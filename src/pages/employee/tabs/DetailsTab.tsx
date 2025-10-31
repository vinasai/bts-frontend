// src/pages/Employees/tabs/DetailsTab.tsx
import { useEffect, useMemo } from "react";
import { App, Divider, Form, Tag, Tooltip, DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import Input, {
  EmailInput,
  PhoneInputCanada,
  validateEmail,
  validateCanadianPhone,
} from "../../../components/Input";
import type { StaffProfile } from "../types";
import {
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Button from "../../../components/Button";

type Props = {
  emp: StaffProfile;
  edit: boolean;
  saving?: boolean;
  onSubmit: (values: Partial<StaffProfile>) => void;
  onResetPassword: () => void;
  onOpenChangeRole: () => void;
};

function ViewField({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-medium text-gray-900 truncate">
        {value ?? <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
}

const DATE_FMT = "YYYY-MM-DD";
const pickToIso = (d: Dayjs | null) => (d ? d.format(DATE_FMT) : undefined);
const isoToPick = (v?: string | null) => (v ? dayjs(v, DATE_FMT) : null);

export default function DetailsTab({
  emp,
  edit,
  saving = false,
  onSubmit,
  onResetPassword,
  onOpenChangeRole,
}: Props) {
  const [form] = Form.useForm<Partial<StaffProfile>>();
  const { message } = App.useApp();

  // Initialize / sync form values from emp
  useEffect(() => {
    const initial = {
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email ?? "",
      birthday: emp.birthday ?? undefined,
      joiningDate: emp.joiningDate ?? undefined,
      contactNumbers: emp.contactNumbers ?? [],
      primaryContact: emp.primaryContact ?? undefined,
    };
    if (edit) {
      form.setFieldsValue(initial);
    } else {
      form.resetFields();
      form.setFieldsValue(initial);
    }
  }, [emp, edit, form]);

  function normalizeContacts(arr: string[] | undefined) {
    return Array.from(
      new Set((arr ?? []).map((v) => (v ?? "").trim()).filter(Boolean))
    );
  }

  function handleSubmit() {
    form
      .validateFields()
      .then((vals) => {
        const nums = normalizeContacts(
          vals.contactNumbers as string[] | undefined
        );
        const firstValid = nums.find((n) => validateCanadianPhone(n));
        const next: Partial<StaffProfile> = {
          firstName: vals.firstName,
          lastName: vals.lastName,
          email: vals.email,
          birthday: vals.birthday || null,
          joiningDate: vals.joiningDate || null,
          contactNumbers: nums,
          primaryContact: vals.primaryContact || firstValid || null,
        };
        onSubmit(next);
      })
      .catch(() => message.error("Please fix the highlighted fields"));
  }

  return (
    <div className="space-y-8">
      {/* Account (always read-only) */}
      <section>
        <h2 className="text-base font-semibold text-gray-900">Account</h2>
        <Divider className="!my-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ViewField label="Employee ID" value={emp.employeeId} />
          <ViewField label="Username" value={emp.username || "—"} />
          <ViewField
            label="Login Access"
            value={
              <Tag color={emp.isLogin ? "green" : "red"} className="!m-0">
                {emp.isLogin ? "ACTIVE" : "INACTIVE"}
              </Tag>
            }
          />
          <ViewField label="Created By" value={emp.createdByName || "—"} />
          <ViewField label="Updated By" value={emp.updatedByName || "—"} />
          <ViewField label="Role" value={emp.role || "—"} />
        </div>
      </section>

      {/* Personal & Employment (mixed: view vs input) */}
      <section>
        <h2 className="text-base font-semibold text-gray-900">
          Personal & Employment
        </h2>
        <Divider className="!my-3" />

        <Form
          id="employee-details-form"
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3"
          disabled={saving}
        >
          {/* First Name */}
          <div>
            {!edit ? (
              <ViewField label="First Name" value={emp.firstName} />
            ) : (
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input placeholder="First name" disabled={saving} />
              </Form.Item>
            )}
          </div>

          {/* Last Name */}
          <div>
            {!edit ? (
              <ViewField label="Last Name" value={emp.lastName} />
            ) : (
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input placeholder="Last name" disabled={saving} />
              </Form.Item>
            )}
          </div>

          {/* Email */}
          <div>
            {!edit ? (
              <ViewField
                label="Email"
                value={
                  emp.email ? (
                    <a
                      href={`mailto:${emp.email}`}
                      className="text-primary hover:underline"
                    >
                      {emp.email}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            ) : (
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter email" },
                  {
                    validator: (_, v) =>
                      !v || validateEmail(v)
                        ? Promise.resolve()
                        : Promise.reject(new Error("Enter a valid email")),
                  },
                ]}
              >
                <EmailInput placeholder="name@example.com" disabled={saving} />
              </Form.Item>
            )}
          </div>

          {/* Birthday */}
          <div>
            {!edit ? (
              <ViewField label="Birthday" value={emp.birthday || "—"} />
            ) : (
              <Form.Item
                name="birthday"
                label="Birthday"
                getValueFromEvent={(d: Dayjs | null) => pickToIso(d)}
                getValueProps={(v?: string) => ({ value: isoToPick(v) })}
                rules={[
                  { required: true, message: "Please select a birthday" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  allowClear
                  disabled={saving}
                />
              </Form.Item>
            )}
          </div>

          {/* Joining Date */}
          <div>
            {!edit ? (
              <ViewField label="Joining Date" value={emp.joiningDate || "—"} />
            ) : (
              <Form.Item
                name="joiningDate"
                label="Joining Date"
                getValueFromEvent={(d: Dayjs | null) => pickToIso(d)}
                getValueProps={(v?: string) => ({ value: isoToPick(v) })}
                rules={[
                  { required: true, message: "Please select a joining date" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  allowClear
                  disabled={saving}
                />
                {/* NEW */}
              </Form.Item>
            )}
          </div>

          {/* Primary Contact (view only label; editing happens in list below) */}
          <ViewField
            label="Primary Contact"
            value={
              emp.primaryContact ? (
                <a href={`tel:${emp.primaryContact}`}>{emp.primaryContact}</a>
              ) : (
                "—"
              )
            }
          />

          {/* Contact numbers list (full-width row) */}
          <div className="sm:col-span-1 md:col-span-1">
            {!edit ? (
              <>
                <div className="text-xs text-gray-500 mb-1">Contact No</div>
                <div className="space-y-1">
                  {(emp.contactNumbers ?? []).length ? (
                    emp.contactNumbers.map((n, i) => (
                      <div key={i}>
                        <a href={`tel:${n}`}>{n}</a>
                        {emp.primaryContact === n && (
                          <Tag className="ml-2" color="blue">
                            PRIMARY
                          </Tag>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </>
            ) : (
              <Form.Item label="Contact No" required className="!mb-0">
                <Form.List
                  name="contactNumbers"
                  rules={[
                    {
                      validator: async (_, value) => {
                        const arr: string[] = Array.isArray(value) ? value : [];
                        if (!arr.some((v) => v && validateCanadianPhone(v))) {
                          throw new Error(
                            "Enter at least one valid phone number"
                          );
                        }
                      },
                    },
                    {
                      validator: async (_, value) => {
                        const arr: string[] = (
                          Array.isArray(value) ? value : []
                        )
                          .map((v) => (v ?? "").replace(/\D/g, ""))
                          .filter(Boolean);
                        if (new Set(arr).size !== arr.length) {
                          throw new Error(
                            "Duplicate phone numbers are not allowed"
                          );
                        }
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      {fields.map((field, idx) => (
                        <div
                          key={field.key}
                          className="flex gap-2 mb-2 items-center"
                        >
                          <Form.Item
                            {...field}
                            noStyle
                            validateTrigger={["onBlur", "onSubmit"]}
                            rules={[
                              {
                                validator: async (_, value: string) => {
                                  const s = (value ?? "").trim();
                                  if (fields.length === 1) {
                                    if (!validateCanadianPhone(s)) {
                                      throw new Error(
                                        "Enter a valid phone number"
                                      );
                                    }
                                    return;
                                  }
                                  if (!s) return;
                                  if (!validateCanadianPhone(s)) {
                                    throw new Error(
                                      "Enter a valid phone number"
                                    );
                                  }
                                },
                              },
                            ]}
                          >
                            <PhoneInputCanada
                              className="flex-1"
                              placeholder={
                                idx === 0 ? "(###) ###-####" : "Add another..."
                              }
                              disabled={saving}
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
                              disabled={saving}
                            />
                          )}
                        </div>
                      ))}

                      <div className="flex justify-between items-center mt-1">
                        <Tooltip title="The first valid number will be set as primary.">
                          <InfoCircleOutlined className="text-gray-500" />
                        </Tooltip>

                        <Button
                          type="primary"
                          size="small"
                          aria-label="Add contact"
                          icon={<PlusOutlined style={{ color: "#fff" }} />}
                          onClick={() => add("")}
                          disabled={saving}
                        />
                      </div>

                      <Form.ErrorList errors={errors} />
                    </>
                  )}
                </Form.List>
              </Form.Item>
            )}
          </div>

          {/* Hidden field to support primaryContact if you later add a selector */}
          <Form.Item name="primaryContact" hidden>
            <input />
          </Form.Item>
        </Form>
      </section>

      {/* Account Management (unchanged, always visible) */}
      <section>
        <h2 className="text-base font-semibold text-gray-900">
          Account Management
        </h2>
        <Divider className="!my-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Change Role</div>
              <div className="text-xs text-gray-500">
                Update the employee’s role and permissions
              </div>
            </div>
            <button className="btn btn-default" onClick={onOpenChangeRole}>
              Change
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Reset Password</div>
              <div className="text-xs text-gray-500">
                Send password reset instructions to their email
              </div>
            </div>
            <button className="btn btn-danger" onClick={onResetPassword}>
              Reset
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
