import type { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import Navbar from "../components/Navbar";
import Container from "../components/Container";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <Layout className="min-h-screen bg-gray-50 !flex-row items-stretch">
      <Layout className="flex flex-col flex-1 min-w-0">
        <Navbar />

        <Layout.Content className="flex-1 overflow-x-hidden min-w-0">
          <Container className="py-6">{children ?? <Outlet />}</Container>
        </Layout.Content>

        <Layout.Footer className="!bg-primary !py-2 !text-white">
          <Container className="!text-center !text-xs">
            © {new Date().getFullYear()} — All rights reserved
          </Container>
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}
