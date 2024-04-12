"use client";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar-year";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast from "react-hot-toast";

export default function ImportantForms({ data }: { data: ExternalForm[] }) {
    const supabase = createClientComponentClient();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [selectedRow, setSelectedRow] = useState<any>({});
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<ExternalForm | null>(null);
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2022, 0, 20),
        to: addDays(new Date(2022, 0, 20), 20),
    });

    const isWithinRange = (row: { getValue: (arg0: any) => string | number | Date }, columnId: any, value: any) => {
        console.log("row: ", row.getValue(columnId));
        console.log("columnId: ", columnId);
        console.log("value: ", value);

        const date = new Date(row.getValue(columnId));
        const [start, end] = [new Date(2024, 0, 1), new Date(2025, 0, 1)]; // value => two date input values

        //If one filter defined and date is null filter it
        if ((start || end) && !date) return false;
        if (start && !end) {
            return date.getTime() >= start.getTime();
        } else if (!start && end) {
            return date.getTime() <= end.getTime();
        } else if (start && end) {
            return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
        } else return true;
    };

    const columns: ColumnDef<ExternalForm>[] = [
        {
            accessorKey: "full_name",
            sortingFn: "text",
            header: ({ column }) => (
                <Button variant="ghost" className="capitalize" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Name (Staff ID)
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const staffID = row.original.staff_id;
                const fullName = row.original.full_name;
                const displayText = staffID ? `${fullName} (${staffID})` : fullName;

                return <div className="capitalize">{displayText}</div>;
            },
        },
        {
            accessorKey: "program_title",
            sortingFn: "text",
            header: ({ column }) => (
                <Button variant="ghost" className="capitalize" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Program Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="capitalize">{row.getValue("program_title")}</div>,
        },
        {
            accessorKey: "formStage",
            sortingFn: "auto",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Form Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const formStage = row.original.formStage;

                if (formStage === 1) {
                    return <div className="uppercase text-red-500 font-bold">Reverted to Staff</div>;
                } else if (formStage === 2) {
                    return <div className="uppercase text-blue-500 font-bold">Reviewing by AAO</div>;
                } else if (formStage === 3) {
                    return <div className="uppercase text-blue-500 font-bold">Reviewing by HOS/ ADCR/ MGR</div>;
                } else if (formStage === 4) {
                    return <div className="uppercase text-blue-500 font-bold">Reviewing by HMU/ Dean</div>;
                } else if (formStage === 5) {
                    return <div className="uppercase text-green-500 font-bold">Approved</div>;
                } else if (formStage === 6) {
                    return <div className="uppercase text-red-500 font-bold">Rejected</div>;
                } else {
                    return <div className="uppercase">Unknown</div>;
                }
            },
        },
        {
            accessorKey: "created_at",
            sortingFn: "datetime",
            filterFn: isWithinRange,
            header: ({ column }) => {
                return (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                        Last Updated
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },

            cell: ({ row }) => {
                // const date = new Date(row.getValue("last_updated"));
                // const day = date.getDate();
                // const month = date.getMonth() + 1;
                // const year = date.getFullYear();
                // const formattedDate = `${day}-${month}-${year}`;
                const lastUpdated = row.original.last_updated;

                return <div className="lowercase">{lastUpdated}</div>;
            },
        },
        // Update the last_updated column to now() once they remind.
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const rowID = row.original.id;

                return (
                    <Button onClick={() => sendReminder(rowID)}>REMIND</Button>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const sendReminder = async (id: string) => {
        console.log(id);

        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from("external_forms")
            .update({ last_updated: todayDateString })
            .eq("id", id);

        if (error) {
            toast.error("Failed to send reminder.")
        }

        toast.success("Successfully sent a reminder for the selected forms.")
    }

    return (
        <>
            <div className="flex items-center py-2">
                <Input
                    placeholder="Filter names..."
                    value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
                    onChange={event => table.getColumn("full_name")?.setFilterValue(event.target.value)}
                    className="max-w-sm mr-5"
                />

                {/* <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span>Select a year range</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="range"
                            captionLayout="dropdown-buttons"
                            selected={date}
                            onSelect={setDate}
                            fromYear={1960}
                            toYear={new Date().getFullYear()}
                        />
                    </PopoverContent>
                </Popover> */}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto dark:text-dark_text">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter(column => column.getCanHide())
                            .map(column => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={value => column.toggleVisibility(!!value)}
                                    >
                                        {column.id
                                            .split("_")
                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                            .join(" ")}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <TableHead key={header.id} className="text-center bg-gray-100 dark:bg-[#1D2021] dark:text-[#B1ABA1]">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map(row => (
                                <ContextMenu key={row.id}>
                                    <ContextMenuTrigger asChild>
                                        <TableRow
                                            onClick={() => {
                                                // router.push(`/external/${row.original.id}`);
                                            }}
                                            data-state={row.getIsSelected() && "selected"}
                                            className="cursor-pointer text-center dark:bg-dark_mode_card dark:text-dark_text"
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                            ))}
                                        </TableRow>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem
                                            onClick={() => {
                                                // router.push(`/external/${row.original.id}`);
                                            }}
                                        >
                                            View
                                        </ContextMenuItem>
                                        <ContextMenuItem
                                            onClick={() => {
                                                setOpen(true);
                                                setSelectedRow(row.original);
                                            }}
                                        >
                                            Undo Action
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center dark:text-dark_text">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4 dark:text-dark_text">
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Next
                    </Button>
                </div>
            </div>
        </>
    )
}
