import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllVenues } from '../services/venueService';

const BookerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const data = await getAllVenues();
                setVenues(data.venues);
            } catch (err) {
                setError('Failed to load venues');
            } finally {
                setLoading(false);
            }
        };
        fetchVenues();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Book<span className="text-blue-400">Your</span>Event</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/booker/my-bookings')}
                        className="text-blue-300 hover:text-white text-sm transition"
                    >
                        My Bookings
                    </button>
                    <span className="text-blue-200 text-sm">Welcome, {user?.name}</span>
                    <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg text-sm transition">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="p-6">
                <h2 className="text-3xl font-bold text-white mb-2">Find Your Perfect Venue</h2>
                <p className="text-blue-300 mb-8">Discover and book amazing venues in Bangalore</p>

                {loading && (
                    <div className="text-center py-20">
                        <p className="text-blue-300 text-lg">Loading venues...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {venues.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-blue-300 text-lg">No venues available yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {venues.map(venue => (
                                    <div
                                        key={venue._id}
                                        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:border-blue-400 transition cursor-pointer"
                                        onClick={() => navigate(`/venue/${venue._id}`)}
                                    >
                                        <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full">
                                            {venue.type}
                                        </span>
                                        <h3 className="text-xl font-bold text-white mt-3 mb-1">{venue.name}</h3>
                                        <p className="text-blue-300 text-sm mb-3">
                                            📍 {venue.location.address}, {venue.location.city}
                                        </p>
                                        <p className="text-white/60 text-sm mb-4 line-clamp-2">{venue.description}</p>
                                        <div className="flex justify-between items-center border-t border-white/10 pt-4">
                                            <div>
                                                <p className="text-white/40 text-xs">Capacity</p>
                                                <p className="text-white font-semibold">{venue.capacity} guests</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white/40 text-xs">Starting from</p>
                                                <p className="text-blue-400 font-bold">₹{venue.pricePerHour}/hr</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {venue.amenities?.slice(0, 3).map((amenity, index) => (
                                                <span key={index} className="bg-white/5 text-white/50 text-xs px-2 py-1 rounded">
                                                    {amenity}
                                                </span>
                                            ))}
                                            {venue.amenities?.length > 3 && (
                                                <span className="bg-white/5 text-white/50 text-xs px-2 py-1 rounded">
                                                    +{venue.amenities.length - 3} more
                                                </span>
                                            )}
                                        </div>
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

export default BookerDashboard;