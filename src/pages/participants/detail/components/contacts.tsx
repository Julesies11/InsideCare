import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users, Clock } from 'lucide-react';
import { useParticipantContacts } from '@/hooks/use-participant-contacts';
import { useContactTypesMaster } from '@/hooks/use-contact-types-master';
import { ContactTypeCombobox } from './contact-components/contact-type-combobox';
import { ContactTypeMasterDialog } from './contact-components/contact-type-master-dialog';
import { cn } from '@/lib/utils';

interface ContactPendingChanges {
  toAdd: any[];
  toUpdate: any[];
  toDelete: string[];
}

interface ContactsProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  canEdit: boolean;
  pendingChanges?: ContactPendingChanges;
  onPendingChangesChange?: (changes: ContactPendingChanges) => void;
}

export function Contacts({ 
  participantId, 
  canAdd, 
  canDelete,
  canEdit,
  pendingChanges,
  onPendingChangesChange 
}: ContactsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showContactTypeMasterDialog, setShowContactTypeMasterDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<{ id?: string; tempId?: string; contact_name: string; contact_type_id?: string; phone?: string; email?: string; address?: string; notes?: string; is_active: boolean } | null>(null);
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_type_id: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    is_active: true,
  });

  const { data: contacts = [], isLoading: loading } = useParticipantContacts(participantId);
  const { data: contactTypes = [] } = useContactTypesMaster();

  const handleAdd = () => {
    setEditingContact(null);
    setFormData({
      contact_name: '',
      contact_type_id: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      is_active: true,
    });
    setShowDialog(true);
  };

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      contact_name: contact.contact_name,
      contact_type_id: contact.contact_type_id || '',
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      notes: contact.notes || '',
      is_active: contact.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingContact) {
      if (editingContact.tempId) {
        const newPending = {
          ...pendingChanges,
          toAdd: pendingChanges.toAdd.map(c => 
            c.tempId === editingContact.tempId ? { ...c, ...formData } : c
          ),
        };
        onPendingChangesChange(newPending);
      } else {
        const newPending = {
          ...pendingChanges,
          toUpdate: [
            ...pendingChanges.toUpdate.filter(c => c.id !== editingContact.id),
            { id: editingContact.id, ...formData },
          ],
        };
        onPendingChangesChange(newPending);
      }
    } else {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        toAdd: [
          ...pendingChanges.toAdd,
          { tempId, ...formData },
        ],
      };
      onPendingChangesChange(newPending);
    }

    setShowDialog(false);
  };

  const handleDelete = (contact: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (contact.tempId) {
      const newPending = {
        ...pendingChanges,
        toAdd: pendingChanges.toAdd.filter(c => c.tempId !== contact.tempId),
      };
      onPendingChangesChange(newPending);
      return;
    }

    if (confirm('Mark this contact for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        toDelete: [...pendingChanges.toDelete, contact.id],
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    const newPending = {
      ...pendingChanges,
      toUpdate: pendingChanges.toUpdate.filter(c => c.id !== id),
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    const newPending = {
      ...pendingChanges,
      toDelete: pendingChanges.toDelete.filter(contactId => contactId !== id),
    };
    onPendingChangesChange(newPending);
  };

  const getContactTypeName = (id: string) => {
    return contactTypes.find(t => t.id === id)?.name || 'Unknown Type';
  };

  // Combine actual and pending contacts
  const visibleContacts = contacts
    .filter(c => !pendingChanges?.toDelete.includes(c.id))
    .map(c => {
      const update = pendingChanges?.toUpdate.find(u => u.id === c.id);
      return update ? { ...c, ...update, isPendingUpdate: true } : c;
    });

  const allContacts = [
    ...visibleContacts,
    ...(pendingChanges?.toAdd.map(c => ({ ...c, isPendingAdd: true })) || []),
  ];

  return (
    <>
      <Card className="pb-2.5" id="contacts">
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!participantId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
          ) : allContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No contacts recorded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allContacts.map((contact) => {
                  const isPendingDelete = !contact.isPendingAdd && pendingChanges?.toDelete.includes(contact.id);
                  const isPendingUpdate = contact.isPendingUpdate;
                  const isPendingAdd = contact.isPendingAdd;

                  return (
                    <TableRow 
                      key={contact.id || contact.tempId}
                      className={cn(
                        isPendingAdd && 'bg-primary/5',
                        isPendingUpdate && 'bg-warning/5',
                        isPendingDelete && 'opacity-50 grayscale bg-red-50'
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground" />
                          <span className={cn(isPendingDelete && 'line-through')}>
                            {contact.contact_name}
                          </span>
                          {isPendingAdd && <Badge variant="outline" className="text-[10px] uppercase">New</Badge>}
                          {isPendingUpdate && <Badge variant="outline" className="text-[10px] uppercase border-warning text-warning">Pending Update</Badge>}
                          {isPendingDelete && <Badge variant="destructive" className="text-[10px] uppercase">Pending Delete</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className={cn(isPendingDelete && 'line-through')}>
                        {getContactTypeName(contact.contact_type_id)}
                      </TableCell>
                      <TableCell className={cn(isPendingDelete && 'line-through')}>{contact.phone}</TableCell>
                      <TableCell className={cn(isPendingDelete && 'line-through')}>{contact.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && !isPendingAdd && !isPendingUpdate && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)} disabled={!canAdd}>
                                <Edit className="size-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(contact)} disabled={!canDelete}>
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                          {isPendingAdd && (
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(contact)}>
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button variant="ghost" size="sm" onClick={() => handleCancelPendingUpdate(contact.id)}>
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button variant="ghost" size="sm" onClick={() => handleCancelPendingDelete(contact.id)}>
                              Undo
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            <DialogDescription>
              {editingContact ? 'Update contact details' : 'Add a new contact for this participant'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_type">Contact Type *</Label>
              <div className="flex gap-2">
                <ContactTypeCombobox
                  value={formData.contact_type_id}
                  onChange={(val) => setFormData({ ...formData, contact_type_id: val })}
                  canEdit={canEdit}
                  onManageList={() => setShowContactTypeMasterDialog(true)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="contact_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="contact_active">Active Contact</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.contact_name || !formData.contact_type_id}>
              {editingContact ? 'Update Queue' : 'Add to Queue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContactTypeMasterDialog
        open={showContactTypeMasterDialog}
        onOpenChange={setShowContactTypeMasterDialog}
      />
    </>
  );
}
