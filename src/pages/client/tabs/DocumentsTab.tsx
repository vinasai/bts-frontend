import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Select, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { SearchOutlined, UploadOutlined } from "@ant-design/icons";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import type { DocumentRow, DocStatus, DocAlert } from "../types";

/* Mock data (replace with API) */
const MOCK_ROWS: DocumentRow[] = [
  {
    id: "DOC7890",
    date: "2025-09-19",
    name: "Tax Return",
    type: "Tax",
    status: "APPROVED",
    alert: "NOT REQUIRED",
    via: "—",
  },
  {
    id: "DOC7890",
    date: "2025-09-15",
    name: "Tax Return",
    type: "Tax",
    status: "PENDING",
    alert: "ALERTED",
    via: "Phone",
  },
  {
    id: "DOC6547",
    date: "2025-09-12",
    name: "Payroll",
    type: "Payroll",
    status: "APPROVAL REQUIRED",
    alert: "SENT",
    via: "Mail",
  },
  {
    id: "DOC7890",
    date: "2025-09-10",
    name: "Tax Return",
    type: "Tax",
    status: "DUE",
    alert: "ALERT",
    via: "Message",
  },
  {
    id: "DOC7880",
    date: "2025-09-09",
    name: "T4",
    type: "Tax",
    status: "ESIGN REQUIRED",
    alert: "SENT",
    via: "Mail",
  },
];

/* tag colors */
const statusColor: Record<DocStatus, string> = {
  APPROVED: "green",
  PENDING: "default",
  "APPROVAL REQUIRED": "default",
  DUE: "default",
  "ESIGN REQUIRED": "default",
};
const alertColor: Record<DocAlert, string> = {
  "NOT REQUIRED": "green",
  SENT: "default",
  ALERTED: "default",
  ALERT: "default",
};

type Props = {
  rows?: DocumentRow[];
  loading?: boolean;
  onUpload?: () => void;
  onView?: (row: DocumentRow) => void;
  onDownload?: (row: DocumentRow) => void;
};

export default function DocumentsTab({
  rows = MOCK_ROWS,
  loading = false,
  onUpload,
  onView,
  onDownload,
}: Props) {
  // search + filters + pagination
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | DocStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | string>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const topRef = useRef<HTMLDivElement | null>(null);

  // filter (no toolbar date sort)
  const visibleRows = useMemo(() => {
    let list = [...rows];

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.id, r.name, r.type, r.via, r.status]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (statusFilter !== "All")
      list = list.filter((r) => r.status === statusFilter);
    if (typeFilter !== "All") list = list.filter((r) => r.type === typeFilter);

    return list;
  }, [rows, query, statusFilter, typeFilter]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return visibleRows.slice(start, end);
  }, [visibleRows, page, pageSize]);

  useEffect(() => setPage(1), [query, statusFilter, typeFilter]);

  // table columns (date still sortable via header)
  const columns: TableProps<DocumentRow>["columns"] = [
    {
      title: "Date",
      dataIndex: "date",
      width: 200,
      sorter: (a, b) => a.date.localeCompare(b.date),
      render: (d: string) =>
        new Date(d).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
    },
    {
      title: "Document ID",
      dataIndex: "id",
      width: 140,
      render: (v: string) => <span className="font-medium">{v}</span>,
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: "Name/Type",
      dataIndex: "name",
      width: 220,
      render: (_: any, r) => <span>{r.name}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 180,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (s: DocStatus) => (
        <Tag color={statusColor[s]} className="uppercase !m-0">
          {s}
        </Tag>
      ),
    },
    {
      title: "Alert",
      dataIndex: "alert",
      width: 160,
      sorter: (a, b) => a.alert.localeCompare(b.alert),
      render: (a: DocAlert) => (
        <Tag color={alertColor[a]} className="uppercase !m-0">
          {a}
        </Tag>
      ),
    },
    {
      title: "Via",
      dataIndex: "via",
      width: 140,
      sorter: (a, b) => a.via.localeCompare(b.via),
      render: (v: string) => <span className="text-gray-500">{v}</span>,
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

  // filter options
  const statusOptions = useMemo(
    () =>
      (Array.from(new Set(rows.map((r) => r.status))) as DocStatus[]).map(
        (s) => ({
          value: s,
          label: s,
        })
      ),
    [rows]
  );
  const typeOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.type))).map((t) => ({
        value: t,
        label: t,
      })),
    [rows]
  );

  return (
    <div className="space-y-4">
      {/* Title + Upload */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          TechCorp Documents
        </h2>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          className="!bg-[#FF6236] hover:!bg-[#ff764f]"
          onClick={onUpload}
        >
          Upload Document
        </Button>
      </div>

      {/* Search row with filters on the right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search (left) */}
        <div className="w-full max-w-md">
          <Input
            placeholder="Search  documents"
            prefix={<SearchOutlined />}
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filters (right) */}
        <div className="w-full sm:w-auto sm:ml-auto flex gap-2 sm:items-center">
          <Select
            value={typeFilter}
            onChange={(v) => setTypeFilter(v)}
            options={[{ value: "All", label: "Document Type" }, ...typeOptions]}
            className="min-w-[180px]"
          />
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[{ value: "All", label: "Status" }, ...statusOptions]}
            className="min-w-[160px]"
          />
        </div>
      </div>

      {/* Table */}
      <div ref={topRef} />
      <Table<DocumentRow>
        rowKey={(r) => `${r.id}-${r.date}-${r.name}`}
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
