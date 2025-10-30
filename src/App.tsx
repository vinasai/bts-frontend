// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Auth / Utils
import LoginPage from "./pages/auth/LoginPage";
import Employees from "./pages/employee/Employees";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import ClientPage from "./pages/client/ClientPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
// Pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import StaffCreate from "./pages/dashboard/StaffCreate";
import EmployeeList from "./pages/dashboard/EmployeeList";
import StaffDetails from "./pages/dashboard/StaffDetails";
import MyLeaves from "./pages/dashboard/MyLeaves";
import AdminLeaveApproval from "./pages/dashboard/AdminLeaveApproval";
import AdminAttendanceList from "./pages/dashboard/AdminAttendanceList";
import AttendanceSummary from "./pages/dashboard/AttendanceSummary";
import CreateAdminPage from "./pages/auth/CreateAdminPage";
import MyWFH from "./pages/dashboard/MyWFH";
import AdminWFH from "./pages/dashboard/AdminWFH";
import QRBoard from "./pages/qr/QRBoard";
import AttendancePage from "./pages/auth/AttendancePage";
import Clients from "./pages/clients/Clients";
import AddClient from "./pages/clients/AddClients";

export default function App() {
  return (
    <Routes>
      {/* 🔓 Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<DashboardLayout />}>
        <Route path="/employee-list" element={<EmployeeList />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/employees-profile" element={<EmployeeProfile />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/add" element={<AddClient />} />
        <Route path="/client-profile" element={<ClientPage />} />
      </Route>
      {/* 🌐 Catch-all: redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
