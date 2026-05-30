import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
  const { settings } = useSettings();
  const { id } = useParams();
  const { hasAccess } = useRBAC();
  const isMobile = useIsMobile();
  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });
  const [sidebarSticky, setSidebarSticky] = useState(false);
  
  const canEdit = hasAccess({ 
    resource: RBAC_MODULES.SHIFT_NOTES, 
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
  });

  const [formData, setFormData] = useState<Record<string, unknown> | null>(null);
  const [originalData, setOriginalData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);

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

  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    
    // Navigate back if possible, otherwise to the shift notes list
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/participants/shift-notes');
    }
  }, [navigate, isDirty]);

  const handleSave = async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current();
    }
  };

  const isNewNote = id === 'new';

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
                <Button 
                  onClick={handleSave} 
                  disabled={!isDirty || saving || !canEdit}
                  variant={isDirty ? 'primary' : 'secondary'}
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
