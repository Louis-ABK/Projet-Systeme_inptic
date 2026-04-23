import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role;
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/etudiant"} replace />;
  }
  return <>{children}</>;
};
