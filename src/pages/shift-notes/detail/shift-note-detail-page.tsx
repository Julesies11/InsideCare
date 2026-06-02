import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { ShiftNoteDetailContent } from './shift-note-detail-content';
import { ShiftNoteDetailSidebar } from './shift-note-detail-sidebar';
import { Scrollspy } from '@/components/ui/scrollspy';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { cn } from '@/lib/utils';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { useDirtyTracker } from '@/hooks/useDirtyTracker';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { useArchiveShiftNote } from '@/hooks/use-shift-notes';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes.config';
import { QUERY_KEYS } from '@/config/query-keys';

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
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { id } = useParams();
  const { hasAccess } = useRBAC();
  const isMobile = useIsMobile();
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });
  const [sidebarSticky, setSidebarSticky] = useState(false);
  const archiveNote = useArchiveShiftNote();
  
  const canEdit = hasAccess({ 
    resource: RBAC_MODULES.SHIFT_NOTES, 
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
  });

  const [formData, setFormData] = useState<Record<string, unknown> | null>(null);
  const [originalData, setOriginalData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);

  const isNewNote = id === 'new';

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
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    
    // Refresh the table data before going back
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });

    // Navigate back to the shift notes list
    navigate(ROUTES.SHIFT_NOTES);
  }, [navigate, isDirty, queryClient]);

  const handleSave = async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current();
    }
  };

  const handleDelete = async () => {
    if (!id || id === 'new') return;
    
    const confirmed = window.confirm('Are you sure you want to delete this shift note? This will mark it as inactive.');
    if (!confirmed) return;

    try {
      setSaving(true);
      await archiveNote.mutateAsync(id);
      
      // Refresh the table data
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFT_NOTES] });

      toast.success('Shift note deleted successfully');
      navigate(ROUTES.SHIFT_NOTES);
    } catch (err: any) {
      console.error('Error deleting shift note:', err);
      toast.error(err.message || 'Failed to delete shift note');
    } finally {
      setSaving(false);
    }
  };

  // Allow "Create" for new notes even if technically clean (due to defaults), 
  // provided they have the minimum required fields.
  const canSave = isDirty || (isNewNote && formData?.shift_id && formData?.participant_id);

  const stickyClass = settings?.layout
    ? stickySidebarClasses[`${settings?.layout}-layout`] ||
      'top-[calc(var(--header-height)+1rem)]'
    : 'top-[calc(var(--header-height)+1rem)]';

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
                    <ToolbarPageTitle text={isNewNote ? 'New Shift Note' : 'Shift Note Details'} />
                    <ToolbarDescription>
                      {isNewNote ? 'Create a new shift note' : 'View and edit shift note'}
                    </ToolbarDescription>
                  </div>
                </div>
              </ToolbarHeading>
              <ToolbarActions>
                {!isNewNote && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDelete}
                    disabled={saving || !canEdit}
                  >
                    <Trash2 className="size-4 me-1.5" />
                    Delete
                  </Button>
                )}
                <Button 
                  onClick={handleSave} 
                  disabled={!canSave || saving || !canEdit}
                  variant={canSave ? 'primary' : 'secondary'}
                >
                  {saving ? 'Saving...' : isNewNote ? 'Create' : 'Save Changes'}
                </Button>
              </ToolbarActions>
            </Toolbar>
          </Container>
        </div>
      )}
      <Container className="py-6 pb-[30vh]">
        <div className="flex grow gap-5 lg:gap-7.5">
          {!isMobile && !loading && formData && (
            <div className="w-[230px] shrink-0">
              <div className={cn('w-[230px]', sidebarSticky && `fixed z-10 start-auto ${stickyClass}`)}>
                <Scrollspy offset={100} targetRef={parentRef}>
                  <ShiftNoteDetailSidebar formData={formData as Record<string, unknown>} />
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
