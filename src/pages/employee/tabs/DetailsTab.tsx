import { useMemo } from "react";
import { App, Divider, Form, Tag } from "antd";
import Input, {
  EmailInput,
  PhoneInputCanada,
  NumberInput,
  TextArea,
  validateEmail,
  validateCanadianPhone,
} from "../../../components/Input";
import type { Employee, EmpStatus } from "../types";

type Props = {
  emp: Employee;
  edit: boolean;
  onSubmit: (values: Partial<Employee>) => void;
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

export default function DetailsTab({
  emp,
  edit,
  onSubmit,
  onResetPassword,
  onOpenChangeRole,
}: Props) {
  const [form] = Form.useForm<Employee>();
  const { message } = App.useApp();

  // initialize form with current emp whenever it changes
  useMemo(() => {
    form.setFieldsValue(emp);
  }, [emp, form]);

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

  function handleSubmit() {
    form
      .validateFields()
      .then(onSubmit)
      .catch(() => {
        message.error("Please fix the highlighted fields");
      });
  }

  return (
    <div
      className={[
        "relative transition-transform duration-500",
        edit ? "rotate-y-180 preserve-3d" : "preserve-3d",
      ].join(" ")}
      style={{ perspective: 1000 }}
    >
      {/* VIEW */}
      <div
        className={[
          "backface-hidden",
          edit ? "hidden" : "block",
          "space-y-8",
        ].join(" ")}
      >
        <section>
          <h2 className="text-base font-semibold text-gray-900">
            Personal Information
          </h2>
          <Divider className="!my-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ViewField label="Full Name" value={fullName} />
            <ViewField
              label="Email"
              value={
                <a
                  href={`mailto:${emp.email}`}
                  className="text-primary hover:underline"
                >
                  {emp.email}
                </a>
              }
            />
            <ViewField
              label="Phone Number"
              value={<a href={`tel:${emp.phone}`}>{emp.phone}</a>}
            />
            <ViewField label="Address" value={emp.address} />
            <ViewField label="Date of Birth" value={emp.dob} />
            <ViewField label="Gender" value={emp.gender} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-base font-semibold text-gray-900">
            Employment Details
          </h2>
          <Divider className="!my-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ViewField label="Role" value={emp.role} />
            <ViewField label="Department" value={emp.department} />
            <ViewField label="Status" value={statusTag} />
            <ViewField label="Hire Date" value={emp.hireDate} />
            <ViewField
              label="Salary"
              value={
                typeof emp.salary === "number"
                  ? `$${emp.salary.toLocaleString()}`
                  : undefined
              }
            />
            <ViewField label="Reports To" value={emp.reportsTo} />
          </div>
        </section>

        <section className="mt-10">
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

      {/* EDIT */}
      <div
        className={[
          "backface-hidden rotate-y-180",
          edit ? "block" : "hidden",
        ].join(" ")}
      >
        <Form
          id="employee-details-form"
          layout="vertical"
          form={form}
          initialValues={emp}
          onFinish={handleSubmit}
          className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <h2 className="text-base font-semibold text-gray-900">
              Personal Information
            </h2>
            <Divider className="!my-3" />
          </div>

          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: "Please enter first name" }]}
          >
            <Input placeholder="First name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: "Please enter last name" }]}
          >
            <Input placeholder="Last name" />
          </Form.Item>

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
            <EmailInput placeholder="name@example.com" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              {
                validator: (_, v) =>
                  !v || validateCanadianPhone(v)
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Enter a valid +1XXXXXXXXXX number")
                      ),
              },
            ]}
          >
            <PhoneInputCanada />
          </Form.Item>

          <Form.Item name="address" label="Address" className="sm:col-span-2">
            <TextArea allowNewlines={false} maxLength={200} />
          </Form.Item>

          <Form.Item name="dob" label="Date of Birth">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="gender" label="Gender">
            <Input placeholder="Female / Male / Other" />
          </Form.Item>

          <div className="sm:col-span-2 mt-2">
            <h2 className="text-base font-semibold text-gray-900">
              Employment Details
            </h2>
            <Divider className="!my-3" />
          </div>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please enter role" }]}
          >
            <Input placeholder="e.g., Accountant" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true, message: "Please enter department" }]}
          >
            <Input placeholder="e.g., Engineering / Finance / HR" />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Input placeholder="Active / Inactive / Probation" />
          </Form.Item>

          <Form.Item name="hireDate" label="Hire Date">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="salary" label="Salary (USD)">
            <NumberInput integerOnly min={0} />
          </Form.Item>

          <Form.Item name="reportsTo" label="Reports To">
            <Input placeholder="Manager name" />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
