-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    details JSONB,
    url TEXT,
    user_agent TEXT,
    app_version VARCHAR(50),
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own error logs
CREATE POLICY "Users can insert their own error logs" 
ON error_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow anonymous users to insert error logs (e.g., login failures)
CREATE POLICY "Anonymous users can insert error logs" 
ON error_logs FOR INSERT 
TO anon 
WITH CHECK (user_id IS NULL);

-- Only admins can view error logs (assuming 'admin' metadata check, or similar depending on the app's setup)
-- For now, we'll keep it simple: no one can select from the client, only insert.
-- The Supabase dashboard will be used to view logs.
