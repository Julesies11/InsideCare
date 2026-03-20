import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { generateRRule } from '@/lib/rrule-utils';

interface RRuleGeneratorProps {
  onChange: (rrule: string) => void;
  initialValue?: string;
}

const DAYS = [
  { label: 'Mon', value: 'MO' },
  { label: 'Tue', value: 'TU' },
  { label: 'Wed', value: 'WE' },
  { label: 'Thu', value: 'TH' },
  { label: 'Fri', value: 'FR' },
  { label: 'Sat', value: 'SA' },
  { label: 'Sun', value: 'SU' },
];

export function RRuleGenerator({ onChange, initialValue }: RRuleGeneratorProps) {
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [byDay, setByDay] = useState<string[]>([]);

  useEffect(() => {
    // For Daily/Weekly, we need days. For Monthly, it defaults to the same day of the month.
    const rrule = generateRRule({ 
      freq: freq === 'DAILY' ? 'WEEKLY' : freq, // Daily with day selection is effectively weekly
      byDay: freq === 'MONTHLY' ? [] : byDay,
      interval: 1 
    });
    onChange(rrule);
  }, [freq, byDay]);

  const toggleDay = (day: string) => {
    setByDay(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Frequency</Label>
        <Select value={freq} onValueChange={(val: any) => setFreq(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAILY">Daily (Select Days)</SelectItem>
            <SelectItem value="WEEKLY">Weekly (Select Days)</SelectItem>
            <SelectItem value="MONTHLY">Monthly (Same Day of Month)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {freq !== 'MONTHLY' && (
        <div className="space-y-2">
          <Label>Repeat on these days</Label>
          <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg border border-dashed">
            {DAYS.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox 
                  id={`day-${day.value}`} 
                  checked={byDay.includes(day.value)}
                  onCheckedChange={() => toggleDay(day.value)}
                />
                <label
                  htmlFor={`day-${day.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 italic">
        {freq !== 'MONTHLY' && byDay.length > 0 && `This checklist will repeat every ${byDay.join(', ')}.`}
        {freq !== 'MONTHLY' && byDay.length === 0 && "Please select at least one day."}
        {freq === 'MONTHLY' && "This checklist will repeat on the same day each month based on the start date."}
      </div>
    </div>
  );
}
