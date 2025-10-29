// src/pages/staff/StaffCreate.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  DatePicker,
  TimePicker,
  Select,
  App,
  Card,
  Row,
  Col,
  Tooltip,
  Divider,
  Upload,
  List,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import PageHeader from "../../components/PageHeader";
import Input, {
  PasswordInput,
  EmailInput,
  NumberInput,
  PhoneInputCanada,
  validateCanadianPhone,
} from "../../components/Input";
import Button from "../../components/Button";
import axiosInstance from "../../utils/axiosInstance";
import {
  UploadOutlined,
  DeleteOutlined,
  FileOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  CopyOutlined,
} from "@ant-design/icons";

type StaffForm = {
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string[];
  emergencyContactNo?: string;
  birthday?: Dayjs;
  joiningDate?: Dayjs;
  position?: string;
  managerId?: string;
  jobFamily?: string;
  totalLeaves?: number;
  username?: string;
  password?: string;
  documents?: File[];
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const JOB_FAMILIES = [
  { value: "operations", label: "Operations" },
  { value: "mechanical", label: "Mechanical" },
  { value: "body", label: "Body Shop" },
  { value: "towing", label: "Towing" },
  { value: "rental", label: "Rental" },
  { value: "admin", label: "Admin" },
];

export default function StaffCreate() {
  const [form] = Form.useForm<StaffForm>();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const navigate = useNavigate();

  const [startWeek, setStartWeek] = useState<(Dayjs | null)[]>(
    Array(7).fill(null)
  );
  const [endWeek, setEndWeek] = useState<(Dayjs | null)[]>(Array(7).fill(null));

  const setStartAt = (i: number, v: Dayjs | null) =>
    setStartWeek((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setEndAt = (i: number, v: Dayjs | null) =>
    setEndWeek((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  const clearDay = (i: number) => {
    setStartAt(i, null);
    setEndAt(i, null);
  };

  const canCopyRow = (i: number) => {
    const s = startWeek[i];
    const e = endWeek[i];
    if (!s || !e) return false;
    return s.isBefore(e);
  };

  // copy from a single row to all
  const copyRowToAll = (i: number) => {
    const s = startWeek[i];
    const e = endWeek[i];

    if (!s && !e) {
      // clear all
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

  async function onSubmit(values: StaffForm) {
    setLoading(true);
    try {
      // Pairing validation
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

      const shiftStart = startWeek.map((v) => (v ? v.format("HH:mm") : null));
      const shiftEnd = endWeek.map((v) => (v ? v.format("HH:mm") : null));

      for (let i = 0; i < 7; i++) {
        if (shiftStart[i] && shiftEnd[i]) {
          const a = dayjs(shiftStart[i], "HH:mm");
          const b = dayjs(shiftEnd[i], "HH:mm");
          if (!a.isBefore(b)) {
            message.error(`${DAYS[i]}: Start must be before End`);
            setLoading(false);
            return;
          }
        }
      }

      const contactNoArray = Array.isArray(values.contactNo)
        ? values.contactNo.map((v) => (v ?? "").trim()).filter(Boolean)
        : [];

      const payload = {
        ...values,
        contactNo: contactNoArray,
        shiftStart,
        shiftEnd,
        birthday: values.birthday?.format("YYYY-MM-DD") ?? null,
        joiningDate: values.joiningDate?.format("YYYY-MM-DD") ?? null,
      };

      const response = await axiosInstance.post(
        "/auth/register-staff",
        payload
      );
      const staffId = response.data.staff.id;

      if (documents.length > 0) {
        const formData = new FormData();
        documents.forEach((file) => formData.append("documents", file));
        await axiosInstance.post(`/staff/${staffId}/documents`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success("Staff created successfully with documents!");
      } else {
        message.success("Staff created successfully!");
      }

      form.resetFields();
      setStartWeek(Array(7).fill(null));
      setEndWeek(Array(7).fill(null));
      setDocuments([]);
      navigate("/staff/list");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to create staff";
      message.error(errorMsg);
      console.error("Create Staff Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleRemoveFile = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="py-4">
        <PageHeader title="Add new staff" />
      </div>

      <Card className="!rounded-2xl !shadow !border-0">
        <Form<StaffForm>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onSubmit}
          validateTrigger="onSubmit"
          initialValues={{ totalLeaves: 0, contactNo: [""] }}
        >
          <Row gutter={[16, 8]}>
            {/* First/Last */}
            <Col xs={24} md={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                // trims user input as they type/paste
                getValueFromEvent={(e) =>
                  (e?.target?.value ?? "").replace(/\s+/g, " ").trimStart()
                }
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Please enter first name",
                  },
                  {
                    validator: (_, v: string) => {
                      const s = (v ?? "").trim();
                      if (!s)
                        return Promise.reject(
                          new Error("First name cannot be only spaces")
                        );
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="First name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                getValueFromEvent={(e) =>
                  (e?.target?.value ?? "").replace(/\s+/g, " ").trimStart()
                }
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Please enter last name",
                  },
                  {
                    validator: (_, v: string) => {
                      const s = (v ?? "").trim();
                      if (!s)
                        return Promise.reject(
                          new Error("Last name cannot be only spaces")
                        );
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Last name" />
              </Form.Item>
            </Col>

            {/* Email / Birthday */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                // handle e or value
                getValueFromEvent={(e: any) => {
                  if (e && typeof e === "object" && "target" in e) {
                    return (e.target?.value ?? "").trim();
                  }
                  if (typeof e === "string") {
                    return e.trim();
                  }
                  return "";
                }}
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Enter a valid email" },
                  {
                    validator: async (_, v?: string) => {
                      const s = (v ?? "").trim();
                      if (!s) return; // let "required" rule handle empties
                      if (/\s/.test(s))
                        throw new Error("Email cannot contain spaces");
                      const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                      if (!re.test(s))
                        throw new Error("Enter a valid email address");
                    },
                  },
                ]}
              >
                <EmailInput
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Birthday"
                name="birthday"
                rules={[
                  {
                    validator: (_, v?: Dayjs | null) => {
                      if (!v) return Promise.resolve(); // optional
                      if (!dayjs.isDayjs(v) || !v.isValid())
                        return Promise.reject(
                          new Error("Please select a valid date of birth")
                        );
                      if (v.endOf("day").isAfter(dayjs().endOf("day")))
                        return Promise.reject(
                          new Error("Birthday cannot be in the future")
                        );
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  className="!w-full !rounded-md"
                  format="YYYY-MM-DD"
                  disabledDate={(current) =>
                    !!current &&
                    current.endOf("day").isAfter(dayjs().endOf("day"))
                  }
                />
              </Form.Item>
            </Col>

            {/* Contact numbers (compact, icon-only add/remove) */}
            <Col xs={24} md={12}>
              <Form.List
                name="contactNo"
                rules={[
                  {
                    validator: async (_, value) => {
                      const arr: string[] = Array.isArray(value) ? value : [];
                      // Require at least one VALID Canadian number
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
                      <Button
                        type="primary"
                        shape="circle"
                        size="small"
                        aria-label="Add contact"
                        icon={<PlusOutlined style={{ color: "#fff" }} />}
                        onClick={() => add("")}
                        className="!p-0"
                      />
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
                                if (fields.length === 1) {
                                  if (!validateCanadianPhone(s)) {
                                    throw new Error(
                                      "Enter a valid Canadian phone number (Canada only)"
                                    );
                                  }
                                  return;
                                }
                                if (!s) return; // allow blank extras
                                if (!validateCanadianPhone(s)) {
                                  throw new Error(
                                    "Enter a valid Canadian phone number (Canada only)"
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

                        {fields.length > 1 && (
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

            {/* Username / Password */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: "Please enter a username" },
                  { min: 3, message: "Username must be at least 3 characters" },
                ]}
              >
                <Input placeholder="e.g. jdoe" autoComplete="username" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please enter a password" },
                  {
                    min: 8,
                    message: "Password must be at least 8 characters long",
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      // At least 1 letter, 1 number, 1 special, no spaces
                      const strong =
                        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]+$/;
                      return strong.test(value)
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              "Password must contain a letter, number, special character, and no spaces."
                            )
                          );
                    },
                  },
                ]}
              >
                <PasswordInput
                  type="password"
                  placeholder="Enter password"
                  autoComplete="new-password"
                />
              </Form.Item>
            </Col>

            {/* Emergency Contact */}
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
                        throw new Error(
                          "Enter a valid Canadian emergency contact number (Canada only)"
                        );
                      }
                    },
                  },
                ]}
              >
                <PhoneInputCanada placeholder="(###) ###-####" />
              </Form.Item>
            </Col>

            {/* Joining Date / Position / Job Family */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Joining Date"
                name="joiningDate"
                rules={[
                  {
                    validator: (_, v?: Dayjs | null) => {
                      if (!v) return Promise.resolve(); // optional
                      if (!dayjs.isDayjs(v) || !v.isValid())
                        return Promise.reject(
                          new Error("Please select a valid joining date")
                        );
                      if (v.endOf("day").isAfter(dayjs().endOf("day")))
                        return Promise.reject(
                          new Error("Joining date cannot be in the future")
                        );
                      const b = form.getFieldValue("birthday") as
                        | Dayjs
                        | null
                        | undefined;
                      if (b && v.isBefore(b, "day"))
                        return Promise.reject(
                          new Error("Joining date cannot be before birthday")
                        );
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  className="!w-full !rounded-md"
                  format="YYYY-MM-DD"
                  disabledDate={(current) =>
                    !!current &&
                    current.endOf("day").isAfter(dayjs().endOf("day"))
                  }
                />
              </Form.Item>
            </Col>
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

            {/* Total Leaves */}
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

            {/* Weekly Shift Grid */}
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

                    <Col xs={24} md={2} className="text-right md:mt-0 mt-2">
                      <div className="flex justify-end gap-2">
                        <Tooltip
                          title={
                            canCopyRow(i)
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
                              disabled={!canCopyRow(i)}
                            />
                          </span>
                        </Tooltip>

                        <Tooltip title="Clear this day">
                          <span>
                            <Button
                              type="text"
                              aria-label={`Clear ${d}`}
                              onClick={() => clearDay(i)}
                              icon={<DeleteOutlined />}
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

            <Upload
              multiple
              beforeUpload={(file) => {
                setDocuments((prev) => [...prev, file]);
                return false;
              }}
              fileList={documents.map((file) => ({
                uid: file.name,
                name: file.name,
                status: "done",
              }))}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} className="mb-2">
                Add Documents
              </Button>
            </Upload>

            <List
              bordered
              dataSource={documents}
              renderItem={(file, idx) => (
                <List.Item
                  key={file.name}
                  className="flex justify-between items-center"
                  actions={[
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveFile(idx)}
                    />,
                  ]}
                >
                  <FileOutlined className="mr-2 text-gray-600" />
                  {file.name}
                </List.Item>
              )}
            />
          </Card>

          <div className="mt-2 flex justify-end">
            <Button
              type="primary"
              size="middle"
              htmlType="submit"
              loading={loading}
              className="!h-10 !rounded-md !px-8 !font-medium !w-auto"
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
