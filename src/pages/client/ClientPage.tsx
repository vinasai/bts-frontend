import { useEffect, useMemo, useState } from "react";
import { App, Avatar, Card, Tabs, Tag } from "antd";
import axiosInstance from "../../utils/axiosInstance";
import OverviewTab from "./tabs/OverviewTab";
import CompaniesTab from "./tabs/CompaniesTab";
import DocumentsTab from "./tabs/DocumentsTab";
import InvoicesTab from "./tabs/InvoicesTab";
import CommunicationTab from "./tabs/CommunicationTab";
import type { Client, NextDue, PaymentRecord } from "./types";

/* Mock */
const MOCK_MODE = true;

function makeMockClient(): Client {
  return {
    id: "client_123",
    clientCode: "12345",
    firstName: "Ethan",
    lastName: "Carter",
    email: "ethan.carter@email.com",
    phone: "(555) 123-4567",
  };
}

const MOCK_NEXT_DUE: NextDue = {
  tax: "Income Tax",
  amount: 5000,
  date: "2025-07-15",
};

const MOCK_RECORDS: PaymentRecord[] = [
  {
    id: "r1",
    date: "2025-04-15",
    description: "Income Tax",
    amount: 4500,
    status: "Paid",
  },
  {
    id: "r2",
    date: "2025-01-15",
    description: "Quarterly Tax",
    amount: 2000,
    status: "Paid",
  },
  {
    id: "r3",
    date: "2024-10-15",
    description: "Income Tax",
    amount: 5200,
    status: "Paid",
  },
];

export default function ClientPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [nextDue, setNextDue] = useState<NextDue | null>(null);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [activeKey, setActiveKey] = useState("overview");

  const fullName = useMemo(
    () => [client?.firstName, client?.lastName].filter(Boolean).join(" "),
    [client]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (MOCK_MODE) {
          await new Promise((r) => setTimeout(r, 300));
          setClient(makeMockClient());
          setNextDue(MOCK_NEXT_DUE);
          setRecords(MOCK_RECORDS);
        } else {
          const { data } = await axiosInstance.get("/clients/123"); // replace with real id
          setClient(data.client);
          setNextDue(data.nextDue);
          setRecords(data.records);
        }
      } catch (e: any) {
        message.error(e?.response?.data?.message || "Failed to load client");
      } finally {
        setLoading(false);
      }
    })();
  }, [message]);

  async function saveClient(values: Partial<Client>) {
    const payload: Client = { ...(client as Client), ...values };
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 300));
      setClient(payload);
      message.success("Client updated");
    } else {
      await axiosInstance.put(`/clients/${client!.id}`, payload);
      setClient(payload);
      message.success("Client updated");
    }
  }

  if (loading || !client) {
    return (
      <div className="space-y-4">
        <Card className="!rounded-2xl !shadow !border-0 p-6">Loading…</Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simple Header (no edit button here) */}
      <div className="py-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar size={64} src={client.avatarUrl}>
            {client.firstName?.[0]}
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-title uppercase text-ink truncate">
                {fullName || "Client"}
              </h1>
              <Tag color="blue" className="!m-0">
                CLIENT
              </Tag>
            </div>
            <div className="text-gray-500 text-sm">
              <div>Client ID: {client.clientCode}</div>
              <div>
                Phone: {client.phone || "—"} • Email: {client.email || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="!rounded-2xl !shadow !border-0">
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          destroyOnHidden
          items={[
            {
              key: "overview",
              label: "Overview",
              children: (
                <OverviewTab
                  client={client}
                  onSubmit={saveClient}
                  nextDue={nextDue}
                  records={records}
                />
              ),
            },
            {
              key: "companies",
              label: "Companies",
              children: <CompaniesTab />,
            },
            {
              key: "documents",
              label: "Documents",
              children: <DocumentsTab />,
            },
            {
              key: "invoices",
              label: "Invoices",
              children: <InvoicesTab />,
            },
            {
              key: "communication",
              label: "Communication",
              children: <CommunicationTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
