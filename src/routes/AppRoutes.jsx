import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import LoginPage from "../pages/LoginPage";
import NotFound from "../pages/NotFound";
import ParkingView from "../pages/ParkingView";
import PublicParking from "../pages/PublicParking";
import { ProtectedRoute, RoleRoute } from "./ProtectedRoute";

function DashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "admin" ? "/admin" : "/satpam"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicParking />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route element={<RoleRoute role="admin" />}>
          <Route path="/admin" element={<ParkingView />} />
        </Route>
        <Route element={<RoleRoute role="satpam" />}>
          <Route path="/satpam" element={<ParkingView />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
