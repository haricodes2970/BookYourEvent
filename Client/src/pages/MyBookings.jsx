import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/bookingService';

const MyBookings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await getMyBookings();
                setBookings(data.bookings);
            } catch (err) {
                setError('Failed to load bookings');
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white cursor-pointer" onClick={() => navigate('/booker/dashboard')}>
                    Book<span className="text-blue-400">Your</span>Event
                </h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/booker/dashboard')} className="text-blue-300 hover:text-white text-sm transition">
                        Browse Venues
                    </button>
                    <span className="text-blue-200 text-sm">Welcome, {user?.name}</span>
                    <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg text-sm transition">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="p-6">
                <h2 className="text-3xl font-bold text-white mb-2">My Bookings</h2>
                <p className="text-blue-300 mb-8">Track all your venue bookings</p>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="text-blue-300">Loading your bookings...</p>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-blue-300 text-lg mb-4">No bookings yet.</p>
                        <button
                            onClick={() => navigate('/booker/dashboard')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition"
                        >
                            Browse Venues
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map(booking => (
                            <div key={booking._id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-white">{booking.venue?.name}</h3>
                                    <span className={`text-xs px-3 py-1 rounded-full ${
                                        booking.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                                        booking.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                                        booking.status === 'cancelled' ? 'bg-gray-500/20 text-gray-300' :
                                        'bg-yellow-500/20 text-yellow-300'
                                    }`}>
                                        {booking.status}
                                    </span>
                                </div>

                                <p className="text-blue-300 text-sm mb-4">
                                    📍 {booking.venue?.location?.address}
                                </p>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <p className="text-white/40 text-xs">Date</p>
                                        <p className="text-white text-sm">{new Date(booking.eventDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs">Time</p>
                                        <p className="text-white text-sm">{booking.startTime} - {booking.endTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs">Guests</p>
                                        <p className="text-white text-sm">{booking.guestCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs">Total Paid</p>
                                        <p className="text-blue-400 font-bold">₹{booking.totalPrice}</p>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-3">
                                    <p className="text-white/40 text-xs">Owner</p>
                                    <p className="text-white text-sm">{booking.venue?.owner?.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;