import { masterListsApi } from '@/api/master-lists.api';
import { TABLES } from '@/config/db-tables';
import { useQuery } from '@tanstack/react-query';

export function useClinicalTrackersMaster() {
  return useQuery({
    queryKey: ['clinical-trackers-master'],
    queryFn: async () => {
      const tables = [
        'SLEEP_QUALITY_MASTER',
        'SLEEP_TYPES_MASTER',
        'BEHAVIOUR_INTENSITY_MASTER',
        'NUTRITION_MEAL_TYPES_MASTER',
        'NUTRITION_INTAKE_MASTER',
        'MTM_DIET_TYPES_MASTER',
        'MTM_FLUIDS_MASTER',
        'MTM_MEAL_INTAKE_MASTER',
        'MTM_FLUID_INTAKE_MASTER',
        'MTM_SWALLOWING_CONCERNS_MASTER',
        'HYGIENE_LEVELS_MASTER',
        'BOWEL_AMOUNTS_MASTER',
        'BOWEL_ASSISTANCE_MASTER',
      ] as const;

      const results = await Promise.all(
        tables.map(async (tableKey) => {
          const data = await masterListsApi.clinicalTrackers.list(
            TABLES[tableKey],
            false, // only active
          );
          return { [tableKey]: data };
        }),
      );

      return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
