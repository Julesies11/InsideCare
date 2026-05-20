import { supabase } from './supabase';

type ResolveFn = (url: string | null) => void;
type RejectFn = (error: Error) => void;

interface QueueItem {
  path: string;
  resolve: ResolveFn;
  reject: RejectFn;
}

class SignedUrlBatcherClass {
  // Map of bucket name to an array of pending requests
  private queue: Map<string, QueueItem[]> = new Map();
  // Map of bucket name to active timeout ID
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  // Batch window in milliseconds
  private batchWindowMs = 50;

  /**
   * Request a signed URL for a specific bucket and path.
   * If multiple requests for the same bucket are made within the batch window,
   * they will be grouped into a single API call to Supabase.
   */
  public get(bucket: string, path: string, expiresIn: number = 3600): Promise<string | null> {
    return new Promise((resolve, reject) => {
      // 1. Initialize queue for this bucket if it doesn't exist
      if (!this.queue.has(bucket)) {
        this.queue.set(bucket, []);
      }

      // 2. Add this request to the queue
      const bucketQueue = this.queue.get(bucket)!;
      bucketQueue.push({ path, resolve, reject });

      // 3. If there is already a timeout waiting, we do nothing and wait for it to fire.
      // If there is no timeout, we start one.
      if (!this.timeouts.has(bucket)) {
        const timeoutId = setTimeout(() => {
          this.processQueue(bucket, expiresIn);
        }, this.batchWindowMs);
        
        this.timeouts.set(bucket, timeoutId);
      }
    });
  }

  private async processQueue(bucket: string, expiresIn: number) {
    // 1. Clear the timeout so new requests start a new batch
    this.timeouts.delete(bucket);

    // 2. Extract the current queue and reset the map for this bucket immediately
    const currentQueue = this.queue.get(bucket) || [];
    this.queue.set(bucket, []);

    if (currentQueue.length === 0) return;

    // 3. Extract unique paths to ask Supabase for (Supabase will throw if we ask for duplicates in the array)
    const uniquePaths = Array.from(new Set(currentQueue.map(item => item.path)));

    try {
      // 4. Chunk the paths to avoid "Request body is too large" (413) errors
      const CHUNK_SIZE = 50;
      const chunks: string[][] = [];
      for (let i = 0; i < uniquePaths.length; i += CHUNK_SIZE) {
        chunks.push(uniquePaths.slice(i, i + CHUNK_SIZE));
      }

      // Process all chunks in parallel
      const resultsMap = new Map<string, { signedUrl: string, error?: string }>();
      
      const chunkPromises = chunks.map(async (chunk) => {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrls(chunk, expiresIn);

        if (error) {
          console.error(`Failed to sign a chunk of ${chunk.length} URLs for bucket ${bucket}:`, error);
          return; // Skip this chunk but allow others to proceed
        }

        if (data) {
          data.forEach(result => {
            if (result.path && result.signedUrl) {
              resultsMap.set(result.path, { signedUrl: result.signedUrl, error: result.error });
            }
          });
        }
      });

      await Promise.all(chunkPromises);

      // 5. Resolve or reject each promise in the queue
      currentQueue.forEach(item => {
        const result = resultsMap.get(item.path);
        if (result && !result.error) {
          item.resolve(result.signedUrl);
        } else {
          // If the specific path failed to sign, we resolve with null instead of rejecting
          // to prevent the entire UI component from crashing
          item.resolve(null);
        }
      });

    } catch (error) {
      console.error(`Failed to batch fetch signed URLs for bucket ${bucket}:`, error);
      // If the entire network request failed, reject all queued items
      currentQueue.forEach(item => item.reject(error as Error));
    }
  }
}

export const SignedUrlBatcher = new SignedUrlBatcherClass();
