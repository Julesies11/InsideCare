import { useState, useCallback, useEffect, useMemo } from 'react';
import { detectChanges } from '@/lib/activity-logger';

interface UseDetailFormProps<T> {
  initialData: T | null;
  onFormDataChange?: (data: T) => void;
  onOriginalDataChange?: (data: T) => void;
  onSavingChange?: (saving: boolean) => void;
  onSave?: (changedFields: Partial<T>) => Promise<void>;
}

export function useDetailForm<T extends Record<string, any>>({
  initialData,
  onFormDataChange,
  onOriginalDataChange,
  onSavingChange,
  onSave,
}: UseDetailFormProps<T>) {
  const [formData, setFormData] = useState<T>({} as T);
  const [originalData, setOriginalData] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize form when initial data arrives
  useEffect(() => {
    if (initialData && !originalData) {
      setFormData(initialData);
      setOriginalData(initialData);
      onOriginalDataChange?.(initialData);
    }
  }, [initialData, originalData, onOriginalDataChange]);

  // Bubble up form data changes
  useEffect(() => {
    onFormDataChange?.(formData);
  }, [formData, onFormDataChange]);

  // Bubble up saving state
  useEffect(() => {
    onSavingChange?.(saving);
  }, [saving, onSavingChange]);

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    if (originalData) {
      setFormData(originalData);
    }
  }, [originalData]);

  const isDirty = useMemo(() => {
    if (!originalData) return false;
    const changes = detectChanges(originalData, formData);
    return Object.keys(changes).length > 0;
  }, [originalData, formData]);

  const changedFields = useMemo(() => {
    if (!originalData) return {} as Partial<T>;
    return detectChanges(originalData, formData) as Partial<T>;
  }, [originalData, formData]);

  const handleSave = async () => {
    if (!onSave || !isDirty) return;
    
    setSaving(true);
    try {
      await onSave(changedFields);
      setOriginalData(formData);
      onOriginalDataChange?.(formData);
    } finally {
      setSaving(false);
    }
  };

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    originalData,
    isDirty,
    changedFields,
    saving,
    handleSave,
    resetForm,
  };
}
