import { useState, type ReactNode } from "react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type FilterFn, type Row, type RowSelectionState, type SortingState } from "@tanstack/react-table";
import { ArrowUpDown, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

type Props<T> = {
  columns: ColumnDef<T, any>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFn?: (row: T, q: string) => boolean;
  toolbar?: ReactNode;
  selectable?: boolean;
  bulkActions?: (rows: T[], clear: () => void) => ReactNode;
  getRowId?: (row: T) => string;
  empty?: string;
};

export function DataTable<T>({ columns, data, loading, searchPlaceholder, searchFn, toolbar, selectable, bulkActions, getRowId, empty = "Nothing here yet." }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const filterFn: FilterFn<T> = (row: Row<T>, _id, value: string) => !value || (searchFn ? searchFn(row.original, value.toLowerCase()) : true);
  const cols: ColumnDef<T, any>[] = selectable ? [{
    id: "select",
    header: ({ table }) => <Checkbox aria-label="Select all" checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)} />,
    cell: ({ row }) => <Checkbox aria-label="Select row" checked={row.getIsSelected()} onCheckedChange={v => row.toggleSelected(!!v)} />,
    enableSorting: false,
  }, ...columns] : columns;
  const table = useReactTable({
    data, columns: cols, getRowId,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter, onRowSelectionChange: setRowSelection,
    globalFilterFn: filterFn, enableRowSelection: !!selectable,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });
  const selected = table.getSelectedRowModel().rows.map(r => r.original);
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      {searchFn && <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-md border border-input px-3 sm:max-w-xs"><Search className="size-4 text-muted-foreground" /><input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder ?? "Search"} aria-label={searchPlaceholder ?? "Search"} className="w-full bg-transparent text-sm outline-none" /></label>}
      {toolbar}
    </div>
    {selectable && selected.length > 0 && bulkActions && <div className="flex flex-wrap items-center gap-2 rounded-md bg-secondary p-2 text-sm"><span className="px-2">{selected.length} selected</span>{bulkActions(selected, () => setRowSelection({}))}</div>}
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <Table>
        <TableHeader>{table.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id} className="whitespace-nowrap">{h.isPlaceholder ? null : h.column.getCanSort() ? <button className="inline-flex items-center gap-1" onClick={h.column.getToggleSortingHandler()}>{flexRender(h.column.columnDef.header, h.getContext())}<ArrowUpDown className="size-3" /></button> : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
        <TableBody>
          {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={cols.length}><Skeleton className="h-6" /></TableCell></TableRow>)
            : table.getRowModel().rows.length === 0 ? <TableRow><TableCell colSpan={cols.length} className="py-10 text-center text-muted-foreground">{empty}</TableCell></TableRow>
            : table.getRowModel().rows.map(r => <TableRow key={r.id} data-state={r.getIsSelected() && "selected"}>{r.getVisibleCells().map(c => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}</TableRow>)}
        </TableBody>
      </Table>
    </div>
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{table.getFilteredRowModel().rows.length} rows</span>
      <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button><span>Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}</span><Button variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button></div>
    </div>
  </div>;
}
