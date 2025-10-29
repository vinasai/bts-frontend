// AuthLayout.tsx
// AuthLayout.tsx
import type { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import { Layout } from "antd";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <Layout className="min-h-screen">
      <Layout.Content className="flex items-center justify-center">
        <div className="container-app">{children ?? <Outlet />}</div>
      </Layout.Content>

      <Layout.Footer className="!text-center !py-4 !bg-primary !text-white !text-sm">
        © {new Date().getFullYear()} — All rights reserved
      </Layout.Footer>
    </Layout>
  );
}
