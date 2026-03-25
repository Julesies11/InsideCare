import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { generateRRule } from '@/lib/rrule-utils';
import { cn } from '@/lib/utils';

interface RRuleGeneratorProps {
  onChange: (rrule: string) => void;
  initialValue?: string;
}

const DAYS = [
  { label: 'M', value: 'MO', full: 'Monday' },
  { label: 'T', value: 'TU', full: 'Tuesday' },
  { label: 'W', value: 'WE', full: 'Wednesday' },
  { label: 'T', value: 'TH', full: 'Thursday' },
  { label: 'F', value: 'FR', full: 'Friday' },
  { label: 'S', value: 'SA', full: 'Saturday' },
  { label: 'S', value: 'SU', full: 'Sunday' },
];

export function RRuleGenerator({ onChange, initialValue }: RRuleGeneratorProps) {
  const [freq, setFreq] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [byDay, setByDay] = useState<string[]>([]);

  useEffect(() => {
    const rrule = generateRRule({ 
      freq: freq,
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
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Repetition Frequency</Label>
        <Select value={freq} onValueChange={(val: any) => setFreq(val)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WEEKLY" className="font-medium">Weekly (Select Days)</SelectItem>
            <SelectItem value="MONTHLY" className="font-medium">Monthly (Same Date)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {freq === 'WEEKLY' && (
        <div className="space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Repeat on these days</Label>
          <div className="flex justify-between gap-2 p-1 bg-gray-50 rounded-xl border border-gray-200">
            {DAYS.map((day) => {
              const isActive = byDay.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "size-9 rounded-lg text-xs font-black transition-all flex items-center justify-center border-2",
                    isActive 
                      ? "bg-primary border-primary text-white shadow-sm scale-105" 
                      : "bg-white border-transparent text-gray-400 hover:border-gray-200 hover:text-gray-600"
                  )}
                  title={day.full}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 px-3 py-2 bg-amber-50/50 rounded-lg border border-amber-100/50 text-[10px] text-amber-700 font-medium italic">
        {freq === 'WEEKLY' && byDay.length > 0 && (
          <p>Generates checklist on: {byDay.map(d => DAYS.find(day => day.value === d)?.full).join(', ')}</p>
        )}
        {freq === 'WEEKLY' && byDay.length === 0 && (
          <p>Please select at least one day above.</p>
        )}
        {freq === 'MONTHLY' && (
          <p>Generates checklist on the same date every month (based on Start Date below).</p>
        )}
      </div>
    </div>
  );
}
