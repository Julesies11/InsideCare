import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSignedUrl } from '@/hooks/use-signed-url';
import { cn } from '@/lib/utils';

interface SecureAvatarProps {
  src?: string | null;
  alt?: string;
  initials?: string;
  className?: string;
  bucket?: string;
}

export function SecureAvatar({ 
  src, 
  alt = "avatar", 
  initials = "?", 
  className,
  bucket = "staff-photos"
}: SecureAvatarProps) {

  const { url: signedUrl } = useSignedUrl(bucket, src);

  return (
    <Avatar className={cn("shrink-0", className)}>
      {signedUrl && (
        <AvatarImage src={signedUrl} alt={alt} className="object-cover" />
      )}
      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
}
