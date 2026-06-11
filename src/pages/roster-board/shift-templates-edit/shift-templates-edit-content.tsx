import { HouseShiftSetup } from '@/pages/houses/detail/components/house-shift-setup';

interface ShiftTemplatesEditContentProps {
  houseId: string;
}

export function ShiftTemplatesEditContent({
  houseId,
}: ShiftTemplatesEditContentProps) {
  return (
    <div className="flex flex-col gap-5 lg:gap-7.5">
      <HouseShiftSetup houseId={houseId} directSave={true} canEdit={true} />
    </div>
  );
}
