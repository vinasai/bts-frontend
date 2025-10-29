// src/pages/staff/EmployeeList.tsx
import { useMemo, useState, useEffect, useRef } from "react";
import { Card, Table, type TableProps, Spin, Tag, Tooltip } from "antd";
import { SearchOutlined, PhoneOutlined, MailOutlined } from "@ant-design/icons";
import PageHeader from "../../components/PageHeader";
import Input from "../../components/Input";
import axiosInstance from "../../utils/axiosInstance"; // your axios instance

type Employee = {
  employee_id: string;
  empNo: string; // keep for routing
  name: string;
  email: string;
  contactNo: string[]; // ⟵ CHANGED: array of numbers (TEXT[])
  role: string;
  joinDate: string; // YYYY-MM-DD
  status: "Active" | "Inactive";
};

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/staff"); // fetch all staff
        const staffList = res.data;

        // fetch allowed status for each staff
        const employeesWithStatus = await Promise.all(
          staffList.map(async (e: any) => {
            let allowed = false;
            try {
              const allowedRes = await axiosInstance.get(
                `/staff/${e.id}/allowed`
              );
              allowed = allowedRes.data.allowed;
            } catch (err) {
              console.error(`Failed to fetch allowed for staff ${e.id}:`, err);
            }

            // Ensure contact array shape (DB returns text[]; normalize defensively)
            const contacts: string[] = Array.isArray(e.contact_no)
              ? e.contact_no.filter(
                  (x: any) => typeof x === "string" && x.trim() !== ""
                )
              : typeof e.contact_no === "string" && e.contact_no.trim() !== ""
                ? [e.contact_no]
                : [];

            return {
              employee_id: e.employee_id,
              empNo: e.id,
              name: `${e.first_name} ${e.last_name}`.trim(),
              email: e.email ?? "",
              contactNo: contacts, // ← array
              role: e.position ?? "N/A",
              joinDate: e.joining_date ? e.joining_date.split("T")[0] : "N/A",
              status: allowed ? "Active" : "Inactive",
            } as Employee;
          })
        );

        setEmployees(employeesWithStatus);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Search across fields, including all phone numbers
  const data = useMemo(() => {
    if (!query.trim()) return employees;
    const q = query.toLowerCase();
    return employees.filter((r) => {
      const hay = [
        r.employee_id,
        r.name,
        r.email,
        r.contactNo.join(" "), // join all numbers
        r.role,
        r.joinDate,
        r.status,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, employees]);

  const columns: TableProps<Employee>["columns"] = [
    {
      title: "EMPLOYEE ID",
      dataIndex: "employee_id",
      sorter: (a, b) => a.employee_id.localeCompare(b.employee_id),
      width: 140,
      ellipsis: true,
      defaultSortOrder: "descend",
    },
    {
      title: "NAME",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (v) => <span className="font-medium">{v}</span>,
      width: 220,
      ellipsis: true,
    },
    {
      title: "EMAIL",
      dataIndex: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (v: string) => (
        <span className="whitespace-nowrap flex items-center gap-2">
          <MailOutlined /> {v || "—"}
        </span>
      ),
      width: 260,
      ellipsis: true,
    },
    {
      title: "CONTACT NO",
      dataIndex: "contactNo",
      // Sort by the first number, then length
      sorter: (a, b) => {
        const aFirst = a.contactNo[0] ?? "";
        const bFirst = b.contactNo[0] ?? "";
        const firstCmp = aFirst.localeCompare(bFirst);
        return firstCmp !== 0
          ? firstCmp
          : a.contactNo.length - b.contactNo.length;
      },
      render: (nums: string[]) =>
        nums.length ? (
          <div className="flex flex-wrap gap-1 items-center">
            <PhoneOutlined className="opacity-70" />
            {nums.slice(0, 3).map((n, i) => (
              <Tag key={`${n}-${i}`} className="m-0">
                {n}
              </Tag>
            ))}
            {nums.length > 3 && (
              <Tooltip title={nums.slice(3).join(", ")}>
                <Tag className="m-0">+{nums.length - 3} more</Tag>
              </Tooltip>
            )}
          </div>
        ) : (
          <span>—</span>
        ),
      width: 260,
    },
    {
      title: "ROLE",
      dataIndex: "role",
      sorter: (a, b) => (a.role || "").localeCompare(b.role || ""),
      width: 180,
      ellipsis: true,
    },
    {
      title: "JOIN DATE",
      dataIndex: "joinDate",
      // Sort true chronology (YYYY-MM-DD or "N/A")
      sorter: (a, b) => {
        if (a.joinDate === "N/A" && b.joinDate === "N/A") return 0;
        if (a.joinDate === "N/A") return 1;
        if (b.joinDate === "N/A") return -1;
        return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      },
      width: 140,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 130,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status: Employee["status"]) => {
        const color = status === "Active" ? "green" : "red";
        const label = status.toUpperCase();
        return (
          <Tooltip
            title={status === "Active" ? "User is active" : "User is inactive"}
          >
            <Tag color={color} style={{ marginInlineEnd: 0 }}>
              {label}
            </Tag>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="py-4">
        <PageHeader title="STAFF LIST" />
      </div>
      <div ref={topRef} />
      <Card className="!rounded-2xl !shadow !border-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="w-full max-w-xs">
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <Table<Employee>
            rowKey="empNo"
            columns={columns}
            dataSource={data}
            scroll={{ x: "max-content" }}
            pagination={{
              current: page,
              pageSize,
              total: data.length,
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
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total}`,
              position: ["bottomRight"],
            }}
            onRow={(record) => ({
              onClick: () => {
                window.location.href = `/staff/${record.empNo}`;
              },
              className: "cursor-pointer",
            })}
            size="middle"
            className="rounded-xl"
          />
        )}
      </Card>
    </div>
  );
}
