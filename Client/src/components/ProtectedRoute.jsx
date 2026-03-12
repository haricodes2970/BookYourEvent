import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * If `role` prop is provided, also checks the user's role.
 * Roles: "booker" | "venueOwner" | "admin"
 */
export default function ProtectedRoute({ children, role }) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Redirect to their own dashboard if they hit the wrong one
    const redirectMap = {
      booker:     "/booker/dashboard",
      venueOwner: "/owner/dashboard",
      admin:      "/admin/dashboard",
    };
    return <Navigate to={redirectMap[user.role] || "/login"} replace />;
  }

  return children;
}
