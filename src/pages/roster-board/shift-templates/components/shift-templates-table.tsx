'use client';

import { useMemo } from 'react';
import { housesApi } from '@/api/houses.api';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Clock, Edit, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { getPeriodTheme } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTable, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';

export function ShiftTemplatesTable() {
  const navigate = useNavigate();

  const { data: houses, isLoading } = useQuery({
    queryKey: ['houses-with-shift-templates'],
    queryFn: () => housesApi.listWithTemplates(),
  });

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'house_name',
        header: 'House Name',
        cell: ({ row }) => (
          <Link
            to={`${ROUTES.HOUSE_DETAIL}/${row.original.id}`}
            className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline transition-colors"
          >
            {row.original.house_name}
          </Link>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Address',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">
            {row.original.address || 'No address provided'}
          </span>
        ),
      },
      {
        id: 'shift_templates',
        header: 'Shift Templates',
        cell: ({ row }) => {
          const templates = row.original.templates || [];
          const sortedTemplates = [...templates].sort(
            (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
          );

          if (sortedTemplates.length === 0) {
            return (
              <span className="text-xs italic text-muted-foreground">
                No templates configured
              </span>
            );
          }

          return (
            <div className="flex flex-wrap gap-1.5 py-1">
              {sortedTemplates.map((st: any) => {
                const theme = getPeriodTheme(
                  st.shift_template_name,
                  st.color_theme,
                );
                return (
                  <Badge
                    key={st.id}
                    variant="outline"
                    className={`text-[9px] uppercase font-black tracking-tighter h-5 px-1.5 border-${theme.color}-200 text-${theme.color}-700 bg-${theme.color}-50`}
                  >
                    {st.shift_template_name}
                  </Badge>
                );
              })}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: ({ column }) => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 font-bold text-primary hover:text-primary hover:bg-primary/5"
              onClick={() => navigate(`/shift-setup/${row.original.id}`)}
            >
              <Edit className="size-3.5" />
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const table = useReactTable({
    data: houses || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataGrid
      table={table}
      recordCount={houses?.length || 0}
      isLoading={isLoading}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-gray-500" />
            <CardTitle>House Shift Templates</CardTitle>
          </div>
        </CardHeader>
        <CardTable>
          <DataGridTable table={table} />
        </CardTable>
      </Card>
    </DataGrid>
  );
}
