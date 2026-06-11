import { STORAGE_BUCKETS } from '@/config/storage-buckets';
import { cn } from '@/lib/utils';
import { useSignedUrl } from '@/hooks/use-signed-url';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SecureAvatarProps {
  src?: string | null;
  alt?: string;
  initials?: string;
  className?: string;
  bucket?: string;
}

export function SecureAvatar({
  src,
  alt = 'avatar',
  initials = '?',
  className,
  bucket = STORAGE_BUCKETS.STAFF_PHOTOS,
}: SecureAvatarProps) {
  const { url: signedUrl } = useSignedUrl(bucket, src);

  return (
    <Avatar className={cn('shrink-0', className)}>
      {signedUrl && (
        <AvatarImage src={signedUrl} alt={alt} className="object-cover" />
      )}
      <AvatarFallback className="text-xs font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
