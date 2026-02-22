import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Download } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
  ToolbarDescription,
} from '@/partials/common/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PersonalDetails } from '@/pages/employees/staff-detail/components/personal-details';
import { EmergencyContact } from '@/pages/employees/staff-detail/components/emergency-contact';
import { useStaff, StaffTraining } from '@/hooks/useStaff';

type TrainingStatus = 'Current' | 'Expiring Soon' | 'Expired';

function calcTrainingStatus(expiryDate?: string | null): TrainingStatus {
  if (!expiryDate) return 'Current';
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiring Soon';
  return 'Current';
}

const trainingStatusVariant: Record<TrainingStatus, 'success' | 'warning' | 'destructive'> = {
  Current: 'success',
  'Expiring Soon': 'warning',
  Expired: 'destructive',
};

export function StaffProfile() {
  const { user, setUser } = useAuth();
  const { updateStaff } = useStaff();

  // Resolve staffId directly from DB — works for both admin and staff users
  const [staffId, setStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) { setLoading(false); return; }
      const { data } = await supabase
        .from('staff')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      setStaffId(data?.id ?? null);
      setLoading(false);
    });
  }, []);

  // Photo state — kept separate so it doesn't affect dirty tracking
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state — mirrors StaffDetailContent pattern
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    hobbies: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [originalData, setOriginalData] = useState<any>(null);

  // Training
  const [training, setTraining] = useState<StaffTraining[]>([]);
  const [loadingTraining, setLoadingTraining] = useState(true);

  // Load staff record once staffId is known
  const { getStaffById } = useStaff();
  useEffect(() => {
    if (!staffId) return;
    getStaffById(staffId).then(({ data }) => {
      if (data) {
        const d = {
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          date_of_birth: data.date_of_birth ?? '',
          address: data.address ?? '',
          hobbies: data.hobbies ?? '',
          allergies: data.allergies ?? '',
          emergency_contact_name: data.emergency_contact_name ?? '',
          emergency_contact_phone: data.emergency_contact_phone ?? '',
        };
        setOriginalPhotoUrl((data as any).photo_url ?? null);
        if ((data as any).photo_url) setPhotoPreview((data as any).photo_url);
        setFormData(d);
        setOriginalData(d);
      }
    });

    supabase
      .from('staff_training')
      .select('*')
      .eq('staff_id', staffId)
      .order('date_completed', { ascending: false })
      .then(({ data }) => {
        setTraining((data as StaffTraining[]) || []);
        setLoadingTraining(false);
      });
  }, [staffId]);

  // Dirty tracking — photo dirty if new file selected OR preview differs from original (deletion)
  const isPhotoDirty = photoFile !== null || photoPreview !== originalPhotoUrl;
  const isDirty =
    isPhotoDirty ||
    (originalData !== null &&
      Object.keys(originalData).some(
        (k) => formData[k] !== originalData[k]
      ));

  // onFormChange handler — intercepts photo fields like StaffDetailContent does
  const handleFormChange = (field: string, value: any) => {
    if (field === 'photo_file') { setPhotoFile(value); return; }
    if (field === 'photo_url_preview') { setPhotoPreview(value); return; }
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      // Step 1: Upload photo if pending, or clear it if deleted
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const path = `${staffId}/profile/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('staff-documents')
          .upload(path, photoFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('staff-documents').getPublicUrl(path);
        const newPhotoUrl = urlData.publicUrl;

        await supabase.from('staff').update({ photo_url: newPhotoUrl }).eq('id', staffId);
        setOriginalPhotoUrl(newPhotoUrl);

        // Update header avatar immediately
        if (setUser && user) setUser({ ...user, photo_url: newPhotoUrl });
        setPhotoFile(null);
        setPhotoPreview(newPhotoUrl);
      } else if (photoPreview === null && originalPhotoUrl !== null) {
        // Photo was deleted — clear it in the DB
        await supabase.from('staff').update({ photo_url: null }).eq('id', staffId);
        setOriginalPhotoUrl(null);
        if (setUser && user) setUser({ ...user, photo_url: null });
      }

      // Step 2: Save form fields via useStaff hook (mirrors StaffDetailContent)
      const toNull = (v: any) => (v === '' ? null : v);
      const updates: Record<string, any> = {
        name: formData.name,
        email: formData.email,
        phone: toNull(formData.phone),
        date_of_birth: toNull(formData.date_of_birth),
        address: toNull(formData.address),
        hobbies: toNull(formData.hobbies),
        allergies: toNull(formData.allergies),
        emergency_contact_name: toNull(formData.emergency_contact_name),
        emergency_contact_phone: toNull(formData.emergency_contact_phone),
      };

      const { error } = await updateStaff(staffId, updates);
      if (error) throw new Error(String(error));

      setOriginalData({ ...formData });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error('Failed to save profile', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTraining = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('staff-documents').download(filePath);
      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">Loading profile...</div>
      </Container>
    );
  }

  if (!staffId) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">
          No staff record linked to your account. Please contact your administrator.
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="My Profile" />
            <ToolbarDescription>View and update your personal information</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              onClick={handleSave}
              disabled={!isDirty || saving}
              variant={isDirty ? 'primary' : 'secondary'}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="max-w-3xl grid gap-5 lg:gap-7.5">

          <PersonalDetails
            formData={{ ...formData, photo_url_preview: photoPreview }}
            onFormChange={handleFormChange}
            canEdit={true}
          />

          <EmergencyContact
            formData={formData}
            onFormChange={handleFormChange}
            canEdit={true}
          />

          {/* Training (read-only) */}
          <Card className="pb-2.5" id="staff_training">
            <CardHeader>
              <CardTitle>Training</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTraining ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Loading training records...</div>
              ) : training.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No training records available</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Training Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date Completed</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Document</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {training.map((item) => {
                      const status = calcTrainingStatus(item.expiry_date);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            {item.date_completed
                              ? format(parseISO(item.date_completed), 'dd MMM yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {item.expiry_date
                              ? format(parseISO(item.expiry_date), 'dd MMM yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={trainingStatusVariant[status]} size="sm">
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.file_path ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadTraining(item.file_path!)}
                                title="Download document"
                              >
                                <Download className="size-4" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        </div>
      </Container>
    </>
  );
}
