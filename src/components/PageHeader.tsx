// src/components/PageHeader.tsx
import { Link } from "react-router-dom";
import { Divider, Avatar } from "antd";
import {
  UserOutlined,
  QrcodeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
  docBadgeCount?: number;
  onDocClick?: () => void;
};

export default function PageHeader({
  title,
  subtitle,
  className = "",
  docBadgeCount,
  onDocClick,
}: Props) {
  const showDoc = typeof docBadgeCount !== "undefined";

  return (
    <div className={`flex items-center justify-between gap-6 ${className}`}>
      {/* Left: title */}
      <div className="flex-2 min-w-0">
        <h1 className="text-title uppercase text-ink">{title}</h1>
        {subtitle ? (
          <p className="text-small text-gray-500 mt-1 truncate">{subtitle}</p>
        ) : null}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Document circle (visible on all breakpoints when requested) */}
        {showDoc && (
          <button
            type="button"
            onClick={onDocClick}
            className="relative flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Open documents"
          >
            <FileTextOutlined className="text-lg" />
            <span className="absolute -top-1 -left-1 min-w-[18px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] leading-5 text-center">
              {docBadgeCount}
            </span>
          </button>
        )}

        {/* Scan QR & Profile group — desktop only */}
        <div className="hidden lg:flex">
          <div className="inline-flex items-center bg-primary text-white h-12 rounded-bl-2xl rounded-tl-2xl overflow-hidden">
            {/* Scan QR */}
            <Link
              to="/"
              className="relative inline-flex items-center gap-3 font-heading tracking-wide text-base sm:text-lg px-6 sm:px-8 h-full no-underline hover:no-underline group overflow-hidden"
            >
              <span className="pointer-events-none absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-2 text-white">
                <QrcodeOutlined className="text-xl sm:text-2xl" />
                <span className="hidden sm:inline ps-4">Scan QR</span>
              </span>
            </Link>

            <Divider type="vertical" className="!border-white/60 !h-6" />

            {/* Profile */}
            <Link
              to="/profile"
              className="relative inline-flex items-center justify-center px-6 sm:px-8 h-full no-underline group overflow-hidden"
            >
              <span className="pointer-events-none absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 text-white">
                <Avatar
                  size={36}
                  icon={<UserOutlined className="text-primary" />}
                  style={{ backgroundColor: "white" }}
                />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
