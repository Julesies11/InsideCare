import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, CheckSquare, GripVertical, Search, ClipboardList } from 'lucide-react';
import { useChecklistMaster, ChecklistMaster } from '@/hooks/useChecklistMaster';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { handleSupabaseError } from '@/errors/error-handler';
import { ChecklistCard } from '@/components/checklists/checklist-card';
import { Container } from '@/components/common/container';

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
  const [initialFormData, setInitialFormData] = useState<any>(null);

  const hasEdits = useMemo(() => {
    if (!initialFormData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  const [itemFormData, setItemFormData] = useState({
    title: '',
    instructions: '',
    priority: 'medium',
    is_required: true,
    sort_order: 0,
  });

  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    const initialData = {
      name: '',
      frequency: 'daily',
      description: '',
      items: [],
    };
    setFormData(initialData);
    setInitialFormData(initialData);
    setShowEditDialog(true);
  };

  const handleEditTemplate = (template: ChecklistMaster) => {
    setSelectedTemplate(template);
    const initialData = {
      name: template.name,
      frequency: template.frequency,
      description: template.description || '',
      items: template.items || [],
    };
    setFormData(initialData);
    setInitialFormData(initialData);
    setShowEditDialog(true);
  };

  const handleDeleteTemplate = async (template: ChecklistMaster) => {
    if (!confirm('Are you sure you want to delete this master checklist? It will not affect existing house checklists.')) return;

    try {
      const { error } = await supabase
        .from('checklist_master')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
      toast.success('Master checklist deleted successfully');
      refresh();
    } catch (error: any) {
      handleSupabaseError(error, 'Failed to delete checklist');
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) return;

    try {
      let masterId = selectedTemplate?.id;

      if (masterId) {
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

      // Separate updates from inserts to avoid PostgREST bulk array null key issues
      if (currentItems.length > 0) {
        const itemsToUpdate = currentItems
          .filter((item: any) => item.id && !item.id.startsWith('temp-'))
          .map((item: any) => ({
            id: item.id,
            master_id: masterId,
            title: item.title,
            instructions: item.instructions,
            priority: item.priority,
            is_required: item.is_required,
            sort_order: item.sort_order,
          }));

        const itemsToInsert = currentItems
          .filter((item: any) => !item.id || item.id.startsWith('temp-'))
          .map((item: any) => ({
            master_id: masterId,
            title: item.title,
            instructions: item.instructions,
            priority: item.priority,
            is_required: item.is_required,
            sort_order: item.sort_order,
          }));

        if (itemsToUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from('checklist_item_master')
            .upsert(itemsToUpdate);
          if (updateError) throw updateError;
        }

        if (itemsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('checklist_item_master')
            .insert(itemsToInsert);
          if (insertError) throw insertError;
        }
      }

      toast.success('Master checklist saved successfully');
      setShowEditDialog(false);
      refresh();
    } catch (error: any) {
      handleSupabaseError(error, 'Failed to save checklist');
    }
  };

  const handleSaveItem = () => {
    if (!itemFormData.title.trim()) return;

    if (selectedItem) {
      setFormData({
        ...formData,
        items: formData.items.map((item: any) => 
          (item.id && item.id === selectedItem.id) || (item.tempId && item.tempId === selectedItem.tempId) 
            ? { ...item, ...itemFormData } 
            : item
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

  return (
    <Container>
      <div className="grid gap-5 lg:gap-7.5 py-5">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Checklist Templates
            </h1>
            <p className="text-sm text-gray-700 dark:text-gray-400">
              Manage master checklists for all houses
            </p>
          </div>
          <Button onClick={handleAddTemplate}>
            <Plus className="size-4 me-1.5" />
            New Master Checklist
          </Button>
        </div>

        {/* Motivational Banner */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <ClipboardList className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                  Standardising Care Quality
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Master templates allow you to define standardised operational procedures that can be 
                  easily deployed and customised across all your service locations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Card */}
        <Card>
          <CardHeader>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search master checklists..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Loading checklists...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckSquare className="size-12 mx-auto mb-4 opacity-20" />
                <p>No master checklists found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTemplates.map(template => (
                  <ChecklistCard 
                    key={template.id}
                    checklist={template}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                    showTasksPreview={true}
                    footer={
                      <Button variant="secondary" size="sm" className="w-full h-8 text-xs font-bold gap-1.5" onClick={() => handleEditTemplate(template)}>
                        <Edit className="size-3.5" />
                        Manage Master Checklist
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{selectedTemplate ? 'Edit Master Checklist' : 'Add Master Checklist'}</DialogTitle>
            <DialogDescription>Define the structure for this master checklist</DialogDescription>
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
                placeholder="What is this checklist for?"
                rows={2}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Master Tasks</Label>
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedItem(null);
                  setItemFormData({ title: '', instructions: '', priority: 'medium', is_required: true, sort_order: formData.items.length });
                  setShowItemDialog(true);
                }}>
                  <Plus className="size-3.5 mr-1" />
                  Add Master Task
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
                        <span className="text-sm font-medium truncate block">{item.title}</span>
                        {item.is_required && (
                          <Badge variant="outline" className="text-[9px] h-4 border-red-200 text-red-600 bg-red-50 px-1 uppercase shrink-0">
                            Required
                          </Badge>
                        )}
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
                        setFormData({ ...formData, items: formData.items.filter((i: any) => ( (i.id && i.id !== item.id) || (i.tempId && i.tempId !== item.tempId) )) });
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
            <Button variant="primary" onClick={handleSaveTemplate} disabled={!hasEdits || !formData.name.trim()}>Save Master Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Master Task' : 'Add Master Task'}</DialogTitle>
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
                id="itm-req-master"
                checked={itemFormData.is_required}
                onCheckedChange={(c) => setItemFormData({ ...itemFormData, is_required: !!c })}
              />
              <Label htmlFor="itm-req-master" className="cursor-pointer">Required Task</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveItem}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
