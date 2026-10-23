import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

function RouteLoading() {
  return <div className="route-loading" role="status">Memeriksa sesi...</div>;
}

export function ProtectedRoute() {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <RouteLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function RoleRoute({ role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/satpam"} replace />;
  }
  return <Outlet />;
}
