import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ShiftNoteHealthSectionProps {
  canEdit: boolean;
  formData: Record<string, unknown>;
  onFormChange: (field: string, value: unknown) => void;
}

export function ShiftNoteHealthSection({
  canEdit,
  formData,
  onFormChange,
}: ShiftNoteHealthSectionProps) {
  return (
    <div className="space-y-6">
      {/* Health and Medication */}
      <Card>
        <CardHeader>
          <CardTitle>Health and Medication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="regular_medication_status">
                Regular medication administered?
              </Label>
              <Select
                value={formData.regular_medication_status || 'none'}
                onValueChange={(val) =>
                  onFormChange(
                    'regular_medication_status',
                    val === 'none' ? null : val,
                  )
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select status...</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No IR submitted">
                    No IR submitted
                  </SelectItem>
                  <SelectItem value="Not applicable to shift">
                    Not applicable to shift
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="prn_medication_given">
                  PRN medication given?
                </Label>
                <RadioGroup
                  value={
                    formData.prn_medication_given === true
                      ? 'yes'
                      : formData.prn_medication_given === false
                        ? 'no'
                        : ''
                  }
                  onValueChange={(val) =>
                    onFormChange(
                      'prn_medication_given',
                      val === 'yes' ? true : val === 'no' ? false : null,
                    )
                  }
                  disabled={!canEdit}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="prn_yes" />
                    <Label
                      htmlFor="prn_yes"
                      className="font-normal cursor-pointer"
                    >
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="prn_no" />
                    <Label
                      htmlFor="prn_no"
                      className="font-normal cursor-pointer"
                    >
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.prn_medication_given && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <Label
                    htmlFor="prn_description"
                    className="text-xs text-muted-foreground"
                  >
                    Describe why PRN medication was given, what was observed
                    beforehand, and the effect after administration.
                  </Label>
                  <Textarea
                    id="prn_description"
                    value={formData.prn_description || ''}
                    onChange={(e) =>
                      onFormChange('prn_description', e.target.value)
                    }
                    placeholder="Enter PRN description..."
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positive Behaviour Support */}
      <Card>
        <CardHeader>
          <CardTitle>Positive Behaviour Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pbs_strategies_used">
                  Were PBS strategies used?
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Select if any strategies were used to support the participant.
                </p>
              </div>
              <RadioGroup
                value={
                  formData.pbs_strategies_used === true
                    ? 'yes'
                    : formData.pbs_strategies_used === false
                      ? 'no'
                      : ''
                }
                onValueChange={(val) =>
                  onFormChange(
                    'pbs_strategies_used',
                    val === 'yes' ? true : val === 'no' ? false : null,
                  )
                }
                disabled={!canEdit}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="pbs_yes" />
                  <Label
                    htmlFor="pbs_yes"
                    className="font-normal cursor-pointer"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="pbs_no" />
                  <Label
                    htmlFor="pbs_no"
                    className="font-normal cursor-pointer"
                  >
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.pbs_strategies_used && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="pbs_strategies_details">
                    What Strategies were used?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Describe the strategies used (e.g. redirection, prompting,
                    offering choices, environmental changes).
                  </p>
                  <Textarea
                    id="pbs_strategies_details"
                    value={formData.pbs_strategies_details || ''}
                    onChange={(e) =>
                      onFormChange('pbs_strategies_details', e.target.value)
                    }
                    placeholder="Enter strategies used..."
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pbs_when_used">When were they used?</Label>
                  <p className="text-xs text-muted-foreground">
                    (e.g. proactively before behaviour, during escalation, after
                    incident)
                  </p>
                  <Input
                    id="pbs_when_used"
                    value={formData.pbs_when_used || ''}
                    onChange={(e) =>
                      onFormChange('pbs_when_used', e.target.value)
                    }
                    placeholder="Enter context..."
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pbs_outcome">What was the outcome?</Label>
                  <p className="text-xs text-muted-foreground">
                    (e.g. prevented escalation, reduced behaviour, no change)
                  </p>
                  <Input
                    id="pbs_outcome"
                    value={formData.pbs_outcome || ''}
                    onChange={(e) =>
                      onFormChange('pbs_outcome', e.target.value)
                    }
                    placeholder="Enter outcome..."
                    disabled={!canEdit}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-dashed">
            <div className="flex items-center justify-between">
              <Label htmlFor="restrictive_practices_status">
                Restrictive Practices
              </Label>
              <Select
                value={formData.restrictive_practices_status || 'none'}
                onValueChange={(val) =>
                  onFormChange(
                    'restrictive_practices_status',
                    val === 'none' ? null : val,
                  )
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select status...</SelectItem>
                  <SelectItem value="Yes Incident Report Submitted">
                    Yes Incident Report Submitted
                  </SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Not applicable to client">
                    Not applicable to client
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
