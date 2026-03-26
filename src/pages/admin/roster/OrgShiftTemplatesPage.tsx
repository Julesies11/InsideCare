import { useState, Fragment } from 'react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Clock, 
  CheckCircle2,
  XCircle,
  Zap,
  CheckSquare,
  Info
} from 'lucide-react';
import { useOrgShiftTemplates, OrgShiftTemplate } from '@/hooks/use-org-shift-templates';
import { useChecklistMaster } from '@/hooks/use-checklist-master';
import { toast } from 'sonner';
import { cn, getPeriodTheme, SHIFT_ICONS } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function OrgShiftTemplatesPage() {
  const { templates, createTemplate, updateTemplate, deleteTemplate, isLoading } = useOrgShiftTemplates();
  const { masterChecklists, isLoading: loadingChecklists } = useChecklistMaster();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OrgShiftTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<OrgShiftTemplate>>({
    name: '',
    short_name: '',
    start_time_default: '09:00',
    end_time_default: '17:00',
    color_theme: 'day',
    icon_name: 'Clock',
    sort_order: 0,
    is_active: true,
    default_checklists: []
  });

  const handleOpenDialog = (template?: OrgShiftTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        short_name: template.short_name || '',
        start_time_default: template.start_time_default?.substring(0, 5) || '09:00',
        end_time_default: template.end_time_default?.substring(0, 5) || '17:00',
        color_theme: template.color_theme || 'day',
        icon_name: template.icon_name || 'Clock',
        sort_order: template.sort_order || 0,
        is_active: template.is_active ?? true,
        default_checklists: template.default_checklists || []
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        short_name: '',
        start_time_default: '09:00',
        end_time_default: '17:00',
        color_theme: 'day',
        icon_name: 'Clock',
        sort_order: (templates?.length || 0) * 10,
        is_active: true,
        default_checklists: []
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, updates: formData });
        toast.success('Shift template updated');
      } else {
        await createTemplate.mutateAsync(formData);
        toast.success('Shift template created');
      }
      setShowDialog(false);
    } catch (err) {
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift template?')) return;
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Shift template deleted');
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const toggleChecklist = (id: string) => {
    setFormData(prev => ({
      ...prev,
      default_checklists: prev.default_checklists?.includes(id)
        ? prev.default_checklists.filter(clId => clId !== id)
        : [...(prev.default_checklists || []), id]
    }));
  };

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Org Shift Templates" />
            <ToolbarDescription>
              Manage global shift templates (e.g. Morning, Day, Night) for the entire organization
            </ToolbarDescription>
          </ToolbarHeading>
          <Button size="sm" onClick={() => handleOpenDialog()} className="font-bold">
            <Plus className="size-4 me-1" />
            Add Template
          </Button>
        </Toolbar>
      </Container>

      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full p-10 text-center text-muted-foreground">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="col-span-full p-10 text-center text-muted-foreground">No shift templates defined. Click "Add Template" to get started.</div>
          ) : (
            templates.map(template => {
              const theme = getPeriodTheme(template.name, template.color_theme, template.icon_name);
              const Icon = theme.icon;
              
              return (
                <Card key={template.id} className={cn(
                  "bg-white border rounded-xl overflow-hidden shadow-sm hover:border-primary/30 transition-all group relative",
                  !template.is_active && "opacity-60 bg-gray-50/50"
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("size-12 rounded-xl flex items-center justify-center shadow-sm", theme.bg)}>
                          <Icon className={cn("size-6", theme.text)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-lg">{template.name}</h4>
                            {!template.is_active && (
                              <Badge variant="secondary" className="text-[9px] font-bold bg-gray-100 text-gray-500 uppercase tracking-widest px-2">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1.5 mt-0.5">
                            <Clock className="size-3" />
                            {template.start_time_default?.substring(0, 5)} - {template.end_time_default?.substring(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenDialog(template)}>
                          <Edit className="size-4 text-gray-500 hover:text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="size-4 text-red-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <CheckSquare className="size-3" /> Default Master Checklists
                      </p>
                      <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                        {template.default_checklists && template.default_checklists.length > 0 ? (
                          template.default_checklists.map(clId => {
                            const cl = masterChecklists.find(c => c.id === clId);
                            return (
                              <Badge key={clId} variant="secondary" className="text-[9px] h-5 font-medium px-2 bg-gray-50 text-gray-600 border-gray-100">
                                {cl?.name || 'Unknown'}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-[9px] text-muted-foreground italic">None assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-dashed pt-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("size-2 rounded-full", theme.dot)} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider capitalize">{template.color_theme || 'Default'}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold border-gray-100 bg-gray-50 text-gray-400">
                        Order: {template.sort_order}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </Container>

      {/* Management Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl border-primary/10">
          <DialogHeader className="p-6 pb-2 bg-gray-50/50 border-b">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="size-6 fill-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {editingTemplate ? 'Update Shift Template' : 'New Shift Template'}
                </DialogTitle>
                <DialogDescription>
                  Define the global settings for this work period
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Template Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Night Shift" 
                    className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-primary/20" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Short Name</Label>
                  <Input 
                    value={formData.short_name} 
                    onChange={e => setFormData({...formData, short_name: e.target.value})} 
                    placeholder="e.g. N" 
                    className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-primary/20" 
                  />
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Default Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-300" />
                    <Input 
                      type="time" 
                      value={formData.start_time_default} 
                      onChange={e => setFormData({...formData, start_time_default: e.target.value})} 
                      className="h-11 pl-10 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-primary/20" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Default End Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-300" />
                    <Input 
                      type="time" 
                      value={formData.end_time_default} 
                      onChange={e => setFormData({...formData, end_time_default: e.target.value})} 
                      className="h-11 pl-10 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-primary/20" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-dashed border-gray-100">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Visual Icon</Label>
                <Select value={formData.icon_name} onValueChange={v => setFormData({...formData, icon_name: v})}>
                  <SelectTrigger className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-primary/20">
                    <SelectValue>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const IconComponent = SHIFT_ICONS[formData.icon_name || 'Clock'] || Clock;
                          return <IconComponent className="size-4 text-primary" />;
                        })()}
                        <span className="text-sm font-bold text-gray-700">{formData.icon_name || 'Select icon'}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] w-[350px] p-2 rounded-xl border-gray-100 shadow-2xl">
                    <div className="grid grid-cols-3 gap-1 overflow-y-auto custom-scrollbar pr-1">
                      {Object.entries(SHIFT_ICONS).map(([name, IconComponent]) => (
                        <SelectItem key={name} value={name} className="flex flex-col items-center justify-center py-3 px-1 h-auto focus:bg-primary/5 data-[state=checked]:bg-primary/10 rounded-lg cursor-pointer group">
                          <IconComponent className="size-5 mb-1.5 text-gray-400 group-hover:text-primary transition-colors" />
                          <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500 group-hover:text-primary leading-none text-center truncate w-full">{name}</span>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Colour Theme</Label>
                <Select value={formData.color_theme} onValueChange={v => setFormData({...formData, color_theme: v})}>
                  <SelectTrigger className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-primary/20">
                    <SelectValue>
                      <div className="flex items-center gap-3">
                        <div className={cn("size-3 rounded-full shadow-sm", getPeriodTheme('', formData.color_theme).dot)} />
                        <span className="text-sm font-bold text-gray-700 capitalize">{formData.color_theme || 'Select theme'}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                    {[
                      { id: 'morning', name: 'Amber' },
                      { id: 'day', name: 'Sky' },
                      { id: 'afternoon', name: 'Orange' },
                      { id: 'night', name: 'Indigo' },
                      { id: 'community', name: 'Emerald' },
                      { id: 'other', name: 'Gray' }
                    ].map(theme => (
                      <SelectItem key={theme.id} value={theme.id} className="rounded-lg cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={cn("size-3 rounded-full", getPeriodTheme('', theme.id).dot)} />
                          <span className="text-sm font-medium text-gray-600">{theme.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Master Checklists Section */}
            <div className="space-y-4 pt-6 border-t border-dashed border-gray-100">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Default Master Checklists</Label>
                {formData.default_checklists?.length > 0 && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                    {formData.default_checklists.length} Selected
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                {loadingChecklists ? (
                  <div className="col-span-full py-4 text-center text-xs text-muted-foreground italic">Loading master checklists...</div>
                ) : masterChecklists.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-xs text-muted-foreground italic">No master checklists defined yet.</div>
                ) : (
                  masterChecklists.map(cl => {
                    const isSelected = formData.default_checklists?.includes(cl.id);
                    return (
                      <div 
                        key={cl.id} 
                        className={cn(
                          "cursor-pointer border-2 rounded-xl p-4 transition-all hover:border-primary/50 relative group flex items-center justify-between",
                          isSelected ? "border-primary bg-primary/[0.02] shadow-sm" : "border-gray-100 bg-white"
                        )}
                        onClick={() => toggleChecklist(cl.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-gray-900 truncate pr-2">{cl.name}</h5>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{cl.frequency || 'Manual'}</p>
                        </div>
                        <div className={cn(
                          "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "bg-primary border-primary text-white" : "border-gray-200 bg-white"
                        )}>
                          {isSelected && <CheckSquare className="size-3" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
                <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  <strong>Workflow Tip:</strong> Selected master checklists will be automatically suggested for shifts created with this template across all houses.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sort Order</Label>
                <Input 
                  type="number" 
                  value={formData.sort_order} 
                  onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} 
                  className="h-11 border-gray-100 bg-gray-50/50 rounded-xl focus:ring-primary/20" 
                />
              </div>
              <div className="flex flex-col justify-center space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Display Status</Label>
                <div className="flex items-center space-x-3 h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <Switch 
                    id="type-active" 
                    checked={formData.is_active} 
                    onCheckedChange={v => setFormData({...formData, is_active: v})} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="type-active" className="text-xs font-bold text-gray-600 cursor-pointer">
                    {formData.is_active ? 'ENABLED IN SYSTEM' : 'DISABLED IN SYSTEM'}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t bg-gray-50/50">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="font-bold border-gray-200 h-11 rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="px-10 font-black uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-primary/20">
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
