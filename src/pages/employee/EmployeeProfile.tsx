// src/pages/Employees/EmployeeProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, App, Avatar, Tabs, Skeleton } from "antd";
import { EditOutlined } from "@ant-design/icons";
import Button from "../../components/Button";
import axiosInstance from "../../utils/axiosInstance";
import { showConfirmModal } from "../../components/ConfirmModal";
import CommonModal from "../../components/Modal/CommonModal";
import DetailsTab from "./tabs/DetailsTab";
import ProjectsTab from "./tabs/ProjectsTab";
import TasksTab from "./tabs/TasksTab";
import type { StaffProfile, EmpStatus, ProjectRow, TaskRow } from "./types";
import { DEPARTMENTS } from "./types";

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

export default function EmployeeProfile() {
  const { id: staffId = "" } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [emp, setEmp] = useState<StaffProfile | null>(null);
  const [edit, setEdit] = useState(false);
  const [activeKey, setActiveKey] = useState<string>("details");
  const [saving, setSaving] = useState(false);
  const MOCK_MODE = true;

  // role modal (kept for later)
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const { message } = App.useApp();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/staff/${staffId}`);
        console.log(data);
        const mapped: StaffProfile = {
          id: data.id,
          userId: data.user_id ?? null,
          employeeId: data.employee_id,
          firstName: data.first_name,
          lastName: data.last_name,
          username: data.username ?? null,
          email: data.email ?? null,
          isLogin: !!data.is_login,
          birthday: data.birthday ?? null,
          joiningDate: data.joining_date ?? null,
          contactNumbers: data.contact_numbers ?? [],
          primaryContact: data.primary_contact ?? null,
          createdByName: data.created_by_name ?? null,
          updatedByName: data.updated_by_name ?? null,
          role: data.role ?? null,
        };
        setEmp(mapped);
      } catch (e: any) {
        message.error(e?.response?.data?.error || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [staffId, message]);

  const fullName = useMemo(
    () => [emp?.firstName, emp?.lastName].filter(Boolean).join(" "),
    [emp]
  );

  async function saveProfile(values: Partial<StaffProfile>) {
    if (!emp) return;

    const payload: any = {};
    if (values.firstName !== undefined) payload.firstName = values.firstName;
    if (values.lastName !== undefined) payload.lastName = values.lastName;
    if (values.email !== undefined) payload.email = values.email;
    if (values.birthday !== undefined)
      payload.birthday = values.birthday || null;
    if (values.joiningDate !== undefined)
      payload.joiningDate = values.joiningDate || null;
    if (values.contactNumbers !== undefined)
      payload.contactNumbers = values.contactNumbers;
    if (values.primaryContact !== undefined)
      payload.primaryContact = values.primaryContact;

    try {
      setSaving(true);
      await axiosInstance.patch(`/staff/${emp.id}`, payload);
      setEmp((prev) =>
        prev ? ({ ...prev, ...values } as StaffProfile) : prev
      );
      message.success("Profile updated");
      setEdit(false);
    } catch (e: any) {
      message.error(e?.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
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
        message.success("Password reset email sent (mock)");
      },
    });
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
            <Avatar size={64}>{emp.firstName?.[0]}</Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-title uppercase text-ink truncate">
                  {fullName || "Employee"}
                </h1>
              </div>
              <div className="text-gray-500 text-sm truncate">
                {emp.role ?? "—"}
              </div>
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
                disabled={saving}
              >
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={() => setEdit(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  form="employee-details-form"
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  disabled={saving}
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
        <div className={saving ? "pointer-events-none opacity-60" : ""}>
          <Tabs
            activeKey={activeKey}
            onChange={(k) => {
              if (!saving) {
                setActiveKey(k);
                setEdit(false);
              }
            }}
            destroyOnHidden   
            tabBarStyle={
              saving ? { pointerEvents: "none", opacity: 0.6 } : undefined
            }
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
                    onOpenChangeRole={() => setRoleModalOpen(true)}
                    saving={saving}
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
        </div>
      </Card>

      {/* Change Role Modal (kept for later) */}
      <CommonModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Change Role"
        subtitle={fullName}
        actions={{
          items: [
            {
              label: "Apply",
              variant: "primary",
              onClick: () => setRoleModalOpen(false),
            },
          ],
        }}
      >
        <div className="text-sm text-gray-500">
          Role changes integration coming soon.
        </div>
      </CommonModal>
    </div>
  );
}
