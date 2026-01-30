import { Fragment, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ShiftNoteDetailContent } from './shift-note-detail-content';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';

export function ShiftNoteDetailPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { id } = useParams();
  const [formData, setFormData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);

  // Check if form is dirty
  const isDirty = formData && originalData && JSON.stringify(formData) !== JSON.stringify(originalData);

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

  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    navigate('/shift-notes/profiles');
  }, [navigate, isDirty]);

  const handleSave = async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current();
    }
  };

  const isNewNote = id === 'new';

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
                  disabled={!isDirty || saving}
                  variant={isDirty ? 'primary' : 'secondary'}
                >
                  {saving ? 'Saving...' : isNewNote ? 'Create' : 'Save Changes'}
                </Button>
              </ToolbarActions>
            </Toolbar>
          </Container>
        </div>
      )}
      <Container>
        <ShiftNoteDetailContent 
          onFormDataChange={setFormData}
          onOriginalDataChange={setOriginalData}
          onSavingChange={setSaving}
          saveHandlerRef={saveHandlerRef}
        />
      </Container>
    </Fragment>
  );
}
