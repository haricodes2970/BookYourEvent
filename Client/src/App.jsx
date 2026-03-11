import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Home            from './pages/Home';
import Login           from './pages/Login';
import Register        from './pages/Register';
import About           from './pages/About';
import BookerDashboard from './pages/BookerDashboard';
import OwnerDashboard  from './pages/OwnerDashboard';
import OwnerVenueDetails from './features/ownerDashboard/OwnerVenueDetails';
import AdminDashboard  from './pages/AdminDashboard';
import VenueDetail     from './pages/VenueDetail';
import MyBookings      from './pages/MyBookings';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import ForgotPassword  from './pages/ForgotPassword';
import HelpContact     from './pages/HelpContact';
import VerifyOTP       from './pages/VerifyOTP';
import NotFound        from './pages/NotFound';   // ✅ FIX #5

// Components
import LanguageSwitcher from './components/LanguageSwitcher';
import ErrorBoundary    from './components/ErrorBoundary';  // ✅ FIX #5

// ── ✅ FIX #5 — Protected route guard ──────────────────────────────────────
/**
 * ProtectedRoute
 * @param {string[]} roles  — allowed roles, e.g. ['admin'] or ['booker','venueOwner']
 *                            omit / pass [] to allow any authenticated user
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Authenticated but wrong role — redirect to their own dashboard
    const dashMap = {
      booker:      '/booker/dashboard',
      venueOwner:  '/owner/dashboard',
      admin:       '/admin/dashboard',
    };
    return <Navigate to={dashMap[user.role] || '/'} replace />;
  }

  return children;
};

function App() {
  return (
    // ✅ FIX #5 — ErrorBoundary wraps the whole tree
    <ErrorBoundary>
      <BrowserRouter>
        {/* Language switcher floats above everything */}
        <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 2000 }}>
          <LanguageSwitcher />
        </div>

        <Routes>
          {/* ── Public ───────────────────────────────────────────────── */}
          <Route path="/"               element={<Home />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/about"          element={<About />} />
          <Route path="/help"           element={<HelpContact />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp"     element={<VerifyOTP />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
          <Route path="/venue/:id"      element={<VenueDetail />} />

          {/* ── Booker — must be authenticated ────────────────────── */}
          <Route
            path="/booker/dashboard"
            element={
              <ProtectedRoute roles={['booker']}>
                <BookerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booker/my-bookings"
            element={
              <ProtectedRoute roles={['booker']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* ── Venue Owner ────────────────────────────────────────── */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute roles={['venueOwner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/venues/:id"
            element={
              <ProtectedRoute roles={['venueOwner']}>
                <OwnerVenueDetails />
              </ProtectedRoute>
            }
          />

          {/* ── Admin ──────────────────────────────────────────────── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── 404 catch-all ──────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
