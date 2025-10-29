import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout, Button, Avatar, Menu, Drawer, Grid } from "antd";
import type { MenuProps } from "antd";
import {
  MenuOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  FileAddOutlined,
  OrderedListOutlined,
  DollarOutlined,
  IdcardOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import Container from "./Container";

const { useBreakpoint } = Grid;

type Props = {
  brand?: string;
};

export default function Navbar({ brand = "SPEEDEX" }: Props) {
  const [open, setOpen] = useState(false);
  const screens = useBreakpoint();
  const isDesktop = screens.lg;
  const location = useLocation();
  const navigate = useNavigate();

  // Map route -> menu key
  const routeToKey = (path: string) => {
    if (path.startsWith("/documents/add")) return "documents:add";
    if (path.startsWith("/documents/list")) return "documents:list";
    if (path.startsWith("/documents")) return "documents";
    if (path.startsWith("/clients")) return "clients";
    if (path.startsWith("/tasks")) return "tasks";
    if (path.startsWith("/invoices")) return "invoices";
    if (path.startsWith("/employees")) return "employees";
    return "dashboard";
  };

  const currentKey = routeToKey(location.pathname);

  // If a child under "documents" is active, also mark the parent "documents"
  const selectedKeys = useMemo(() => {
    if (currentKey.startsWith("documents:")) {
      return ["documents", currentKey];
    }
    return [currentKey];
  }, [currentKey]);

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    // centralize navigation by key
    switch (key) {
      case "dashboard":
        navigate("/dashboard");
        break;
      case "clients":
        navigate("/clients");
        break;
      case "tasks":
        navigate("/tasks");
        break;
      case "invoices":
        navigate("/invoices");
        break;
      case "employees":
        navigate("/employees");
        break;
      case "documents":
      case "documents:add":
        navigate("/documents/add");
        break;
      case "documents:list":
        navigate("/documents/list");
        break;
      default:
        break;
    }
    setOpen(false);
  };

  // One unified items definition (desktop & mobile)
  const items: MenuProps["items"] = [
    { key: "dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
    { key: "clients", label: "Clients", icon: <IdcardOutlined /> },
    { key: "tasks", label: "Tasks", icon: <CheckSquareOutlined /> },
    {
      key: "documents",
      label: "Documents",
      icon: <FileTextOutlined />,
      children: [
        { key: "documents:add", label: "Add", icon: <FileAddOutlined /> },
        { key: "documents:list", label: "List", icon: <OrderedListOutlined /> },
      ],
    },
    { key: "invoices", label: "Invoices", icon: <DollarOutlined /> },
    { key: "employees", label: "Employees", icon: <TeamOutlined /> },
  ];

  return (
    <Layout.Header className="!sticky !top-0 !z-40 !h-16 !px-0 !bg-white border-b border-gray-200">
      <Container className="flex h-full items-center">
        {/* Left section: brand + (mobile) hamburger */}
        {!isDesktop ? (
          <div className="flex items-center gap-3 flex-1">
            <Button
              type="text"
              icon={<MenuOutlined />}
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="!text-gray-700 hover:!bg-gray-100"
            />
            <div className="font-heading text-xl tracking-wide text-gray-900">
              {brand}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="font-heading text-xl tracking-wide text-gray-900">
              {brand}
            </div>
          </div>
        )}

        {/* Right: desktop menu + profile */}
        {isDesktop ? (
          <div className="flex items-center gap-4">
            <Menu
              mode="horizontal"
              disabledOverflow
              items={items}
              onClick={onMenuClick}
              selectedKeys={selectedKeys}
              className="
                border-none
                [&_.ant-menu-item]:!px-3
                [&_.ant-menu-submenu-title]:!px-3
                [&_.ant-menu-title-content]:!font-medium
                [&_.ant-menu-item-selected]:!bg-primary/10
                [&_.ant-menu-item-selected]:!text-primary
                [&_.ant-menu-submenu-selected_.ant-menu-submenu-title]:!text-primary
                [&_.ant-menu-submenu-selected_.ant-menu-submenu-title]:!bg-primary/10
                [&_.ant-menu-item:hover]:!bg-gray-100
                [&_.ant-menu-submenu-title:hover]:!bg-gray-100
              "
            />
            <Avatar
              size={28}
              icon={<UserOutlined />}
              className="bg-gray-200 text-gray-700"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar
              size={28}
              icon={<UserOutlined />}
              className="bg-gray-200 text-gray-700"
            />
          </div>
        )}
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        title={brand}
        placement="left"
        open={open}
        onClose={() => setOpen(false)}
        closable={false}
        bodyStyle={{ padding: 0 }}
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setOpen(false)}
            className="!text-gray-700 hover:!bg-gray-100"
          />
        }
        styles={{
          header: {
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
          },
          body: { padding: 0 },
        }}
      >
        <Menu
          mode="inline"
          items={items}
          onClick={onMenuClick}
          selectedKeys={selectedKeys}
          className="
      [&_.ant-menu-title-content]:!font-medium
      [&_.ant-menu-item-selected]:!bg-primary/10
      [&_.ant-menu-item-selected]:!text-primary
      [&_.ant-menu-submenu-selected_.ant-menu-submenu-title]:!text-primary
      [&_.ant-menu-submenu-selected_.ant-menu-submenu-title]:!bg-primary/10
    "
        />
      </Drawer>
    </Layout.Header>
  );
}
