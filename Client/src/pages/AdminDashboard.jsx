import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Book<span className="text-blue-400">Your</span>Event</h1>
                <div className="flex items-center gap-4">
                    <span className="text-blue-200 text-sm">Admin: {user?.name}</span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg text-sm transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>
            <div className="p-6">
                <h2 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h2>
                <p className="text-blue-300 mb-8">Platform overview and controls</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Total Users</p>
                        <p className="text-4xl font-bold text-white mt-1">0</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Total Venues</p>
                        <p className="text-4xl font-bold text-white mt-1">0</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Total Bookings</p>
                        <p className="text-4xl font-bold text-white mt-1">0</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Pending Approvals</p>
                        <p className="text-4xl font-bold text-white mt-1">0</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Pending Venue Approvals</h3>
                        <p className="text-blue-300">No pending approvals...</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Recent Bookings</h3>
                        <p className="text-blue-300">No recent bookings...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;