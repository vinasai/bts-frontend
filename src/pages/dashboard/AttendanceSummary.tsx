import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Spin,
  Table,
  DatePicker,
  Radio,
  Typography,
  Tooltip,
  Tag,
  App,
  TimePicker,
  Button,
  Popover,
} from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import axiosInstance from "../../utils/axiosInstance";
import PageHeader from "../../components/PageHeader";
import { InfoCircleOutlined, EditOutlined } from "@ant-design/icons";

dayjs.extend(customParseFormat);

/* ===== Types ===== */
type UnTimeSession = {
  start: string; // Toronto ISO from backend
  end: string;   // Toronto ISO from backend
  reason?: string;
};

type AttendanceRecord = {
  id: string;
  attendance_date: string; // "YYYY-MM-DD" (Toronto)
  time_in?: string | null; // Toronto ISO
  time_out?: string | null; // Toronto ISO
  untime_sessions?: UnTimeSession[] | null;
  workedHours?: number;
  untimeHours?: number;
  updated_at?: string | null;
  updated_by_name?: string | null;
  is_forced_out?: boolean;
};

type Staff = {
  first_name: string;
  last_name: string;
  position?: string;
  joining_date?: string; // Toronto ISO or "YYYY-MM-DD"
};

type Summary = {
  worked?: { totalHours?: number };
  untime?: { totalHours?: number };
};
/* ================= */

/** ---------- RAW render helpers (no timezone conversion) ---------- */
const rawDate = (s?: string | null) => (s ? s.slice(0, 10) : "—"); // "YYYY-MM-DD"
const rawTime = (s?: string | null) => (s && s.length >= 16 ? s.slice(11, 16) : "—"); // "HH:mm"
const rawDateTime = (s?: string | null) => {
  if (!s) return "—";
  const date = rawDate(s);
  const time = rawTime(s);
  return time === "—" ? date : `${date} ${time}`;
};

// parse "HH:mm" (from display) into a Dayjs time-only object
const hhmmToDayjs = (s?: string | null) =>
  s && s.length >= 16 ? dayjs(s.slice(11, 16), "HH:mm") : null;

// Build an ISO string for the given date (YYYY-MM-DD) and time (Dayjs),
// preserving the original offset (e.g. "-04:00"/"-05:00") if available
const isoWithSameOffset = (
  attendanceDate: string,
  timeVal: dayjs.Dayjs | null,
  sourceIso?: string | null,
  fallbackOffset = "-04:00"
): string | null => {
  if (!timeVal) return null;
  const m = sourceIso?.match(/([+-]\d{2}:\d{2})$/);
  const offset = m?.[1] ?? fallbackOffset;
  const hh = String(timeVal.hour()).padStart(2, "0");
  const mm = String(timeVal.minute()).padStart(2, "0");
  return `${attendanceDate}T${hh}:${mm}:00.000${offset}`;
};
/* ------------------------------------------------------------------ */

export default function AttendanceSummary() {
  const { staffId } = useParams();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<"day" | "week" | "month">("month");
  const [filterValue, setFilterValue] = useState(dayjs());
  const { message } = App.useApp();

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const val = filterValue.format(filterType === "month" ? "YYYY-MM" : "YYYY-MM-DD");
      const res = await axiosInstance.get(
        `/attendance/staff/${staffId}/details?filterType=${filterType}&filterValue=${val}`
      );
      setStaff(res.data.staff as Staff);
      setRecords(res.data.records as AttendanceRecord[]);
      setSummary(res.data.summary as Summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterValue, staffId]);

  const handleUpdate = async (
    id: string,
    field: "time_in" | "time_out",
    timeOnly: dayjs.Dayjs | null
  ) => {
    try {
      const record = records.find((r) => r.id === id);
      if (!record) return;

      // Pick a source to copy the offset from (this field, then the other field)
      const sourceForOffset =
        (field === "time_in" ? record.time_in : record.time_out) ??
        (field === "time_in" ? record.time_out : record.time_in) ??
        null;

      const updatedIso = isoWithSameOffset(
        record.attendance_date,
        timeOnly,
        sourceForOffset,
        "-04:00"
      );

      // Build prospective values for validation (dayjs respects embedded offset)
      const nextTimeIn =
        field === "time_in"
          ? (updatedIso ? dayjs(updatedIso) : null)
          : record.time_in
          ? dayjs(record.time_in)
          : null;

      const nextTimeOut =
        field === "time_out"
          ? (updatedIso ? dayjs(updatedIso) : null)
          : record.time_out
          ? dayjs(record.time_out)
          : null;

      if (nextTimeIn && nextTimeOut && nextTimeOut.isBefore(nextTimeIn)) {
        return message.error("Time Out cannot be before Time In");
      }

      const res = await axiosInstance.patch(`/attendance/${id}`, {
        [field]: updatedIso, // send ISO with explicit Toronto offset
      });

      if (res.data?.ok === true) {
        message.success("Attendance updated successfully");

        setRecords((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;

            const updated: AttendanceRecord = {
              ...r,
              ...(res.data.attendance as Partial<AttendanceRecord>),
            };

            // compute hours using the ISO values (offset respected)
            const tIn = updated.time_in ? dayjs(updated.time_in) : null;
            const tOut = updated.time_out ? dayjs(updated.time_out) : null;
            const workedHours = tIn && tOut ? tOut.diff(tIn, "minute") / 60 : 0;

            const unArr = updated.untime_sessions ?? [];
            const untimeHours =
              unArr.length > 0
                ? unArr.reduce((sum, u) => {
                    const s = dayjs(u.start);
                    const e = dayjs(u.end);
                    return sum + e.diff(s, "minute") / 60;
                  }, 0)
                : 0;

            return { ...updated, workedHours, untimeHours };
          })
        );
      }
    } catch (err:any) {
      console.error("Update failed", err);
      message.error(err.response?.data?.error || "Failed to update attendance");
    }
  };

  /* ------ Columns (display raw; edit via popover TimePicker seeded from raw HH:mm) ------ */
  const columns = [
    {
      title: "Date",
      dataIndex: "attendance_date",
      sorter: (a: AttendanceRecord, b: AttendanceRecord) =>
        String(a.attendance_date).localeCompare(String(b.attendance_date)),
      defaultSortOrder: "descend",
      render: (v: string, record: AttendanceRecord) => (
        <div className="flex items-center gap-1">
          {rawDate(v)}
          {record.updated_at && record.updated_by_name && (
            <Tooltip title={`Updated by ${record.updated_by_name} on ${rawDateTime(record.updated_at)}`}>
              <InfoCircleOutlined className="text-blue-500" />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Time In",
      dataIndex: "time_in",
      sorter: (a: AttendanceRecord, b: AttendanceRecord) => {
        const av = a.time_in ? a.time_in.slice(11, 16).replace(":", "") : "9999";
        const bv = b.time_in ? b.time_in.slice(11, 16).replace(":", "") : "9999";
        return Number(av) - Number(bv);
      },
      render: (v: string | null | undefined, record: AttendanceRecord) => {
        const content = (
          <TimePicker
            format="HH:mm"
            showNow={false}
            value={hhmmToDayjs(v)}
            onChange={(val) => handleUpdate(record.id, "time_in", val)}
          />
        );
        return (
          <div className="flex items-center gap-2">
            <span>{rawTime(v)}</span>
            <Popover trigger="click" content={content}>
              <Button icon={<EditOutlined />} size="small" />
            </Popover>
          </div>
        );
      },
    },
    {
      title: "Time Out",
      dataIndex: "time_out",
      sorter: (a: AttendanceRecord, b: AttendanceRecord) => {
        const av = a.time_out ? a.time_out.slice(11, 16).replace(":", "") : "9999";
        const bv = b.time_out ? b.time_out.slice(11, 16).replace(":", "") : "9999";
        return Number(av) - Number(bv);
      },
      render: (v: string | null | undefined, record: AttendanceRecord) => {
        const content = (
          <TimePicker
            format="HH:mm"
            showNow={false}
            value={hhmmToDayjs(v)}
            onChange={(val) => handleUpdate(record.id, "time_out", val)}
          />
        );
        return (
          <div className="flex items-center gap-2">
            <span>{rawTime(v)}</span>
            <Popover trigger="click" content={content}>
              <Button icon={<EditOutlined />} size="small" />
            </Popover>
          </div>
        );
      },
    },
    {
      title: "Off Schedule Sessions",
      dataIndex: "untime_sessions",
      render: (arr: UnTimeSession[] | null | undefined) =>
        arr && arr.length ? (
          arr.map((u, i) => (
            <div key={i}>
              <ReasonTag reason={u.reason} /> {rawTime(u.start)} - {rawTime(u.end)}
            </div>
          ))
        ) : (
          "—"
        ),
    },
    {
      title: "Worked Hours",
      dataIndex: "workedHours",
      render: (v: number | undefined) => (v ?? 0).toFixed(2),
    },
    {
      title: "Off Schedule Hours",
      dataIndex: "untimeHours",
      render: (v: number | undefined) => (v ?? 0).toFixed(2),
    },
  ];
  /* -------------------------------------------------------------------------------------- */

  const ReasonTag = ({ reason }: { reason?: string }) => {
    if (!reason) return <span className="text-gray-700">—</span>;
    const key = String(reason).toLowerCase();
    const map: Record<string, { color: string; text: string }> = {
      ended: { color: "blue", text: "ENDED TODAY" },
      leave: { color: "purple", text: "ON LEAVE" },
      "outside-window": { color: "gold", text: "OUTSIDE SHIFT" },
    };
    const fallback = String(reason).replace(/[-_]+/g, " ").toUpperCase();
    const meta = map[key] || { color: "default", text: fallback };
    return (
      <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
        {meta.text}
      </Tag>
    );
  };

  if (loading || !staff)
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="py-4">
        <PageHeader title="Attendance Summary" />
      </div>

      <Card className="!rounded-2xl !shadow !border-0">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          {/* Staff Details */}
          <div className="flex-1 space-y-1">
            <Typography.Title level={4}>Staff Details</Typography.Title>
            <p>
              <strong>Name:</strong> {staff.first_name} {staff.last_name}
            </p>
            <p>
              <strong>Role:</strong> {staff.position || "—"}
            </p>
            <p>
              <strong>Join Date:</strong> {staff.joining_date ? rawDate(staff.joining_date) : "—"}
            </p>
          </div>

          {/* Summary */}
          <div className="flex-1 space-y-1">
            <Typography.Title level={4}>Summary</Typography.Title>
            <p>
              <strong>Total Worked Hours:</strong>{" "}
              {(summary?.worked?.totalHours ?? 0).toFixed(2)} hrs
            </p>
            <p>
              <strong>Total Off Schedule Hours:</strong>{" "}
              {(summary?.untime?.totalHours ?? 0).toFixed(2)} hrs
            </p>
          </div>
        </div>
      </Card>

      <Card className="!rounded-2xl !shadow !border-0">
        <Typography.Title level={4}>Filters</Typography.Title>
        <div className="flex gap-4 items-center my-2">
          <Radio.Group value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <Radio.Button value="day">Day</Radio.Button>
            <Radio.Button value="week">Week</Radio.Button>
            <Radio.Button value="month">Month</Radio.Button>
          </Radio.Group>
          <DatePicker
            picker={filterType === "month" ? "month" : undefined}
            value={filterValue}
            onChange={(val) => val && setFilterValue(val)}
          />
        </div>
      </Card>

      <Card className="!rounded-2xl !shadow !border-0">
        <Typography.Title level={4}>Attendance Records</Typography.Title>

        <Table<AttendanceRecord>
          rowKey="id"
          columns={columns as any}
          dataSource={records}
          rowClassName={(record) => {
            if (record.updated_at) return "bg-blue-100 text-blue-800"; // updated -> blue
            if (record.is_forced_out) return "bg-red-100 text-red-700"; // forced out -> red
            return "";
          }}
        />
      </Card>
    </div>
  );
}
