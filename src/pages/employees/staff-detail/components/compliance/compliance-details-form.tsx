import React from 'react';
import { ResolvedComplianceItem } from '@/models/compliance.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ComplianceDetailsFormProps {
  item: ResolvedComplianceItem;
  canEdit: boolean;
  onFieldChange: (
    field: 'document_number' | 'expiry_date' | 'comments',
    value: string,
  ) => void;
}

export const ComplianceDetailsForm = React.memo(function ComplianceDetailsForm({
  item,
  canEdit,
  onFieldChange,
}: ComplianceDetailsFormProps) {
  // Return null if nothing to show
  if (!item.documentNumberApplicable && !item.commentsApplicable) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {item.documentNumberApplicable && (
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Document Number
            </Label>
            <Input
              value={item.docNumber}
              onChange={(e) => onFieldChange('document_number', e.target.value)}
              placeholder="e.g. LIC123456"
              maxLength={100}
              className="h-8 text-xs bg-white focus:bg-white"
              disabled={!canEdit}
            />
          </div>
        )}
      </div>

      {item.commentsApplicable && (
        <div className="space-y-1">
          <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Comments
          </Label>
          <Textarea
            value={item.comments}
            onChange={(e) => onFieldChange('comments', e.target.value)}
            placeholder="Enter any additional notes..."
            maxLength={1000}
            className="text-xs min-h-[60px] resize-none bg-white focus:bg-white"
            disabled={!canEdit}
          />
        </div>
      )}
    </div>
  );
});
