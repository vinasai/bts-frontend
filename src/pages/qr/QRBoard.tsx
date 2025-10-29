// src/pages/qr/QRBoard.tsx
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Card, Alert, Spin, Typography, Tag, App } from "antd";
import {
  QrcodeOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import Button from "../../components/Button";

const { Text } = Typography;

type TimeRemaining = {
  minutes: number;
  seconds: number;
  expired: boolean;
};

export default function QRBoard() {
  const [qr, setQr] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    minutes: 0,
    seconds: 0,
    expired: true,
  });

  const { message } = App.useApp();

  async function fetchQr() {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/attendance/session/qr");
      const newQr: string = res?.data?.dataUrl ?? null;
      const newExpiresAt: string = res?.data?.expiresAt ?? null;

      setQr(newQr);
      setExpiresAt(newExpiresAt);
      setError(null);
      setLastUpdated(new Date());
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Failed to fetch QR code";
      setError(msg);
      setQr(null);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!expiresAt) return;

      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining({ minutes: 0, seconds: 0, expired: true });
        fetchQr(); // auto-refresh on expiry
      } else {
        setTimeRemaining({
          minutes: Math.floor(diff / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
          expired: false,
        });
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const isExpired = timeRemaining.expired;

  return (
    <div className="space-y-4 w-full py-6">
      {/* Page heading (uniform style) */}
      <h1 className="text-title text-center mb-6">ATTENDANCE QR BOARD</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main QR card */}
        <Card className="!rounded-2xl !shadow !border-0 lg:col-span-2">
          <div className="flex flex-col items-center text-center">
            {/* Status badge */}
            <div className="mb-4">
              <Tag
                icon={
                  isExpired ? <ExclamationCircleOutlined /> : <SyncOutlined spin />
                }
                color={isExpired ? "error" : "processing"}
                style={{ marginInlineEnd: 0, fontWeight: 400 }}
              >
                {isExpired ? "SESSION EXPIRED" : "ACTIVE SESSION"}
              </Tag>
            </div>

            {/* QR */}
            <div className="relative inline-block">
              {loading ? (
                <div className="w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                  <Spin size="large" tip="Loading QR Code..." />
                </div>
              ) : qr ? (
                <>
                  <img
                    src={qr}
                    alt="Attendance QR Code"
                    className="w-80 h-80 sm:w-96 sm:h-96 border-4 border-blue-100 rounded-xl shadow-lg object-contain"
                  />
                  {!isExpired && (
                    <div className="pointer-events-none absolute top-0 left-0 right-0 h-2 bg-blue-500/80 rounded-full animate-pulse" />
                  )}
                </>
              ) : (
                <div className="w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <ExclamationCircleOutlined className="text-5xl text-gray-300" />
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <ClockCircleOutlined />
                <Text strong>Expires in:</Text>
                {!isExpired ? (
                  <Tag
                    color="blue"
                    style={{ marginInlineEnd: 0, fontWeight: 400 }}
                  >
                    {timeRemaining.minutes}m{" "}
                    {String(timeRemaining.seconds).padStart(2, "0")}s
                  </Tag>
                ) : (
                  <Tag color="red" style={{ marginInlineEnd: 0, fontWeight: 400 }}>
                    EXPIRED
                  </Tag>
                )}
              </div>

              {expiresAt && (
                <Text type="secondary" className="text-sm">
                  Valid until: {new Date(expiresAt).toLocaleString()}
                </Text>
              )}
            </div>

            {/* Error */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                className="mt-4 max-w-md w-full text-left"
                action={
                  <Button onClick={fetchQr}>
                    Retry
                  </Button>
                }
              />
            )}

            {/* Actions */}
            <div className="mt-6">
              <Button
                type="primary"
                size="middle"
                icon={<SyncOutlined />}
                onClick={fetchQr}
                loading={loading}
                aria-busy={loading}
              >
                Refresh QR Code
              </Button>
            </div>
          </div>
        </Card>

        {/* Sidebar cards */}
        <div className="space-y-4">
          <Card
            title={
              <div className="flex items-center gap-2">
                <QrcodeOutlined />
                <span>Session Information</span>
              </div>
            }
            className="!rounded-2xl !shadow !border-0"
            headStyle={{ borderBottom: "1px solid #f0f0f0" }}
          >
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <Text type="secondary">Current Status</Text>
                <Tag color={isExpired ? "red" : "green"} style={{ marginInlineEnd: 0, fontWeight: 400 }}>
                  {isExpired ? "INACTIVE" : "ACTIVE"}
                </Tag>
              </div>
              <div className="flex justify-between items-center min-w-0">
                <Text type="secondary">Last Updated</Text>
                <Text code className="truncate max-w-[160px] sm:max-w-none">
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text type="secondary">Auto-refresh</Text>
                <Tag color="green" style={{ marginInlineEnd: 0, fontWeight: 400 }}>
                  ON EXPIRY
                </Tag>
              </div>
            </div>
          </Card>

          <Card
            title="How to Use"
            className="!rounded-2xl !shadow !border-0"
            headStyle={{ borderBottom: "1px solid #f0f0f0" }}
          >
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                <Text>Point your camera at the QR code</Text>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                <Text>Scan to mark your attendance</Text>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                <Text>QR code auto-refreshes when expired</Text>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                <Text>Make sure to scan before time expires</Text>
              </div>
            </div>
          </Card>

          <Card
            title="Quick Status"
            className="!rounded-2xl !shadow !border-0"
            headStyle={{ borderBottom: "1px solid #f0f0f0" }}
          >
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <Text type="secondary">QR Code</Text>
                <Tag color={qr ? "green" : "red"} style={{ marginInlineEnd: 0, fontWeight: 400 }}>
                  {qr ? "LOADED" : "NOT AVAILABLE"}
                </Tag>
              </div>
              <div className="flex items-center justify-between">
                <Text type="secondary">Time Remaining</Text>
                <Text strong className={isExpired ? "text-red-600" : "text-green-600"}>
                  {isExpired
                    ? "Expired"
                    : `${timeRemaining.minutes}m ${String(timeRemaining.seconds).padStart(2, "0")}s`}
                </Text>
              </div>
              <div className="flex items-center justify-between">
                <Text type="secondary">Server Status</Text>
                <Tag color={error ? "red" : "green"} style={{ marginInlineEnd: 0, fontWeight: 400 }}>
                  {error ? "ERROR" : "CONNECTED"}
                </Tag>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer note */}
      <Card className="!rounded-2xl !shadow !border-0">
        <div className="text-center">
          <Text type="secondary" className="text-sm">
            The QR board automatically fetches a new QR code when the current session expires.
            Make sure to scan before the session expires.
          </Text>
        </div>
      </Card>
    </div>
  );
}
