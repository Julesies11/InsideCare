import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CheckCircle2, ChevronRight, ChevronLeft, LayoutDashboard, Clock, CalendarDays, Send, Plus, Trash2, Edit, X, Download, Loader2 } from 'lucide-react';
import { cn, getPeriodTheme } from '@/lib/utils';
import { useHouseShiftTypes, HouseShiftType } from '@/hooks/use-house-shift-types';
import { useHouseChecklists } from '@/hooks/use-house-checklists';
import { useShiftTemplates } from '@/hooks/use-shift-templates';
import { useHouses } from '@/hooks/use-houses';
import { HousePendingChanges } from '@/models/house-pending-changes';
import { HouseChecklistSetup } from './house-checklist-setup';
import { HouseShiftSetup } from './house-shift-setup';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';

interface HouseRosterWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseId: string;
  houseName: string;
  pendingChanges: HousePendingChanges;
  onPendingChangesChange: (changes: HousePendingChanges) => void;
  initialStep?: number;
}

const STEPS = [
  { id: 1, title: 'Shift Model', description: 'Define work periods', icon: Clock },
  { id: 2, title: 'Calendar Tasks', description: 'Facility routines', icon: CalendarDays },
  { id: 3, title: 'Shift Templates', description: 'Titled shift groups', icon: LayoutDashboard },
  { id: 4, title: 'Review', description: 'Finalize setup', icon: Send },
];

export function HouseRosterWizard({ open, onOpenChange, houseId, houseName, pendingChanges, onPendingChangesChange, initialStep = 1 }: HouseRosterWizardProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSaving, setIsSaving] = useState(false);
  
  const { shiftTypes, isLoading: loadingShifts } = useHouseShiftTypes(houseId);
  const { houseChecklists, isLoading: loadingChecklists } = useHouseChecklists(houseId);
  const { groups: templates, isLoading: loadingTemplates } = useShiftTemplates(houseId);
  const { houses: allHouses } = useHouses(0, 100);

  const [showImportTemplate, setShowImportTemplate] = useState(false);
  
  // Sync step if initialStep changes
  useEffect(() => {
    if (open) setCurrentStep(initialStep || 1);
  }, [open, initialStep]);

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      try {
        await supabase
          .from('houses')
          .update({ setup_step: nextStep })
          .eq('id', houseId);
      } catch (e) {
        console.error('Failed to persist setup step', e);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('houses')
        .update({ 
          setup_step: 4,
          is_configured: true,
          status: 'active'
        })
        .eq('id', houseId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['house-detail', houseId] });

      toast.success('House configuration finalized! It is now live for staff.');
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to finalize wizard setup');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 1: Define Your Shift Model</h3>
              <p className="text-sm text-muted-foreground">
                Set up the periods of work used in this house (e.g., Morning, Afternoon, Night). 
                Assign <strong>Default Checklists</strong> to each shift type to automate your operational setup.
              </p>
            </div>
            <HouseShiftSetup houseId={houseId} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 2: Calendar Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Define the facility tasks that repeat on the house calendar. These are shared by all staff working on those days.
              </p>
            </div>
            <div className="min-h-[400px]">
              <HouseChecklistSetup 
                houseId={houseId} 
                canAdd={true} 
                canDelete={true} 
                pendingChanges={pendingChanges}
                onPendingChangesChange={onPendingChangesChange}
                directSave={true}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step 3: Shift Templates</h3>
              <p className="text-sm text-muted-foreground">
                Create titled shift groups (e.g., "Standard Weekday", "Christmas Day") to allow for flexible, bulk roster deployment.
              </p>
            </div>
            <HouseShiftSetup houseId={houseId} />
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 text-center py-12 animate-in zoom-in-95 duration-500">
            <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="size-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ready to Go!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The operational skeleton for <strong>{houseName}</strong> is complete. 
              You can now start assigning staff to the published roster.
            </p>
            <div className="bg-gray-50 border rounded-2xl p-6 mt-8 text-left max-w-lg mx-auto">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Summary</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm font-medium">
                  <div className="size-1.5 rounded-full bg-green-500" />
                  {shiftTypes.length} Shift Types configured
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <div className="size-1.5 rounded-full bg-green-500" />
                  Calendar tasks defined
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <div className="size-1.5 rounded-full bg-green-500" />
                  {templates.length} Shift Templates defined
                </li>
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">House Setup Wizard</DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground">
                Setting up operational routines for <span className="text-primary font-bold">{houseName}</span>
              </DialogDescription>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progress</p>
              <p className="text-lg font-black text-primary">{Math.round((currentStep / STEPS.length) * 100)}%</p>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between mt-8 relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group">
                  <div 
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                      isActive ? "bg-primary border-primary text-white shadow-lg scale-110 shadow-primary/20" : 
                      isCompleted ? "bg-green-500 border-green-500 text-white" : 
                      "bg-white border-gray-200 text-gray-400"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="size-5" /> : <StepIcon className="size-5" />}
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-tight",
                      isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-gray-400"
                    )}>
                      {step.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {renderStepContent()}
          </div>
        </div>

        <DialogFooter className="p-6 bg-white border-t flex justify-between items-center sticky bottom-0 z-10">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            disabled={currentStep === 1}
            className="font-bold gap-2 hover:bg-gray-100"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" className="font-bold border-gray-300" onClick={() => onOpenChange(false)}>Save & Exit</Button>
            {currentStep === STEPS.length ? (
              <Button variant="primary" className="px-10 font-bold shadow-lg shadow-primary/20" onClick={handleFinish} disabled={isSaving}>
                {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Finish Setup
              </Button>
            ) : (
              <Button variant="primary" className="px-10 font-bold gap-2 shadow-lg shadow-primary/20" onClick={handleNext}>
                Continue
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
