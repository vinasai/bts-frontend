// src/components/RoleProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Props = {
  roles: string[]; // allowed roles
};

export default function RoleProtectedRoute({ roles }: Props) {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(currentUser!.role)) {
    return <Navigate to="/" replace />; // redirect if role not allowed
  }

  return <Outlet />;
}
