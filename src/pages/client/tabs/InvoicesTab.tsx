import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Select, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import type { InvoiceRow, InvoiceStatus, PayStatus } from "../types";

/* -------------------- Mock data (replace with API) -------------------- */
const MOCK_ROWS: InvoiceRow[] = [
  {
    id: "ID4523",
    date: "2025-05-18",
    description: "Tax for May",
    amount: 600,
    paid: "Paid",
    status: "APPROVED",
  },
  {
    id: "ID8725",
    date: "2025-06-18",
    description: "Tax for June",
    amount: 600,
    paid: "Not Paid",
    status: "PENDING",
  },
];

/* Tag colors */
const paidColor: Record<PayStatus, string> = {
  Paid: "green",
  "Not Paid": "red",
};
const statusColor: Record<InvoiceStatus, string> = {
  APPROVED: "green",
  PENDING: "default",
  DRAFT: "default",
  OVERDUE: "red",
};

type Props = {
  rows?: InvoiceRow[];
  loading?: boolean;
  onCreate?: () => void;
  onView?: (row: InvoiceRow) => void;
  onDownload?: (row: InvoiceRow) => void;
};

export default function InvoicesTab({
  rows = MOCK_ROWS,
  loading = false,
  onCreate,
  onView,
  onDownload,
}: Props) {
  // search + filters + pagination
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>(
    "All"
  );
  const [paidFilter, setPaidFilter] = useState<"All" | PayStatus>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const topRef = useRef<HTMLDivElement | null>(null);

  // filtered list (no date filter)
  const visibleRows = useMemo(() => {
    let list = [...rows];

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.id, r.description, r.status, r.paid]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (paidFilter !== "All") list = list.filter((r) => r.paid === paidFilter);
    if (statusFilter !== "All")
      list = list.filter((r) => r.status === statusFilter);

    return list;
  }, [rows, query, paidFilter, statusFilter]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return visibleRows.slice(start, end);
  }, [visibleRows, page, pageSize]);

  useEffect(() => setPage(1), [query, paidFilter, statusFilter]);

  // table columns
  const columns: TableProps<InvoiceRow>["columns"] = [
    {
      title: "Date",
      dataIndex: "date",
      width: 180,
      sorter: (a, b) => a.date.localeCompare(b.date),
      render: (d: string) =>
        new Date(d).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
    },
    {
      title: "Invoice ID",
      dataIndex: "id",
      width: 140,
      render: (v: string) => <span className="font-medium">{v}</span>,
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: "Description",
      dataIndex: "description",
      width: 240,
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      align: "right" as const,
      width: 120,
      render: (n: number) => `$${n.toLocaleString()}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Paid/Not Paid",
      dataIndex: "paid",
      width: 150,
      sorter: (a, b) => a.paid.localeCompare(b.paid),
      render: (s: PayStatus) => (
        <Tag color={paidColor[s]} className="uppercase !m-0">
          {s}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 140,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (s: InvoiceStatus) => (
        <Tag color={statusColor[s]} className="uppercase !m-0">
          {s}
        </Tag>
      ),
    },
    {
      title: "View",
      key: "view",
      width: 100,
      render: (_: any, r) => (
        <button
          className="text-primary hover:underline"
          onClick={() => onView?.(r)}
        >
          View
        </button>
      ),
    },
    {
      title: "Download",
      key: "download",
      width: 120,
      render: (_: any, r) => (
        <button
          className="text-primary hover:underline"
          onClick={() => onDownload?.(r)}
        >
          Download
        </button>
      ),
    },
  ];

  // filter options (for Paid and Status)
  const paidOptions = [
    { value: "All", label: "Paid / Not Paid" },
    { value: "Paid", label: "Paid" },
    { value: "Not Paid", label: "Not Paid" },
  ];

  const statusOptions = useMemo(
    () =>
      (Array.from(new Set(rows.map((r) => r.status))) as InvoiceStatus[]).map(
        (s) => ({ value: s, label: s })
      ),
    [rows]
  );

  return (
    <div className="space-y-4">
      {/* Title + Create */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          TechCorp Invoice
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="!bg-[#FF6236] hover:!bg-[#ff764f]"
          onClick={onCreate}
        >
          Create New Invoice
        </Button>
      </div>

      {/* Search row with filters on the right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search (left) */}
        <div className="w-full max-w-md">
          <Input
            placeholder="Search invoices"
            prefix={<SearchOutlined />}
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filters (right) */}
        <div className="w-full sm:w-auto sm:ml-auto flex gap-2 sm:items-center">
          <Select
            value={paidFilter}
            onChange={(v) => setPaidFilter(v)}
            options={paidOptions}
            className="min-w-[160px]"
          />
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[{ value: "All", label: "Status" }, ...statusOptions]}
            className="min-w-[150px]"
          />
        </div>
      </div>

      {/* Table */}
      <div ref={topRef} />
      <Table<InvoiceRow>
        rowKey={(r) => `${r.id}-${r.date}`}
        size="middle"
        className="rounded-xl"
        columns={columns}
        dataSource={pagedRows}
        loading={loading}
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize,
          total: visibleRows.length,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}`,
          position: ["bottomRight"],
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
            topRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          },
        }}
      />
    </div>
  );
}
