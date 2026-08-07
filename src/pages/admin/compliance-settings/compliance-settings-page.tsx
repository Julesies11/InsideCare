import { useMemo, useState } from 'react';
import { Database } from '@/models/database.types';
import {
  AlertTriangle,
  Edit,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAddComplianceType,
  useAddIDDocumentType,
  useComplianceTypes,
  useDeleteIDDocumentType,
  useIDDocumentTypes,
  useUpdateComplianceType,
  useUpdateIDDocumentType,
} from '@/hooks/use-staff';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/common/container';
import { SortIcon } from '@/components/common/sort-icon';

type IDDocRow = Database['public']['Tables']['ic_id_document_types']['Row'];
type IDDocInsert =
  Database['public']['Tables']['ic_id_document_types']['Insert'];

type SortField =
  | 'compliance_name'
  | 'is_active'
  | 'attachment_applicable'
  | 'system_category';
type SortDirection = 'asc' | 'desc';

export function ComplianceSettingsPage() {
  const [activeTab, setActiveTab] = useState('master-list');

  // Master List Hooks
  const {
    types = [],
    isLoading: loadingTypes,
    refetch: refetchTypes,
    error: typesError,
  } = useComplianceTypes(true);
  const { mutateAsync: addType } = useAddComplianceType();
  const { mutateAsync: updateType } = useUpdateComplianceType();

  // ID Documents Hooks
  const {
    idDocumentTypes = [],
    isLoading: loadingDocs,
    refetch: refetchDocs,
    error: docsError,
  } = useIDDocumentTypes(true);
  const { mutateAsync: addIDDoc } = useAddIDDocumentType();
  const { mutateAsync: updateIDDoc } = useUpdateIDDocumentType();
  const { mutateAsync: deleteIDDoc } = useDeleteIDDocumentType();

  // Master List State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('compliance_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Master List Dialog state
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [typeFormData, setTypeFormData] = useState({
    compliance_name: '',
    description: '',
    is_active: true,
    attachment_applicable: false,
    expiry_date_applicable: true,
    document_number_applicable: true,
    comments_applicable: true,
  });

  // ID Docs Dialog state
  const [showIDDialog, setShowIDDialog] = useState(false);
  const [editingIDDoc, setEditingIDDoc] = useState<IDDocRow | null>(null);
  const [idFormData, setIDFormData] = useState<IDDocInsert>({
    id: '',
    name: '',
    category: 'primary',
    points: 0,
    expiry_date_applicable: true,
    attachment_applicable: true,
    document_number_applicable: true,
    comments_applicable: true,
    placeholder: '',
    is_active: true,
  });

  // Sorting and Filtering Master List
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredTypes = useMemo(() => {
    const filtered = types.filter(
      (t) =>
        t.compliance_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description &&
          t.description.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    filtered.sort((a, b) => {
      // Primary sort
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'is_active' || sortField === 'attachment_applicable') {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;

      // Secondary sort by compliance_name if primary is same
      if (sortField !== 'compliance_name') {
        const aName = a.compliance_name.toLowerCase();
        const bName = b.compliance_name.toLowerCase();
        if (aName < bName) return -1;
        if (aName > bName) return 1;
      }

      return 0;
    });

    return filtered;
  }, [types, searchQuery, sortField, sortDirection]);

  const sortedIDDocumentTypes = useMemo(() => {
    return [...idDocumentTypes].sort((a, b) => {
      // Primary sort by category (primary first)
      if (a.category !== b.category) {
        return a.category === 'primary' ? -1 : 1;
      }
      // Secondary sort by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [idDocumentTypes]);

  // Actions - Master List
  const handleAddTypeClick = () => {
    setEditingType(null);
    setTypeFormData({
      compliance_name: '',
      description: '',
      is_active: true,
      attachment_applicable: false,
      expiry_date_applicable: true,
      document_number_applicable: true,
      comments_applicable: true,
    });
    setShowTypeDialog(true);
  };

  const handleEditTypeClick = (type: any) => {
    setEditingType(type);
    setTypeFormData({
      compliance_name: type.compliance_name,
      description: type.description || '',
      is_active: type.is_active ?? true,
      attachment_applicable: type.attachment_applicable ?? false,
      expiry_date_applicable: type.expiry_date_applicable ?? true,
      document_number_applicable: type.document_number_applicable ?? true,
      comments_applicable: type.comments_applicable ?? true,
    });
    setShowTypeDialog(true);
  };

  const handleToggleActive = async (type: any) => {
    const newActive = !type.is_active;
    try {
      await updateType({ id: type.id, updates: { is_active: newActive } });
      toast.success(
        `Compliance check ${newActive ? 'activated' : 'deactivated'} successfully`,
      );
      refetchTypes();
    } catch (err: any) {
      toast.error('Failed to toggle active status: ' + err.message);
    }
  };

  const handleSaveType = async () => {
    if (!typeFormData.compliance_name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingType) {
        await updateType({ id: editingType.id, updates: typeFormData });
        toast.success('Compliance type updated successfully');
      } else {
        await addType(typeFormData);
        toast.success('Compliance type added successfully');
      }
      setShowTypeDialog(false);
      refetchTypes();
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  // Actions - ID Documents
  const handleAddIDDocClick = () => {
    setEditingIDDoc(null);
    setIDFormData({
      id: '',
      name: '',
      category: 'primary',
      points: 0,
      expiry_date_applicable: true,
      attachment_applicable: true,
      document_number_applicable: true,
      comments_applicable: true,
      placeholder: '',
      is_active: true,
    });
    setShowIDDialog(true);
  };

  const handleEditIDDocClick = (doc: IDDocRow) => {
    setEditingIDDoc(doc);
    setIDFormData({
      id: doc.id,
      name: doc.name,
      category: doc.category as 'primary' | 'secondary',
      points: doc.points,
      expiry_date_applicable: doc.expiry_date_applicable ?? true,
      attachment_applicable: doc.attachment_applicable ?? true,
      document_number_applicable: doc.document_number_applicable ?? true,
      comments_applicable: doc.comments_applicable ?? true,
      placeholder: doc.placeholder || '',
      is_active: doc.is_active ?? true,
    });
    setShowIDDialog(true);
  };

  const handleSaveIDDoc = async () => {
    if (!idFormData.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingIDDoc) {
        await updateIDDoc({ id: editingIDDoc.id, updates: idFormData });
        toast.success('ID document type updated successfully');
      } else {
        // Sanitize: remove empty id so Postgres can generate it
        const { id, ...payload } = idFormData;
        await addIDDoc(payload);
        toast.success('ID document type added successfully');
      }
      setShowIDDialog(false);
      refetchDocs();
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const handleToggleIDDocActive = async (doc: IDDocRow) => {
    const newActive = !doc.is_active;
    try {
      await updateIDDoc({ id: doc.id, updates: { is_active: newActive } });
      toast.success(
        `ID document type ${newActive ? 'activated' : 'deactivated'} successfully`,
      );
      refetchDocs();
    } catch (err: any) {
      toast.error('Failed to toggle active status: ' + err.message);
    }
  };

  return (
    <Container>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShieldCheck className="size-6 text-gray-600 dark:text-gray-400" />
              Compliance Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage the master list of mandatory and optional compliance
              checks.
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'master-list' ? (
              <Button onClick={handleAddTypeClick}>
                <Plus className="size-4 me-1.5" />
                Add Compliance Type
              </Button>
            ) : (
              <Button onClick={handleAddIDDocClick}>
                <Plus className="size-4 me-1.5" />
                Add ID Document Type
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="master-list">
              Compliance Master List
            </TabsTrigger>
            <TabsTrigger value="id-config">100 Points of ID Config</TabsTrigger>
          </TabsList>

          <TabsContent value="master-list" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CardTitle>Compliance Checklist Master List</CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-500 font-bold text-[10px]"
                    >
                      {sortedAndFilteredTypes.length}
                    </Badge>
                  </div>
                  <Input
                    placeholder="Search requirements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs h-9 bg-white"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loadingTypes ? (
                  <div className="py-10 text-center text-muted-foreground animate-pulse">
                    Loading compliance configurations...
                  </div>
                ) : typesError ? (
                  <div className="py-10 text-center bg-red-50 rounded-lg border border-red-100 m-2">
                    <AlertTriangle className="size-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-700 font-medium">
                      Failed to load configurations
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      {(typesError as any).message}
                    </p>
                  </div>
                ) : sortedAndFilteredTypes.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    {searchQuery
                      ? 'No compliance checks match your query.'
                      : 'No compliance checks configured. Click "Add Compliance Type" to create one.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="w-[30%] cursor-pointer select-none"
                            onClick={() => handleSort('compliance_name')}
                          >
                            Requirement Name
                            <SortIcon
                              field="compliance_name"
                              currentField={sortField}
                              direction={sortDirection}
                            />
                          </TableHead>
                          <TableHead className="w-[30%] text-center">
                            Tracking Configuration
                          </TableHead>
                          <TableHead
                            className="w-[25%] cursor-pointer select-none text-center"
                            onClick={() => handleSort('is_active')}
                          >
                            Status
                            <SortIcon
                              field="is_active"
                              currentField={sortField}
                              direction={sortDirection}
                            />
                          </TableHead>
                          <TableHead className="w-[15%] text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedAndFilteredTypes.map((type) => (
                          <TableRow
                            key={type.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {type.compliance_name}
                                </span>
                                {type.description && (
                                  <span className="text-xs text-muted-foreground mt-0.5 max-w-md line-clamp-2">
                                    {type.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap justify-center gap-1">
                                {type.expiry_date_applicable && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    Expiry
                                  </Badge>
                                )}
                                {type.attachment_applicable && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200"
                                  >
                                    Attachment
                                  </Badge>
                                )}
                                {type.document_number_applicable && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-teal-50 text-teal-700 border-teal-200"
                                  >
                                    Doc #
                                  </Badge>
                                )}
                                {type.comments_applicable && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-slate-50 text-slate-700 border-slate-200"
                                  >
                                    Comments
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Badge
                                  variant={
                                    type.is_active ? 'success' : 'secondary'
                                  }
                                >
                                  {type.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditTypeClick(type)}
                                >
                                  <Edit className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={
                                    type.is_active
                                      ? 'text-destructive'
                                      : 'text-success'
                                  }
                                  onClick={() => handleToggleActive(type)}
                                >
                                  {type.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="id-config" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>100 Points of ID Configuration</CardTitle>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-500 font-bold text-[10px]"
                  >
                    {sortedIDDocumentTypes.length}
                  </Badge>
                </div>
                <CardDescription>
                  Define the types of identification documents and their
                  respective point values.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDocs ? (
                  <div className="py-10 text-center text-muted-foreground animate-pulse">
                    Loading ID document configurations...
                  </div>
                ) : docsError ? (
                  <div className="py-10 text-center bg-red-50 rounded-lg border border-red-100 m-2">
                    <AlertTriangle className="size-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-700 font-medium">
                      Failed to load ID document types
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      {(docsError as any).message}
                    </p>
                  </div>
                ) : idDocumentTypes.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    No ID document types configured. Click "Add ID Document
                    Type" to create one.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[15%]">Category</TableHead>
                          <TableHead className="w-[30%]">
                            Document Name
                          </TableHead>
                          <TableHead className="w-[25%] text-center">
                            Tracking Configuration
                          </TableHead>
                          <TableHead className="w-[10%] text-center">
                            Points
                          </TableHead>
                          <TableHead className="w-[10%]">Status</TableHead>
                          <TableHead className="w-[10%] text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedIDDocumentTypes.map((doc) => (
                          <TableRow
                            key={doc.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  doc.category === 'primary'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'bg-orange-50 text-orange-700'
                                }
                              >
                                {doc.category.charAt(0).toUpperCase() +
                                  doc.category.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {doc.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap justify-center gap-1">
                                {doc.expiry_date_applicable && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    Expiry
                                  </Badge>
                                )}
                                {doc.attachment_applicable && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200"
                                  >
                                    Attachment
                                  </Badge>
                                )}
                                {doc.document_number_applicable && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-teal-50 text-teal-700 border-teal-200"
                                  >
                                    Doc #
                                  </Badge>
                                )}
                                {doc.comments_applicable && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-slate-50 text-slate-700 border-slate-200"
                                  >
                                    Comments
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-gray-900">
                              {doc.points}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  doc.is_active ? 'success' : 'secondary'
                                }
                              >
                                {doc.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditIDDocClick(doc)}
                                >
                                  <Edit className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={
                                    doc.is_active
                                      ? 'text-destructive'
                                      : 'text-success'
                                  }
                                  onClick={() => handleToggleIDDocActive(doc)}
                                >
                                  {doc.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Compliance Type Dialog */}
        <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Edit Compliance Type' : 'Add Compliance Type'}
              </DialogTitle>
              <DialogDescription>
                Define a new requirement and configure its tracking parameters.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type-name">Requirement Name</Label>
                <Input
                  id="type-name"
                  value={typeFormData.compliance_name}
                  onChange={(e) =>
                    setTypeFormData({
                      ...typeFormData,
                      compliance_name: e.target.value,
                    })
                  }
                  placeholder="e.g. First Aid Certificate"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type-desc">Description (Optional)</Label>
                <Textarea
                  id="type-desc"
                  value={typeFormData.description}
                  onChange={(e) =>
                    setTypeFormData({
                      ...typeFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Details about this requirement..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="is-active"
                      className="text-xs cursor-pointer"
                    >
                      Active
                    </Label>
                    <Switch
                      id="is-active"
                      checked={typeFormData.is_active}
                      onCheckedChange={(checked) =>
                        setTypeFormData({ ...typeFormData, is_active: checked })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-l ps-4">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                    Applicable Fields
                  </Label>
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="expiry-app"
                      className="text-xs cursor-pointer"
                    >
                      Expiry Date
                    </Label>
                    <Switch
                      id="expiry-app"
                      checked={typeFormData.expiry_date_applicable}
                      onCheckedChange={(checked) =>
                        setTypeFormData({
                          ...typeFormData,
                          expiry_date_applicable: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="doc-num-app"
                      className="text-xs cursor-pointer"
                    >
                      Doc Number
                    </Label>
                    <Switch
                      id="doc-num-app"
                      checked={typeFormData.document_number_applicable}
                      onCheckedChange={(checked) =>
                        setTypeFormData({
                          ...typeFormData,
                          document_number_applicable: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="attach-app"
                      className="text-xs cursor-pointer"
                    >
                      Attachments
                    </Label>
                    <Switch
                      id="attach-app"
                      checked={typeFormData.attachment_applicable}
                      onCheckedChange={(checked) =>
                        setTypeFormData({
                          ...typeFormData,
                          attachment_applicable: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="comments-app"
                      className="text-xs cursor-pointer"
                    >
                      Comments
                    </Label>
                    <Switch
                      id="comments-app"
                      checked={typeFormData.comments_applicable}
                      onCheckedChange={(checked) =>
                        setTypeFormData({
                          ...typeFormData,
                          comments_applicable: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTypeDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveType}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ID Document Dialog */}
        <Dialog open={showIDDialog} onOpenChange={setShowIDDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>
                {editingIDDoc
                  ? 'Edit ID Document Type'
                  : 'Add ID Document Type'}
              </DialogTitle>
              <DialogDescription>
                Configure point values and rules for identity verification.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="doc-name">Document Name</Label>
                <Input
                  id="doc-name"
                  value={idFormData.name}
                  onChange={(e) =>
                    setIDFormData({ ...idFormData, name: e.target.value })
                  }
                  placeholder="e.g. Passport, Drivers License"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="doc-category">Category</Label>
                  <Select
                    value={idFormData.category}
                    onValueChange={(val: any) =>
                      setIDFormData({ ...idFormData, category: val })
                    }
                  >
                    <SelectTrigger id="doc-category">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="doc-points">Points</Label>
                  <Input
                    id="doc-points"
                    type="number"
                    value={idFormData.points}
                    onChange={(e) =>
                      setIDFormData({
                        ...idFormData,
                        points: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="doc-placeholder">Placeholder Text</Label>
                <Input
                  id="doc-placeholder"
                  value={idFormData.placeholder}
                  onChange={(e) =>
                    setIDFormData({
                      ...idFormData,
                      placeholder: e.target.value,
                    })
                  }
                  placeholder="e.g. Passport Number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="doc-active"
                      className="text-xs cursor-pointer"
                    >
                      Active
                    </Label>
                    <Switch
                      id="doc-active"
                      checked={idFormData.is_active}
                      onCheckedChange={(checked) =>
                        setIDFormData({ ...idFormData, is_active: checked })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-l ps-4">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                    Applicable Fields
                  </Label>
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="doc-expiry-app"
                      className="text-xs cursor-pointer"
                    >
                      Expiry Date
                    </Label>
                    <Switch
                      id="doc-expiry-app"
                      checked={idFormData.expiry_date_applicable}
                      onCheckedChange={(checked) =>
                        setIDFormData({
                          ...idFormData,
                          expiry_date_applicable: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="doc-num-app"
                      className="text-xs cursor-pointer"
                    >
                      Doc Number
                    </Label>
                    <Switch
                      id="doc-num-app"
                      checked={idFormData.document_number_applicable}
                      onCheckedChange={(checked) =>
                        setIDFormData({
                          ...idFormData,
                          document_number_applicable: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="doc-attach-app"
                      className="text-xs cursor-pointer"
                    >
                      Attachments
                    </Label>
                    <Switch
                      id="doc-attach-app"
                      checked={idFormData.attachment_applicable}
                      onCheckedChange={(checked) =>
                        setIDFormData({
                          ...idFormData,
                          attachment_applicable: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="doc-comments-app"
                      className="text-xs cursor-pointer"
                    >
                      Comments
                    </Label>
                    <Switch
                      id="doc-comments-app"
                      checked={idFormData.comments_applicable}
                      onCheckedChange={(checked) =>
                        setIDFormData({
                          ...idFormData,
                          comments_applicable: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowIDDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveIDDoc}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
}
