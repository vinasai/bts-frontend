// src/pages/dashboard/AdminLeaveApproval.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Card, Table, App, Segmented, Tooltip, Tag, Button as AntdButton } from "antd";
import type { TableProps } from "antd";
import {
  DeleteOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined 
  
} from "@ant-design/icons";
import { DateTime } from "luxon";
import PermissionGate from "../../components/PermissionGate";

import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import OutlineSweepButton from "../../components/OutlineSweepButton";
import Input from "../../components/Input";
import { showConfirmModal } from "../../components/ConfirmModal";
import api from "../../utils/axiosInstance";
import ReportModal from "../../components/reports/ReportModal";

type LeaveStatus = "pending" | "approved" | "rejected";

type LeaveRow = {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  start_date: string;
  end_date: string;
  reason?: string;
  note?: string;
  status: LeaveStatus;
  approved_by?: string | null;
  approved_by_username?: string | null; // added
  created_at?: string | null;
};

export default function AdminLeaveApproval() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeaveStatus>("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const topRef = useRef<HTMLDivElement | null>(null);

  const { message } = App.useApp();
  const statusTabs = useMemo(
    () => [
      { label: "All", value: "All" as const },
      { label: "Pending", value: "pending" as const },
      { label: "Approved", value: "approved" as const },
      { label: "Rejected", value: "rejected" as const },
    ],
    []
  );

  /* ----------------------- fetch leaves ----------------------- */
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leave"); // ✅ admin endpoint
      setRows(res.data);
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || err.response?.data?.error ||  "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  /* ----------------------- approve / reject ----------------------- */
  const handleUpdateStatus = async (id: string, status: LeaveStatus) => {
    try {
      await api.patch(`/leave/status/${id}`, { status });
      message.success(`Leave ${status.toLowerCase()} successfully`);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || err.response?.data?.error || "Action failed");
    }
  };

  const sortedRows = useMemo(() => {
    const byCreatedDesc = (a: LeaveRow, b: LeaveRow) => {
      const av = a.created_at ? Date.parse(a.created_at) : 0;
      const bv = b.created_at ? Date.parse(b.created_at) : 0;
      return bv - av; // newest first
    };

    const rowsWithNotes = rows
      .filter((r) => r.note && r.note.trim() !== "")
      .sort(byCreatedDesc);
    const rowsWithoutNotes = rows
      .filter((r) => !r.note || r.note.trim() === "")
      .sort(byCreatedDesc);

    return [...rowsWithNotes, ...rowsWithoutNotes];
  }, [rows]);

  /* ----------------------- delete ----------------------- */
  const handleAdminDelete = async (row: LeaveRow) => {
    // Toronto calendar: only allow if start_date is in the future (not today)
    const today = DateTime.now().setZone("America/Toronto").startOf("day");
    const leaveStart = DateTime.fromISO(row.start_date, {
      zone: "America/Toronto",
    }).startOf("day");
    if (!(leaveStart > today)) {
      return message.warning(
        "This leave can't be deleted because it has started or starts today."
      );
    }

    showConfirmModal({
      title: "Delete leave?",
      content: `Delete ${row.first_name}'s leave (${row.start_date} → ${row.end_date})`,
      okText: "Delete",
      danger: true,
      onOk: async () => {
        try {
          setDeletingId(row.id);
          await api.delete(`/leave/admin/${row.id}`);
          setRows((prev) => prev.filter((r) => r.id !== row.id));
          message.success("Leave deleted by admin");
        } catch (err: any) {
          console.error(err);
          message.error(err?.response?.data?.error || err.response?.data?.error || "Failed to delete leave");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  /* ----------------------- filtering ----------------------- */
  const visibleRows = useMemo(() => {
    let list = sortedRows;

    if (statusFilter !== "All") {
      list = list.filter((r) => r.status === statusFilter);
    }

    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) =>
      [
        r.employee_id,
        r.first_name,
        r.last_name,
        r.reason ?? "",
        r.start_date,
        r.end_date,
        r.status,
        r.note ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [sortedRows, query, statusFilter]);

  // paged rows
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return visibleRows.slice(start, end);
  }, [visibleRows, page, pageSize]);

  /* ----------------------- table ----------------------- */
  const columns: TableProps<LeaveRow>["columns"] = useMemo(
    () => [
      {
        title: "STAFF ID",
        dataIndex: "employee_id",
        width: 140,
        sorter: (a, b) => a.employee_id.localeCompare(b.employee_id),
      },
      {
        title: "NAME",
        dataIndex: "first_name", // keeps column keyed, but we’ll render combined
        width: 260,
        sorter: (a, b) =>
          `${a.first_name} ${a.last_name || ""}`.localeCompare(
            `${b.first_name} ${b.last_name || ""}`
          ),
        render: (_: any, r: LeaveRow) => (
          <span className="font-medium">
            {`${r.first_name} ${r.last_name || ""}`.trim()}
          </span>
        ),
      },
      {
        title: "START DATE",
        dataIndex: "start_date",
        width: 150,
        sorter: (a, b) => a.start_date.localeCompare(b.start_date),
      },
      {
        title: "END DATE",
        dataIndex: "end_date",
        width: 150,
        sorter: (a, b) => a.end_date.localeCompare(b.end_date),
      },
      {
        title: "REASON",
        dataIndex: "reason",
        width: 280,
        ellipsis: true,
        render: (v?: string) => (
          <span className="text-gray-700">{v || "—"}</span>
        ),
        sorter: (a, b) => (a.reason || "").localeCompare(b.reason || ""),
      },
      // {
      //   title: "NOTE",
      //   dataIndex: "note",
      //   width: 250,
      //   ellipsis: true,
      //   render: (note?: string) => (
      //     <span className="text-gray-700">{note || "—"}</span>
      //   ),
      // },
      {
        title: "STATUS",
        dataIndex: "status",
        width: 140,
        sorter: (a, b) => a.status.localeCompare(b.status),
        render: (s: LeaveStatus, r) => {
          const color =
            s === "approved" ? "green" : s === "rejected" ? "red" : "orange";
          return (
            <Tooltip
              title={
                s === "approved"
                  ? `Approved: ${r.end_date ? `${r.start_date} → ${r.end_date}` : r.start_date}`
                  : s === "rejected"
                    ? `Rejected: ${r.end_date ? `${r.start_date} → ${r.end_date}` : r.start_date}`
                    : `Pending: ${r.end_date ? `${r.start_date} → ${r.end_date}` : r.start_date}`
              }
            >
              <Tag color={color} style={{ marginInlineEnd: 0 }}>
                {s.toUpperCase()}
              </Tag>
            </Tooltip>
          );
        },
      },

      {
        title: "ACTIONS",
        key: "actions",
        width: 200,
        render: (_, record) => {
          const isFinal = record.status !== "pending";

          return (
            <div className="flex flex-wrap gap-2">
              <PermissionGate permission="approve-leave">
                <Tooltip title={isFinal ? "Already finalized" : "Approve"}>
                  <span>
                    <Button
                      type="primary"
                      size="small"
                      shape="circle"
                      icon={<CheckOutlined />}
                      disabled={isFinal}
                      aria-label="Approve"
                      onClick={() =>
                        showConfirmModal({
                          title: "Approve leave?",
                          content: `Approve leave for ${record.first_name}`,
                          okText: "Approve",
                          onOk: () => handleUpdateStatus(record.id, "approved"),
                        })
                      }
                    />
                  </span>
                </Tooltip>
              </PermissionGate>

              <PermissionGate permission="approve-leave">
                <Tooltip title={isFinal ? "Already finalized" : "Reject"}>
                  <span>
                    <OutlineSweepButton
                      danger
                      size="small"
                      shape="circle"
                      icon={<CloseOutlined />}
                      disabled={isFinal}
                      aria-label="Reject"
                      onClick={() =>
                        showConfirmModal({
                          title: "Reject leave?",
                          content: `Reject leave for ${record.first_name} (${record.start_date} → ${record.end_date})`,
                          okText: "Reject",
                          danger: true,
                          onOk: () => handleUpdateStatus(record.id, "rejected"),
                        })
                      }
                    />
                  </span>
                </Tooltip>
              </PermissionGate>

              {(() => {
                const today = DateTime.now()
                  .setZone("America/Toronto")
                  .startOf("day");
                const leaveStart = DateTime.fromISO(record.start_date, {
                  zone: "America/Toronto",
                }).startOf("day");
                const canDelete = leaveStart > today;

                return (
                  <Tooltip
                    title={
                      canDelete
                        ? "Delete this leave request"
                        : "Only future-dated leaves can be deleted (Toronto time)"
                    }
                  >
                    <PermissionGate permission="delete-leave">
                      <Button
                        danger
                        size="small"
                        shape="circle"
                        icon={<DeleteOutlined />}
                        disabled={!canDelete || deletingId === record.id}
                        aria-label="Delete"
                        onClick={() => handleAdminDelete(record)}
                      />
                    </PermissionGate>
                  </Tooltip>
                );
              })()}
            </div>
          );
        },
      },
      {
        title: "APPROVED BY",
        dataIndex: "approved_by_username",
        width: 140,
        render: (username?: string) =>
          username ? (
            <span className="text-gray-500">{username}</span> // grey, subtle
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="py-4">
        <div className="flex justify-between items-center">
      <PageHeader title="Leave Requests" />
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
        {/* toolbar */}
        <div className="mb-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full max-w-xs">
              <Input
                placeholder="Search by staff, reason, date, status…"
                prefix={<SearchOutlined />}
                allowClear
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="w-full sm:w-auto sm:ml-auto flex justify-start sm:justify-end">
              <Segmented
                options={statusTabs}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as "All" | LeaveStatus);
                  setPage(1);
                }}
                className="!bg-white"
              />
            </div>
          </div>
        </div>

        {/* table */}
        <Table<LeaveRow>
          rowKey="id"
          columns={columns}
          dataSource={pagedRows}
          size="middle"
          className="rounded-xl"
          scroll={{ x: "max-content" }}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total: visibleRows.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
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
  <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="leave"
        title="Leave Report"
      />
    </div>
  );
}
