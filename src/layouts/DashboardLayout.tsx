import type { PropsWithChildren } from "react";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Layout } from "antd";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/MobileNavbar";

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    // ...
    <Layout className="min-h-screen bg-gray-50 !flex-row items-stretch">
      <Sidebar
        activePath={pathname}
        open={open}
        onClose={() => setOpen(false)}
      />

      {/* Main column on the right */}
      <Layout className="flex flex-col flex-1 min-w-0">
        {/* add min-w-0 */}
        <Navbar onOpenMenu={() => setOpen(true)} />

        <Layout.Content className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden min-w-0">
          {/* add min-w-0 (and keep overflow-x-hidden) */}
          {children ?? <Outlet />}
        </Layout.Content>

        <Layout.Footer className="!text-center !py-4 !bg-primary !text-white !text-sm">
          © {new Date().getFullYear()} — All rights reserved
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}
