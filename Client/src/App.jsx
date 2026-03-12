import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import Home             from "./pages/Home";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import ForgotPassword   from "./pages/ForgotPassword";
import VerifyOTP        from "./pages/VerifyOTP";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import BookerDashboard  from "./pages/BookerDashboard";
import OwnerDashboard   from "./pages/OwnerDashboard";
import AdminDashboard   from "./pages/AdminDashboard";
import VenueDetail      from "./pages/VenueDetail";
import MyBookings       from "./pages/MyBookings";
import About            from "./pages/About";
import HelpContact      from "./pages/HelpContact";
import NotFound         from "./pages/NotFound";

// ─── BUG-13 FIX: ProtectedRoute — was missing entirely ──────────────────────
function ProtectedRoute({ children, role }) {
  const { user, token } = useAuth();

  if (!token || !user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    const map = {
      booker:     "/booker/dashboard",
      venueOwner: "/owner/dashboard",
      admin:      "/admin/dashboard",
    };
    return <Navigate to={map[user.role] || "/login"} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                    element={<Home />} />
      <Route path="/login"               element={<Login />} />
      <Route path="/register"            element={<Register />} />
      <Route path="/forgot-password"     element={<ForgotPassword />} />
      <Route path="/verify-otp"          element={<VerifyOTP />} />
      <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
      <Route path="/venue/:id"           element={<VenueDetail />} />
      <Route path="/about"               element={<About />} />
      <Route path="/help"                element={<HelpContact />} />

      {/* Protected — role-gated */}
      <Route path="/booker/dashboard" element={
        <ProtectedRoute role="booker">
          <BookerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/my-bookings" element={
        <ProtectedRoute role="booker">
          <MyBookings />
        </ProtectedRoute>
      } />

      <Route path="/owner/dashboard" element={
        <ProtectedRoute role="venueOwner">
          <OwnerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
