import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BookerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            {/* Navbar */}
            <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Book<span className="text-blue-400">Your</span>Event</h1>
                <div className="flex items-center gap-4">
                    <span className="text-blue-200 text-sm">Welcome, {user?.name}</span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg text-sm transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Content */}
            <div className="p-6">
                <h2 className="text-3xl font-bold text-white mb-2">Find Your Perfect Venue</h2>
                <p className="text-blue-300 mb-8">Discover and book amazing venues in Bangalore</p>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">My Bookings</p>
                        <p className="text-4xl font-bold text-white mt-1">0</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Upcoming Events</p>
                        <p className="text-4xl font-bold text-white mt-1">0</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Reviews Given</p>
                        <p className="text-4xl font-bold text-white mt-1">0</p>
                    </div>
                </div>

                {/* Venues Section */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Available Venues</h3>
                    <p className="text-blue-300">Venues will appear here soon...</p>
                </div>
            </div>
        </div>
    );
};

export default BookerDashboard;