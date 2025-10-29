import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, App, Tag, Select } from "antd";
import type { TableProps } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Button from "../../components/Button";
import Input from "../../components/Input";
import axiosInstance from "../../utils/axiosInstance";

type EmpStatus = "Active" | "Inactive" | "Probation";

type EmployeeRow = {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: EmpStatus;
};

const DEPARTMENTS = [
  "Engineering",
  "Operations",
  "Finance",
  "HR",
  "Sales",
  "Support",
] as const;
const STATUS: EmpStatus[] = ["Active", "Inactive", "Probation"];

// --- Toggle this while backend is not connected
const MOCK_MODE = true;

// --- Simple mock data generator (no external libs)
function makeMockEmployees(count = 120): EmployeeRow[] {
  const firstNames = [
    "Aisha",
    "Ben",
    "Chathura",
    "Dina",
    "Eshan",
    "Fiona",
    "Gihan",
    "Hana",
    "Ishan",
    "Jade",
    "Kasun",
    "Lena",
    "Maya",
    "Nimal",
    "Owen",
    "Priya",
    "Qadir",
    "Rhea",
    "Sahan",
    "Tara",
    "Uma",
    "Vik",
    "Waseem",
    "Xena",
    "Yohan",
    "Zara",
  ];
  const lastNames = [
    "Perera",
    "Fernando",
    "Silva",
    "Kumar",
    "De Alwis",
    "Wijesinghe",
    "Jayasinghe",
    "Herath",
    "Dias",
    "Peiris",
    "Ekanayake",
    "de Silva",
    "Senanayake",
    "Abeysekara",
  ];
  const roles = [
    "Software Engineer",
    "Senior Software Engineer",
    "Tech Lead",
    "QA Engineer",
    "Product Manager",
    "Operations Associate",
    "Finance Executive",
    "HR Generalist",
    "Sales Executive",
    "Customer Support Rep",
    "DevOps Engineer",
    "UX Designer",
  ];

  const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

  const pad = (n: number, len = 3) => String(n).padStart(len, "0");

  const toStatus = (i: number): EmpStatus =>
    i % 11 === 0 ? "Probation" : i % 7 === 0 ? "Inactive" : "Active";

  return Array.from({ length: count }).map((_, i) => {
    const fn = pick(firstNames, i + 3);
    const ln = pick(lastNames, i + 7);
    const name = `${fn} ${ln}`;
    const department = pick([...DEPARTMENTS], i + 5);
    const role = pick(roles, i + 9);
    const email =
      `${fn}.${ln}`.replace(/\s+/g, "").toLowerCase() + `@example.com`;
    const phone = `+94 7${(i % 9) + 1}${pad(i % 1000, 3)}${pad((i * 3) % 1000, 3)}`;
    const status = toStatus(i);

    return {
      id: `emp_${pad(i, 4)}`,
      name,
      role,
      department,
      email,
      phone,
      status,
    };
  });
}

const MOCK_EMPLOYEES: EmployeeRow[] = makeMockEmployees();

export default function Employees() {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(false);

  // toolbar state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | EmpStatus>("All");
  const [deptFilter, setDeptFilter] = useState<
    "All" | (typeof DEPARTMENTS)[number]
  >("All");

  // pagination state (page-per-view)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { message } = App.useApp();
  const topRef = useRef<HTMLDivElement | null>(null);

  // ---- Fetch employees (mock or real)
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      if (MOCK_MODE) {
        // Simulate network latency
        await new Promise((r) => setTimeout(r, 600));
        setRows(MOCK_EMPLOYEES);
      } else {
        // Adjust the endpoint to your API
        const res = await axiosInstance.get("/employees");
        const data: EmployeeRow[] = (res.data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          role: r.role,
          department: r.department,
          email: r.email,
          phone: r.phone,
          status: (String(r.status || "Active")
            .charAt(0)
            .toUpperCase() +
            String(r.status || "Active")
              .slice(1)
              .toLowerCase()) as EmpStatus,
        }));
        setRows(data);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Filters + search
  const visibleRows = useMemo(() => {
    let list = rows;

    if (statusFilter !== "All") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (deptFilter !== "All") {
      list = list.filter((r) => r.department === deptFilter);
    }

    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) =>
      [r.name, r.role, r.department, r.email, r.phone, r.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query, statusFilter, deptFilter]);

  // ---- Client-side pagination
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return visibleRows.slice(start, end);
  }, [visibleRows, page, pageSize]);

  // ---- Table columns
  const columns: TableProps<EmployeeRow>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (v) => <span className="font-medium">{v}</span>,
      width: 220,
    },
    {
      title: "Role",
      dataIndex: "role",
      sorter: (a, b) => a.role.localeCompare(b.role),
      width: 180,
      ellipsis: true,
    },
    {
      title: "Department",
      dataIndex: "department",
      sorter: (a, b) => a.department.localeCompare(b.department),
      width: 180,
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
      width: 240,
      ellipsis: true,
      render: (v: string) => (
        <a href={`mailto:${v}`} className="text-primary hover:underline">
          {v}
        </a>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      sorter: (a, b) => a.phone.localeCompare(b.phone),
      width: 160,
      render: (v: string) => <a href={`tel:${v}`}>{v}</a>,
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      width: 140,
      render: (s: EmpStatus) => {
        const key = s.toLowerCase();
        const color =
          key === "active" ? "green" : key === "inactive" ? "red" : "orange";
        return (
          <Tag color={color} style={{ marginInlineEnd: 0 }}>
            {s.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page header: title left, action right */}
      <div className="py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: title */}
          <div className="flex-2 min-w-0">
            <h1 className="text-title uppercase text-ink">Employees</h1>
          </div>

          {/* Right: action button */}
          <Button type="primary" icon={<PlusOutlined />}>
            Add Employee
          </Button>
        </div>
      </div>

      <Card className="!rounded-2xl !shadow !border-0">
        {/* Toolbar */}
        <div className="mb-3 space-y-3">
          {/* Row: search (left) + filters (right) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search left */}
            <div className="w-full max-w-md">
              <Input
                placeholder="Search by name, role, email, phone…"
                prefix={<SearchOutlined />}
                allowClear
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filters right */}
            <div className="w-full sm:w-auto sm:ml-auto flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                allowClear={false}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as "All" | EmpStatus);
                  setPage(1);
                }}
                options={[{ value: "All", label: "All Statuses" }].concat(
                  STATUS.map((s) => ({ value: s, label: s }))
                )}
                className="min-w-[160px]"
                placeholder="Status"
              />
              <Select
                allowClear={false}
                value={deptFilter}
                onChange={(val) => {
                  setDeptFilter(val as "All" | (typeof DEPARTMENTS)[number]);
                  setPage(1);
                }}
                options={[{ value: "All", label: "All Departments" }].concat(
                  DEPARTMENTS.map((d) => ({ value: d, label: d }))
                )}
                className="min-w-[180px]"
                placeholder="Department"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div ref={topRef} />
        <Table<EmployeeRow>
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
        />
      </Card>
    </div>
  );
}
