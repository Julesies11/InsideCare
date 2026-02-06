import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useContactTypesMaster } from '@/hooks/useContactTypesMaster';
import { ContactTypeMaster } from '@/models/contact-type-master';
import { ContactTypeMasterQuickAdd } from './contact-type-master-quick-add';
import { toast } from 'sonner';

interface ContactTypeMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type SortField = 'name' | 'is_active';
type SortDirection = 'asc' | 'desc';

export function ContactTypeMasterDialog({
  open,
  onClose,
  onUpdate,
}: ContactTypeMasterDialogProps) {
  const { contactTypes, loading, addContactType, updateContactType, refresh } = useContactTypesMaster();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContactType, setEditingContactType] = useState<ContactTypeMaster | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredContactTypes = useMemo(() => {
    let filtered = contactTypes.filter((ct) =>
      ct.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'is_active') {
        aVal = a.is_active ? 1 : 0;
        bVal = b.is_active ? 1 : 0;
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [contactTypes, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingContactType(null);
    setShowAddDialog(true);
  };

  const handleEdit = (contactType: ContactTypeMaster) => {
    setEditingContactType(contactType);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (contactType: ContactTypeMaster) => {
    const newStatus = !contactType.is_active;
    const { error } = await updateContactType(contactType.id, { is_active: newStatus });
    if (error) {
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} contact type: ` + error);
    } else {
      toast.success(`Contact type ${newStatus ? 'activated' : 'deactivated'} successfully`);
      await refresh();
      onUpdate();
    }
  };

  const handleSave = async (contactTypeData: Partial<ContactTypeMaster>) => {
    if (editingContactType) {
      const { error } = await updateContactType(editingContactType.id, contactTypeData);
      if (error) {
        toast.error('Failed to update contact type: ' + error);
      } else {
        toast.success('Contact type updated successfully');
        setShowAddDialog(false);
        await refresh();
        onUpdate();
      }
    } else {
      const { error } = await addContactType({
        name: contactTypeData.name!,
        is_active: contactTypeData.is_active ?? true,
        created_by: null,
        updated_by: null,
      });
      if (error) {
        toast.error('Failed to add contact type: ' + error);
      } else {
        toast.success('Contact type added successfully');
        setShowAddDialog(false);
        await refresh();
        onUpdate();
      }
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-4 ms-1 inline opacity-30" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="size-4 ms-1 inline" /> : 
      <ArrowDown className="size-4 ms-1 inline" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col" style={{ zIndex: 60 }}>
          <DialogHeader>
            <DialogTitle>Manage Contact Types</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 mb-4">
            <Input
              placeholder="Search contact types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd}>
              <Plus className="size-4 me-1.5" />
              Add Contact Type
            </Button>
          </div>

          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading contact types...</div>
            ) : sortedAndFilteredContactTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No contact types found matching your search' : 'No contact types available'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      Contact Type Name
                      <SortIcon field="name" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('is_active')}
                    >
                      Status
                      <SortIcon field="is_active" />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredContactTypes.map((contactType) => (
                    <TableRow key={contactType.id}>
                      <TableCell className="font-medium">{contactType.name}</TableCell>
                      <TableCell>
                        <Badge variant={contactType.is_active ? 'success' : 'secondary'}>
                          {contactType.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(contactType)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(contactType)}
                            title={contactType.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {contactType.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t mt-auto">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ContactTypeMasterQuickAdd
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingContactType(null);
        }}
        onSave={handleSave}
        editingContactType={editingContactType}
      />
    </>
  );
}
