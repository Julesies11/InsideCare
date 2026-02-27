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
import { Plus, Edit, Trash2, CheckSquare, GripVertical, Search } from 'lucide-react';
import { useChecklistMaster, ChecklistMaster } from '@/hooks/useChecklistMaster';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { handleSupabaseError } from '@/errors/error-handler';
import { Toolbar, ToolbarActions, ToolbarBreadcrumbs, ToolbarHeading } from '@/layouts/demo1/components/toolbar';

export function ChecklistMasterPage() {
  const { masterChecklists, loading, refresh } = useChecklistMaster();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistMaster | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    frequency: 'daily',
    description: '',
    items: [],
  });

  const [itemFormData, setItemFormData] = useState({
    title: '',
    instructions: '',
    priority: 'medium',
    is_required: true,
    sort_order: 0,
  });

  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      frequency: 'daily',
      description: '',
      items: [],
    });
    setShowEditDialog(true);
  };

  const handleEditTemplate = (template: ChecklistMaster) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      frequency: template.frequency,
      description: template.description || '',
      items: template.items || [],
    });
    setShowEditDialog(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? It will not affect existing house checklists.')) return;

    try {
      const { error } = await supabase
        .from('checklist_master')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      refresh();
    } catch (error: any) {
      handleSupabaseError(error, 'Failed to delete template');
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) return;

    try {
      let masterId = selectedTemplate?.id;

      if (masterId) {
        // Update existing
        const { error } = await supabase
          .from('checklist_master')
          .update({
            name: formData.name,
            frequency: formData.frequency,
            description: formData.description,
          })
          .eq('id', masterId);
        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('checklist_master')
          .insert({
            name: formData.name,
            frequency: formData.frequency,
            description: formData.description,
          })
          .select()
          .single();
        if (error) throw error;
        masterId = data.id;
      }

      // Handle items
      const originalItems = selectedTemplate?.items || [];
      const currentItems = formData.items.map((item: any, index: number) => ({
        ...item,
        master_id: masterId,
        sort_order: index,
      }));

      // Delete items
      const itemsToDelete = originalItems
        .filter(orig => !currentItems.some((curr: any) => curr.id === orig.id))
        .map(i => i.id);
      
      if (itemsToDelete.length > 0) {
        await supabase.from('checklist_item_master').delete().in('id', itemsToDelete);
      }

      // Upsert items (handle both new and existing)
      if (currentItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('checklist_item_master')
          .upsert(currentItems.map((item: any) => ({
            id: item.id?.startsWith('temp-') ? undefined : item.id,
            master_id: masterId,
            title: item.title,
            instructions: item.instructions,
            priority: item.priority,
            is_required: item.is_required,
            sort_order: item.sort_order,
          })));
        if (itemsError) throw itemsError;
      }

      toast.success('Template saved successfully');
      setShowEditDialog(false);
      refresh();
    } catch (error: any) {
      handleSupabaseError(error, 'Failed to save template');
    }
  };

  const handleSaveItem = () => {
    if (!itemFormData.title.trim()) return;

    if (selectedItem) {
      setFormData({
        ...formData,
        items: formData.items.map((item: any) => 
          (item.id === selectedItem.id || item.tempId === selectedItem.tempId) ? { ...item, ...itemFormData } : item
        )
      });
    } else {
      const tempId = `temp-${Date.now()}`;
      setFormData({
        ...formData,
        items: [...formData.items, { ...itemFormData, tempId }]
      });
    }
    setShowItemDialog(false);
  };

  const filteredTemplates = masterChecklists.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <>
      <Toolbar>
        <div className="flex flex-col gap-1">
          <ToolbarBreadcrumbs />
          <ToolbarHeading 
            title="Checklist Templates" 
            description="Manage master checklist blueprints for all houses" 
          />
        </div>
        <ToolbarActions>
          <Button onClick={handleAddTemplate}>
            <Plus className="size-4 me-1.5" />
            New Template
          </Button>
        </ToolbarActions>
      </Toolbar>

      <div className="container-fixed flex flex-col gap-5 lg:gap-7.5 py-5">
        <Card>
          <CardHeader>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search templates..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckSquare className="size-12 mx-auto mb-4 opacity-20" />
                <p>No templates found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="flex flex-col h-full hover:shadow-sm transition-all border-gray-200">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900 truncate">{template.name}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase">{template.frequency}</Badge>
                        </div>
                        {template.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEditTemplate(template)}>
                          <Edit className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDeleteTemplate(template.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-bold text-gray-700">{template.items?.length || 0}</span> tasks defined
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Add Template'}</DialogTitle>
            <DialogDescription>Define the blueprint for this checklist</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tpl-name">Name *</Label>
                <Input
                  id="tpl-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Safety Audit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-freq">Default Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                  <SelectTrigger id="tpl-freq">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-desc">Description</Label>
              <Textarea
                id="tpl-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this blueprint for?"
                rows={2}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Template Items</Label>
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedItem(null);
                  setItemFormData({ title: '', instructions: '', priority: 'medium', is_required: true, sort_order: formData.items.length });
                  setShowItemDialog(true);
                }}>
                  <Plus className="size-3.5 mr-1" />
                  Add Task
                </Button>
              </div>

              <Sortable
                value={formData.items}
                onValueChange={(newItems) => setFormData({ ...formData, items: newItems })}
                getItemValue={(item) => (item.id || item.tempId).toString()}
                className="space-y-2"
              >
                {formData.items.map((item: any) => (
                  <SortableItem 
                    key={item.id || item.tempId} 
                    value={(item.id || item.tempId).toString()}
                    className="flex items-center gap-3 p-3 bg-background border rounded-lg group"
                  >
                    <SortableItemHandle className="shrink-0 text-muted-foreground/50 hover:text-foreground cursor-grab">
                      <GripVertical className="size-4" />
                    </SortableItemHandle>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">{item.title}</span>
                        {item.is_required && <Badge variant="outline" className="text-[9px] border-red-200 text-red-600 bg-red-50">REQ</Badge>}
                      </div>
                      {item.instructions && <p className="text-[10px] text-muted-foreground truncate">{item.instructions}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                        setSelectedItem(item);
                        setItemFormData({ ...item });
                        setShowItemDialog(true);
                      }}>
                        <Edit className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => {
                        setFormData({ ...formData, items: formData.items.filter((i: any) => (i.id !== item.id || i.tempId !== item.tempId)) });
                      }}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </SortableItem>
                ))}
              </Sortable>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Task' : 'Add Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                value={itemFormData.title}
                onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
                placeholder="What needs to be done?"
              />
            </div>
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={itemFormData.instructions}
                onChange={(e) => setItemFormData({ ...itemFormData, instructions: e.target.value })}
                placeholder="Step-by-step guidance..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="itm-req"
                checked={itemFormData.is_required}
                onCheckedChange={(c) => setItemFormData({ ...itemFormData, is_required: !!c })}
              />
              <Label htmlFor="itm-req" className="cursor-pointer">Required Task</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveItem}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
