import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, ChevronRight, ChevronLeft, CalendarDays, Info, Clock, CheckSquare } from 'lucide-react';
import { useShiftTemplates, ShiftTemplateGroup } from '@/hooks/use-shift-templates';
import { cn, getPeriodTheme } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TemplateLibrarySidebarProps {
  houseId: string;
  onApplyTemplate: (templateId: string) => void;
}

export function TemplateLibrarySidebar({ houseId, onApplyTemplate }: TemplateLibrarySidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { groups: templates, isLoading } = useShiftTemplates(houseId !== 'all' ? houseId : undefined);

  if (houseId === 'all') {
    return (
      <div className="hidden lg:block w-64 shrink-0">
        <Card className="h-full border-dashed bg-muted/30">
          <CardContent className="p-6 text-center space-y-4 pt-20">
            <Info className="size-8 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground italic">Select a specific house to view the Template Library.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out relative flex flex-col gap-4",
      isOpen ? "w-72" : "w-12"
    )}>
      <Button
        variant="secondary"
        size="icon"
        className="absolute -left-3 top-10 size-6 rounded-full shadow-md z-10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
      </Button>

      {isOpen ? (
        <Card className="h-full shadow-sm border-gray-200 overflow-hidden flex flex-col">
          <CardHeader className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="size-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-tight">Template Library</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {isLoading ? (
              <div className="py-10 text-center animate-pulse space-y-2">
                <div className="h-12 bg-gray-100 rounded-lg w-full" />
                <div className="h-12 bg-gray-100 rounded-lg w-full" />
              </div>
            ) : templates.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs text-muted-foreground italic">No templates defined for this house.</p>
                <Button variant="link" className="text-[10px]" onClick={() => window.open(`/houses/detail/${houseId}#shift_templates`, '_blank')}>
                  Configure Templates
                </Button>
              </div>
            ) : (
              templates.map(tpl => (
                <div 
                  key={tpl.id} 
                  className="group border border-gray-100 rounded-xl p-3 bg-white hover:border-primary/30 hover:shadow-md transition-all cursor-default"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{tpl.name}</h4>
                      {tpl.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{tpl.description}</p>}
                    </div>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-gray-100">{tpl.items?.length || 0} shifts</Badge>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {tpl.items?.slice(0, 3).map((item: any) => {
                      const theme = getPeriodTheme(item.shift_type?.name, item.shift_type?.color_theme);
                      return (
                        <div key={item.id} className="flex items-center gap-2 text-[10px]">
                          <div className={cn("size-1.5 rounded-full", theme.dot)} />
                          <span className="font-medium text-gray-600 truncate">{item.shift_type?.name}</span>
                          <span className="ml-auto text-gray-400 font-bold">{item.start_time.substring(0, 5)}</span>
                        </div>
                      );
                    })}
                    {(tpl.items?.length || 0) > 3 && (
                      <p className="text-[9px] text-muted-foreground italic pl-3">+{tpl.items!.length - 3} more...</p>
                    )}
                  </div>

                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full h-8 text-[10px] font-bold gap-1.5 opacity-90 hover:opacity-100"
                    onClick={() => onApplyTemplate(tpl.id)}
                  >
                    <CalendarDays className="size-3" />
                    Apply to Week
                  </Button>
                </div>
              ))
            )}
          </CardContent>
          <div className="p-3 bg-blue-50/50 border-t">
            <div className="flex gap-2">
              <Info className="size-3 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[9px] text-blue-800 leading-relaxed">
                Click <strong>Apply to Week</strong> to materialize these shifts for the currently selected week.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col items-center pt-10 gap-6 h-full border-l bg-gray-50/30">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <LayoutDashboard className="size-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="left">Open Template Library</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
