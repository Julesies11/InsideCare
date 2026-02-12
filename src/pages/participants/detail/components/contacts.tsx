import { useState } from 'react';
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
import { useParticipantContacts } from '@/hooks/useParticipantContacts';
import { useContactTypesMaster } from '@/hooks/useContactTypesMaster';
import { ContactTypeCombobox } from './contact-components/contact-type-combobox';
import { ContactTypeMasterDialog } from './contact-components/contact-type-master-dialog';
import { ParticipantPendingChanges } from '@/models/participant-pending-changes';

interface ContactsProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: ParticipantPendingChanges;
  onPendingChangesChange?: (changes: ParticipantPendingChanges) => void;
}

export function Contacts({ 
  participantId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: ContactsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showContactTypeMasterDialog, setShowContactTypeMasterDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [refreshContactTypeKey, setRefreshContactTypeKey] = useState(0);
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_type_id: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    is_active: true,
  });

  const { contacts, loading } = useParticipantContacts(participantId);
  const { contactTypes } = useContactTypesMaster();

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
    if (!formData.contact_name.trim()) {
      return;
    }
    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingContact) {
      // Update existing contact
      if (editingContact.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          contacts: {
            ...pendingChanges.contacts,
            toAdd: pendingChanges.contacts.toAdd.map(cont =>
              cont.tempId === editingContact.tempId ? { ...cont, ...formData } : cont
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          contacts: {
            ...pendingChanges.contacts,
            toUpdate: [
              ...pendingChanges.contacts.toUpdate.filter(c => c.id !== editingContact.id),
              { id: editingContact.id, ...formData },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new contact
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        contacts: {
          ...pendingChanges.contacts,
          toAdd: [
            ...pendingChanges.contacts.toAdd,
            { tempId, ...formData },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
  };

  const handleDelete = (contact: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (contact.tempId) {
      handleCancelPendingAdd(contact.tempId);
      return;
    }

    // Otherwise, mark existing contact for deletion
    if (confirm('Mark this contact for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        contacts: {
          ...pendingChanges.contacts,
          toDelete: [...pendingChanges.contacts.toDelete, contact.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      contacts: {
        ...pendingChanges.contacts,
        toAdd: pendingChanges.contacts.toAdd.filter(cont => cont.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      contacts: {
        ...pendingChanges.contacts,
        toUpdate: pendingChanges.contacts.toUpdate.filter(cont => cont.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      contacts: {
        ...pendingChanges.contacts,
        toDelete: pendingChanges.contacts.toDelete.filter(contId => contId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Helper function to get contact type name
  const getContactTypeName = (contact: any) => {
    // If contact has contact_type object (from database join), use it
    if (contact.contact_type?.name) {
      return contact.contact_type.name;
    }
    // Otherwise, look up by contact_type_id (for pending contacts)
    if (contact.contact_type_id) {
      const contactType = contactTypes.find(ct => ct.id === contact.contact_type_id);
      return contactType?.name || 'N/A';
    }
    return 'N/A';
  };

  // Combine existing contacts with pending adds, filter out pending deletes
  const visibleContacts = [
    ...contacts.filter(cont => !pendingChanges?.contacts.toDelete.includes(cont.id)),
    ...(pendingChanges?.contacts.toAdd || []),
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
          ) : visibleContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No contacts recorded</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleContacts.map((contact) => {
                  const isPendingAdd = 'tempId' in contact;
                  const isPendingUpdate = pendingChanges?.contacts.toUpdate.some(c => c.id === contact.id);
                  const isPendingDelete = pendingChanges?.contacts.toDelete.includes(contact.id);
                  
                  return (
                    <TableRow 
                      key={contact.id || contact.tempId} 
                      className={
                        isPendingAdd ? 'bg-primary/5' : 
                        isPendingDelete ? 'opacity-50 bg-destructive/5' : 
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground" />
                          <span className={`font-medium ${isPendingDelete ? 'line-through' : ''}`}>
                            {contact.contact_name}
                          </span>
                          {isPendingAdd && (
                            <span className="text-xs text-primary flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending add
                            </span>
                          )}
                          {isPendingUpdate && (
                            <span className="text-xs text-warning flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending update
                            </span>
                          )}
                          {isPendingDelete && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending deletion
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getContactTypeName(contact)}</TableCell>
                      <TableCell>{contact.phone || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {contact.email || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={contact.is_active ? 'success' : 'secondary'}>
                          {contact.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(contact)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {isPendingAdd && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingAdd(contact.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(contact.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(contact.id)}
                            >
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            <DialogDescription>
              {editingContact
                ? 'Update contact details'
                : 'Add a new contact for this participant'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_type">Contact Type</Label>
              <ContactTypeCombobox
                value={formData.contact_type_id}
                onChange={(value) => setFormData({ ...formData, contact_type_id: value })}
                canEdit={true}
                onManageList={() => setShowContactTypeMasterDialog(true)}
                onRefresh={refreshContactTypeKey > 0 ? () => {} : undefined}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., contact@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder="Physical address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active_contact"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active_contact">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContactTypeMasterDialog
        open={showContactTypeMasterDialog}
        onClose={() => {
          setShowContactTypeMasterDialog(false);
          setRefreshContactTypeKey(prev => prev + 1);
        }}
        onUpdate={() => {}}
      />
    </>
  );
}
