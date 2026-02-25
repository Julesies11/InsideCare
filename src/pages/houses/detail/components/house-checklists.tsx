import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, CheckSquare, Square, Clock, AlertCircle, Info } from 'lucide-react';
import { useHouseChecklists } from '@/hooks/useHouseChecklists';
import { HousePendingChanges } from '@/models/house-pending-changes';

interface HouseChecklistsProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

export function HouseChecklists({ 
  houseId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: HouseChecklistsProps) {
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [checklistFormData, setChecklistFormData] = useState({
    name: '',
    frequency: 'daily',
    description: '',
    is_global: false,
  });
  const [itemFormData, setItemFormData] = useState({
    title: '',
    instructions: '',
    priority: 'medium',
    is_required: true,
    sort_order: 0,
  });

  const { houseChecklists, loading } = useHouseChecklists(houseId);

  const handleAddChecklist = () => {
    setSelectedChecklist(null);
    setChecklistFormData({
      name: '',
      frequency: 'daily',
      description: '',
      is_global: false,
    });
    setShowChecklistDialog(true);
  };

  const handleEditChecklist = (checklist: any) => {
    setSelectedChecklist(checklist);
    setChecklistFormData({
      name: checklist.name,
      frequency: checklist.frequency,
      description: checklist.description || '',
      is_global: checklist.is_global || false,
    });
    setShowChecklistDialog(true);
  };

  const handleSaveChecklist = () => {
    if (!checklistFormData.name.trim() || !pendingChanges || !onPendingChangesChange) return;

    const checklistData = {
      ...checklistFormData,
      house_id: houseId,
    };

    if (selectedChecklist) {
      // Update existing checklist
      if (selectedChecklist.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          checklists: {
            ...pendingChanges.checklists,
            toAdd: pendingChanges.checklists.toAdd.map(checklist =>
              checklist.tempId === selectedChecklist.tempId ? { ...checklist, ...checklistData } : checklist
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          checklists: {
            ...pendingChanges.checklists,
            toUpdate: [
              ...pendingChanges.checklists.toUpdate.filter(c => c.id !== selectedChecklist.id),
              { id: selectedChecklist.id, ...checklistData },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new checklist
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toAdd: [
            ...pendingChanges.checklists.toAdd,
            { tempId, ...checklistData, items: [] },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowChecklistDialog(false);
  };

  const handleDeleteChecklist = (checklist: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (checklist.tempId) {
      handleCancelPendingAdd(checklist.tempId);
      return;
    }

    // Otherwise, mark existing checklist for deletion
    if (confirm('Mark this checklist for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toDelete: [...pendingChanges.checklists.toDelete, checklist.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleAddItem = (checklistId: string) => {
    setSelectedChecklist(checklistId);
    setSelectedItem(null);
    setItemFormData({
      title: '',
      instructions: '',
      priority: 'medium',
      is_required: true,
      sort_order: 0,
    });
    setShowItemDialog(true);
  };

  const handleEditItem = (checklistId: string, item: any) => {
    setSelectedChecklist(checklistId);
    setSelectedItem(item);
    setItemFormData({
      title: item.title,
      instructions: item.instructions || '',
      priority: item.priority,
      is_required: item.is_required,
      sort_order: item.sort_order,
    });
    setShowItemDialog(true);
  };

  const handleSaveItem = () => {
    if (!itemFormData.title.trim() || !pendingChanges || !onPendingChangesChange) return;

    const itemData = {
      ...itemFormData,
      checklist_id: selectedChecklist,
    };

    if (selectedItem) {
      // Update existing item
      if (selectedItem.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          checklists: {
            ...pendingChanges.checklists,
            toAdd: pendingChanges.checklists.toAdd.map(checklist =>
              checklist.tempId === selectedChecklist ? {
                ...checklist,
                items: checklist.items.map(item =>
                  item.tempId === selectedItem.tempId ? { ...item, ...itemData } : item
                )
              } : checklist
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates for checklist items
        const newPending = {
          ...pendingChanges,
          checklists: {
            ...pendingChanges.checklists,
            checklistItems: {
              ...pendingChanges.checklists.checklistItems,
              toUpdate: [
                ...pendingChanges.checklists.checklistItems.toUpdate.filter(item => item.id !== selectedItem.id),
                { id: selectedItem.id, ...itemData },
              ],
            },
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new item
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toAdd: pendingChanges.checklists.toAdd.map(checklist =>
            checklist.tempId === selectedChecklist ? {
              ...checklist,
              items: [...checklist.items, { tempId, ...itemData }]
            } : checklist
          ),
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowItemDialog(false);
  };

  const handleDeleteItem = (checklistId: string, item: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (item.tempId) {
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          toAdd: pendingChanges.checklists.toAdd.map(checklist =>
            checklist.tempId === checklistId ? {
              ...checklist,
              items: checklist.items.filter(i => i.tempId !== item.tempId)
            } : checklist
          ),
        },
      };
      onPendingChangesChange(newPending);
      return;
    }

    // Otherwise, mark existing item for deletion
    if (confirm('Mark this checklist item for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        checklists: {
          ...pendingChanges.checklists,
          checklistItems: {
            ...pendingChanges.checklists.checklistItems,
            toDelete: [...pendingChanges.checklists.checklistItems.toDelete, item.id],
          },
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      checklists: {
        ...pendingChanges.checklists,
        toAdd: pendingChanges.checklists.toAdd.filter(checklist => checklist.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      checklists: {
        ...pendingChanges.checklists,
        toUpdate: pendingChanges.checklists.toUpdate.filter(checklist => checklist.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      checklists: {
        ...pendingChanges.checklists,
        toDelete: pendingChanges.checklists.toDelete.filter(checklistId => checklistId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Combine existing checklists with pending adds, filter out pending deletes
  const visibleChecklists = [
    ...houseChecklists.filter(checklist => !pendingChanges?.checklists.toDelete.includes(checklist.id)),
    ...(pendingChanges?.checklists.toAdd || []),
  ];

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Get frequency badge color
  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'blue';
      case 'weekly': return 'purple';
      case 'monthly': return 'orange';
      case 'quarterly': return 'pink';
      default: return 'gray';
    }
  };

  return (
    <>
      <Card className="pb-2.5" id="checklists">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="size-5" />
            Checklists
          </CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAddChecklist} disabled={!houseId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Checklist
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading checklists...</div>
          ) : visibleChecklists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <CheckSquare className="size-12 text-muted-foreground opacity-50" />
                <p>No checklists created yet</p>
                <p className="text-sm">Create checklists to track regular tasks and procedures</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleChecklists.map((checklist) => {
                const isPendingAdd = 'tempId' in checklist;
                const isPendingUpdate = pendingChanges?.checklists.toUpdate.some(c => c.id === checklist.id);
                const isPendingDelete = pendingChanges?.checklists.toDelete.includes(checklist.id);
                const checklistItems = checklist.items || [];

                return (
                  <Card key={checklist.id || checklist.tempId} className={`border ${
                    isPendingAdd ? 'bg-primary/5 border-primary/20' :
                    isPendingDelete ? 'opacity-50 bg-destructive/5 border-destructive/20' :
                    isPendingUpdate ? 'bg-warning/5 border-warning/20' : ''
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`text-base font-semibold ${isPendingDelete ? 'line-through' : ''}`}>
                              {checklist.name}
                            </h3>
                            {checklist.is_global && (
                              <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                                Global
                              </Badge>
                            )}
                            <Badge variant="outline" className={`text-xs border-${getFrequencyColor(checklist.frequency)}-500 text-${getFrequencyColor(checklist.frequency)}-700`}>
                              {checklist.frequency}
                            </Badge>
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
                          {checklist.description && (
                            <p className="text-sm text-muted-foreground">{checklist.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEditChecklist(checklist)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDeleteChecklist(checklist)}
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
                              onClick={() => handleCancelPendingAdd(checklist.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(checklist.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(checklist.id)}
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {checklistItems.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No items in this checklist
                          </div>
                        ) : (
                          checklistItems.map((item, index) => {
                            const isItemPendingAdd = 'tempId' in item;
                            const isItemPendingUpdate = pendingChanges?.checklists.checklistItems.toUpdate.some(i => i.id === item.id);
                            const isItemPendingDelete = pendingChanges?.checklists.checklistItems.toDelete.includes(item.id);

                            return (
                              <div
                                key={item.id || item.tempId}
                                className={`flex items-start gap-3 p-2 rounded-lg border ${
                                  isItemPendingAdd ? 'bg-primary/5 border-primary/20' :
                                  isItemPendingDelete ? 'opacity-50 bg-destructive/5 border-destructive/20' :
                                  isItemPendingUpdate ? 'bg-warning/5 border-warning/20' : 'bg-muted/30'
                                }`}
                              >
                                <Checkbox
                                  checked={false}
                                  disabled
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-sm font-medium ${isItemPendingDelete ? 'line-through' : ''}`}>
                                      {item.title}
                                    </span>
                                    {item.is_required && (
                                      <Badge variant="outline" className="text-xs border-red-500 text-red-700">
                                        Required
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className={`text-xs border-${getPriorityColor(item.priority)}-500 text-${getPriorityColor(item.priority)}-700`}>
                                      {item.priority}
                                    </Badge>
                                    {isItemPendingAdd && (
                                      <span className="text-xs text-primary flex items-center gap-1">
                                        <Clock className="size-3" />
                                        Pending add
                                      </span>
                                    )}
                                    {isItemPendingUpdate && (
                                      <span className="text-xs text-warning flex items-center gap-1">
                                        <Clock className="size-3" />
                                        Pending update
                                      </span>
                                    )}
                                    {isItemPendingDelete && (
                                      <span className="text-xs text-destructive flex items-center gap-1">
                                        <Clock className="size-3" />
                                        Pending deletion
                                      </span>
                                    )}
                                  </div>
                                  {item.instructions && (
                                    <p className="text-xs text-muted-foreground">{item.instructions}</p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  {!isItemPendingDelete && (
                                    <>
                                      <Button variant="ghost" size="sm" onClick={() => handleEditItem(checklist.id || checklist.tempId, item)}>
                                        <Edit className="size-3" />
                                      </Button>
                                      {canDelete && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive"
                                          onClick={() => handleDeleteItem(checklist.id || checklist.tempId, item)}
                                        >
                                          <Trash2 className="size-3" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                  {isItemPendingAdd && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteItem(checklist.id || checklist.tempId, item)}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                  {isItemPendingUpdate && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteItem(checklist.id || checklist.tempId, item)}
                                    >
                                      Undo
                                    </Button>
                                  )}
                                  {isItemPendingDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteItem(checklist.id || checklist.tempId, item)}
                                    >
                                      Undo
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div className="pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddItem(checklist.id || checklist.tempId)}
                            className="text-primary"
                          >
                            <Plus className="size-3 mr-1" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedChecklist ? 'Edit Checklist' : 'Add Checklist'}</DialogTitle>
            <DialogDescription>
              {selectedChecklist
                ? 'Update checklist details'
                : 'Create a new checklist for this house'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Checklist Name *</Label>
              <Input
                id="name"
                value={checklistFormData.name}
                onChange={(e) => setChecklistFormData({ ...checklistFormData, name: e.target.value })}
                placeholder="Enter checklist name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select value={checklistFormData.frequency} onValueChange={(value) => setChecklistFormData({ ...checklistFormData, frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={checklistFormData.description}
                onChange={(e) => setChecklistFormData({ ...checklistFormData, description: e.target.value })}
                placeholder="Describe what this checklist is for"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_global"
                checked={checklistFormData.is_global}
                onCheckedChange={(checked) => setChecklistFormData({ ...checklistFormData, is_global: checked })}
              />
              <Label htmlFor="is_global">Global Checklist</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChecklistDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveChecklist}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
            <DialogDescription>
              {selectedItem
                ? 'Update checklist item details'
                : 'Add a new item to this checklist'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Item Title *</Label>
              <Input
                id="title"
                value={itemFormData.title}
                onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
                placeholder="Enter item title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={itemFormData.instructions}
                onChange={(e) => setItemFormData({ ...itemFormData, instructions: e.target.value })}
                placeholder="Provide instructions for completing this item"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={itemFormData.priority} onValueChange={(value) => setItemFormData({ ...itemFormData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={itemFormData.sort_order}
                  onChange={(e) => setItemFormData({ ...itemFormData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_required"
                checked={itemFormData.is_required}
                onCheckedChange={(checked) => setItemFormData({ ...itemFormData, is_required: checked })}
              />
              <Label htmlFor="is_required">Required Item</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
