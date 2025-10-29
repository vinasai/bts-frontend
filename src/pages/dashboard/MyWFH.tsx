// src/pages/dashboard/MyWFH.tsx
import { useEffect, useState, useMemo, useRef } from "react";
import { Card, Table, Form, DatePicker, App, Tooltip, Tag } from "antd";
import type { TableProps } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import axiosInstance from "../../utils/axiosInstance";

import PageHeader from "../../components/PageHeader";
import Input, { TextArea } from "../../components/Input";
import Button from "../../components/Button";
import OutlineSweepButton from "../../components/OutlineSweepButton";
import CommonModal from "../../components/Modal/CommonModal";

type WFHStatus = "pending" | "approved" | "rejected";

type WFHRow = {
  id: string;
  request_date: string; // ISO in America/Toronto
  reason?: string;
  status: WFHStatus;
  time_in?: string | null; // ISO in America/Toronto
  time_out?: string | null; // ISO in America/Toronto
  created_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
};

type RequestForm = {
  request_date?: Dayjs;
  reason?: string;
};

// ---- RAW helpers (no timezone conversion) ----
const rawDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : "-"); // "YYYY-MM-DD"
const rawTime = (iso?: string | null) =>
  iso && iso.length >= 16 ? iso.slice(11, 16) : "-"; // "HH:mm"
const rawDateTime = (iso?: string | null) =>
  iso ? `${rawDate(iso)} ${rawTime(iso)}`.trim() : "-";

export default function MyWFH() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<WFHRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<RequestForm>();

  // search + paging
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const topRef = useRef<HTMLDivElement | null>(null);

  const fetchMyWFH = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/wfh/me");
      setRows(res.data);
    } catch (err: any) {
      message.error(
        err?.response?.data?.error || "Failed to load WFH requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWFH();
  }, []);

  const submitRequest = async (values: RequestForm) => {
    if (!values.request_date) {
      message.error("Select a date");
      return;
    }

    try {
      await axiosInstance.post("/wfh/request", {
        request_date: values.request_date.format("YYYY-MM-DD"),
        reason: values.reason,
      });
      message.success("WFH request submitted");
      setOpen(false);
      form.resetFields();
      fetchMyWFH();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to request WFH");
    }
  };

  const checkIn = async () => {
    try {
      const res = await axiosInstance.post("/wfh/check-in");
      message.success(`Checked in at ${rawTime(res.data.time_in)}`);
      fetchMyWFH();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Check-in failed");
    }
  };

  const checkOut = async () => {
    try {
      const res = await axiosInstance.post("/wfh/check-out");
      message.success(`Checked out at ${rawTime(res.data.time_out)}`);
      fetchMyWFH();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Check-out failed");
    }
  };

  // search/filter
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        rawDate(r.request_date),
        r.reason || "",
        r.status,
        rawTime(r.time_in),
        rawTime(r.time_out),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  // table columns (sortable)
  const columns: TableProps<WFHRow>["columns"] = [
    {
      title: "DATE",
      dataIndex: "request_date",
      width: 160,
      render: (v: string) => <span className="font-medium">{rawDate(v)}</span>,
      sorter: (a, b) =>
        rawDate(a.request_date).localeCompare(rawDate(b.request_date)),
      defaultSortOrder: "descend",
    },
    {
      title: "REASON",
      dataIndex: "reason",
      width: 320,
      ellipsis: true,
      render: (v?: string) => v || "-",
      sorter: (a, b) => (a.reason || "").localeCompare(b.reason || ""),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 140,
      render: (_: WFHStatus, r) => {
        const color =
          r.status === "approved"
            ? "green"
            : r.status === "rejected"
              ? "red"
              : "orange";
        const tip =
          r.status === "approved"
            ? `Approved at ${rawDateTime(r.approved_at)}`
            : r.status === "rejected"
              ? `Rejected at ${rawDateTime(r.rejected_at)}`
              : `Requested at ${rawDateTime(r.created_at)}`;
        return (
          <Tooltip title={tip}>
            <Tag color={color} style={{ marginInlineEnd: 0 }}>
              {r.status.toUpperCase()}
            </Tag>
          </Tooltip>
        );
      },
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "TIME IN",
      dataIndex: "time_in",
      width: 120,
      render: (v?: string | null) => rawTime(v),
      sorter: (a, b) => {
        const av = a.time_in ? rawTime(a.time_in).replace(":", "") : "9999";
        const bv = b.time_in ? rawTime(b.time_in).replace(":", "") : "9999";
        return Number(av) - Number(bv);
      },
    },
    {
      title: "TIME OUT",
      dataIndex: "time_out",
      width: 120,
      render: (v?: string | null) => rawTime(v),
      sorter: (a, b) => {
        const av = a.time_out ? rawTime(a.time_out).replace(":", "") : "9999";
        const bv = b.time_out ? rawTime(b.time_out).replace(":", "") : "9999";
        return Number(av) - Number(bv);
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="py-4">
        <PageHeader title="WFH Requests" />
      </div>
      <div ref={topRef} />
      <Card className="!rounded-2xl !shadow !border-0">
        {/* top bar: search + actions */}
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search by date, reason, status, time…"
              prefix={<SearchOutlined />}
              allowClear
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <OutlineSweepButton onClick={checkIn} className="!w-auto">
              Check In
            </OutlineSweepButton>
            <OutlineSweepButton onClick={checkOut} className="!w-auto">
              Check Out
            </OutlineSweepButton>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
            >
              Request WFH
            </Button>
          </div>
        </div>

        <Table<WFHRow>
          rowKey="id"
          columns={columns}
          dataSource={visibleRows}
          loading={loading}
          size="middle"
          className="rounded-xl"
          scroll={{ x: "max-content" }}
          pagination={{
            current: page,
            pageSize,
            total: visibleRows.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
              topRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            position: ["bottomRight"],
          }}
        />
      </Card>

      <CommonModal
        open={open}
        onClose={() => setOpen(false)}
        title="Request WFH"
        actions={{
          items: [
            {
              label: "Submit",
              variant: "primary",
              onClick: () => form.submit(), // trigger form submit
            },
          ],
        }}
      >
        <div className="pb-4">
          <Form form={form} layout="vertical" onFinish={submitRequest}>
            <Form.Item
              name="request_date"
              label="Date"
              rules={[{ required: true, message: "Select a date" }]}
            >
              <DatePicker className="!w-full" />
            </Form.Item>

            <Form.Item name="reason" label="Reason">
              <TextArea
                placeholder="Enter reason..."
                allowNewlines
                rows={3}
                maxLength={300}
              />
            </Form.Item>
          </Form>
        </div>
      </CommonModal>
    </div>
  );
}
