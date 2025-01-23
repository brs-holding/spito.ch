import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../ui/data-table-column-header";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  {
    id: "actions",
    cell: ({ row }) => {
      const billing = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(`/api/billings/${billing.id}/pdf`, '_blank')}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];