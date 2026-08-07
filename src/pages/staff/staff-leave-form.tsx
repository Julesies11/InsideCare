import { useEffect, useRef, useState } from 'react';
import { rosterApi } from '@/api/roster.api';
import { useAuth } from '@/auth/context/auth-context';
import { LeaveTypeMasterDialog } from '@/pages/admin/leave-types/components/leave-type-master-dialog';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  Paperclip,
  Settings2,
  Upload,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { LEAVE_STATUS } from '@/config/enums';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ROUTES } from '@/config/routes.config';
import { useLeaveTypesMaster } from '@/hooks/use-leave-types-master';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/common/container';
import {
  getFileIcon,
  getFilenameFromStorageUrl,
  toAbsoluteUrl,
} from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface ConflictingShift {
  id: string;
  start_date: string;
  start_time: string;
  end_time: string;
  house?: { house_name: string } | null;
}

export function StaffLeaveForm() {
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const getFilenameFromUrl = getFilenameFromStorageUrl;

  const { data: leaveTypes = [], refetch: refetchLeaveTypes } =
    useLeaveTypesMaster(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<
    string | null
  >(null);
  const [toDeleteFile, setToDeleteFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);

  const canManageLeaveTypes = hasAccess({
    resource: RBAC_MODULES.MASTER_LISTS,
    requiredLevel: ACCESS_LEVEL.FULL,
  });

  // Conflict detection
  const [conflictingShifts, setConflictingShifts] = useState<
    ConflictingShift[]
  >([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Load existing leave for edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    const load = async () => {
      try {
        const data = await rosterApi.getLeaveRequest(id);
        if (data) {
          setLeaveTypeId(data.leave_type_id || '');
          setStartDate(data.start_date || '');
          setEndDate(data.end_date || '');
          setReason(data.reason || '');
          setExistingAttachmentUrl(data.attachment_url || null);
        }
      } catch (error) {
        console.error('Error loading leave request:', error);
        toast.error('Failed to load leave request');
      } finally {
        setLoadingEdit(false);
      }
    };
    load();
  }, [id, isEdit]);

  // Check for conflicting shifts when dates change
  useEffect(() => {
    if (!startDate || !endDate || !user?.staff_id) {
      setConflictingShifts([]);
      return;
    }
    if (new Date(endDate) < new Date(startDate)) return;

    const check = async () => {
      setCheckingConflicts(true);
      try {
        const data = await rosterApi.listConflictingShifts(
          user.staff_id!,
          startDate,
          endDate,
        );
        setConflictingShifts(data as any[]);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      } finally {
        setCheckingConflicts(false);
      }
    };
    check();
  }, [startDate, endDate, user?.staff_id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      if (existingAttachmentUrl) {
        setToDeleteFile(true);
        setExistingAttachmentUrl(null);
      } else {
        setToDeleteFile(false);
      }
    }
  };

  const handleRemoveFile = () => {
    setAttachmentFile(null);
    if (existingAttachmentUrl) {
      setToDeleteFile(true);
      setExistingAttachmentUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.staff_id) return;

    if (!leaveTypeId || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be on or after start date');
      return;
    }

    setSaving(true);
    try {
      let attachmentUrl = existingAttachmentUrl;
      if (attachmentFile) {
        attachmentUrl = await rosterApi.uploadStaffDocument(
          user.staff_id,
          attachmentFile,
        );
      } else if (toDeleteFile) {
        attachmentUrl = null;
      }

      const payload = {
        staff_id: user.staff_id,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
        attachment_url: attachmentUrl,
        status: LEAVE_STATUS.PENDING,
      };

      await rosterApi.upsertLeaveRequest(payload, id);

      toast.success(
        isEdit
          ? 'Leave request updated'
          : 'Leave request submitted successfully',
      );
      navigate(ROUTES.MY_LEAVE);
    } catch (error: any) {
      toast.error('Failed to save leave request: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingEdit) {
    return (
      <Container>
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </Container>
    );
  }

  const handleView = async (filePath: string) => {
    if (!filePath) return;
    try {
      const url = await rosterApi.getStaffDocumentSignedUrl(filePath);
      if (url) window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to open document');
    }
  };

  const currentFileName = attachmentFile
    ? attachmentFile.name
    : existingAttachmentUrl
      ? getFilenameFromUrl(existingAttachmentUrl)
      : '';

  return (
    <>
      <Container>
        <Toolbar className="hidden sm:flex">
          <ToolbarHeading>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.MY_LEAVE)}
              >
                <ArrowLeft className="size-4 me-1.5" />
                Back
              </Button>
              <div>
                <ToolbarPageTitle
                  text={isEdit ? 'Edit Leave Request' : 'New Leave Request'}
                />
                <ToolbarDescription>
                  {isEdit
                    ? 'Update your pending leave request'
                    : 'Submit a leave request for approval'}
                </ToolbarDescription>
              </div>
            </div>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.MY_LEAVE)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button form="leave-form" type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : isEdit
                  ? 'Save Changes'
                  : 'Submit Request'}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="py-6 sm:py-0">
        <div className="max-w-2xl space-y-5">
          {/* Conflict warning */}
          {conflictingShifts.length > 0 && (
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 flex gap-3 mx-4 sm:mx-0">
              <AlertTriangle className="size-5 text-warning mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {conflictingShifts.length} rostered shift
                  {conflictingShifts.length !== 1 ? 's' : ''} overlap with these
                  dates
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {conflictingShifts.map((s) => (
                    <Badge
                      key={s.id}
                      variant="warning"
                      appearance="light"
                      className="text-xs"
                    >
                      {format(parseISO(s.start_date), 'EEE dd MMM')}{' '}
                      {s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}
                      {s.house?.house_name ? ` · ${s.house.house_name}` : ''}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your supervisor will see these conflicts when reviewing your
                  request.
                </p>
              </div>
            </div>
          )}

          <Card className="border-0 sm:border">
            <CardContent className="pt-6 pb-8 px-4 sm:px-6">
              <form
                id="leave-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="leaveType">
                      Leave Type <span className="text-destructive">*</span>
                    </Label>
                    {canManageLeaveTypes && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-primary font-medium flex items-center gap-1"
                        onClick={() => setShowManageDialog(true)}
                      >
                        <Settings2 className="size-3.5" />
                        Manage List
                      </Button>
                    )}
                  </div>
                  <Select
                    value={leaveTypeId}
                    onValueChange={setLeaveTypeId}
                    required
                  >
                    <SelectTrigger id="leaveType">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          {lt.leave_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      End Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {startDate &&
                  endDate &&
                  new Date(endDate) >= new Date(startDate) && (
                    <p className="text-sm text-muted-foreground">
                      Duration:{' '}
                      {Math.round(
                        (new Date(endDate).getTime() -
                          new Date(startDate).getTime()) /
                          86400000,
                      ) + 1}{' '}
                      day(s)
                      {checkingConflicts && (
                        <span className="ml-2 text-xs">
                          (checking conflicts...)
                        </span>
                      )}
                    </p>
                  )}

                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason{' '}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe the reason for your leave..."
                    rows={4}
                  />
                </div>

                {/* File attachment */}
                <div className="space-y-2">
                  <Label>
                    Attachment{' '}
                    <span className="text-muted-foreground text-xs">
                      (optional — e.g. sick note)
                    </span>
                  </Label>
                  <div className="flex flex-col gap-2">
                    {currentFileName ? (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={toAbsoluteUrl(
                              `/media/file-types/${getFileIcon(currentFileName)}`,
                            )}
                            className="size-8 shrink-0"
                            alt="file icon"
                          />
                          <div className="flex flex-col overflow-hidden">
                            <button
                              type="button"
                              className="text-sm font-medium truncate text-blue-700 dark:text-blue-400 hover:underline text-left cursor-pointer"
                              onClick={() =>
                                existingAttachmentUrl &&
                                handleView(existingAttachmentUrl)
                              }
                              disabled={!existingAttachmentUrl}
                            >
                              {currentFileName}
                            </button>
                            {attachmentFile && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(attachmentFile.size / 1024)} KB
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={handleRemoveFile}
                          title="Remove attachment"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="size-8 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, JPG, PNG up to 10MB
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Container>

      <LeaveTypeMasterDialog
        open={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        onUpdate={refetchLeaveTypes}
      />
    </>
  );
}
