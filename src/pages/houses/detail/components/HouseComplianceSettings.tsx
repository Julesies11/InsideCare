import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Info, AlertTriangle } from 'lucide-react';
import { useComplianceTypes, useHouseComplianceRequirements } from '@/hooks/use-staff';
import { HousePendingChanges } from '@/models/house-pending-changes';

interface HouseComplianceSettingsProps {
  houseId: string;
  pendingChanges: HousePendingChanges;
  onPendingChangesChange: (changes: HousePendingChanges) => void;
  canEdit: boolean;
}

export function HouseComplianceSettings({
  houseId,
  pendingChanges,
  onPendingChangesChange,
  canEdit,
}: HouseComplianceSettingsProps) {
  const { types: allTypes = [], isLoading: loadingTypes } = useComplianceTypes(false);
  const { requirements = [], isLoading: loadingRequirements } = useHouseComplianceRequirements(houseId);

  // Initialize selected IDs state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Keep track of database mapped IDs
  const dbRequiredIds = requirements.map((r) => r.compliance_type_id);

  // Sync selectedIds with pending changes or database values
  useEffect(() => {
    if (pendingChanges.complianceTypeIds !== undefined) {
      setSelectedIds(pendingChanges.complianceTypeIds);
    } else if (!loadingRequirements) {
      setSelectedIds(dbRequiredIds);
    }
  }, [pendingChanges.complianceTypeIds, loadingRequirements, requirements]);

  // Helper to determine if sets match
  const hasChanges = () => {
    if (pendingChanges.complianceTypeIds === undefined) return false;
    const setDb = new Set(dbRequiredIds);
    const setPending = new Set(pendingChanges.complianceTypeIds);
    if (setDb.size !== setPending.size) return true;
    for (const id of setPending) {
      if (!setDb.has(id)) return true;
    }
    return false;
  };

  const handleToggle = (typeId: string, isChecked: boolean) => {
    if (!canEdit) return;

    let newSelected: string[];
    if (isChecked) {
      newSelected = [...selectedIds, typeId];
    } else {
      newSelected = selectedIds.filter((id) => id !== typeId);
    }

    // Always ensure all global defaults are checked and included
    const globalDefaultIds = allTypes
      .filter((t) => t.is_default_global && t.is_active)
      .map((t) => t.id);
    
    globalDefaultIds.forEach((id) => {
      if (!newSelected.includes(id)) {
        newSelected.push(id);
      }
    });

    // Determine if the new set differs from original database requirements
    const setDb = new Set(dbRequiredIds);
    const setCurr = new Set(newSelected);
    let isDifferent = setDb.size !== setCurr.size;
    if (!isDifferent) {
      for (const id of setCurr) {
        if (!setDb.has(id)) {
          isDifferent = true;
          break;
        }
      }
    }

    const updatedPending = {
      ...pendingChanges,
      complianceTypeIds: isDifferent ? newSelected : undefined,
    };
    onPendingChangesChange(updatedPending);
  };

  const isPendingChange = hasChanges();
  const isLoading = loadingTypes || loadingRequirements;

  return (
    <Card id="compliance_settings">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-gray-500" />
            Compliance Requirements
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Configure compliance checks required for staff assigned to this house.
          </p>
        </div>
        {isPendingChange && (
          <Badge variant="outline" className="border-warning text-warning-700 bg-warning/5 font-bold uppercase tracking-widest text-[9px]">
            Unsaved Changes
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">
            Loading compliance settings...
          </div>
        ) : allTypes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No compliance types configured in system admin.
          </div>
        ) : (
          <div className="space-y-4">
            {isPendingChange && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-warning/20 bg-warning/5 text-xs text-warning-800">
                <AlertTriangle className="size-4 shrink-0 mt-0.5 text-warning-600" />
                <div>
                  <span className="font-bold">You have pending compliance changes.</span> Click "Save Changes" in the main footer to apply them.
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Requirement</TableHead>
                    <TableHead className="w-[30%]">Classification</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[10%] text-right">Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTypes.map((type) => {
                    const isGlobalDefault = type.is_default_global;
                    const isRequired = isGlobalDefault || selectedIds.includes(type.id);
                    
                    const isOriginal = dbRequiredIds.includes(type.id);
                    const isNowSelected = selectedIds.includes(type.id);
                    const isChanged = !isGlobalDefault && (isOriginal !== isNowSelected);

                    return (
                      <TableRow
                        key={type.id}
                        className={isChanged ? 'bg-warning/5' : ''}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{type.compliance_name}</span>
                            {type.description && (
                              <span className="text-xs text-muted-foreground mt-0.5">
                                {type.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isGlobalDefault ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="primary" className="h-5 uppercase tracking-widest text-[8px] font-black">
                                Global Default
                              </Badge>
                              <Info className="size-3 text-blue-500" title="Applied automatically to all houses." />
                            </div>
                          ) : (
                            <Badge variant="outline" className="h-5 uppercase tracking-widest text-[8px] font-black">
                              House Specific
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isRequired ? 'success' : 'secondary'} className="h-5">
                            {isRequired ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={isRequired}
                            onCheckedChange={(checked) => handleToggle(type.id, checked)}
                            disabled={!canEdit || isGlobalDefault}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
