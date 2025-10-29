import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, App, Avatar, Tabs, Tag, Divider, Skeleton, Select } from "antd";
import { EditOutlined } from "@ant-design/icons";
import Button from "../../components/Button";
import Input from "../../components/Input";
import axiosInstance from "../../utils/axiosInstance";
import { showConfirmModal } from "../../components/ConfirmModal";
import CommonModal from "../../components/Modal/CommonModal";

import type { Employee, EmpStatus, ProjectRow, TaskRow } from "./types";
import { DEPARTMENTS } from "./types";

import DetailsTab from "./tabs/DetailsTab";
import ProjectsTab from "./tabs/ProjectsTab";
import TasksTab from "./tabs/TasksTab";

/* ----------------------------------------------------------------------------
 * Mock
 * ---------------------------------------------------------------------------*/

const MOCK_MODE = true;

function makeMockEmployee(id = "emp_0007"): Employee {
  return {
    id,
    avatarUrl: "",
    firstName: "Sarah",
    lastName: "Johnson",
    gender: "Female",
    role: "Accountant",
    department: "Finance",
    email: "sarah.johnson@acme.com",
    phone: "+14165550123",
    address: "123 Main Street, Anytown, USA",
    dob: "1994-05-15",
    status: "Active",
    salary: 75000,
    hireDate: "2023-03-15",
    reportsTo: "Michael Brown",
    joinedAgo: "Joined 2 years ago",
  };
}

const MOCK_PROJECTS: ProjectRow[] = [
  {
    id: "p1",
    name: "Quarterly Closing",
    code: "FIN-Q4",
    role: "Lead Accountant",
    start: "2024-10-01",
    status: "Active",
  },
  {
    id: "p2",
    name: "ERP Migration",
    code: "OPS-ERP",
    role: "Finance SME",
    start: "2024-06-10",
    end: "2025-01-31",
    status: "Paused",
  },
  {
    id: "p3",
    name: "Audit 2024",
    code: "FIN-AUD",
    role: "Coordinator",
    start: "2024-12-01",
    end: "2025-02-28",
    status: "Completed",
  },
];

const MOCK_TASKS: TaskRow[] = [
  {
    id: "t1",
    title: "Reconcile AR bucket",
    due: "2025-11-03",
    done: false,
    priority: "High",
  },
  {
    id: "t2",
    title: "Schedule vendor payments",
    due: "2025-11-05",
    done: false,
    priority: "Medium",
  },
  { id: "t3", title: "Upload invoices to ERP", done: true, priority: "Low" },
];

/* ----------------------------------------------------------------------------
 * Main
 * ---------------------------------------------------------------------------*/

export default function EmployeeProfile() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id ?? "emp_0007";
  const [loading, setLoading] = useState(true);
  const [emp, setEmp] = useState<Employee | null>(null);
  const [edit, setEdit] = useState(false);

  // role modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | undefined>(undefined);
  const [pendingDept, setPendingDept] = useState<string | undefined>(undefined);

  const [activeKey, setActiveKey] = useState<string>("details");

  const { message } = App.useApp();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (MOCK_MODE) {
          await new Promise((r) => setTimeout(r, 400));
          const m = makeMockEmployee(employeeId);
          setEmp(m);
        } else {
          const { data } = await axiosInstance.get(`/employees/${employeeId}`);
          setEmp(data);
        }
      } catch (e: any) {
        message.error(e?.response?.data?.message || "Failed to load employee");
      } finally {
        setLoading(false);
      }
    })();
  }, [employeeId, message]);

  const fullName = useMemo(
    () => [emp?.firstName, emp?.lastName].filter(Boolean).join(" "),
    [emp]
  );

  const statusTag = useMemo(() => {
    const key = (emp?.status || "Active").toLowerCase();
    const color =
      key === "active" ? "green" : key === "inactive" ? "red" : "orange";
    return (
      <Tag color={color} className="!m-0">
        {(emp?.status || "Active").toUpperCase()}
      </Tag>
    );
  }, [emp]);

  async function saveProfile(values: Partial<Employee>) {
    const payload: Employee = { ...(emp as Employee), ...values };
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      setEmp(payload);
      message.success("Profile updated");
      setEdit(false);
    } else {
      await axiosInstance.put(`/employees/${employeeId}`, payload);
      setEmp(payload);
      message.success("Profile updated");
      setEdit(false);
    }
  }

  function onResetPassword() {
    showConfirmModal({
      title: "Reset password?",
      content:
        "This will send a password reset email to the employee’s registered address.",
      danger: true,
      okText: "Send reset",
      async onOk() {
        if (MOCK_MODE) {
          await new Promise((r) => setTimeout(r, 400));
          message.success("Password reset email sent");
        } else {
          await axiosInstance.post(`/employees/${employeeId}/reset-password`);
          message.success("Password reset email sent");
        }
      },
    });
  }

  function openChangeRole() {
    setPendingRole(emp?.role);
    setPendingDept(emp?.department);
    setRoleModalOpen(true);
  }

  async function applyRoleChange() {
    if (!pendingRole || !emp) {
      message.error("Pick a role");
      return;
    }
    const next: Employee = {
      ...emp,
      role: pendingRole,
      department: pendingDept || emp.department,
    };
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 300));
      setEmp(next);
      message.success("Role updated");
      setRoleModalOpen(false);
    } else {
      await axiosInstance.post(`/employees/${employeeId}/change-role`, {
        role: pendingRole,
        department: pendingDept,
      });
      setEmp(next);
      message.success("Role updated");
      setRoleModalOpen(false);
    }
  }

  if (loading || !emp) {
    return (
      <div className="space-y-4">
        <Card className="!rounded-2xl !shadow !border-0 p-6">
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar size={64} src={emp.avatarUrl}>
              {emp.firstName?.[0]}
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-title uppercase text-ink truncate">
                  {fullName || "Employee"}
                </h1>
                {statusTag}
              </div>
              <div className="text-gray-500 text-sm truncate">
                {emp.role} • {emp.department}
              </div>
              <div className="text-gray-400 text-xs">{emp.joinedAgo}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!edit ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  setActiveKey("details");
                  setEdit(true);
                }}
              >
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={() => setEdit(false)}>Cancel</Button>
                {/* Save is triggered from DetailsTab via onSubmit -> saveProfile */}
                <Button
                  form="employee-details-form"
                  type="primary"
                  htmlType="submit"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card className="!rounded-2xl !shadow !border-0">
        <Tabs
          activeKey={activeKey}
          onChange={(k) => {
            setActiveKey(k);
            setEdit(false);
          }}
          destroyOnHide
          items={[
            {
              key: "details",
              label: "Details",
              children: (
                <DetailsTab
                  emp={emp}
                  edit={edit}
                  onSubmit={saveProfile}
                  onResetPassword={onResetPassword}
                  onOpenChangeRole={openChangeRole}
                />
              ),
            },
            {
              key: "projects",
              label: "Projects",
              children: <ProjectsTab data={MOCK_MODE ? MOCK_PROJECTS : []} />,
            },
            {
              key: "tasks",
              label: "Tasks",
              children: <TasksTab data={MOCK_MODE ? MOCK_TASKS : []} />,
            },
          ]}
        />
      </Card>

      {/* Change Role Modal */}
      <CommonModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Change Role"
        subtitle={fullName}
        actions={{
          items: [
            { label: "Apply", variant: "primary", onClick: applyRoleChange },
          ],
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div>
            <div className="text-sm mb-1">New Role</div>
            <Input
              value={pendingRole}
              onChange={(e) => setPendingRole(e.target.value)}
              placeholder="e.g., Senior Accountant"
            />
          </div>
          <div>
            <div className="text-sm mb-1">Department</div>
            <Select
              className="!w-full"
              value={pendingDept}
              onChange={(v) => setPendingDept(v)}
              options={Array.from(DEPARTMENTS).map((d) => ({
                value: d,
                label: d,
              }))}
              placeholder="Select department"
              allowClear
            />
          </div>
        </div>
      </CommonModal>
    </div>
  );
}
