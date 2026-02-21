import { useAuth } from '@/auth/context/auth-context';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';
import { Card, CardContent } from '@/components/ui/card';
import { UserCircle, Mail, Phone } from 'lucide-react';

export function StaffProfile() {
  const { user } = useAuth();

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || '—';

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="My Profile" />
            <ToolbarDescription>Your account information</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="max-w-2xl grid gap-5">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <UserCircle className="size-9 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{fullName}</h2>
                  <p className="text-sm text-muted-foreground">Staff Member</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 py-3 border-b">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user?.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <Phone className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{user?.phone || '—'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
