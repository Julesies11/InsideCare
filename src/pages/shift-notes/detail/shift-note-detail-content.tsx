import { useState, useEffect, MutableRefObject } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useStaff } from '@/hooks/useStaff';
import { useHouses } from '@/hooks/use-houses';
import { useParticipants } from '@/hooks/use-participants';

interface ShiftNoteDetailContentProps {
  onFormDataChange?: (data: any) => void;
  onOriginalDataChange?: (data: any) => void;
  onSavingChange?: (saving: boolean) => void;
  saveHandlerRef?: MutableRefObject<(() => Promise<void>) | null>;
}

export function ShiftNoteDetailContent({
  onFormDataChange,
  onOriginalDataChange,
  onSavingChange,
  saveHandlerRef,
}: ShiftNoteDetailContentProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { staff } = useStaff();
  const { houses } = useHouses();
  const { participants } = useParticipants();

  const [loading, setLoading] = useState(true);
  const [shiftNote, setShiftNote] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    shift_date: new Date().toISOString().split('T')[0],
    shift_time: '',
    participant_id: '',
    staff_id: '',
    house_id: '',
    notes: '',
    full_note: '',
    tags: [] as string[],
  });

  const isNewNote = id === 'new';

  useEffect(() => {
    if (isNewNote) {
      setLoading(false);
      const initialData = { ...formData };
      setFormData(initialData);
      if (onFormDataChange) onFormDataChange(initialData);
      if (onOriginalDataChange) onOriginalDataChange(initialData);
    } else {
      fetchShiftNote();
    }
  }, [id]);

  const fetchShiftNote = async () => {
    if (!id || id === 'new') return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shift_notes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setShiftNote(data);
      
      const normalizedData = {
        shift_date: data.shift_date || new Date().toISOString().split('T')[0],
        shift_time: data.shift_time || '',
        participant_id: data.participant_id || '',
        staff_id: data.staff_id || '',
        house_id: data.house_id || '',
        notes: data.notes || '',
        full_note: data.full_note || '',
        tags: data.tags || [],
      };

      setFormData(normalizedData);
      if (onFormDataChange) onFormDataChange(normalizedData);
      if (onOriginalDataChange) onOriginalDataChange(normalizedData);
    } catch (err) {
      console.error('Error fetching shift note:', err);
      toast.error('Failed to load shift note');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    if (onFormDataChange) onFormDataChange(updatedData);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      const newTags = [...formData.tags, tagInput.trim()];
      handleFormChange('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = formData.tags.filter(tag => tag !== tagToRemove);
    handleFormChange('tags', newTags);
  };

  const handleSave = async () => {
    try {
      if (onSavingChange) onSavingChange(true);

      const dataToSave = {
        shift_date: formData.shift_date,
        shift_time: formData.shift_time || null,
        participant_id: formData.participant_id || null,
        staff_id: formData.staff_id || null,
        house_id: formData.house_id || null,
        notes: formData.notes || null,
        full_note: formData.full_note || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
      };

      if (isNewNote) {
        const { data, error } = await supabase
          .from('shift_notes')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;

        toast.success('Shift note created successfully');
        navigate(`/shift-notes/detail/${data.id}`);
      } else {
        const { error } = await supabase
          .from('shift_notes')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;

        toast.success('Shift note updated successfully');
        
        // Update local state
        setShiftNote({ ...shiftNote, ...dataToSave });
        if (onOriginalDataChange) onOriginalDataChange(formData);
      }
    } catch (err) {
      console.error('Error saving shift note:', err);
      toast.error('Failed to save shift note');
    } finally {
      if (onSavingChange) onSavingChange(false);
    }
  };

  // Expose save handler to parent
  useEffect(() => {
    if (saveHandlerRef) {
      saveHandlerRef.current = handleSave;
    }
  }, [formData, saveHandlerRef]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift_date">Shift Date *</Label>
              <Input
                id="shift_date"
                type="date"
                value={formData.shift_date}
                onChange={(e) => handleFormChange('shift_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift_time">Shift Time</Label>
              <Input
                id="shift_time"
                type="time"
                value={formData.shift_time}
                onChange={(e) => handleFormChange('shift_time', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="participant_id">Participant</Label>
              <Select
                value={formData.participant_id || 'none'}
                onValueChange={(value) => handleFormChange('participant_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General Note</SelectItem>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff Member</Label>
              <Select
                value={formData.staff_id || 'none'}
                onValueChange={(value) => handleFormChange('staff_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select staff</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="house_id">House</Label>
              <Select
                value={formData.house_id || 'none'}
                onValueChange={(value) => handleFormChange('house_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select house</SelectItem>
                  {houses.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note Content */}
      <Card>
        <CardHeader>
          <CardTitle>Note Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              placeholder="Brief notes about the shift..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_note">Full Note *</Label>
            <Textarea
              id="full_note"
              value={formData.full_note}
              onChange={(e) => handleFormChange('full_note', e.target.value)}
              placeholder="Detailed shift notes..."
              rows={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="size-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
