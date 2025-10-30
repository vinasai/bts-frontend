import { useEffect, useMemo, useState } from "react";
import { Card, Divider, Form, Select, Table, Tag } from "antd";
import Input, {
  EmailInput,
  PhoneInputCanada,
  validateEmail,
  validateCanadianPhone,
} from "../../../components/Input";
import Button from "../../../components/Button";
import type { Client, NextDue, PaymentRecord, PayStatus } from "../types";
import { EditOutlined } from "@ant-design/icons";

type Props = {
  client: Client;
  onSubmit: (values: Partial<Client>) => void;
  nextDue: NextDue | null;
  records: PaymentRecord[];
};

const statusTagColor: Record<PayStatus, string> = {
  Paid: "green",
  "Not Paid": "red",
};

export default function OverviewTab({
  client,
  onSubmit,
  nextDue,
  records,
}: Props) {
  const [form] = Form.useForm<Client>();
  const [editing, setEditing] = useState(false);

  // filters + pagination
  const [taxFilter, setTaxFilter] = useState<string | "All">("All");
  const [statusFilter, setStatusFilter] = useState<PayStatus | "All">("All");
  const [sortByDate, setSortByDate] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    form.setFieldsValue(client);
  }, [client, form]);

  const fullName = useMemo(
    () => [client?.firstName, client?.lastName].filter(Boolean).join(" "),
    [client]
  );

  const filtered = useMemo(() => {
    let data = [...records];
    if (taxFilter !== "All")
      data = data.filter((r) => r.description === taxFilter);
    if (statusFilter !== "All")
      data = data.filter((r) => r.status === statusFilter);
    data.sort((a, b) =>
      sortByDate === "desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date)
    );
    return data;
  }, [records, taxFilter, statusFilter, sortByDate]);

  useEffect(() => {
    const max = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > max) setPage(1);
  }, [filtered, page, pageSize]);

  function save() {
    form.validateFields().then((v) => {
      onSubmit(v);
      setEditing(false);
    });
  }

  function cancel() {
    form.resetFields();
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* CLIENT DETAILS (view with inline edit) */}
      <Card className="!rounded-2xl !shadow !border-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Client Details
          </h2>
          {!editing ? (
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={cancel}>Cancel</Button>
              <Button type="primary" onClick={save}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
        <Divider className="!my-3" />

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Detail label="Full Name" value={fullName || "—"} />
            <Detail label="Client ID" value={client.clientCode || "—"} />
            <Detail
              label="Phone"
              value={
                client.phone ? (
                  <a
                    className="text-primary hover:underline"
                    href={`tel:${client.phone}`}
                  >
                    {client.phone}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Detail
              label="Email"
              value={
                client.email ? (
                  <a
                    className="text-primary hover:underline"
                    href={`mailto:${client.email}`}
                  >
                    {client.email}
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </div>
        ) : (
          <Form
            id="client-details-form"
            layout="vertical"
            form={form}
            initialValues={client}
            className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
          >
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: "Please enter first name" }]}
            >
              <Input placeholder="Ethan" />
            </Form.Item>

            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: "Please enter last name" }]}
            >
              <Input placeholder="Carter" />
            </Form.Item>

            <Form.Item
              name="clientCode"
              label="Client ID"
              rules={[{ required: true, message: "Please enter client ID" }]}
            >
              <Input placeholder="12345" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                {
                  validator: (_, v) =>
                    !v || validateEmail(v)
                      ? Promise.resolve()
                      : Promise.reject(new Error("Enter a valid email")),
                },
              ]}
            >
              <EmailInput placeholder="ethan.carter@email.com" />
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
          </Form>
        )}
      </Card>

      {/* NEXT PAYMENT DUE */}
      <Card className="!rounded-2xl !shadow !border-0">
        <h2 className="text-base font-semibold text-gray-900">
          Next Payment Due
        </h2>
        <Divider className="!my-3" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left py-2 pr-6">Tax Due</th>
                <th className="text-left py-2 pr-6">Amount</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {nextDue ? (
                <tr className="border-t">
                  <td className="py-3 pr-6">{nextDue.tax}</td>
                  <td className="py-3 pr-6">
                    ${nextDue.amount.toLocaleString()}
                  </td>
                  <td className="py-3">
                    {new Date(nextDue.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ) : (
                <tr className="border-t">
                  <td className="py-3 pr-6" colSpan={3}>
                    No upcoming dues.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PAST PAYMENT RECORDS */}
      <Card className="!rounded-2xl !shadow !border-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Past Payment Records
          </h2>
          <div className="flex gap-2">
            <Select
              value={sortByDate}
              onChange={setSortByDate}
              options={[
                { value: "desc", label: "Sort by Date ↓" },
                { value: "asc", label: "Sort by Date ↑" },
              ]}
              style={{ width: 160 }}
            />
            <Select
              value={taxFilter}
              onChange={setTaxFilter}
              options={[
                { value: "All", label: "Tax: All" },
                ...Array.from(new Set(records.map((r) => r.description))).map(
                  (v) => ({
                    value: v,
                    label: `Tax: ${v}`,
                  })
                ),
              ]}
              style={{ width: 160 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "All", label: "Payment Status: All" },
                { value: "Paid", label: "Payment Status: Paid" },
                { value: "Not Paid", label: "Payment Status: Not Paid" },
              ]}
              style={{ width: 210 }}
            />
          </div>
        </div>

        <Divider className="!my-3" />

        <Table<PaymentRecord>
          rowKey="id"
          size="middle"
          className="rounded-xl"
          dataSource={filtered}
          columns={[
            {
              title: "Date",
              dataIndex: "date",
              width: 160,
              render: (d: string) =>
                new Date(d).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              sorter: (a, b) => a.date.localeCompare(b.date),
            },
            {
              title: "Tax Description",
              dataIndex: "description",
              width: 220,
              render: (v: string) => <span className="text-primary">{v}</span>,
              sorter: (a, b) => a.description.localeCompare(b.description),
            },
            {
              title: "Amount",
              dataIndex: "amount",
              width: 140,
              render: (n: number) => `$${n.toLocaleString()}`,
              sorter: (a, b) => a.amount - b.amount,
              align: "right" as const,
            },
            {
              title: "Paid/Not Paid",
              dataIndex: "status",
              width: 140,
              render: (s: PayStatus) => (
                <Tag color={statusTagColor[s]} style={{ marginInlineEnd: 0 }}>
                  {s.toUpperCase()}
                </Tag>
              ),
              filters: [
                { text: "Paid", value: "Paid" },
                { text: "Not Paid", value: "Not Paid" },
              ],
              onFilter: (value, r) => r.status === value,
            },
          ]}
          scroll={{ x: "max-content" }}
          pagination={{
            current: page,
            pageSize,
            total: filtered.length,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20, 50],
            showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}`,
            position: ["bottomRight"],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-medium text-gray-900 truncate">
        {value ?? <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
}
