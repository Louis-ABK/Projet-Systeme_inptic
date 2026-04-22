import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/lib/auth-store";

export const ProtectedRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role;
}) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/etudiant"} replace />;
  }
  return <>{children}</>;
};
