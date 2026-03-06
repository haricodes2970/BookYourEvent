import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import BookerDashboard from './pages/BookerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VenueDetail from './pages/VenueDetail';
import MyBookings from './pages/MyBookings';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import ForgotPassword from './pages/ForgotPassword';
import HelpContact from './pages/HelpContact';
import VerifyOTP from './pages/VerifyOTP';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/booker/dashboard" element={<BookerDashboard />} />
                <Route path="/booker/my-bookings" element={<MyBookings />} />
                <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/venue/:id" element={<VenueDetail />} />
                <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
                <Route path="/help" element={<HelpContact />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;