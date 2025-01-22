import { ColumnDef } from "@tanstack/react-table";
import { Billing } from "@db/schema";
import { DataTableColumnHeader } from "../ui/data-table-column-header";

export const columns: ColumnDef<Billing & { formattedAmount: string; formattedTime: string }>[] = [
  {
    accessorKey: "patient.firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.patient?.firstName} {row.original.patient?.lastName}
      </div>
    ),
  },
  {
    accessorKey: "formattedAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
  },
  {
    accessorKey: "formattedTime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Time" />
    ),
  },
  {
    accessorKey: "employee.fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employee" />
    ),
  },
  {
    accessorKey: "notes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notes" />
    ),
  },
];