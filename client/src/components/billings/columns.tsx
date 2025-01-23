import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../ui/data-table-column-header";
import { format } from "date-fns";

type BillingData = {
  id: number;
  amount: string;
  time: string;
  notes: string | null;
  patientId: number;
  employeeId: number;
  patientName: string;
  employeeName: string;
  formattedAmount: string;
  formattedTime: string;
};

export const columns: ColumnDef<BillingData>[] = [
  {
    accessorKey: "patientName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
  },
  {
    accessorKey: "employeeName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employee" />
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
    accessorKey: "notes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notes" />
    ),
    cell: ({ row }) => row.getValue("notes") || "-",
  },
];