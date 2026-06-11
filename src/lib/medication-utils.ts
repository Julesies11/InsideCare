import { MedicationType } from '@/api/master-lists.api';

/**
 * Filters medication types based on active status and currently selected type.
 * Only show active types, unless the medication uses that current type (even if inactive).
 */
export function getDisplayMedicationTypes(
  allTypes: MedicationType[],
  currentTypeId?: string | null,
): MedicationType[] {
  const activeTypes = allTypes.filter((t) => t.is_active);

  if (currentTypeId) {
    const currentType = allTypes.find((t) => t.id === currentTypeId);
    if (currentType && !currentType.is_active) {
      return [...activeTypes, currentType].sort((a, b) =>
        a.medication_type_name.localeCompare(b.medication_type_name),
      );
    }
  }

  return activeTypes.sort((a, b) =>
    a.medication_type_name.localeCompare(b.medication_type_name),
  );
}
