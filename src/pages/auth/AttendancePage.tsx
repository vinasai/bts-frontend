// src/pages/attendance/AttendancePage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import Button from "../../components/Button";
import OutlineSweepButton from "../../components/OutlineSweepButton";
import {
  Card,
  Alert,
  Typography,
  Result,
  Tag,
  Timeline,
  App,
  Flex,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

type Status = "loading" | "ready" | "success" | "error" | "details";
type AttendanceType = "in" | "out";

type Attendance = {
  staff_id: string;
  time_in?: string | null;
  time_out?: string | null;
  created_at?: string;
};

export default function AttendancePage() {
  const [searchParams] = useSearchParams();
  const session = searchParams.get("session");
  const [status, setStatus] = useState<Status>("loading");
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [error, setError] = useState<string>("");
  const [selectedType, setSelectedType] = useState<AttendanceType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const { message } = App.useApp();

  // Toronto time (live)
  const [torontoTime, setTorontoTime] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date());
    setTorontoTime(fmt());
    const id = window.setInterval(() => setTorontoTime(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!session) {
      setStatus("error");
      setError("Invalid QR link — session not found.");
      return;
    }
    setStatus("ready");
  }, [session]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        window.clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  const startRedirectCountdown = (seconds = 3) => {
    setCountdown(seconds);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    countdownRef.current = window.setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          if (countdownRef.current) {
            window.clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          navigate("/dashboard");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const markAttendance = async (type: AttendanceType) => {
    if (!session || isSubmitting || status === "success") return;

    setIsSubmitting(true);
    setSelectedType(type);

    try {
      const res = await axiosInstance.post("/attendance/mark", {
        session,
        type,
      });
      const data: Attendance = res?.data?.attendance;
      setAttendance(data ?? null);
      setStatus("success");

      message.success(
        type === "in" ? "Checked in successfully." : "Checked out successfully."
      );
      startRedirectCountdown(3);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to mark attendance";
      setError(msg);
      setStatus("error");
      message.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = useMemo(() => {
    switch (status) {
      case "loading":
        return {
          type: "info" as const,
          icon: <ClockCircleOutlined />,
          title: "Processing QR Code...",
        };
      case "ready":
        return {
          type: "success" as const,
          icon: <CheckCircleOutlined />,
          title: "QR Code Validated",
        };
      case "success":
        return {
          type: "success" as const,
          icon: <CheckCircleOutlined />,
          title: "Attendance Marked Successfully!",
        };
      case "error":
        return {
          type: "error" as const,
          icon: <ClockCircleOutlined />,
          title: "Error Processing Attendance",
        };
      case "details":
        return {
          type: "info" as const,
          icon: <UserOutlined />,
          title: "Attendance Details",
        };
      default:
        return { type: "info" as const, icon: null, title: "Processing..." };
    }
  }, [status]);

  function ActionTile({
    icon,
    title,
    subtitle,
    onClick,
    loading,
    disabled,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  }) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={!disabled ? onClick : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !disabled) onClick();
        }}
        className="rounded-xl border p-6 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Button icon={icon} loading={loading} disabled={disabled} />
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-gray-600">{subtitle}</div>
          </div>
        </div>
      </div>
    );
  }

  // Shared top toolbar (Toronto time + Back to Scanner outline button)
  const TopToolbar = () => (
    <div className="mb-4 space-y-2">
      {/* Row 1: stack on mobile to avoid overflow */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <OutlineSweepButton
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/qr-board")}
        >
          Back to Scanner
        </OutlineSweepButton>

        {/* Toronto time: allow shrink & truncate on very narrow screens */}
        <div className="px-3 py-2 bg-gray-50 rounded-lg text-xs sm:text-sm text-gray-600 min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {torontoTime || "—"}
        </div>
      </div>

      {/* Row 2: Alert (flex-1) + Session chip (min-w-0, truncates) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="min-w-0 flex-1">
          <Alert
            message={statusConfig.title}
            type={statusConfig.type}
            showIcon
            icon={statusConfig.icon}
            className="!mb-0"
          />
        </div>

        {/* Session chip: no bold + truncate with tooltip */}
        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl w-full sm:w-auto min-w-0">
          <Text className="shrink-0" type="secondary">
            Session:
          </Text>
          <Tag
            style={{
              maxWidth: 240,
              overflow: "hidden",
              fontWeight: 400, // normalize (Tag tends to look bold)
              lineHeight: 1.2,
            }}
          >
            <span
              title={session || "—"}
              style={{
                display: "inline-block",
                maxWidth: "100%",
                verticalAlign: "middle",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                fontWeight: 400, // enforce again on inner text
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              {session || "—"}
            </span>
          </Tag>
        </div>
      </div>
    </div>
  );

  // Error screen
  if (status === "error") {
    return (
      <div className="space-y-4 w-full py-4">
        <h1 className="text-title text-center mb-6">MARK ATTENDANCE</h1>

        <Card className="!rounded-2xl !shadow !border-0 w-full">
          <TopToolbar />
          <Result
            status="error"
            title="Attendance Error"
            subTitle={error}
            extra={
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  // Success + details screen
  if (status === "success" || status === "details") {
    return (
      <div className="space-y-4 w-full py-4">
        <h1 className="text-title text-center mb-6">MARK ATTENDANCE</h1>

        <Card className="!rounded-2xl !shadow !border-0 w-full text-center">
          <TopToolbar />
          <Result
            status="success"
            title="Attendance Recorded!"
            subTitle={
              <div className="space-y-3">
                <div>
                  <Tag
                    color={selectedType === "in" ? "green" : "blue"}
                    className="text-lg"
                  >
                    {selectedType === "in" ? "Checked In" : "Checked Out"}
                  </Tag>
                </div>
                <Text type="secondary">
                  Redirecting to dashboard in{" "}
                  <span className="font-medium">{countdown}</span> sec…
                </Text>
              </div>
            }
            extra={
              <Flex gap={8} justify="center" wrap="wrap">
                <Button onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
                <OutlineSweepButton
                  onClick={() =>
                    setStatus(status === "details" ? "success" : "details")
                  }
                >
                  {status === "details" ? "Hide Details" : "View Details"}
                </OutlineSweepButton>
              </Flex>
            }
          />

          {status === "details" && attendance && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-left w-full">
              <Title level={4} className="!mb-3">
                Attendance Details
              </Title>
              <Timeline
                items={[
                  {
                    dot: <UserOutlined />,
                    children: (
                      <div>
                        <Text strong>Staff ID: </Text>
                        <Text>{attendance.staff_id}</Text>
                      </div>
                    ),
                  },
                  {
                    dot: <LoginOutlined />,
                    children: (
                      <div>
                        <Text strong>Time In: </Text>
                        <Text>{attendance.time_in || "Not recorded"}</Text>
                      </div>
                    ),
                  },
                  {
                    dot: <LogoutOutlined />,
                    children: (
                      <div>
                        <Text strong>Time Out: </Text>
                        <Text>{attendance.time_out || "Not recorded"}</Text>
                      </div>
                    ),
                  },
                  {
                    dot: <ClockCircleOutlined />,
                    children: (
                      <div>
                        <Text strong>Date: </Text>
                        <Text>{attendance.created_at || "-"}</Text>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Ready / initial screen
  return (
    <div className="space-y-4 w-full py-4">
      <h1 className="text-title text-center mb-6">MARK ATTENDANCE</h1>

      <Card className="!rounded-2xl !shadow !border-0 w-full">
        <TopToolbar />

        <Divider className="!my-4" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <ActionTile
            icon={<LoginOutlined />}
            title="Check In"
            subtitle="Start your work day"
            loading={isSubmitting && selectedType === "in"}
            disabled={status !== "ready"}
            onClick={() => markAttendance("in")}
          />

          <ActionTile
            icon={<LogoutOutlined />}
            title="Check Out"
            subtitle="End your work day"
            loading={isSubmitting && selectedType === "out"}
            disabled={status !== "ready"}
            onClick={() => markAttendance("out")}
          />
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl w-full">
          <Title level={5} className="!mb-3">
            How it works
          </Title>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              • <Text strong>Check In</Text> — record your arrival time
            </li>
            <li>
              • <Text strong>Check Out</Text> — record your departure time
            </li>
            <li>• Attendance is recorded immediately</li>
            <li>• You’ll be redirected to the dashboard automatically</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
