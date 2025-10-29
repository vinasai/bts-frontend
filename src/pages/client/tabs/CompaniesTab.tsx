import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import type { PayStatus, LinkedCompanyRow } from "../types";

/* ------------------------------------------------------------------ */
/* Mock data — replace with API results                                */
/* ------------------------------------------------------------------ */
const MOCK_ROWS: LinkedCompanyRow[] = [
  {
    id: "lc_001",
    name: "Carter",
    relationship: "father",
    company: "Carter & Sons",
    taxDescription: "Payroll",
    taxAmount: 3000,
    dueDate: "2025-09-27",
    status: "Not Paid",
  },
  {
    id: "lc_002",
    name: "Ann",
    relationship: "mother",
    company: "Ann Bakestore",
    taxDescription: "Income Tax",
    taxAmount: 2800,
    dueDate: "2025-09-01",
    status: "Paid",
  },
];

const statusColor: Record<PayStatus, string> = {
  Paid: "green",
  "Not Paid": "red",
};

type Props = {
  /** Optional: feed rows from parent/API. Defaults to mock. */
  rows?: LinkedCompanyRow[];
  loading?: boolean;
  onAdd?: () => void; // open modal, route, etc.
};

export default function CompaniesTab({
  rows = MOCK_ROWS,
  loading = false,
  onAdd,
}: Props) {
  // search and pagination
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const topRef = useRef<HTMLDivElement | null>(null);

  // filter by query (company name, relationship, or name)
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.company, r.relationship, r.name, r.taxDescription]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  // client-side pagination slice
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return visibleRows.slice(start, end);
  }, [visibleRows, page, pageSize]);

  useEffect(() => {
    // reset to first page when search changes
    setPage(1);
  }, [query]);

  const columns: TableProps<LinkedCompanyRow>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      width: 160,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      title: "Relationship",
      dataIndex: "relationship",
      width: 160,
      sorter: (a, b) => a.relationship.localeCompare(b.relationship),
      render: (v: string) => <span className="text-primary">{v}</span>,
    },
    {
      title: "Company",
      dataIndex: "company",
      width: 220,
      sorter: (a, b) => a.company.localeCompare(b.company),
    },
    {
      title: "Tax Description",
      dataIndex: "taxDescription",
      width: 180,
      sorter: (a, b) => a.taxDescription.localeCompare(b.taxDescription),
    },
    {
      title: "Tax Amount",
      dataIndex: "taxAmount",
      align: "right" as const,
      width: 140,
      sorter: (a, b) => a.taxAmount - b.taxAmount,
      render: (n: number) => `$${n.toLocaleString()}`,
    },
    {
      title: "Payment Due Date",
      dataIndex: "dueDate",
      width: 200,
      sorter: (a, b) => a.dueDate.localeCompare(b.dueDate),
      render: (d: string) =>
        new Date(d).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 140,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (s: PayStatus) => (
        <Tag color={statusColor[s]} style={{ marginInlineEnd: 0 }}>
          {s.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Title + actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Linked Company Details
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="!bg-[#FF6236] hover:!bg-[#ff764f]"
          onClick={onAdd}
        >
          Add Linked Company
        </Button>
      </div>

      {/* Search */}
      <div className="w-full max-w-md">
        <Input
          placeholder="Search  by company name or relationship"
          prefix={<SearchOutlined />}
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div ref={topRef} />
      <Table<LinkedCompanyRow>
        rowKey="id"
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
