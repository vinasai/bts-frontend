import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Table, App, Tag, Select } from "antd";
import type { TableProps } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Button from "../../components/Button";
import Input from "../../components/Input";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

type ClientStatus = "Active" | "Inactive";

type ClientRow = {
  id: string;
  clientName: string;
  companyId: string;
  phoneNumber: string;
  email: string;
  linkedCompanies: string;
  status: ClientStatus;
};

const STATUS: ClientStatus[] = ["Active", "Inactive"];

// --- Toggle this while backend is not connected
const MOCK_MODE = true;

// --- Mock data based on your image
const MOCK_CLIENTS: ClientRow[] = [
  {
    id: "client_0001",
    clientName: "Ethan Harper",
    companyId: "12345",
    phoneNumber: "(555) 123-4567",
    email: "ethan.harper@techcorp.com",
    linkedCompanies: "TechCorp",
    status: "Active",
  },
  {
    id: "client_0002",
    clientName: "Olivia Bennett",
    companyId: "67890",
    phoneNumber: "(855) 887-6543",
    email: "olivia.bennett@greenleaf.com",
    linkedCompanies: "GreenLeaf",
    status: "Inactive",
  },
  {
    id: "client_0003",
    clientName: "Liam Carter",
    companyId: "11233",
    phoneNumber: "(555) 246-8012",
    email: "liam.carter@innovatesolutions.com",
    linkedCompanies: "Innovate Solutions",
    status: "Active",
  },
  {
    id: "client_0004",
    clientName: "Aev Morgan",
    companyId: "33445",
    phoneNumber: "(555) 135-7924",
    email: "aev.morgan@globalenterprises.com",
    linkedCompanies: "Global Enterprises",
    status: "Active",
  },
  {
    id: "client_0005",
    clientName: "Noah Foster",
    companyId: "55697",
    phoneNumber: "(555) 389-1215",
    email: "noah.foster@dynamicsystems.com",
    linkedCompanies: "Dynamic Systems",
    status: "Inactive",
  },
];

// --- Extended mock data generator for more clients
function makeMockClients(count = 80): ClientRow[] {
  const firstNames = [
    "Ethan", "Olivia", "Liam", "Aev", "Noah", "Sophia", "Mason", "Isabella", 
    "James", "Mia", "Benjamin", "Charlotte", "Lucas", "Amelia", "Henry", "Harper",
    "Alexander", "Evelyn", "Daniel", "Abigail", "Matthew", "Emily", "Jackson", "Elizabeth",
    "David", "Sofia", "Joseph", "Avery", "Samuel", "Ella", "John", "Scarlett", "Michael"
  ];
  const lastNames = [
    "Harper", "Bennett", "Carter", "Morgan", "Foster", "Cooper", "Richardson", "Woods",
    "Webb", "Griffin", "Murray", "Hayes", "Ford", "Mills", "Warren", "Fox",
    "Rose", "Stone", "Brooks", "Sullivan", "Russell", "Dixon", "Hamilton", "Graham",
    "Price", "Patterson", "Jordan", "Reynolds", "Fisher", "Spencer", "Gardner", "Stephens"
  ];
  const companies = [
    "TechCorp", "GreenLeaf", "Innovate Solutions", "Global Enterprises", "Dynamic Systems",
    "Alpha Tech", "Beta Solutions", "Gamma Industries", "Delta Corp", "Epsilon Systems",
    "Zenith Partners", "Apex Innovations", "Summit Group", "Pinnacle Tech", "Vertex Solutions",
    "Nexus Enterprises", "Catalyst Corp", "Horizon Group", "Infinity Systems", "Quantum Solutions"
  ];

  const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

  const pad = (n: number, len = 5) => String(n).padStart(len, "0");

  const toStatus = (i: number): ClientStatus => i % 7 === 0 ? "Inactive" : "Active";

  return Array.from({ length: count }).map((_, i) => {
    const fn = pick(firstNames, i + 2);
    const ln = pick(lastNames, i + 5);
    const clientName = `${fn} ${ln}`;
    const companyId = pad(10000 + i);
    const phoneNumber = `(555) ${String(100 + (i % 900)).padStart(3, "0")}-${String(1000 + (i * 7) % 9000).padStart(4, "0")}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase().replace(/\s+/g, '')}@${pick(companies, i + 3).toLowerCase().replace(/\s+/g, '')}.com`;
    const linkedCompanies = pick(companies, i + 3);
    const status = toStatus(i);

    return {
      id: `client_${pad(i, 4)}`,
      clientName,
      companyId,
      phoneNumber,
      email,
      linkedCompanies,
      status,
    };
  });
}

// Use extended mock data if needed
const EXTENDED_MOCK_CLIENTS = makeMockClients();

export default function Clients() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);

  // toolbar state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ClientStatus>("All");

  // pagination state (page-per-view)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { message } = App.useApp();
  const topRef = useRef<HTMLDivElement | null>(null);

  // ---- Fetch clients (mock or real)
  const fetchClients = async () => {
    setLoading(true);
    try {
      if (MOCK_MODE) {
        // Simulate network latency
        await new Promise((r) => setTimeout(r, 600));
        setRows(EXTENDED_MOCK_CLIENTS);
      } else {
        // Adjust the endpoint to your API
        const res = await axiosInstance.get("/clients");
        const data: ClientRow[] = (res.data || []).map((r: any) => ({
          id: r.id,
          clientName: r.clientName,
          companyId: r.companyId,
          phoneNumber: r.phoneNumber,
          email: r.email,
          linkedCompanies: r.linkedCompanies,
          status: (String(r.status || "Active")
            .charAt(0)
            .toUpperCase() +
            String(r.status || "Active")
              .slice(1)
              .toLowerCase()) as ClientStatus,
        }));
        setRows(data);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Filters + search
  const visibleRows = useMemo(() => {
    let list = rows;

    if (statusFilter !== "All") {
      list = list.filter((r) => r.status === statusFilter);
    }

    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) =>
      [r.clientName, r.companyId, r.phoneNumber, r.email, r.linkedCompanies, r.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query, statusFilter]);

  // ---- Client-side pagination
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return visibleRows.slice(start, end);
  }, [visibleRows, page, pageSize]);

  // ---- Table columns
  const columns: TableProps<ClientRow>["columns"] = [
    {
      title: "Client Name",
      dataIndex: "clientName",
      sorter: (a, b) => a.clientName.localeCompare(b.clientName),
      render: (v) => <span className="font-medium">{v}</span>,
      width: 200,
    },
    {
      title: "Company ID",
      dataIndex: "companyId",
      sorter: (a, b) => a.companyId.localeCompare(b.companyId),
      width: 140,
    },
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      sorter: (a, b) => a.phoneNumber.localeCompare(b.phoneNumber),
      width: 180,
      render: (v: string) => <a href={`tel:${v}`}>{v}</a>,
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
      width: 240,
      ellipsis: true,
      render: (v: string) => (
        <a href={`mailto:${v}`} className="text-primary hover:underline">
          {v}
        </a>
      ),
    },
    {
      title: "Linked Companies",
      dataIndex: "linkedCompanies",
      sorter: (a, b) => a.linkedCompanies.localeCompare(b.linkedCompanies),
      width: 200,
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      width: 120,
      render: (s: ClientStatus) => {
        const key = s.toLowerCase();
        const color = key === "active" ? "green" : "red";
        return (
          <Tag color={color} style={{ marginInlineEnd: 0 }}>
            {s.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page header: title left, action right */}
      <div className="py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: title */}
          <div className="flex-2 min-w-0">
            <h1 className="text-title uppercase text-ink">Clients</h1>
          </div>

          {/* Right: action button */}
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate("/clients/add")}
          >
            Add Client
          </Button>
        </div>
      </div>

      <Card className="!rounded-2xl !shadow !border-0">
        {/* Toolbar */}
        <div className="mb-3 space-y-3">
          {/* Row: search (left) + filters (right) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search left */}
            <div className="w-full max-w-md">
              <Input
                placeholder="Search clients…"
                prefix={<SearchOutlined />}
                allowClear
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filters right */}
            <div className="w-full sm:w-auto sm:ml-auto flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                allowClear={false}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as "All" | ClientStatus);
                  setPage(1);
                }}
                options={[
                  { value: "All", label: "All Statuses" },
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" }
                ]}
                className="min-w-[160px]"
                placeholder="Status"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div ref={topRef} />
        <Table<ClientRow>
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
    </div>
  );
}