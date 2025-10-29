// // src/pages/staff/AttendanceList.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { Card, Table, type TableProps, Spin, Tag, DatePicker, Button as AntdButton } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import PageHeader from "../../components/PageHeader";
import { FileTextOutlined } from '@ant-design/icons';
import Input from "../../components/Input";
import ReportModal from "../../components/reports/ReportModal";

dayjs.extend(duration);

type UnTime = {
  start: string; // Toronto ISO from backend
  end: string;   // Toronto ISO from backend
  reason: string;
};

type Attendance = {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  attendance_date: string; // "YYYY-MM-DD" (Toronto, from backend)
  time_in: string | null;  // Toronto ISO string from backend
  time_out: string | null; // Toronto ISO string from backend
  untime_sessions: UnTime[];
  is_forced_out: boolean;
};

export default function AdminAttendanceList() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState<"day" | "month">("month");
  const [filterValue, setFilterValue] = useState<dayjs.Dayjs | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/attendance");
        setRecords(res.data);
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  // ---- RAW render helpers (NO timezone conversion) ----
  const rawDate = (isoOrDate?: string | null) =>
    isoOrDate ? isoOrDate.slice(0, 10) : "-"; // "YYYY-MM-DD"

  const rawTime = (iso?: string | null) =>
    iso && iso.length >= 16 ? iso.slice(11, 16) : "-"; // "HH:mm"

  // compute worked hours (this still uses dayjs diff; that’s OK for math)
  const addComputed = (rec: Attendance) => {
    let totalMs = 0;

    if (rec.time_in && rec.time_out) {
      totalMs += dayjs(rec.time_out).diff(dayjs(rec.time_in), "millisecond");
    }

    rec.untime_sessions.forEach((u) => {
      totalMs -= dayjs(u.end).diff(dayjs(u.start), "millisecond");
    });

    const totalHours =
      totalMs > 0 ? dayjs.duration(totalMs).asHours().toFixed(2) : "0.00";

    return {
      ...rec,
      name: `${rec.first_name} ${rec.last_name}`,
      totalHours,
    };
  };

  const filtered = useMemo(() => {
    let data = records.map(addComputed);

    if (filterValue) {
      data = data.filter((r) =>
        filterType === "month"
          ? dayjs(r.attendance_date).isSame(filterValue, "month")
          : dayjs(r.attendance_date).isSame(filterValue, "day")
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((r) =>
        [r.name, r.attendance_date, r.totalHours]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return data;
  }, [records, query, filterType, filterValue]);

  const columns: TableProps<ReturnType<typeof addComputed>>["columns"] = [
    {
      title: "DATE",
      dataIndex: "attendance_date",
      width: 120,
      // compare raw date strings (YYYY-MM-DD) lexicographically
      sorter: (a, b) => a.attendance_date.localeCompare(b.attendance_date),
      render: (v) => rawDate(v),
      defaultSortOrder: "descend",
    },
    {
      title: "NAME",
      dataIndex: "name",
      width: 180,
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      title: "TIME IN",
      dataIndex: "time_in",
      width: 100,
      render: (v) => rawTime(v),
      sorter: (a, b) => {
        // sort by HHmm when present; missing => bottom
        const av = a.time_in ? rawTime(a.time_in).replace(":", "") : "9999";
        const bv = b.time_in ? rawTime(b.time_in).replace(":", "") : "9999";
        return Number(av) - Number(bv);
      },
    },
    {
      title: "TIME OUT",
      dataIndex: "time_out",
      width: 100,
      render: (v) => rawTime(v),
      sorter: (a, b) => {
        const av = a.time_out ? rawTime(a.time_out).replace(":", "") : "9999";
        const bv = b.time_out ? rawTime(b.time_out).replace(":", "") : "9999";
        return Number(av) - Number(bv);
      },
    },
    {
      title: "OFF SCHEDULE SESSIONS",
      dataIndex: "untime_sessions",
      width: 280,
      render: (sessions: UnTime[]) =>
        !sessions || sessions.length === 0 ? (
          <span>-</span>
        ) : (
          sessions.map((s, i) => {
            const map: Record<string, { color: string; text: string }> = {
              ended: { color: "blue", text: "ENDED TODAY" },
              leave: { color: "purple", text: "ON LEAVE" },
              "outside-window": { color: "gold", text: "OUTSIDE SHIFT" },
            };
            const key = String(s.reason ?? "").toLowerCase();
            const fallbackText = String(s.reason ?? "")
              .replace(/[-_]+/g, " ")
              .toUpperCase();
            const meta = map[key] || { color: "default", text: fallbackText };

            return (
              <div key={i} className="text-xs">
                <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
                  {meta.text}
                </Tag>{" "}
                {rawTime(s.start)} - {rawTime(s.end)}
              </div>
            );
          })
        ),
    },
    {
      title: "TOTAL HOURS",
      dataIndex: "totalHours",
      width: 140,
      render: (v) => <span>{v} hrs</span>,
      sorter: (a, b) => parseFloat(a.totalHours) - parseFloat(b.totalHours),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="py-4">
        <div className="flex justify-between items-center">
        <PageHeader title="ATTENDANCE LIST" />
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
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="w-full max-w-xs">
            <Input
              placeholder="Search by name/date..."
              prefix={<SearchOutlined />}
              allowClear
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
              onChange={(val) => setFilterValue(val)}
              allowClear
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: "max-content" }}
            pagination={{
              current: page,
              pageSize,
              total: filtered.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
                topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              },
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total}`,
              position: ["bottomRight"],
            }}
            size="middle"
            className="rounded-xl"
            onRow={(record) => ({
              onClick: () => {
                navigate(`/attendance/summary/${record.staff_id}`);
              },
              className: "cursor-pointer hover:bg-gray-50",
            })}
            rowClassName={(record) => {
              if ((record as any).updated_at)
                return "bg-blue-100 text-blue-800";
              if (record.is_forced_out) return "bg-red-100 text-red-700";
              return "";
            }}
          />
        )}
      </Card>
       <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="attendance"
        title="Attendance Report"
      />
    </div>
  );
}

