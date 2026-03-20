import { Container } from '@/components/common/container';

export function AuthGetStartedPage() {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to InsideCare</h1>
        <p className="text-lg text-gray-600 max-w-lg">
          We're setting up your account. You'll be able to access your dashboard and tools shortly.
        </p>
      </div>
    </Container>
  );
}
