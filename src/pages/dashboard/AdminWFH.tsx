// src/pages/dashboard/AdminWFH.tsx
import { useEffect, useState, useMemo, useRef } from "react";
import { Card, Table, App, Tooltip, Tag, DatePicker,Button as AntdButton } from "antd";
import { CheckOutlined, CloseOutlined, SearchOutlined, InfoCircleOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import axiosInstance from "../../utils/axiosInstance";
import dayjs from "dayjs";
import { FileTextOutlined } from '@ant-design/icons';
import ReportModal from "../../components/reports/ReportModal";

import PageHeader from "../../components/PageHeader";
import Input from "../../components/Input";
import Button from "../../components/Button";
import OutlineSweepButton from "../../components/OutlineSweepButton";

type WFHRow = {
  approved_by_name?: string;
  rejected_by_name?: string;
  id: string;
  first_name: string;
  last_name: string;
  request_date: string; // Toronto ISO or "YYYY-MM-DD" (from backend)
  reason?: string;
  status: "pending" | "approved" | "rejected";
  dateStatus: "past" | "today" | "future";
  created_at?: string | null;    // Toronto ISO
  approved_at?: string | null;   // Toronto ISO
  rejected_at?: string | null;   // Toronto ISO
  time_in?: string | null;       // Toronto ISO
  time_out?: string | null;      // Toronto ISO
};

export default function AdminWFH() {
  const { message } = App.useApp();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [rows, setRows] = useState<WFHRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // month/day filter state
  const [filterType, setFilterType] = useState<"day" | "month">("month");
  const [filterValue, setFilterValue] = useState<dayjs.Dayjs | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/wfh");
      setRows(res.data);
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  /* ---------------- display helpers (NO timezone conversion) ---------------- */
  const rawDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : "-");                   // YYYY-MM-DD
  const rawTime = (iso?: string | null) => (iso && iso.length >= 16 ? iso.slice(11, 16) : "-"); // HH:mm
  const rawDateTime = (iso?: string | null) =>
    iso ? `${rawDate(iso)} ${rawTime(iso)}`.trim() : "-";

  /* --------------- filter + search pipeline --------------- */
  const visibleRows = useMemo(() => {
    let data = rows;

    // month/day filter like AttendanceList (using request_date for range)
    if (filterValue) {
      data = data.filter((r) =>
        filterType === "month"
          ? dayjs(r.request_date).isSame(filterValue, "month")
          : dayjs(r.request_date).isSame(filterValue, "day")
      );
    }

    // keyword search (use raw slices to avoid TZ shifts)
    const q = query.trim().toLowerCase();
    if (q) {
      data = data.filter((r) =>
        [
          r.first_name,
          r.last_name,
          r.reason || "",
          r.status,
          rawDate(r.request_date),
          rawTime(r.time_in || undefined),
          rawTime(r.time_out || undefined),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return data;
  }, [rows, query, filterType, filterValue]);

  /* ----------------------- table ----------------------- */
  const columns: TableProps<WFHRow>["columns"] = [
    {
      title: "DATE",
      dataIndex: "request_date",
      width: 140,
      render: (v: string) => rawDate(v),
      // sort by the date substring "YYYY-MM-DD"
      sorter: (a, b) => rawDate(a.request_date).localeCompare(rawDate(b.request_date)),
      defaultSortOrder: "descend",
    },
    {
      title: "STAFF",
      dataIndex: "first_name",
      width: 220,
      render: (_: any, r) => (
        <span className="font-medium">{`${r.first_name} ${r.last_name}`}</span>
      ),
      sorter: (a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`
        ),
    },
    {
      title: "TIME IN",
      dataIndex: "time_in",
      width: 110,
      render: (v: string | null) => rawTime(v || undefined),
      sorter: (a, b) => {
        const av = a.time_in ? rawTime(a.time_in).replace(":", "") : "9999";
        const bv = b.time_in ? rawTime(b.time_in).replace(":", "") : "9999";
        return Number(av) - Number(bv);
      },
    },
    {
      title: "TIME OUT",
      dataIndex: "time_out",
      width: 110,
      render: (v: string | null) => rawTime(v || undefined),
      sorter: (a, b) => {
        const av = a.time_out ? rawTime(a.time_out).replace(":", "") : "9999";
        const bv = b.time_out ? rawTime(b.time_out).replace(":", "") : "9999";
        return Number(av) - Number(bv);
      },
    },
    {
      title: "REASON",
      dataIndex: "reason",
      ellipsis: true,
      width: 280,
      render: (v: string | undefined) => v || "-",
    },
   {
  title: "STATUS",
  dataIndex: "status",
  width: 180,
  render: (s: WFHRow["status"], r) => {
    const color =
      s === "approved" ? "green" : s === "rejected" ? "red" : "orange";

    // Tooltip text
    let tipContent = "";
    if (s === "approved") {
      tipContent = `Approved by ${r.approved_by_name || "Unknown"} on ${rawDateTime(r.approved_at)}`;
    } else if (s === "rejected") {
      tipContent = `Rejected by ${r.rejected_by_name || "Unknown"} on ${rawDateTime(r.rejected_at)}`;
    } else {
      tipContent = `Requested at ${rawDateTime(r.created_at)}`;
    }

    return (
      <div className="flex items-center gap-2">
        <Tooltip title={tipContent}>
          <Tag color={color} style={{ marginInlineEnd: 0 }}>
            {s.toUpperCase()}
          </Tag>
        </Tooltip>
        {(s === "approved" || s === "rejected") && (
          <Tooltip title={tipContent}>
            <InfoCircleOutlined style={{ color: "#555" }} />
          </Tooltip>
        )}
      </div>
    );
  },
  sorter: (a, b) => a.status.localeCompare(b.status),
},

    {
      title: "ACTIONS",
      key: "actions",
      width: 140,
      render: (_: any, row: WFHRow) =>
        row.status === "pending" ? (
          <div className="flex items-center gap-2">
            <Button
              icon={<CheckOutlined />}
              aria-label="Approve"
              onClick={() => handle(row, "approve")}
            />
            <OutlineSweepButton
              danger
              icon={<CloseOutlined />}
              aria-label="Reject"
              onClick={() => handle(row, "reject")}
            />
          </div>
        ) : null,
    },
  ];

  const handle = async (row: WFHRow, action: "approve" | "reject") => {
    try {
      await axiosInstance.post(`/wfh/${row.id}/handle`, { action });
      message.success(`Request ${action}d`);
      fetchRequests();
    } catch (err: any) {
      message.error(
        err?.response?.data?.error || `Failed to ${action} request`
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="py-4">
        <div className="flex justify-between items-center">
          <PageHeader title="WFH Requests" />
          <AntdButton 
            type="primary" 
            icon={<FileTextOutlined />}
            onClick={() => setReportModalOpen(true)}
          >
            Generate Report
          </AntdButton>
        </div>
      </div>
      <div ref={topRef} />
      <Card className="!rounded-2xl !shadow !border-0">
        {/* search + date/month filters */}
        <div className="mb-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="w-full max-w-xs">
            <Input
              placeholder="Search by name, reason, status…"
              prefix={<SearchOutlined />}
              allowClear
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-2 py-1"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as "day" | "month");
                setFilterValue(null);
                setPage(1);
              }}
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>

            <DatePicker
              picker={filterType === "month" ? "month" : undefined}
              placeholder={
                filterType === "month" ? "Filter by Month" : "Filter by Day"
              }
              value={filterValue as any}
              onChange={(val) => {
                setFilterValue(val);
                setPage(1);
              }}
              allowClear
            />
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
          rowClassName={(r) => {
            if (r.dateStatus === "today") return "bg-yellow-50";
            if (r.dateStatus === "future") return "bg-green-50";
            return "";
          }}
          pagination={{
            current: page,
            pageSize,
            total: visibleRows.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
              topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            position: ["bottomRight"],
          }}
        />
      </Card>
       <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="wfh"
        title="WFH Report"
      />
    </div>
  );
}
