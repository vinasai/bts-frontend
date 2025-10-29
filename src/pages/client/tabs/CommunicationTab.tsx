import { useMemo, useState } from "react";
import { Card, Select } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import type { CommChannel, CommunicationItem } from "../types";

/* Mock data (replace with API) */
const MOCK_ITEMS: CommunicationItem[] = [
  {
    id: "c1",
    date: "2025-09-15",
    title: "Receive Documents from Client",
    channel: "Email",
    by: "Alex Chen",
  },
  {
    id: "c2",
    date: "2025-09-08",
    title: "Phone call/Mail Client",
    channel: "Phone Call",
    note: "Reminder to settle Tax",
  },
  {
    id: "c3",
    date: "2025-08-02",
    title: "E-signature Document Requirement",
    channel: "Mail",
    by: "Alex Chen",
  },
];

type Props = {
  items?: CommunicationItem[];
  loading?: boolean;
  onLogNew?: () => void; // open modal/route to log interaction
};

export default function CommunicationTab({
  items = MOCK_ITEMS,
  loading = false,
  onLogNew,
}: Props) {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<"All" | CommChannel>("All");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (
      items
        .filter((i) => (channel === "All" ? true : i.channel === channel))
        .filter((i) =>
          !q
            ? true
            : [i.title, i.channel, i.note, i.by]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q)
        )
        // newest first
        .sort((a, b) => b.date.localeCompare(a.date))
    );
  }, [items, query, channel]);

  return (
    <div className="space-y-4">
      {/* Title + CTA */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Communication History
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="!bg-[#FF6236] hover:!bg-[#ff764f]"
          onClick={onLogNew}
        >
          Log New Interaction
        </Button>
      </div>

      {/* Search + filter (kept minimal; matches other tabs layout) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full max-w-md">
          <Input
            placeholder="Search interactions"
            prefix={<SearchOutlined />}
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto sm:ml-auto flex gap-2 sm:items-center">
          <Select
            value={channel}
            onChange={setChannel}
            className="min-w-[180px]"
            options={[
              { value: "All", label: "Channel" },
              { value: "Email", label: "Email" },
              { value: "Phone Call", label: "Phone Call" },
              { value: "Mail", label: "Mail" },
              { value: "Meeting", label: "Meeting" },
            ]}
          />
        </div>
      </div>

      {/* List / timeline */}
      <Card className="!rounded-2xl !shadow !border-0">
        <div className="divide-y">
          {visible.map((it, idx) => (
            <div key={it.id} className="py-4">
              <div className="flex gap-4">
                {/* Icon column with subtle timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100">
                    {it.channel === "Email" && (
                      <MailOutlined className="text-gray-600" />
                    )}
                    {it.channel === "Phone Call" && (
                      <PhoneOutlined className="text-gray-600" />
                    )}
                    {it.channel === "Mail" && (
                      <TeamOutlined className="text-gray-600" />
                    )}{" "}
                    {/* envelope-alt not in antd; using group icon for people/mail route */}
                    {it.channel === "Meeting" && (
                      <TeamOutlined className="text-gray-600" />
                    )}
                  </div>
                  {idx < visible.length - 1 && (
                    <div className="flex-1 border-l border-dashed border-gray-300 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">{it.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(it.date).toISOString().slice(0, 10)}{" "}
                    <span className="mx-2">|</span>
                    {it.channel}
                    {it.note ? (
                      <>
                        <span className="mx-2">|</span>
                        <span className="text-primary">{it.note}</span>
                      </>
                    ) : null}
                    {it.by ? (
                      <>
                        <span className="mx-2">|</span>
                        <span>By {it.by}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!loading && visible.length === 0 && (
            <div className="py-10 text-center text-gray-500">
              No interactions yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
