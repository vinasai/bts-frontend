// src/components/MobileNavbar.tsx
import { Layout, Button, Divider, Avatar } from "antd";
import {
  MenuOutlined,
  BarChartOutlined,
  UserOutlined,
} from "@ant-design/icons";

type Props = { onOpenMenu: () => void };

export default function MobileNavbar({ onOpenMenu }: Props) {
  return (
    <Layout.Header className="!sticky !top-0 !z-40 !h-14 !bg-black !text-white !px-0 lg:!hidden flex items-center">
      {/* left: hamburger + brand */}
      <div className="flex items-center gap-3 flex-1 px-4">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="!text-white/90 hover:!bg-white/10"
        />
        <div className="font-heading text-xl tracking-wide">SPEEDEX</div>
      </div>

      {/* right: actions in primary background block */}
      <div className="flex items-center gap-4 bg-primary px-6 h-full rounded-bl-2xl">
        <BarChartOutlined className="text-white text-xl" />
        <Divider type="vertical" className="!border-white/50 !h-5" />
        <Avatar
          size={24}
          icon={<UserOutlined className="text-primary" />}
          style={{ backgroundColor: "white" }}
        />
      </div>
    </Layout.Header>
  );
}
