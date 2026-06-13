import { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Settings2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container } from '@/components/common/container';
import { ClinicalTrackerMasterDialog } from './components/clinical-tracker-master-dialog';
import { TABLES } from '@/config/db-tables';
import { useClinicalTrackersMaster } from '@/hooks/use-clinical-trackers-master';

// Tracker Categories Definition
const TRACKER_TAXONOMIES = [
  { id: 'BEHAVIOUR_INTENSITY_MASTER', label: 'Behaviour Intensity', table: 'BEHAVIOUR_INTENSITY_MASTER' as keyof typeof TABLES },
  { id: 'BEHAVIOUR_TYPES_MASTER', label: 'Behaviour Types', table: 'BEHAVIOUR_TYPES_MASTER' as keyof typeof TABLES },
  { id: 'BOWEL_AMOUNTS_MASTER', label: 'Bowel Amounts', table: 'BOWEL_AMOUNTS_MASTER' as keyof typeof TABLES },
  { id: 'BOWEL_ASSISTANCE_MASTER', label: 'Bowel Assistance', table: 'BOWEL_ASSISTANCE_MASTER' as keyof typeof TABLES },
  { id: 'HYGIENE_LEVELS_MASTER', label: 'Hygiene Support Levels', table: 'HYGIENE_LEVELS_MASTER' as keyof typeof TABLES },
  { id: 'MTM_DIET_TYPES_MASTER', label: 'MTM Diet Types', table: 'MTM_DIET_TYPES_MASTER' as keyof typeof TABLES },
  { id: 'MTM_FLUID_INTAKE_MASTER', label: 'MTM Fluid Intake', table: 'MTM_FLUID_INTAKE_MASTER' as keyof typeof TABLES },
  { id: 'MTM_FLUIDS_MASTER', label: 'MTM Fluids Consistency', table: 'MTM_FLUIDS_MASTER' as keyof typeof TABLES },
  { id: 'MTM_MEAL_INTAKE_MASTER', label: 'MTM Meal Intake', table: 'MTM_MEAL_INTAKE_MASTER' as keyof typeof TABLES },
  { id: 'MTM_SWALLOWING_CONCERNS_MASTER', label: 'MTM Swallowing Concerns', table: 'MTM_SWALLOWING_CONCERNS_MASTER' as keyof typeof TABLES },
  { id: 'NUTRITION_INTAKE_MASTER', label: 'Nutrition Intake', table: 'NUTRITION_INTAKE_MASTER' as keyof typeof TABLES },
  { id: 'NUTRITION_MEAL_TYPES_MASTER', label: 'Nutrition Meal Types', table: 'NUTRITION_MEAL_TYPES_MASTER' as keyof typeof TABLES },
  { id: 'SEIZURE_TYPES_MASTER', label: 'Seizure Types', table: 'SEIZURE_TYPES_MASTER' as keyof typeof TABLES },
  { id: 'SLEEP_QUALITY_MASTER', label: 'Sleep Quality', table: 'SLEEP_QUALITY_MASTER' as keyof typeof TABLES },
  { id: 'SLEEP_TYPES_MASTER', label: 'Sleep Types', table: 'SLEEP_TYPES_MASTER' as keyof typeof TABLES },
] as const;

export function ClinicalTrackersPage() {
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<typeof TRACKER_TAXONOMIES[number] | null>(null);
  const { data: trackerMasters = {} as any, isLoading } = useClinicalTrackersMaster();

  return (
    <Container>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="size-6 text-gray-600 dark:text-gray-400" />
            Clinical Trackers
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage dropdown options for shift note clinical documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRACKER_TAXONOMIES.map((tax) => {
            const items = [...(trackerMasters[tax.table] || [])].sort((a: any, b: any) => 
              (a.name || '').localeCompare(b.name || '')
            );
            const count = items.length;
            const previewItems = items.slice(0, 5);
            const hasMore = count > 5;

            return (
              <Card key={tax.id} className="hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {tax.label}
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[10px]">
                      {isLoading ? '...' : count}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 mb-4">
                    {isLoading ? (
                      <div className="text-xs text-muted-foreground animate-pulse">Loading items...</div>
                    ) : items.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic">No options configured.</div>
                    ) : (
                      <ul className="text-sm space-y-1.5 text-gray-700 dark:text-gray-300">
                        {previewItems.map((item: any) => (
                          <li key={item.id} className="flex items-center gap-2 truncate">
                            <span className="size-1 bg-primary/40 rounded-full shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </li>
                        ))}
                        {hasMore && (
                          <li className="text-xs text-muted-foreground font-medium pt-0.5">
                            + {count - 5} more...
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-auto"
                    onClick={() => setSelectedTaxonomy(tax)}
                  >
                    <Settings2 className="size-3.5 me-1.5" />
                    Manage List
                    <ArrowRight className="size-3.5 ms-auto" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedTaxonomy && (
        <ClinicalTrackerMasterDialog
          open={!!selectedTaxonomy}
          onClose={() => setSelectedTaxonomy(null)}
          taxonomy={selectedTaxonomy}
        />
      )}
    </Container>
  );
}
