import { useState } from 'react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  getNewPasswordSchema,
  NewPasswordSchemaType,
} from '@/auth/forms/reset-password-schema';
import { systemApi } from '@/api/system.api';

export function AccountSecurity() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const form = useForm<NewPasswordSchemaType>({
    resolver: zodResolver(getNewPasswordSchema()),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: NewPasswordSchemaType) {
    try {
      setIsProcessing(true);

      await systemApi.auth.updatePassword(values.password);

      toast.success('Password updated successfully');
      form.reset();
    } catch (err) {
      const error = err as Error;
      toast.error('Failed to update password', {
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card className="border-0 sm:border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          Account Security
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter new password"
                          type={passwordVisible ? 'text' : 'password'}
                          autoComplete="new-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        >
                          {passwordVisible ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Confirm new password"
                          type={confirmPasswordVisible ? 'text' : 'password'}
                          autoComplete="new-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        >
                          {confirmPasswordVisible ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto">
                {isProcessing ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
