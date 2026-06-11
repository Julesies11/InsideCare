import { MedicationType } from '@/api/master-lists.api';
import { describe, expect, it } from 'vitest';
import { getDisplayMedicationTypes } from '@/lib/medication-utils';

describe('getDisplayMedicationTypes', () => {
  const mockTypes: MedicationType[] = [
    { id: '1', medication_type_name: 'Active A', is_active: true },
    { id: '2', medication_type_name: 'Active B', is_active: true },
    { id: '3', medication_type_name: 'Inactive C', is_active: false },
    { id: '4', medication_type_name: 'Inactive D', is_active: false },
  ];

  it('should return only active types when no current type is provided', () => {
    const result = getDisplayMedicationTypes(mockTypes);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(['1', '2']);
  });

  it('should return only active types when current type is active', () => {
    const result = getDisplayMedicationTypes(mockTypes, '1');
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(['1', '2']);
  });

  it('should include the current type if it is inactive', () => {
    const result = getDisplayMedicationTypes(mockTypes, '3');
    expect(result).toHaveLength(3);
    expect(result.find((t) => t.id === '3')).toBeDefined();
    expect(result.map((t) => t.id)).toContain('3');
  });

  it('should sort the results alphabetically by name', () => {
    const types: MedicationType[] = [
      { id: '2', medication_type_name: 'B', is_active: true },
      { id: '1', medication_type_name: 'A', is_active: true },
      { id: '3', medication_type_name: 'C', is_active: false },
    ];
    const result = getDisplayMedicationTypes(types, '3');
    expect(result.map((t) => t.medication_type_name)).toEqual(['A', 'B', 'C']);
  });

  it('should return only active types if currentTypeId is provided but not found in list', () => {
    const result = getDisplayMedicationTypes(mockTypes, 'non-existent');
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(['1', '2']);
  });
});
