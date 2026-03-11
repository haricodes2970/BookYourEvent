import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import BookerDashboard from './pages/BookerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerVenueDetails from './features/ownerDashboard/OwnerVenueDetails';
import AdminDashboard from './pages/AdminDashboard';
import VenueDetail from './pages/VenueDetail';
import MyBookings from './pages/MyBookings';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import ForgotPassword from './pages/ForgotPassword';
import HelpContact from './pages/HelpContact';
import VerifyOTP from './pages/VerifyOTP';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/venue/:id" element={<VenueDetail />} />
          <Route path="/help" element={<HelpContact />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
          <Route path="/booker/dashboard" element={<BookerDashboard />} />
          <Route path="/booker/my-bookings" element={<MyBookings />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/venues/:id" element={<OwnerVenueDetails />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>

  );
}

export default App;
