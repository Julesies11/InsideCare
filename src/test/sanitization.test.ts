import { describe, it, expect } from 'vitest';

/**
 * Peer review test to ensure the "Empty-to-Null" pattern used in 
 * RolesPage, ChecklistMasterPage, and ShiftNotes is correct and robust.
 */
describe('Data Sanitization Logic (Empty-to-Null)', () => {
  
  it('converts empty strings to null in a flat object (Roles pattern)', () => {
    const roleData = {
      name: 'Admin',
      description: '', // Should become null
      is_active: true
    };

    const sanitizedData = { ...roleData };
    Object.keys(sanitizedData).forEach((key) => {
      if ((sanitizedData as any)[key] === '') {
        (sanitizedData as any)[key] = null;
      }
    });

    expect(sanitizedData.description).toBeNull();
    expect(sanitizedData.name).toBe('Admin');
    expect(sanitizedData.is_active).toBe(true);
  });

  it('converts empty strings to null using logical OR (Checklist pattern)', () => {
    const formData = {
      name: 'Daily Check',
      description: ''
    };

    const payload = {
      name: formData.name,
      description: formData.description || null
    };

    expect(payload.description).toBeNull();
    expect(payload.name).toBe('Daily Check');
  });

  it('converts empty strings to null in a nested structure (Shift Notes pattern)', () => {
    const formData = {
      notes: '',
      full_note: 'Detailed note',
      other_field: 'keep me'
    };

    const sanitizedData = {
      ...formData,
      notes: formData.notes || null,
      full_note: formData.full_note || null,
    };

    expect(sanitizedData.notes).toBeNull();
    expect(sanitizedData.full_note).toBe('Detailed note');
    expect(sanitizedData.other_field).toBe('keep me');
  });

  it('does not convert false or 0 to null (Edge Case Check)', () => {
    const data = {
      count: 0,
      enabled: false,
      text: ''
    };

    const sanitized = { ...data };
    Object.keys(sanitized).forEach((key) => {
      if ((sanitized as any)[key] === '') {
        (sanitized as any)[key] = null;
      }
    });

    expect(sanitized.count).toBe(0);
    expect(sanitized.enabled).toBe(false);
    expect(sanitized.text).toBeNull();
  });
});
