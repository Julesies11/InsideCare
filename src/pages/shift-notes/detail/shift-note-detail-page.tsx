import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, Printer } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/config/query-keys';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ROUTES } from '@/config/routes.config';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { useDirtyTracker } from '@/hooks/useDirtyTracker';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { useSettings } from '@/providers/settings-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scrollspy } from '@/components/ui/scrollspy';
import { Container } from '@/components/common/container';
import { ShiftNoteDetailContent } from './shift-note-detail-content';
import { ShiftNoteDetailSidebar } from './shift-note-detail-sidebar';
import { ShiftNotePrintable } from './components/shift-note-printable';

const stickySidebarClasses: Record<string, string> = {
  'demo1-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo2-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo3-layout': 'top-[calc(var(--header-height)+var(--navbar-height)+1rem)]',
  'demo4-layout': 'top-[3rem]',
  'demo5-layout': 'top-[calc(var(--header-height)+1.5rem)]',
  'demo6-layout': 'top-[3rem]',
  'demo7-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo8-layout': 'top-[3rem]',
  'demo9-layout': 'top-[calc(var(--header-height)+1rem)]',
  'demo10-layout': 'top-[1.5rem]',
};

export function ShiftNoteDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { id } = useParams();
  const { hasAccess } = useRBAC();
  const isMobile = useIsMobile();
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });
  const [sidebarSticky, setSidebarSticky] = useState(false);

  const canEdit = hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_SHIFT_NOTES,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const [formData, setFormData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [originalData, setOriginalData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveHandlerRef = useRef<
    ((status?: 'draft' | 'active') => Promise<void>) | null
  >(null);

  const isNewNote = id === 'new' || id === 'undefined' || !id;

  // Check if form is dirty
  const { isDirty } = useDirtyTracker({
    formData: formData || {},
    originalData: originalData || {},
  });

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    setSidebarSticky(scrollPosition > 100);
  }, [scrollPosition]);

  const handleBack = useCallback(async () => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?',
      );
      if (!confirmLeave) return;
    }

    // Refresh the table data before going back
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });

    const fromPath = location.state?.from;
    if (fromPath) {
      navigate(fromPath);
    } else {
      // If we have a participant context, go back to their detail page
      const participantId =
        formData?.participant_id ||
        new URLSearchParams(window.location.search).get('participantId');
      if (participantId) {
        navigate(
          `${ROUTES.PARTICIPANT_DETAIL}/${participantId}?tab=shift_notes`,
        );
      } else {
        // Navigate back to the general shift notes list
        navigate(ROUTES.SHIFT_NOTES);
      }
    }
  }, [navigate, isDirty, queryClient, formData, location]);

  const handleSave = async (targetStatus?: 'draft' | 'active') => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current(targetStatus);
    }
  };

  // Allow "Create" for new notes even if technically clean (due to defaults),
  // provided they have the minimum required fields.
  const canSave =
    isDirty || (isNewNote && formData?.shift_id && formData?.participant_id);

  const stickyClass = settings?.layout
    ? stickySidebarClasses[`${settings?.layout}-layout`] ||
      'top-[calc(var(--header-height)+1rem)]'
    : 'top-[calc(var(--header-height)+1rem)]';

  const isPrintView = location.pathname.endsWith('/print');

  if (isPrintView) {
    return (
      <Fragment>
        <div className="sticky top-0 z-20 bg-background border-b border-border no-print">
          <Container>
            <Toolbar>
              <ToolbarHeading>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`${ROUTES.SHIFT_NOTES_DETAIL}/${id}`)}
                  >
                    <ArrowLeft className="size-4 me-1.5" />
                    Close Preview
                  </Button>
                  <div>
                    <ToolbarPageTitle
                      text={`Print Shift Note${formData?.reference_id ? ` · ${formData.reference_id}` : ''}`}
                    />
                    <ToolbarDescription>
                      Print or save this shift note as a PDF document
                    </ToolbarDescription>
                  </div>
                </div>
              </ToolbarHeading>
              <ToolbarActions>
                <Button variant="primary" size="sm" onClick={() => window.print()}>
                  <Printer className="size-4 me-1.5" />
                  Print Report
                </Button>
              </ToolbarActions>
            </Toolbar>
          </Container>
        </div>
        <Container className="py-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            formData && <ShiftNotePrintable note={formData} />
          )}
        </Container>
        <div className="hidden">
          <ShiftNoteDetailContent
            onFormDataChange={setFormData}
            onOriginalDataChange={setOriginalData}
            onSavingChange={setSaving}
            onLoadingChange={setLoading}
            saveHandlerRef={saveHandlerRef}
            canEdit={canEdit}
          />
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      {settings?.layout === 'demo1' && (
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
                    <div className="flex items-center gap-2">
                      <ToolbarPageTitle
                        text={
                          isNewNote
                            ? 'New Shift Note'
                            : `Shift Note Details${formData?.reference_id ? ` · ${formData.reference_id}` : ''}`
                        }
                      />
                      {!loading && formData && (
                        <Badge
                          variant={
                            formData.status === 'active' ? 'success' : 'warning'
                          }
                          appearance="light"
                          className="text-[10px] font-bold uppercase shrink-0"
                        >
                          {formData.status === 'active' ? 'Completed' : 'Draft'}
                        </Badge>
                      )}
                    </div>
                    <ToolbarDescription>
                      {isNewNote
                        ? 'Create a new shift note'
                        : 'View and edit shift note'}
                    </ToolbarDescription>
                  </div>
                </div>
              </ToolbarHeading>
              <ToolbarActions>
                {!isNewNote && formData && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`${ROUTES.SHIFT_NOTES_DETAIL}/${id}/print`)}
                    size="sm"
                  >
                    <Eye className="size-4 me-1.5" />
                    Print Preview
                  </Button>
                )}
                {canEdit && formData?.status !== 'active' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleSave('draft')}
                      disabled={!isDirty || saving}
                      size="sm"
                    >
                      Save Draft
                    </Button>
                    <Button
                      onClick={() => handleSave('active')}
                      disabled={saving}
                      size="sm"
                    >
                      {saving ? 'Submitting...' : 'Submit Note'}
                    </Button>
                  </>
                )}
              </ToolbarActions>
            </Toolbar>
          </Container>
        </div>
      )}
      <Container className="py-6 pb-[30vh]">
        <div className="flex grow gap-5 lg:gap-7.5">
          {!isMobile && !loading && formData && (
            <div className="w-[230px] shrink-0">
              <div
                className={cn(
                  'w-[230px]',
                  sidebarSticky && `fixed z-10 start-auto ${stickyClass}`,
                )}
              >
                <Scrollspy offset={100} targetRef={parentRef}>
                  <ShiftNoteDetailSidebar
                    formData={formData as Record<string, unknown>}
                  />
                </Scrollspy>
              </div>
            </div>
          )}

          <ShiftNoteDetailContent
            onFormDataChange={setFormData}
            onOriginalDataChange={setOriginalData}
            onSavingChange={setSaving}
            onLoadingChange={setLoading}
            saveHandlerRef={saveHandlerRef}
            canEdit={canEdit}
          />
        </div>
      </Container>
    </Fragment>
  );
}
