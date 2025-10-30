import type { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import Container from "../components/Container";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <Layout className="min-h-[100svh] grid grid-rows-[1fr_auto] overflow-hidden">
      {/* Only this scrolls if necessary */}
      <Layout.Content className="min-h-0 w-full !p-0 overflow-auto">
        {children ?? <Outlet />}
      </Layout.Content>

      <Layout.Footer className="!bg-primary !py-2 !text-white">
        <Container className="!text-center !text-xs">
          © {new Date().getFullYear()} — All rights reserved
        </Container>
      </Layout.Footer>
    </Layout>
  );
}
