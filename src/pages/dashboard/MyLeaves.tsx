// src/pages/dashboard/MyLeaves.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Card, Table, Form, DatePicker, App, Tag, Segmented } from "antd";
import type { TableProps } from "antd";
import { Tooltip } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { DateTime } from "luxon";

import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import OutlineSweepButton from "../../components/OutlineSweepButton";
import Input, { TextArea } from "../../components/Input";
import axiosInstance from "../../utils/axiosInstance";
import { showConfirmModal } from "../../components/ConfirmModal";
import CommonModal from "../../components/Modal/CommonModal";

type LeaveStatus = "Pending" | "Approved" | "Rejected";

type LeaveRow = {
  id: string;
  employee_id: string;
  first_name: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: LeaveStatus;
};

type RequestForm = {
  start_date?: Dayjs;
  end_date?: Dayjs;
  reason?: string;
};

export default function MyLeaves() {
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeaveStatus>("All");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form] = Form.useForm<RequestForm>();
  const { message } = App.useApp();

  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<LeaveRow | null>(null);
  const [editForm] = Form.useForm<RequestForm>();
  const topRef = useRef<HTMLDivElement | null>(null);

  // const [noteOpen, setNoteOpen] = useState(false);
  // const [noteRow, setNoteRow] = useState<LeaveRow | null>(null);
  // const [noteValue, setNoteValue] = useState("");

  const torontoTodayISO = DateTime.now()
    .setZone("America/Toronto")
    .startOf("day")
    .toISODate();
  const torontoToday = dayjs(torontoTodayISO, "YYYY-MM-DD");

  const disableStartPastToronto = (current?: Dayjs) =>
    !!current && !current.startOf("day").isAfter(torontoToday, "day");

  const disableEndBeforeStart = (current?: Dayjs, start?: Dayjs) => {
    if (!current) return false;
    const base = start ?? form.getFieldValue("start_date");
    if (!base) return !current.startOf("day").isAfter(torontoToday, "day"); // end > today when no start chosen
    // allow same day: only block if end < start
    return current.startOf("day").isBefore(base.startOf("day"));
  };

  // const openNoteModal = (row: LeaveRow) => {
  //   setNoteRow(row);
  //   setNoteValue(row.note ?? row.reason ?? ""); // use note first
  //   setNoteOpen(true);
  // };

  // const submitNote = async () => {
  //   if (!noteRow || !noteValue.trim()) {
  //     message.error("Please enter a note");
  //     return;
  //   }

  //   try {
  //     await axiosInstance.patch(`/leave/${noteRow.id}/request-cancel`, {
  //       note: noteValue.trim(),
  //     });
  //     message.success("Note submitted to admin");
  //     setNoteOpen(false);
  //     setNoteRow(null);
  //     setNoteValue("");
  //     fetchMyLeaves();
  //   } catch (err: any) {
  //     message.error(err?.response?.data?.error || "Failed to submit note");
  //   }
  // };

  /* ---------------- Fetch my leaves ---------------- */
  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/leave/me");
      const norm = (s: string) =>
        s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
      setRows(
        (res.data || []).map((r: any) => ({
          ...r,
          status: norm(r.status),
          reason: r.reason ?? "", // use note if present
        }))
      );
    } catch (err: any) {
      message.error(err.response?.data?.message || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  /* ---------------- Filters ---------------- */
  const visibleRows = useMemo(() => {
    let list = rows;
    if (statusFilter !== "All") {
      list = list.filter((r) => r.status === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [
        r.employee_id,
        r.first_name,
        r.reason ?? "",
        r.start_date,
        r.end_date,
        r.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query, statusFilter]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return visibleRows.slice(start, end);
  }, [visibleRows, page, pageSize]);

  /* ---------------- Table ---------------- */
  const columns: TableProps<LeaveRow>["columns"] = [
    // {
    //   title: "STAFF ID",
    //   dataIndex: "employee_id",
    //   width: 140,
    //   sorter: (a, b) => a.employee_id.localeCompare(b.employee_id),
    // },
    // {
    //   title: "NAME",
    //   dataIndex: "first_name",
    //   width: 220,
    //   sorter: (a, b) => a.first_name.localeCompare(b.first_name),
    //   render: (v) => <span className="font-medium">{v}</span>,
    // },
    {
      title: "START DATE",
      dataIndex: "start_date",
      width: 150,
      sorter: (a, b) => a.start_date.localeCompare(b.start_date),
      defaultSortOrder: "descend", // newest first
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
      render: (v?: string) => <span className="text-gray-700">{v || "—"}</span>,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 140,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (s: LeaveStatus) => {
        const st = String(s).toLowerCase();
        const color =
          st === "approved" ? "green" : st === "rejected" ? "red" : "orange";
        return (
          <Tooltip title={s}>
            <Tag color={color} style={{ marginInlineEnd: 0 }}>
              {st.toUpperCase()}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 150,
      render: (_, record) => {
        // const today = dayjs(torontoTodayISO, "YYYY-MM-DD");
        const isPending = String(record.status).toLowerCase() === "pending";
        // const isApproved = String(record.status).toLowerCase() === "approved";
        // const leaveStart = dayjs(record.start_date, "YYYY-MM-DD");

        return (
          <div className="flex items-center gap-2">
            {/* Edit/Delete for Pending */}
            {isPending && (
              <>
                <Tooltip title="Edit">
                  <OutlineSweepButton
                    shape="circle"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(record)}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button
                    danger
                    shape="circle"
                    icon={<DeleteOutlined />}
                    onClick={() => deleteMyLeave(record)}
                  />
                </Tooltip>
              </>
            )}

            {/* Add Note for Approved and future start date */}
            {/* {isApproved && leaveStart.isAfter(today, "day") && (
              <Tooltip title="Request Cancellation / Add Note">
                <OutlineSweepButton
                  shape="circle"
                  icon={<EditOutlined />}
                  onClick={() => openNoteModal(record)}
                />
              </Tooltip>
            )} */}
          </div>
        );
      },
    },
  ];

  /* ---------------- Request leave ---------------- */
  const submitRequest = async (values: RequestForm) => {
    const start = values.start_date?.format("YYYY-MM-DD");
    const end = values.end_date?.format("YYYY-MM-DD");
    if (!start || !end) {
      message.error("Please select both start and end dates");
      return;
    }

    const s = dayjs(start, "YYYY-MM-DD");
    const e = dayjs(end, "YYYY-MM-DD");
    if (!s.isAfter(torontoToday, "day")) {
      message.error("Start date must be in the future (America/Toronto)");
      return;
    }
    if (e.isBefore(s, "day")) {
      message.error("End date cannot be before start date");
      return;
    }

    try {
      await axiosInstance.post("/leave", {
        startDate: start,
        endDate: end,
        reason: values.reason,
      });
      message.success("Leave request submitted");
      setOpen(false);
      form.resetFields();
      setPage(1);
      fetchMyLeaves(); // refresh list
    } catch (err: any) {
      message.error(err.response?.data?.message || "Failed to submit request");
    }
  };

  const openEdit = (row: LeaveRow) => {
    setEditingRow(row);
    setEditOpen(true);
    editForm.setFieldsValue({
      start_date: dayjs(row.start_date, "YYYY-MM-DD"),
      end_date: dayjs(row.end_date, "YYYY-MM-DD"),
      reason: row.reason ?? "",
    });
  };

  const submitEdit = async (values: RequestForm) => {
    if (!editingRow) return;
    const startDate = values.start_date?.format("YYYY-MM-DD");
    const endDate = values.end_date?.format("YYYY-MM-DD");

    // client-side guards (server enforces Toronto)
    if (!startDate || !endDate) {
      message.error("Please select both start and end dates");
      return;
    }
    const s = dayjs(startDate, "YYYY-MM-DD");
    const e = dayjs(endDate, "YYYY-MM-DD");
    if (!s.isAfter(torontoToday, "day")) {
      message.error("Start date must be in the future (America/Toronto)");
      return;
    }
    if (e.isBefore(s, "day")) {
      message.error("End date cannot be before start date");
      return;
    }

    try {
      await axiosInstance.patch(`/leave/me/${editingRow.id}`, {
        startDate,
        endDate,
        reason: values.reason,
      });
      message.success("Leave updated");
      setEditOpen(false);
      setEditingRow(null);
      editForm.resetFields();
      fetchMyLeaves();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to update leave");
    }
  };

  const deleteMyLeave = async (row: LeaveRow) => {
    showConfirmModal({
      title: "Delete leave?",
      content: `Delete your leave (${row.start_date} → ${row.end_date})`,
      danger: true,
      okText: "Delete",
      onOk: async () => {
        try {
          await axiosInstance.delete(`/leave/me/${row.id}`);
          message.success("Leave deleted");
          setRows((prev) => prev.filter((r) => r.id !== row.id));
        } catch (err: any) {
          message.error(err?.response?.data?.error || "Failed to delete leave");
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="py-4">
        <PageHeader title="Leave Requests" />
      </div>
      <div ref={topRef} />
      <Card className="!rounded-2xl !shadow !border-0">
        {/* toolbar */}
        <div className="mb-3 space-y-3">
          {/* Row 1: primary action */}
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
            >
              Request a Leave
            </Button>
          </div>

          {/* Row 2: search + filter */}
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
                options={["All", "Pending", "Approved", "Rejected"]}
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
          loading={loading}
          size="middle"
          className="rounded-xl"
          scroll={{ x: "max-content" }}
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

      {/* request modal */}
      <CommonModal
        open={open}
        onClose={() => setOpen(false)}
        title="Request a Leave"
        actions={{
          // Cancel button is rendered automatically (uses onClose)
          items: [
            {
              label: "Submit Request",
              variant: "primary",
              onClick: () => form.submit(), // triggers the form below
            },
          ],
        }}
      >
        <div className="pb-4">
          <Form<RequestForm>
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={submitRequest}
          >
            <Form.Item
              label={
                <span className="text-small text-gray-700">Start Date</span>
              }
              name="start_date"
              rules={[{ required: true, message: "Select start date" }]}
            >
              <DatePicker
                className="!w-full !rounded-md"
                format="YYYY-MM-DD"
                disabledDate={(current) =>
                  disableStartPastToronto(current as Dayjs)
                }
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-small text-gray-700">End Date</span>}
              name="end_date"
              rules={[{ required: true, message: "Select end date" }]}
            >
              <DatePicker
                className="!w-full !rounded-md"
                format="YYYY-MM-DD"
                disabledDate={(current) =>
                  disableEndBeforeStart(
                    current as Dayjs,
                    form.getFieldValue("start_date")
                  )
                }
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-small text-gray-700">Reason</span>}
              name="reason"
              rules={[{ required: true, message: "Please enter a reason" }]}
            >
              <TextArea
                placeholder="Type a short reason…"
                allowNewlines
                rows={3}
                maxLength={300}
              />
            </Form.Item>
          </Form>
        </div>
      </CommonModal>

      {/* <Modal
        title="Send Note to Admin"
        open={noteOpen}
        onCancel={() => {
          setNoteOpen(false);
          setNoteRow(null);
          setNoteValue("");
        }}
        footer={null}
        destroyOnClose
      >
        <div className="space-y-3">
          <AntInput.TextArea
            placeholder="Add a note to the admin…"
            rows={4}
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <OutlineSweepButton
              onClick={() => {
                setNoteOpen(false);
                setNoteRow(null);
                setNoteValue("");
              }}
            >
              Cancel
            </OutlineSweepButton>

            <Button type="primary" onClick={submitNote}>
              Submit Note
            </Button>
          </div>
        </div>
      </Modal> */}

      {/* edit modal */}
      <CommonModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingRow(null);
          editForm.resetFields();
        }}
        title="Edit Leave"
        actions={{
          items: [
            {
              label: "Save Changes",
              variant: "primary",
              onClick: () => editForm.submit(),
            },
          ],
        }}
      >
        <div className="pb-4">
          <Form<RequestForm>
            form={editForm}
            layout="vertical"
            requiredMark={false}
            onFinish={submitEdit}
          >
            <Form.Item
              label={
                <span className="text-small text-gray-700">Start Date</span>
              }
              name="start_date"
              rules={[{ required: true, message: "Select start date" }]}
            >
              <DatePicker
                className="!w-full !rounded-md"
                format="YYYY-MM-DD"
                disabledDate={(current) =>
                  disableStartPastToronto(current as Dayjs)
                }
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-small text-gray-700">End Date</span>}
              name="end_date"
              dependencies={["start_date"]}
              rules={[
                { required: true, message: "Select end date" },
                ({ getFieldValue }) => ({
                  validator(_, value: Dayjs) {
                    const s = getFieldValue("start_date") as Dayjs | undefined;
                    if (!value || !s) return Promise.resolve();
                    if (value.startOf("day").isBefore(s.startOf("day"))) {
                      return Promise.reject(
                        new Error("End date cannot be before start date")
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker
                className="!w-full !rounded-md"
                format="YYYY-MM-DD"
                disabledDate={(current) =>
                  disableEndBeforeStart(
                    current as Dayjs,
                    editForm.getFieldValue("start_date")
                  )
                }
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-small text-gray-700">Reason</span>}
              name="reason"
              rules={[{ required: true, message: "Please enter a reason" }]}
            >
              <TextArea
                placeholder="Type a short reason…"
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
