import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, approveVenue, getAllVenuesAdmin } from '../services/adminService';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('venues');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersData, venuesData] = await Promise.all([
                getAllUsers(),
                getAllVenuesAdmin()
            ]);
            setUsers(usersData.users);
            setVenues(venuesData.venues);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveVenue = async (venueId) => {
        try {
            await approveVenue(venueId);
            setVenues(venues.map(v =>
                v._id === venueId ? { ...v, isApproved: true } : v
            ));
            setSuccess('Venue approved successfully');
        } catch (err) {
            setError('Failed to approve venue');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const pendingVenues = venues.filter(v => !v.isApproved);
    const approvedVenues = venues.filter(v => v.isApproved);
    const bookers = users.filter(u => u.role === 'booker');
    const owners = users.filter(u => u.role === 'venueOwner');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Book<span className="text-blue-400">Your</span>Event</h1>
                <div className="flex items-center gap-4">
                    <span className="text-blue-200 text-sm">Admin: {user?.name}</span>
                    <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg text-sm transition">Logout</button>
                </div>
            </nav>

            <div className="p-6">
                <h2 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h2>
                <p className="text-blue-300 mb-6">Platform overview and controls</p>

                {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
                {success && <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-4">{success}</div>}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Total Users</p>
                        <p className="text-4xl font-bold text-white mt-1">{users.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Total Venues</p>
                        <p className="text-4xl font-bold text-white mt-1">{venues.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Pending Approval</p>
                        <p className="text-4xl font-bold text-yellow-400 mt-1">{pendingVenues.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm">Approved Venues</p>
                        <p className="text-4xl font-bold text-green-400 mt-1">{approvedVenues.length}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setActiveTab('venues')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'venues' ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-300 hover:bg-white/20'}`}
                    >
                        Venues {pendingVenues.length > 0 && `(${pendingVenues.length} pending)`}
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'users' ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-300 hover:bg-white/20'}`}
                    >
                        Users ({users.length})
                    </button>
                </div>

                {loading ? (
                    <p className="text-blue-300">Loading data...</p>
                ) : (
                    <>
                        {/* Venues Tab */}
                        {activeTab === 'venues' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {venues.map(venue => (
                                    <div key={venue._id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full">{venue.type}</span>
                                            <span className={`text-xs px-3 py-1 rounded-full ${venue.isApproved ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                                {venue.isApproved ? 'Approved' : 'Pending'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">{venue.name}</h3>
                                        <p className="text-blue-300 text-sm mb-1">📍 {venue.location?.address}</p>
                                        <p className="text-white/50 text-sm mb-3">Owner: {venue.owner?.name}</p>
                                        <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                            <p className="text-blue-400 font-bold">₹{venue.pricePerHour}/hr</p>
                                            {!venue.isApproved && (
                                                <button
                                                    onClick={() => handleApproveVenue(venue._id)}
                                                    className="bg-green-500/20 hover:bg-green-500/40 text-green-300 px-4 py-2 rounded-lg text-sm transition"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {users.map(u => (
                                    <div key={u._id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-white font-bold">{u.name}</h3>
                                            <span className={`text-xs px-3 py-1 rounded-full ${
                                                u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                                                u.role === 'venueOwner' ? 'bg-blue-500/20 text-blue-300' :
                                                'bg-green-500/20 text-green-300'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </div>
                                        <p className="text-blue-300 text-sm">{u.email}</p>
                                        <p className="text-white/50 text-sm">{u.phone}</p>
                                        <p className="text-white/30 text-xs mt-2">
                                            Joined: {new Date(u.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;