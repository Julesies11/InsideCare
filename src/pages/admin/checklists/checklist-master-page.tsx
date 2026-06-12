import { useMemo, useState } from 'react';
import { masterListsApi } from '@/api/master-lists.api';
import {
  CheckSquare,
  ClipboardList,
  Edit,
  GripVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { cn } from '@/lib/utils';
import {
  ChecklistMaster,
  useChecklistMaster,
} from '@/hooks/use-checklist-master';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Sortable, SortableItem } from '@/components/ui/sortable';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ChecklistCard } from '@/components/checklists/checklist-card';
import { Container } from '@/components/common/container';

export function ChecklistMasterPage() {
  const { masterChecklists, loading, refetch } = useChecklistMaster();
  const { hasAccess } = useRBAC();

  const canEdit = hasAccess({
    resource: RBAC_MODULES.MASTER_LISTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const canAdd = hasAccess({
    resource: RBAC_MODULES.MASTER_LISTS,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ChecklistMaster | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [formData, setFormData] = useState<{
    checklist_name: string;
    days_of_week: string[];
    description: string;
    items: any[];
  }>({
    checklist_name: '',
    days_of_week: [],
    description: '',
    items: [],
  });

  const [itemFormData, setItemFormData] = useState({
    title: '',
    instructions: '',
    group_title: 'Morning',
    priority: 'medium',
    is_required: true,
    sort_order: 0,
  });

  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setFormData({
      checklist_name: '',
      days_of_week: [],
      description: '',
      items: [],
    });
    setShowEditDialog(true);
  };

  const handleEditTemplate = (template: ChecklistMaster) => {
    setSelectedTemplate(template);
    setFormData({
      checklist_name: template.checklist_name,
      days_of_week: template.days_of_week || [],
      description: template.description || '',
      items: template.items || [],
    });
    setShowEditDialog(true);
  };

  const handleDeleteTemplate = async (template: ChecklistMaster) => {
    if (
      !confirm(
        'Are you sure you want to delete this master checklist? This will not affect existing house-specific copies.',
      )
    )
      return;

    try {
      await masterListsApi.checklists.delete(template.id);
      toast.success('Master checklist deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error('Failed to delete checklist: ' + error.message);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.checklist_name.trim()) return;

    try {
      await masterListsApi.checklists.upsert(
        {
          checklist_name: formData.checklist_name,
          days_of_week: formData.days_of_week,
          description: formData.description,
          items: formData.items,
        },
        selectedTemplate?.id,
      );

      toast.success(
        selectedTemplate
          ? 'Master checklist updated'
          : 'Master checklist created',
      );
      refetch();
      setShowEditDialog(false);
    } catch (error: any) {
      toast.error('Failed to save checklist: ' + error.message);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setItemFormData({
      title: '',
      instructions: '',
      group_title: 'Morning',
      priority: 'medium',
      is_required: true,
      sort_order: formData.items.length,
    });
    setShowItemDialog(true);
  };

  const handleSaveItem = () => {
    if (!itemFormData.title.trim()) return;

    if (selectedItem) {
      setFormData({
        ...formData,
        items: formData.items.map((i) =>
          i === selectedItem ? { ...itemFormData, id: i.id } : i,
        ),
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          { ...itemFormData, tempId: `temp-${Date.now()}` },
        ],
      });
    }
    setShowItemDialog(false);
  };

  const handleDeleteItem = (item: any) => {
    setFormData({
      ...formData,
      items: formData.items.filter((i) => i !== item),
    });
  };

  const filteredTemplates = useMemo(() => {
    return masterChecklists.filter(
      (t) =>
        t.checklist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [masterChecklists, searchTerm]);

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                Checklist Master
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Standardized routine templates for all houses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="pl-10 h-10"
              />
            </div>
            {canAdd && (
              <Button
                onClick={handleAddTemplate}
                className="gap-2 font-bold h-10"
              >
                <Plus className="size-4" /> Create Template
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <ChecklistCard
              key={template.id}
              checklist={template}
              onEdit={() => handleEditTemplate(template)}
              onDelete={() => handleDeleteTemplate(template)}
              isMaster
              canEdit={canEdit}
            />
          ))}

          {filteredTemplates.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-muted/30">
              <ClipboardList className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-gray-400">
                No master templates found
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Create your first standardized checklist routine
              </p>
              <Button
                onClick={handleAddTemplate}
                variant="outline"
                className="font-bold border-gray-300"
              >
                Create Template
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 border-none shadow-2xl overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 border-b bg-white">
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight">
                {selectedTemplate
                  ? 'Edit Master Template'
                  : 'New Master Template'}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground">
                Standardize this routine for organization-wide use.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-gray-50/30 custom-scrollbar">
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Template Name *
                </Label>
                <Input
                  value={formData.checklist_name}
                  onChange={(e) =>
                    setFormData({ ...formData, checklist_name: e.target.value })
                  }
                  placeholder="e.g. Morning Clinical Routine"
                  className="h-10 text-base font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Default Applicable Days (Optional)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                    (day) => {
                      const isSelected = formData.days_of_week.includes(day);
                      return (
                        <Badge
                          key={day}
                          variant={isSelected ? 'primary' : 'outline'}
                          className={cn(
                            'cursor-pointer h-7 px-3 text-[10px] font-bold transition-all',
                            isSelected
                              ? 'shadow-sm shadow-primary/20 scale-105'
                              : 'bg-white hover:bg-gray-100 border-gray-200',
                          )}
                          onClick={() => {
                            const newDays = isSelected
                              ? formData.days_of_week.filter((d) => d !== day)
                              : [...formData.days_of_week, day];
                            setFormData({ ...formData, days_of_week: newDays });
                          }}
                        >
                          {day}
                        </Badge>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Description
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the standard procedure for this routine..."
                  rows={2}
                  className="bg-white resize-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
                    Standard Tasks ({formData.items.length})
                  </h3>
                  <div className="h-1 w-1 rounded-full bg-gray-300" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 text-primary font-bold hover:bg-primary/5"
                  onClick={handleAddItem}
                >
                  <Plus className="size-4" /> Add Task
                </Button>
              </div>

              <div className="space-y-3">
                <Sortable
                  value={formData.items}
                  onValueChange={(newItems) =>
                    setFormData({ ...formData, items: newItems })
                  }
                  getItemValue={(item) =>
                    (item.id || item.tempId || '').toString()
                  }
                >
                  {formData.items.map((item, idx) => (
                    <SortableItem
                      key={item.id || item.tempId || idx}
                      value={(item.id || item.tempId || idx).toString()}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white group hover:border-primary/30 transition-colors"
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-gray-900 truncate">
                            {item.title}
                          </span>
                          <div className="flex gap-1">
                            {item.is_required && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1.5 border-red-100 text-red-600 bg-red-50 uppercase font-black tracking-tighter"
                              >
                                Mandatory
                              </Badge>
                            )}
                            {item.group_title && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1.5 uppercase font-bold text-blue-600 border-blue-100 bg-blue-50"
                              >
                                {item.group_title}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.instructions && (
                          <p className="text-[10px] text-muted-foreground truncate font-medium">
                            {item.instructions}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg"
                          onClick={() => {
                            setSelectedItem(item);
                            setItemFormData({ ...item });
                            setShowItemDialog(true);
                          }}
                        >
                          <Edit className="size-3.5 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg hover:bg-red-50"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 className="size-3.5 text-red-400" />
                        </Button>
                      </div>
                    </SortableItem>
                  ))}
                </Sortable>

                {formData.items.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-gray-50/50">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      No tasks added yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-white flex flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowEditDialog(false)}
              className="flex-1 font-bold h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              className="flex-[2] font-black uppercase tracking-tight h-11 shadow-xl shadow-primary/20"
            >
              {selectedTemplate
                ? 'Update Master Template'
                : 'Create Master Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-white">
            <div className="flex items-center">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                <CheckSquare className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">
                  {selectedItem ? 'Edit Standard Task' : 'Add Standard Task'}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground">
                  Define a requirement for this template.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-4 sm:p-5 bg-gray-50/30">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Task Title *
              </Label>
              <Input
                value={itemFormData.title}
                onChange={(e) =>
                  setItemFormData({ ...itemFormData, title: e.target.value })
                }
                placeholder="e.g. Confirm kitchen cleaning completed"
                className="bg-white h-10 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Instructions (Optional)
              </Label>
              <Textarea
                value={itemFormData.instructions}
                onChange={(e) =>
                  setItemFormData({
                    ...itemFormData,
                    instructions: e.target.value,
                  })
                }
                placeholder="Step-by-step guidance for staff..."
                rows={3}
                className="bg-white resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Shift Period
                </Label>
                <Select
                  value={itemFormData.group_title}
                  onValueChange={(v) =>
                    setItemFormData({ ...itemFormData, group_title: v })
                  }
                >
                  <SelectTrigger className="bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Afternoon">Afternoon</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                    <SelectItem value="Sleepover">Sleepover</SelectItem>
                    <SelectItem value="Daily">General/Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Priority
                </Label>
                <Select
                  value={itemFormData.priority}
                  onValueChange={(v) =>
                    setItemFormData({ ...itemFormData, priority: v })
                  }
                >
                  <SelectTrigger className="bg-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                  Mandatory Task
                </Label>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Staff must confirm this task is done.
                </p>
              </div>
              <Switch
                checked={itemFormData.is_required}
                onCheckedChange={(v) =>
                  setItemFormData({ ...itemFormData, is_required: v })
                }
                className="scale-90"
              />
            </div>
          </div>

          <DialogFooter className="p-3 sm:p-4 border-t bg-white flex flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowItemDialog(false)}
              className="flex-1 font-bold h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveItem}
              className="flex-[2] font-black uppercase tracking-tight h-10 shadow-lg shadow-primary/10"
            >
              Apply Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
