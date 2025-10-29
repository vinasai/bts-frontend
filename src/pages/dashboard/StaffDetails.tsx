// src/pages/staff/StaffDetails.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Form,
  DatePicker,
  TimePicker,
  Select,
  App,
  Card,
  Row,
  Col,
  Divider,
  Tooltip,
  Upload,
  List,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";

import PageHeader from "../../components/PageHeader";
import Input, {
  EmailInput,
  NumberInput,
  PhoneInputCanada,
  validateCanadianPhone,
  PasswordInput,
} from "../../components/Input";
import Button from "../../components/Button";
import OutlineSweepButton from "../../components/OutlineSweepButton";
import { showConfirmModal } from "../../components/ConfirmModal";
import axiosInstance from "../../utils/axiosInstance";
import {
  UploadOutlined,
  FileOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import CommonModal from "../../components/Modal/CommonModal";

type StaffForm = {
  employee_id: string;
  staff_username: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string[]; // will be E.164 (“+1XXXXXXXXXX”) from PhoneInputCanada
  emergencyContactNo?: string; // optional E.164 from PhoneInputCanada
  birthday?: Dayjs;
  joiningDate?: Dayjs;
  position?: string;
  managerId?: string;
  jobFamily?: string;
  totalLeaves?: number;
  status?: "Active" | "Inactive";
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

const JOB_FAMILIES = [
  { value: "operations", label: "Operations" },
  { value: "mechanical", label: "Mechanical" },
  { value: "body", label: "Body Shop" },
  { value: "towing", label: "Towing" },
  { value: "rental", label: "Rental" },
  { value: "admin", label: "Admin" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// PG can return time[] as string like "{09:00,,17:00,...}" – normalize here
function coercePgTimeArray(val: any): (string | null)[] {
  if (val == null) return [];
  if (Array.isArray(val)) return val; // assume already ["09:00", null, ...]
  if (typeof val === "string") {
    const inner = val.replace(/^{|}$/g, "");
    if (inner.trim() === "") return [];
    return inner.split(",").map((s) => (s === "" ? null : s));
  }
  return [];
}

export default function StaffDetails() {
  const { id } = useParams();
  const [form] = Form.useForm<StaffForm>();
  const { message } = App.useApp();
  const [pwForm] = Form.useForm();
  const [pwOpen, setPwOpen] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const [documents, setDocuments] = useState<
    { id: string; name: string; url: string }[]
  >([]);
  const [uploading] = useState(false);

  const [fileList, setFileList] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<any[]>([]);

  // Weekly shift states (Dayjs or null)
  const [startWeek, setStartWeek] = useState<(Dayjs | null)[]>(
    Array(7).fill(null)
  );
  const [endWeek, setEndWeek] = useState<(Dayjs | null)[]>(Array(7).fill(null));

  const [employeeId, setEmployeeId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const setStartAt = (i: number, v: Dayjs | null) =>
    setStartWeek((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setEndAt = (i: number, v: Dayjs | null) =>
    setEndWeek((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const clearDay = (i: number) => {
    setStartAt(i, null);
    setEndAt(i, null);
  };

  function isoToLocalLike(iso: string) {
    // "2025-10-02T09:22:00.241-04:00" -> "2025-10-02 09:22:00"
    return iso.replace("T", " ").slice(0, 19);
  }

  const canCopyRow = (i: number) => {
    const s = startWeek[i];
    const e = endWeek[i];
    return !!s && !!e && s.isBefore(e);
  };

  // copy from a single row to all
  const copyRowToAll = (i: number) => {
    const s = startWeek[i];
    const e = endWeek[i];

    if (!s && !e) {
      setStartWeek(Array(7).fill(null));
      setEndWeek(Array(7).fill(null));
      message.success(`Cleared all days (copied ${DAYS[i]} off)`);
      return;
    }
    if ((s && !e) || (!s && e)) {
      message.error(`Cannot copy ${DAYS[i]}: set BOTH start and end first.`);
      return;
    }
    if (s && e && !s.isBefore(e)) {
      message.error(`${DAYS[i]}: Start must be before End`);
      return;
    }

    setStartWeek(Array(7).fill(s));
    setEndWeek(Array(7).fill(e));
    message.success(`Copied ${DAYS[i]} to all days`);
  };

  useEffect(() => {
    const fetchStaff = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/staff/${id}`);
        const staff = res.data;

        // status flags
        let allowed = true;
        try {
          const allowedRes = await axiosInstance.get(`/staff/${id}/allowed`);
          allowed = allowedRes.data.allowed;
        } catch (err) {
          console.error("Failed to fetch allowed status:", err);
        }
        try {
          const blockedRes = await axiosInstance.get(`/staff/${id}/blocked`);
          setBlocked(blockedRes.data.blocked);
        } catch (err) {
          console.error("Failed to fetch blocked status:", err);
        }

        // Pre-fill core fields
        form.setFieldsValue({
          employee_id: staff.employee_id,
          staff_username: staff.staff_username,
          firstName: staff.first_name,
          lastName: staff.last_name,
          email: staff.email,
          // Accept server values as array or single, keep strings as-is (PhoneInputCanada can handle E.164)
          contactNo: Array.isArray(staff.contact_no)
            ? staff.contact_no
            : staff.contact_no
              ? [staff.contact_no]
              : [],
          emergencyContactNo: staff.emergency_contact_no || "",
          birthday: staff.birthday ? dayjs(staff.birthday) : undefined,
          joiningDate: staff.joining_date
            ? dayjs(staff.joining_date)
            : undefined,
          position: staff.position,
          managerId: staff.manager_id,
          jobFamily: staff.job_family,
          totalLeaves:
            staff.total_leaves != null ? Number(staff.total_leaves) : 0,
          status: allowed ? "Active" : "Inactive",
          createdBy: staff.created_by_name || "—",
          updatedBy: staff.updated_by_name || "—",
          createdAt: staff.created_at
            ? isoToLocalLike(staff.created_at)
            : undefined,
          updatedAt: staff.updated_at
            ? isoToLocalLike(staff.updated_at)
            : undefined,
        });

        setEmployeeId(staff.employee_id);
        setUsername(staff.staff_username || "");
        setUserId(staff.user_id || "");

        // Weekly shift arrays → Dayjs/null
        const starts = coercePgTimeArray(staff.shift_start_local_time);
        const ends = coercePgTimeArray(staff.shift_end_local_time);

        setStartWeek(
          Array(7)
            .fill(null)
            .map((_, i) =>
              starts[i] ? dayjs(starts[i] as string, "HH:mm") : null
            )
        );
        setEndWeek(
          Array(7)
            .fill(null)
            .map((_, i) => (ends[i] ? dayjs(ends[i] as string, "HH:mm") : null))
        );
      } catch (err) {
        console.error("Failed to fetch staff:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [id, form]);

  // hydrate preview list from documents
  useEffect(() => {
    const files = documents.map((doc) => ({
      uid: doc.id,
      name: doc.name,
      status: "done",
      url: doc.url,
    }));
    setFileList(files);
  }, [documents]);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!id) return;
      try {
        const res = await axiosInstance.get(`/staff/${id}/documents`);
        const docs = res.data.documents.map((docId: string, idx: number) => ({
          id: docId,
          name: `Document ${idx + 1}`,
          url: `https://drive.google.com/file/d/${docId}/view`,
        }));
        setDocuments(docs);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      }
    };
    fetchDocuments();
  }, [id]);

  async function onSubmit(values: StaffForm) {
    setLoading(true);
    try {
      // Pairing validation per day
      for (let i = 0; i < 7; i++) {
        const s = startWeek[i];
        const e = endWeek[i];
        const oneSet = (!!s && !e) || (!s && !!e);
        if (oneSet) {
          message.error(
            `Please set BOTH start and end for ${DAYS[i]} or clear both.`
          );
          setLoading(false);
          return;
        }
      }

      // ensure contactNo is array of trimmed strings (PhoneInputCanada emits E.164 like +1416...)
      const contactNoArray = Array.isArray(values.contactNo)
        ? values.contactNo.map((v) => (v ?? "").trim()).filter(Boolean)
        : [];

      // Build arrays: "HH:mm" | null
      const shiftStart = startWeek.map((v) => (v ? v.format("HH:mm") : null));
      const shiftEnd = endWeek.map((v) => (v ? v.format("HH:mm") : null));

      // Optional local order check
      for (let i = 0; i < 7; i++) {
        if (shiftStart[i] && shiftEnd[i]) {
          const a = dayjs(shiftStart[i] as string, "HH:mm");
          const b = dayjs(shiftEnd[i] as string, "HH:mm");
          if (!a.isBefore(b)) {
            message.error(`${DAYS[i]}: Start must be before End`);
            setLoading(false);
            return;
          }
        }
      }

      const {
        createdBy,
        updatedBy,
        createdAt,
        updatedAt,
        status,
        employee_id,
        staff_username,
        ...editable
      } = values;

      // PATCH payload → arrays (not single times)
      const payload = {
        ...editable,
        contactNo: contactNoArray, // already E.164 from component
        shiftStart,
        shiftEnd,
        birthday: values.birthday?.format("YYYY-MM-DD") ?? null,
        joiningDate: values.joiningDate?.format("YYYY-MM-DD") ?? null,
      };

      await axiosInstance.patch(`/staff/${id}`, payload);

      // Upload newly added files (if any)
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((f) => formData.append("documents", f.originFileObj));
        const res = await axiosInstance.post(
          `/staff/${id}/documents`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        const uploadedDocs = res.data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.name || doc.id,
          url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
        }));
        setDocuments((prev) => [...prev, ...uploadedDocs]);
        setNewFiles([]);
      }

      message.success("Staff updated successfully");
      setEditing(false);

      const allowedRes = await axiosInstance.get(`/staff/${id}/allowed`);
      form.setFieldsValue({
        status: allowedRes.data.allowed ? "Active" : "Inactive",
      });

      await fetchStaffAgain();
    } catch (err: any) {
      message.error(err?.response?.data?.error ?? "Failed to update staff");
    } finally {
      setLoading(false);
    }
  }

  const fetchStaffAgain = async () => {
    const res = await axiosInstance.get(`/staff/${id}`);
    const staff = res.data;

    form.setFieldsValue({
      employee_id: staff.employee_id,
      firstName: staff.first_name,
      lastName: staff.last_name,
      email: staff.email,
      contactNo: Array.isArray(staff.contact_no)
        ? staff.contact_no
        : staff.contact_no
          ? [staff.contact_no]
          : [],
      emergencyContactNo: staff.emergency_contact_no || "",
      birthday: staff.birthday ? dayjs(staff.birthday) : undefined,
      joiningDate: staff.joining_date ? dayjs(staff.joining_date) : undefined,
      position: staff.position,
      managerId: staff.manager_id,
      jobFamily: staff.job_family,
      totalLeaves: staff.total_leaves != null ? Number(staff.total_leaves) : 0,
      createdBy: staff.created_by_name || "—",
      updatedBy: staff.updated_by_name || "—",
      createdAt: staff.created_at
        ? isoToLocalLike(staff.created_at)
        : undefined,
      updatedAt: staff.updated_at
        ? isoToLocalLike(staff.updated_at)
        : undefined,
    });

    setEmployeeId(staff.employee_id);
    setUsername(staff.staff_username || "");
    setUserId(staff.user_id || "");

    // refresh weekly shift grid too
    const starts = coercePgTimeArray(staff.shift_start_local_time);
    const ends = coercePgTimeArray(staff.shift_end_local_time);
    setStartWeek(
      Array(7)
        .fill(null)
        .map((_, i) => (starts[i] ? dayjs(starts[i], "HH:mm") : null))
    );
    setEndWeek(
      Array(7)
        .fill(null)
        .map((_, i) => (ends[i] ? dayjs(ends[i], "HH:mm") : null))
    );
  };

  const submitPasswordChange = async (vals: { newPassword: string }) => {
    try {
      setPwLoading(true);
      if (!userId) {
        message.error("User ID not found for this staff member.");
        return;
      }
      await axiosInstance.post("/auth/admin/reset-password", {
        userId,
        newPassword: vals.newPassword,
      });

      console.log("User id is ", userId);

      message.success("Password updated and sessions revoked");
      setPwOpen(false);
      pwForm.resetFields();
    } catch (e: any) {
      message.error(e?.response?.data?.error ?? "Admin reset failed");
    } finally {
      setPwLoading(false);
    }
  };

  const confirmBlock = () => {
    showConfirmModal({
      title: "Block this staff?",
      content: "They won’t be able to login until unblocked.",
      danger: true,
      onOk: async () => {
        try {
          await axiosInstance.patch(`/auth/${id}/block`, { blocked: true });
          message.success("Staff blocked");
          form.setFieldsValue({ status: "Inactive" });
          setBlocked(true);
        } catch (err: any) {
          message.error(err?.response?.data?.error ?? "Failed to block staff");
        }
      },
    });
  };

  const confirmUnblock = () => {
    showConfirmModal({
      title: "Unblock this staff?",
      content: "They will be able to login again.",
      danger: false,
      onOk: async () => {
        try {
          await axiosInstance.patch(`/auth/${id}/block`, { blocked: false });
          message.success("Staff unblocked");
          form.setFieldsValue({ status: "Active" });
          setBlocked(false);
        } catch (err: any) {
          message.error(
            err?.response?.data?.error ?? "Failed to unblock staff"
          );
        }
      },
    });
  };

  const handleBeforeUpload = (file: File) => {
    const newFile = {
      uid: (file as any).uid || `${file.name}-${Date.now()}`,
      name: file.name,
      status: "done",
      originFileObj: file,
    };
    setFileList((prev) => [...prev, newFile]);
    setNewFiles((prev) => [...prev, newFile]);
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="py-4">
        <PageHeader title="Staff details" />
      </div>

      <Card className="!rounded-2xl !shadow !border-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-gray-500">
            Employee No:{" "}
            <span className="font-medium">{employeeId || "—"}</span>
          </div>
          <div className="text-sm text-gray-500">
            User Name: <span className="font-medium">{username || "—"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full justify-end sm:w-auto sm:justify-start">
            <OutlineSweepButton type="default" onClick={() => setPwOpen(true)}>
              Change Password
            </OutlineSweepButton>

            {blocked ? (
              <Button
                type="primary"
                onClick={confirmUnblock}
                className="!h-10 !rounded-md !px-6 !font-medium !w-auto"
              >
                Unblock User
              </Button>
            ) : (
              <Button
                danger
                onClick={confirmBlock}
                className="!h-10 !rounded-md !px-6 !font-medium !w-auto"
              >
                Block User
              </Button>
            )}

            {!editing ? (
              <Button
                onClick={() => setEditing(true)}
                className="!h-10 !rounded-md !px-6 !font-medium !w-auto"
              >
                Edit
              </Button>
            ) : null}
          </div>
        </div>

        <Form<StaffForm>
          form={form}
          layout="vertical"
          requiredMark={false}
          disabled={!editing}
          onFinish={onSubmit}
          validateTrigger="onSubmit"
        >
          <Row gutter={[16, 8]}>
            {/* First/Last */}
            <Col xs={24} md={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true }]}
              >
                <Input placeholder="First name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true }]}
              >
                <Input placeholder="Last name" />
              </Form.Item>
            </Col>

            {/* Email */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true }, { type: "email" }]}
              >
                <EmailInput
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </Form.Item>
            </Col>

            {/* Contact numbers (use PhoneInputCanada, require at least one valid) */}
            <Col xs={24} md={12}>
              <Form.List
                name="contactNo"
                rules={[
                  {
                    validator: async (_, value) => {
                      const arr: string[] = Array.isArray(value) ? value : [];
                      // Require at least one valid Canadian number (digits or E.164 ok)
                      if (!arr.some((v) => v && validateCanadianPhone(v))) {
                        throw new Error(
                          "Enter at least one valid Canadian phone number"
                        );
                      }
                    },
                  },
                ]}
              >
                {(fields, { add, remove }, { errors }) => (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="ant-form-item-required">
                        Contact No
                      </label>
                      {editing && (
                        <Button
                          type="primary"
                          shape="circle"
                          size="small"
                          aria-label="Add contact"
                          icon={<PlusOutlined style={{ color: "#fff" }} />}
                          onClick={() => add("")}
                          className="!p-0"
                        />
                      )}
                    </div>

                    {fields.map((field, idx) => (
                      <div
                        key={field.key}
                        className="flex gap-2 mb-2 items-center"
                      >
                        <Form.Item
                          {...field}
                          validateTrigger={["onBlur", "onSubmit"]}
                          rules={[
                            {
                              validator: async (_, value: string) => {
                                const s = (value ?? "").trim();
                                // If there is only one field, it must be valid
                                if (fields.length === 1) {
                                  if (!validateCanadianPhone(s)) {
                                    throw new Error(
                                      "Enter a valid Canadian phone number"
                                    );
                                  }
                                  return;
                                }
                                // Multiple fields: allow blank extras, but if filled it must be valid
                                if (!s) return;
                                if (!validateCanadianPhone(s)) {
                                  throw new Error(
                                    "Enter a valid Canadian phone number"
                                  );
                                }
                              },
                            },
                          ]}
                          className="flex-1 !mb-0"
                        >
                          <PhoneInputCanada
                            placeholder={
                              idx === 0 ? "(###) ###-####" : "Add another..."
                            }
                          />
                        </Form.Item>

                        {editing && fields.length > 1 && (
                          <Button
                            type="text"
                            shape="circle"
                            aria-label="Remove contact"
                            onClick={() => remove(field.name)}
                            icon={<DeleteOutlined />}
                            className="!p-1"
                          />
                        )}
                      </div>
                    ))}

                    <Form.ErrorList errors={errors} />
                  </div>
                )}
              </Form.List>
            </Col>

            {/* Emergency Contact (optional, but if present must be valid) */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Emergency Contact No"
                name="emergencyContactNo"
                rules={[
                  {
                    validator: async (_, value: string) => {
                      const s = (value ?? "").trim();
                      if (!s) return; // optional
                      if (!validateCanadianPhone(s)) {
                        throw new Error("Enter a valid Canadian phone number");
                      }
                    },
                  },
                ]}
              >
                <PhoneInputCanada placeholder="(###) ###-####" />
              </Form.Item>
            </Col>

            {/* Birthday / Joining */}
            <Col xs={24} md={12}>
              <Form.Item label="Birthday" name="birthday">
                <DatePicker
                  className="!w-full !rounded-md"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Joining Date" name="joiningDate">
                <DatePicker
                  className="!w-full !rounded-md"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>

            {/* Position / Job Family / Leaves */}
            <Col xs={24} md={12}>
              <Form.Item label="Position" name="position">
                <Input placeholder="e.g. Auto Technician" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Job Family" name="jobFamily">
                <Select
                  allowClear
                  placeholder="Select job family"
                  options={JOB_FAMILIES}
                  className="!rounded-md"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Total Leaves"
                name="totalLeaves"
                rules={[
                  {
                    validator: (_, v) => {
                      if (v == null || v === "") return Promise.resolve();
                      return v >= 0
                        ? Promise.resolve()
                        : Promise.reject(new Error("Must be 0 or greater"));
                    },
                  },
                ]}
              >
                <NumberInput placeholder="0" min={0} step={1} integerOnly />
              </Form.Item>
            </Col>

            {/* Audit info (read-only, no name -> not submitted) */}
            <Col xs={24} md={12}>
              <Form.Item label="Created By">
                <Input
                  disabled
                  value={form.getFieldValue("createdBy") || "—"}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Updated By">
                <Input
                  disabled
                  value={form.getFieldValue("updatedBy") || "—"}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Created At">
                <Input
                  disabled
                  value={form.getFieldValue("createdAt") || "—"}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Updated At">
                <Input
                  disabled
                  value={form.getFieldValue("updatedAt") || "—"}
                />
              </Form.Item>
            </Col>

            {/* Weekly Shift Grid (Mon–Sun) */}
            <Col span={24}>
              <div className="flex items-center gap-2 mb-2">
                <Typography.Title level={5} className="!mb-0">
                  Weekly Shift (Mon–Sun)
                </Typography.Title>
                <Tooltip title="Set start/end for each day. Clear both to mark day off.">
                  <InfoCircleOutlined />
                </Tooltip>
              </div>

              <Card className="!rounded-xl !border !shadow-sm">
                <Row className="font-medium text-sm mb-2 px-2">
                  <Col xs={6}>Day</Col>
                  <Col xs={8}>Start</Col>
                  <Col xs={8}>End</Col>
                  <Col xs={24} md={2} className="text-right">
                    {/* actions */}
                  </Col>
                </Row>

                {DAYS.map((d, i) => (
                  <Row key={d} gutter={8} className="items-center mb-2 px-2">
                    <Col xs={6} className="text-sm">
                      {d}
                    </Col>
                    <Col xs={8}>
                      <TimePicker
                        className="!w-full !rounded-md"
                        format="HH:mm"
                        minuteStep={5}
                        allowClear
                        showNow={false}
                        value={startWeek[i]}
                        onChange={(v) => setStartAt(i, v)}
                      />
                    </Col>
                    <Col xs={8}>
                      <TimePicker
                        className="!w-full !rounded-md"
                        format="HH:mm"
                        minuteStep={5}
                        allowClear
                        showNow={false}
                        value={endWeek[i]}
                        onChange={(v) => setEndAt(i, v)}
                      />
                    </Col>

                    {/* Icon-only clear per day */}
                    <Col xs={24} md={2} className="text-right md:mt-0 mt-2">
                      <div className="flex justify-end gap-2">
                        <Tooltip
                          title={
                            !editing
                              ? "Enable Edit to copy"
                              : canCopyRow(i)
                                ? "Copy this day to all"
                                : "Set Start & End first"
                          }
                        >
                          <span>
                            <Button
                              type="text"
                              aria-label={`Copy ${d} to all`}
                              onClick={() => copyRowToAll(i)}
                              icon={<CopyOutlined />}
                              disabled={!editing || !canCopyRow(i)}
                            />
                          </span>
                        </Tooltip>

                        <Tooltip
                          title={
                            editing ? `Clear ${d}` : "Enable Edit to clear"
                          }
                        >
                          <span>
                            <Button
                              type="text"
                              aria-label={`Clear ${d}`}
                              onClick={() => clearDay(i)}
                              icon={<DeleteOutlined />}
                              disabled={!editing}
                            />
                          </span>
                        </Tooltip>
                      </div>
                    </Col>
                  </Row>
                ))}
              </Card>
            </Col>
          </Row>

          <Divider className="!my-4" />

          {/* Documents */}
          <Card className="!rounded-2xl !shadow !border-0 mt-4">
            <Typography.Title level={5}>Documents</Typography.Title>

            <List
              bordered
              dataSource={documents}
              renderItem={(doc, idx) => (
                <List.Item
                  key={doc.id + idx}
                  className="flex justify-between items-center"
                  actions={[
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600"
                    >
                      View
                    </a>,
                  ]}
                >
                  <FileOutlined className="mr-2 text-gray-600" />
                  {doc.name}
                </List.Item>
              )}
            />

            <Upload
              multiple
              fileList={fileList}
              disabled={!editing || uploading}
              beforeUpload={handleBeforeUpload}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
                setNewFiles((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
            >
              <Button
                icon={<UploadOutlined />}
                type="dashed"
                className="mt-4 !w-full !rounded-md"
              >
                Add Documents
              </Button>
            </Upload>

            {uploading && (
              <span className="text-sm text-gray-500 mt-2 block">
                Uploading...
              </span>
            )}
          </Card>

          {/* Footer actions */}
          {editing && (
            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              <OutlineSweepButton
                onClick={() => setEditing(false)}
                className="!w-auto"
              >
                Cancel
              </OutlineSweepButton>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="!h-10 !rounded-md !px-8 !font-medium !w-auto"
              >
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          )}
        </Form>
      </Card>
      <CommonModal
        open={pwOpen}
        onClose={() => {
          if (!pwLoading) {
            setPwOpen(false);
            pwForm.resetFields();
          }
        }}
        title="Change Password"
        actions={{
          items: [
            {
              label: pwLoading ? "Saving..." : "Save",
              variant: "primary",
              loading: pwLoading,
              onClick: () => pwForm.submit(),
            },
          ],
        }}
      >
        <Form
          form={pwForm}
          layout="vertical"
          requiredMark={false}
          onFinish={(values: { newPassword: string; confirm: string }) =>
            submitPasswordChange({ newPassword: values.newPassword })
          }
        >
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Enter a new password" },
              { min: 8, message: "Must be at least 8 characters" },
            ]}
            hasFeedback
          >
            <PasswordInput placeholder="New password" />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirm"
            dependencies={["newPassword"]}
            hasFeedback
            rules={[
              { required: true, message: "Confirm the new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <PasswordInput placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </CommonModal>
    </div>
  );
}
