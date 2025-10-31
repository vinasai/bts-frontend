import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, App, Tag } from "antd";
import type { TableProps } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Button from "../../components/Button";
import Input from "../../components/Input";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

type StaffRow = {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  username: string | null;
  email: string | null;
  primary_contact: string | null;
  is_login: boolean;
};

export default function Employees() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const topRef = useRef<HTMLDivElement | null>(null);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/staff");
      console.log(res.data);
      const data: StaffRow[] = (res.data ?? []).map((r: any) => ({
        id: r.id,
        employee_id: r.employee_id,
        first_name: r.first_name,
        last_name: r.last_name,
        username: r.username ?? null,
        email: r.email ?? null,
        primary_contact: r.primary_contact ?? null,
        is_login: !!r.is_login,
      }));
      setRows(data);
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.employee_id,
        r.first_name,
        r.last_name,
        r.username,
        r.email,
        r.primary_contact,
        r.is_login ? "yes" : "no",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return visibleRows.slice(start, end);
  }, [visibleRows, page, pageSize]);

  const columns: TableProps<StaffRow>["columns"] = [
    {
      title: "Employee ID",
      dataIndex: "employee_id",
      sorter: (a, b) => a.employee_id.localeCompare(b.employee_id),
      width: 140,
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      title: "Name",
      key: "name",
      sorter: (a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`
        ),
      width: 220,
      render: (_, r) => `${r.first_name} ${r.last_name}`,
    },
    {
      title: "Username",
      dataIndex: "username",
      sorter: (a, b) => (a.username || "").localeCompare(b.username || ""),
      width: 180,
      render: (v: string | null) => v || "—",
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
      width: 260,
      ellipsis: true,
      render: (v: string | null) =>
        v ? (
          <a href={`mailto:${v}`} className="text-primary hover:underline">
            {v}
          </a>
        ) : (
          "—"
        ),
    },
    {
      title: "Primary Contact",
      dataIndex: "primary_contact",
      sorter: (a, b) =>
        (a.primary_contact || "").localeCompare(b.primary_contact || ""),
      width: 180,
      render: (v: string | null) => (v ? <a href={`tel:${v}`}>{v}</a> : "—"),
    },
    {
      title: "Login Access",
      dataIndex: "is_login",
      sorter: (a, b) => Number(a.is_login) - Number(b.is_login),
      width: 140,
      render: (v: boolean) => (
        <Tag color={v ? "green" : "red"} style={{ marginInlineEnd: 0 }}>
          {v ? "ACTIVE" : "INACTIVe"}
        </Tag>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-2 min-w-0">
            <h1 className="text-title uppercase text-ink">Employees</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            Add Employee
          </Button>
        </div>
      </div>

      <Card className="!rounded-2xl !shadow !border-0">
        {/* Toolbar */}
        <div className="mb-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full max-w-md">
              <Input
                placeholder="Search by name, employee ID, username, email, phone…"
                prefix={<SearchOutlined />}
                allowClear
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div ref={topRef} />
        <Table<StaffRow>
          rowKey="id"
          columns={columns}
          dataSource={pagedRows}
          loading={loading}
          size="middle"
          className="rounded-xl"
          scroll={{ x: "max-content" }}
          pagination={{
            current: page,
            pageSize,
            total: visibleRows.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
              topRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            position: ["bottomRight"],
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/employees/${record.id}`),
            style: { cursor: "pointer" },
          })}
        />
      </Card>
    </div>
  );
}
