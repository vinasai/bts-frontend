// src/pages/dashboard/DashboardHome.tsx
import PageHeader from "../../components/PageHeader";

export default function DashboardHome() {
  return (
    <div className="space-y-4">
      <div className="py-4">
        <PageHeader title="Rim Dashboard" />
      </div>
      <div className="card p-6">Content goes here…</div>
    </div>
  );
}
