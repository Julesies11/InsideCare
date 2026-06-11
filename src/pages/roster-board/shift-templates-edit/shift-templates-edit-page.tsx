import { Fragment } from 'react';
import { housesApi } from '@/api/houses.api';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ROUTES } from '@/config/routes.config';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { ShiftTemplatesEditContent } from './shift-templates-edit-content';

export function ShiftTemplatesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasAccess } = useRBAC();

  const canEdit = hasAccess({
    resource: RBAC_MODULES.ROSTER_BOARD,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const { data: house } = useQuery({
    queryKey: ['house-name', id],
    queryFn: async () => {
      if (!id) return null;
      return await housesApi.get(id);
    },
    enabled: !!id,
  });

  const handleBack = () => navigate(ROUTES.SHIFT_SETUP);

  if (!canEdit) {
    return (
      <Container className="py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-muted-foreground max-w-sm">
              You do not have the required permissions to manage shift
              templates.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Fragment>
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ArrowLeft className="size-4 me-1.5" />
                  Back
                </Button>
                <div>
                  <ToolbarPageTitle
                    text={`${house?.house_name || 'House'} Shift Templates`}
                  />
                  <ToolbarDescription>
                    Manage shift routines and templates for this house
                  </ToolbarDescription>
                </div>
              </div>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      </div>
      <Container className="py-6">
        <ShiftTemplatesEditContent houseId={id!} />
      </Container>
    </Fragment>
  );
}
