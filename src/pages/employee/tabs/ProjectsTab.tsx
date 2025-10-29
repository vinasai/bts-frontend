import { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import type { ProjectRow } from "../types";

type Props = { data: ProjectRow[] };

export default function ProjectsTab({ data }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination if data length changes
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(data.length / pageSize));
    if (page > maxPage) setPage(1);
  }, [data, page, pageSize]);

  return (
    <div className="pt-2">
      <Table<ProjectRow>
        rowKey="id"
        size="middle"
        className="rounded-xl"
        dataSource={data}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            width: 220,
            render: (v: string) => <span className="font-medium">{v}</span>,
          },
          {
            title: "Code",
            dataIndex: "code",
            sorter: (a, b) => a.code.localeCompare(b.code),
            width: 120,
          },
          {
            title: "Role",
            dataIndex: "role",
            sorter: (a, b) => a.role.localeCompare(b.role),
            width: 180,
          },
          {
            title: "Period",
            width: 220,
            sorter: (a, b) => a.start.localeCompare(b.start),
            render: (_, r) => `${r.start} — ${r.end ?? "Present"}`,
          },
          {
            title: "Status",
            dataIndex: "status",
            sorter: (a, b) => a.status.localeCompare(b.status),
            width: 140,
            render: (s: ProjectRow["status"]) => {
              const color =
                s === "Active"
                  ? "green"
                  : s === "Completed"
                    ? "blue"
                    : "orange";
              return (
                <Tag color={color} style={{ marginInlineEnd: 0 }}>
                  {s.toUpperCase()}
                </Tag>
              );
            },
          },
        ]}
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize,
          total: data.length,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50, 100],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
          position: ["bottomRight"],
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </div>
  );
}
