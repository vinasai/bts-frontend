import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, App, Divider, Form, Row, Col, Tooltip } from "antd";
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import Button from "../../components/Button";
import Input, {
  PasswordInput,
  EmailInput,
  PhoneInputCanada,
  validateEmail,
  validateCanadianPhone,
} from "../../components/Input";
import axiosInstance from "../../utils/axiosInstance";
import OutlineSweepButton from "../../components/OutlineSweepButton";
import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import { TORONTO_TZ, getTorontoToday, toToronto } from "../../utils/time";

/* ----------------------------------------------------------------------------
 * Local form type (matches API payload we will send)
 * ---------------------------------------------------------------------------*/
type FormValues = {
  // Account
  username: string;
  password: string;

  // Personal
  firstName: string;
  lastName: string;
  email?: string;
  birthday?: string; // YYYY-MM-DD
  joiningDate?: string; // YYYY-MM-DD

  // Contacts
  contactNo: string[]; // at least one valid Canadian number
};

/* ----------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------*/

const DATE_FMT = "YYYY-MM-DD";

/** For DatePicker -> form: Dayjs -> "YYYY-MM-DD" in Toronto */
function pickToIso(d: Dayjs | null) {
  return d ? d.tz(TORONTO_TZ).format(DATE_FMT) : undefined;
}

/** For form -> DatePicker: "YYYY-MM-DD" -> Dayjs in Toronto */
function isoToPick(v?: string) {
  return v ? toToronto(v) : null;
}

/** Disable future days for birthday (Toronto local) */
function disableFutureDates(d: Dayjs) {
  return d && d.startOf("day").isAfter(getTorontoToday(), "day");
}

/* ----------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------------*/
export default function AddEmployees() {
  const [form] = Form.useForm<FormValues>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  const normalizeContacts = (arr: string[] | undefined) =>
    Array.from(
      new Set((arr ?? []).map((v) => (v ?? "").trim()).filter(Boolean))
    );

  async function onSave(values: FormValues) {
    const contactNo = normalizeContacts(values.contactNo);
    if (!contactNo.some((v) => validateCanadianPhone(v))) {
      message.error("Enter at least one valid Canadian phone number");
      return;
    }

    // API wants: username, password, firstName, lastName, contactNo (string[]), primaryContact, birthday, joiningDate
    const payload = {
      username: values.username.trim(),
      password: values.password,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      contactNo,
      primaryContact: contactNo[0], // first valid as primary
      birthday: values.birthday || null,
      joiningDate: values.joiningDate || null,
      email: (values.email ?? "").trim() || null,
    };

    try {
      const { data } = await axiosInstance.post(
        "/auth/register-staff",
        payload
      );
      message.success("Employee created");
      const employeeId = data?.staff?.employeeId || data?.staff?.id;
      navigate(`/employees/${employeeId}`);
    } catch (e: any) {
      message.error(e?.response?.data?.error || "Failed to create staff");
    }
  }

  function handleSubmit() {
    form
      .validateFields()
      .then(async (vals) => {
        setSaving(true);
        try {
          await onSave(vals);
        } finally {
          setSaving(false);
        }
      })
      .catch(() => {
        message.error("Please fix the highlighted fields");
      });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="py-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-title uppercase text-ink">Add Employee</h1>
        </div>
      </div>

      <Card className="!rounded-2xl !shadow !border-0">
        <Form<FormValues>
          id="employee-add-form"
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          requiredMark={false}
          initialValues={{ contactNo: [""] }}
        >
          {/* ======================= Account ======================= */}
          <div className="sm:col-span-2">
            <h2 className="text-base font-semibold text-gray-900">Account</h2>
            <Divider className="!my-3" />
          </div>

          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: "Please enter a username" },
                  { min: 3, message: "Username must be at least 3 characters" },
                ]}
              >
                <Input placeholder="e.g., jdoe" autoComplete="username" />
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
                      // at least 1 letter, 1 number, 1 special, no spaces
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
                  placeholder="Enter password"
                  autoComplete="new-password"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* =================== Personal Information =================== */}
          <div className="sm:col-span-2 mt-2">
            <h2 className="text-base font-semibold text-gray-900">
              Personal Information
            </h2>
            <Divider className="!my-3" />
          </div>

          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="firstName"
                label="First Name"
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
                      return s
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error("First name cannot be only spaces")
                          );
                    },
                  },
                ]}
              >
                <Input placeholder="First name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
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
                      return s
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error("Last name cannot be only spaces")
                          );
                    },
                  },
                ]}
              >
                <Input placeholder="Last name" />
              </Form.Item>
            </Col>

            {/* Email (UI only) */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
                getValueFromEvent={(e: any) => {
                  if (e && typeof e === "object" && "target" in e) {
                    return (e.target?.value ?? "").trim();
                  }
                  if (typeof e === "string") return e.trim();
                  return "";
                }}
                rules={[
                  { required: false },
                  {
                    validator: async (_, v?: string) => {
                      const s = (v ?? "").trim();
                      if (!s) return;
                      if (!validateEmail(s))
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
                name="birthday"
                label="Birthday"
                tooltip="Pick a date (Toronto time); future dates are disabled"
                getValueFromEvent={(d: Dayjs | null) => pickToIso(d)}
                getValueProps={(v?: string) => ({ value: isoToPick(v) })}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format={DATE_FMT}
                  disabledDate={disableFutureDates}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="joiningDate"
                label="Joining Date"
                tooltip="Pick a date (Toronto time); can be in the future"
                getValueFromEvent={(d: Dayjs | null) => pickToIso(d)}
                getValueProps={(v?: string) => ({ value: isoToPick(v) })}
                rules={[
                  {
                    validator: async (_, v?: string) => {
                      if (!v) return;
                      const b: string | undefined =
                        form.getFieldValue("birthday");
                      if (b) {
                        const jd = toToronto(v).startOf("day");
                        const bd = toToronto(b).startOf("day");
                        if (jd.isBefore(bd)) {
                          throw new Error(
                            "Joining date cannot be before birthday"
                          );
                        }
                      }
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format={DATE_FMT}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ======================= Contacts ======================= */}
          <div className="sm:col-span-2 mt-2">
            <h2 className="text-base font-semibold text-gray-900">Contacts</h2>
            <Divider className="!my-3" />
          </div>

          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.List
                name="contactNo"
                rules={[
                  {
                    validator: async (_, value) => {
                      const arr: string[] = Array.isArray(value) ? value : [];
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
                    <Tooltip title="The first valid number will be set as primary.">
                      <InfoCircleOutlined className="text-gray-500" />
                    </Tooltip>
                  </div>
                )}
              </Form.List>
            </Col>
          </Row>
        </Form>

        <div className="mt-6 flex items-center justify-end gap-2">
          <OutlineSweepButton onClick={() => navigate(-1)}>
            Cancel
          </OutlineSweepButton>
          <Button
            type="primary"
            htmlType="submit"
            form="employee-add-form"
            icon={<SaveOutlined />}
            loading={saving}
          >
            {saving ? "Saving..." : "Save Employee"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
