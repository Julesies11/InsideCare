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
import { Plus, Edit, Trash2, Building2, Clock } from 'lucide-react';
import { useParticipantProviders } from '@/hooks/useParticipantProviders';
import { PendingChanges } from '@/models/pending-changes';

interface ServiceProvidersProps {
  participantId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
}

export function ServiceProviders({ 
  participantId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: ServiceProvidersProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [formData, setFormData] = useState({
    provider_name: '',
    provider_type: '',
    provider_description: '',
    is_active: true,
  });

  const { providers, loading } = useParticipantProviders(participantId);

  const handleAdd = () => {
    setEditingProvider(null);
    setFormData({
      provider_name: '',
      provider_type: '',
      provider_description: '',
      is_active: true,
    });
    setShowDialog(true);
  };

  const handleEdit = (provider: any) => {
    setEditingProvider(provider);
    setFormData({
      provider_name: provider.provider_name,
      provider_type: provider.provider_type || '',
      provider_description: provider.provider_description || '',
      is_active: provider.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.provider_name.trim()) {
      return;
    }
    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingProvider) {
      // Update existing provider
      if (editingProvider.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          serviceProviders: {
            ...pendingChanges.serviceProviders,
            toAdd: pendingChanges.serviceProviders.toAdd.map(prov =>
              prov.tempId === editingProvider.tempId ? { ...prov, ...formData } : prov
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          serviceProviders: {
            ...pendingChanges.serviceProviders,
            toUpdate: [
              ...pendingChanges.serviceProviders.toUpdate.filter(p => p.id !== editingProvider.id),
              { id: editingProvider.id, ...formData },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new provider
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        serviceProviders: {
          ...pendingChanges.serviceProviders,
          toAdd: [
            ...pendingChanges.serviceProviders.toAdd,
            { tempId, ...formData },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
  };

  const handleDelete = (provider: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (provider.tempId) {
      handleCancelPendingAdd(provider.tempId);
      return;
    }

    // Otherwise, mark existing provider for deletion
    if (confirm('Mark this provider for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        serviceProviders: {
          ...pendingChanges.serviceProviders,
          toDelete: [...pendingChanges.serviceProviders.toDelete, provider.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      serviceProviders: {
        ...pendingChanges.serviceProviders,
        toAdd: pendingChanges.serviceProviders.toAdd.filter(prov => prov.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      serviceProviders: {
        ...pendingChanges.serviceProviders,
        toUpdate: pendingChanges.serviceProviders.toUpdate.filter(prov => prov.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      serviceProviders: {
        ...pendingChanges.serviceProviders,
        toDelete: pendingChanges.serviceProviders.toDelete.filter(provId => provId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Combine existing providers with pending adds, filter out pending deletes
  const visibleProviders = [
    ...providers.filter(prov => !pendingChanges?.serviceProviders.toDelete.includes(prov.id)),
    ...(pendingChanges?.serviceProviders.toAdd || []),
  ];

  return (
    <>
      <Card className="pb-2.5" id="providers">
        <CardHeader>
          <CardTitle>Service Providers</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!participantId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Provider
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading providers...</div>
          ) : visibleProviders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No service providers recorded</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProviders.map((provider) => {
                  const isPendingAdd = 'tempId' in provider;
                  const isPendingUpdate = pendingChanges?.serviceProviders.toUpdate.some(p => p.id === provider.id);
                  const isPendingDelete = pendingChanges?.serviceProviders.toDelete.includes(provider.id);
                  
                  return (
                    <TableRow 
                      key={provider.id || provider.tempId} 
                      className={
                        isPendingAdd ? 'bg-primary/5' : 
                        isPendingDelete ? 'opacity-50 bg-destructive/5' : 
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-muted-foreground" />
                          <span className={`font-medium ${isPendingDelete ? 'line-through' : ''}`}>
                            {provider.provider_name}
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
                      <TableCell>{provider.provider_type || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {provider.provider_description || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={provider.is_active ? 'success' : 'secondary'}>
                          {provider.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(provider)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(provider)}
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
                              onClick={() => handleCancelPendingAdd(provider.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(provider.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(provider.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
            <DialogDescription>
              {editingProvider
                ? 'Update provider details'
                : 'Add a new service provider for this participant'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider_name">Provider Name *</Label>
              <Input
                id="provider_name"
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider_type">Type</Label>
              <Input
                id="provider_type"
                value={formData.provider_type}
                onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
                placeholder="e.g., GP, Physiotherapist"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider_description">Description</Label>
              <Textarea
                id="provider_description"
                value={formData.provider_description}
                onChange={(e) =>
                  setFormData({ ...formData, provider_description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active_provider"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active_provider">Active</Label>
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
    </>
  );
}
