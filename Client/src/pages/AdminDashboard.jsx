import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, deleteUser, updateUserRole, approveVenue, adminDeleteVenue, getAllVenuesAdmin, getAllBookingsAdmin } from '../services/adminService';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [venues, setVenues] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('venues');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [usersData, venuesData, bookingsData] = await Promise.all([
                getAllUsers(), getAllVenuesAdmin(), getAllBookingsAdmin()
            ]);
            setUsers(usersData.users);
            setVenues(venuesData.venues);
            setBookings(bookingsData.bookings);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
    const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 3000); };

    const handleApproveVenue = async (venueId) => {
        try {
            await approveVenue(venueId);
            setVenues(venues.map(v => v._id === venueId ? { ...v, isApproved: true } : v));
            showSuccess('Venue approved successfully');
        } catch (err) { showError('Failed to approve venue'); }
    };

    const handleDeleteVenue = async (venueId) => {
        if (!window.confirm('Delete this venue permanently?')) return;
        try {
            await adminDeleteVenue(venueId);
            setVenues(venues.filter(v => v._id !== venueId));
            showSuccess('Venue deleted');
        } catch (err) { showError('Failed to delete venue'); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Delete this user permanently?')) return;
        try {
            await deleteUser(userId);
            setUsers(users.filter(u => u._id !== userId));
            showSuccess('User deleted');
        } catch (err) { showError('Failed to delete user'); }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            await updateUserRole(userId, role);
            setUsers(users.map(u => u._id === userId ? { ...u, role } : u));
            showSuccess(`Role updated to ${role}`);
        } catch (err) { showError('Failed to update role'); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const pendingVenues = venues.filter(v => !v.isApproved);
    const approvedVenues = venues.filter(v => v.isApproved);
    const bookers = users.filter(u => u.role === 'booker');
    const owners = users.filter(u => u.role === 'venueOwner');

    const venueEmoji = (type) => ({
        'Resort': '🏖️', 'Rooftop': '🌆', 'Farmhouse': '🌾',
        'Marriage Hall': '💒', 'Party Hall': '🎉', 'Conference Room': '🏢',
        'Banquet Hall': '🍽️', 'Turf': '⚽', 'Studio': '🎨', 'Auditorium': '🎭'
    }[type] || '🏛️');

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col" style={{
            background: 'linear-gradient(180deg, #050d18 0%, #0a1628 30%, #0d1f35 60%, #081420 100%)'
        }}>
            {/* Glow orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #00ffcc, transparent)', filter: 'blur(80px)' }}/>
            <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full opacity-8 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #aa44ff, transparent)', filter: 'blur(80px)' }}/>

            {/* Circuit lines */}
            <svg className="absolute top-0 left-0 w-full opacity-5 pointer-events-none" height="400" viewBox="0 0 1440 400">
                <path d="M0 100 L200 100 L200 150 L400 150 L400 80 L600 80 L600 200 L800 200 L800 120 L1440 120" stroke="#00ffcc" strokeWidth="1" fill="none"/>
                <path d="M0 250 L300 250 L300 180 L500 180 L500 300 L700 300 L700 220 L1440 220" stroke="#aa44ff" strokeWidth="1" fill="none"/>
                <circle cx="200" cy="100" r="3" fill="#00ffcc"/>
                <circle cx="400" cy="150" r="3" fill="#00ffcc"/>
                <circle cx="300" cy="250" r="3" fill="#aa44ff"/>
            </svg>

            {/* Bottom plants */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
                    <path d="M0 180 Q180 110 360 145 Q540 100 720 138 Q900 105 1080 135 Q1260 108 1440 128 L1440 180Z" fill="#00ffcc" opacity="0.04"/>
                    {[30,90,160,240,320,400,490,570,650,730,820,900,990,1070,1150,1230,1310,1390].map((x,i)=>(
                        <g key={i}>
                            <line x1={x} y1="180" x2={x-((i%3)-1)*4} y2={128+(i%5)*8}
                                stroke={['#00ffcc','#aa44ff','#0088ff','#00ccff'][i%4]} strokeWidth="1" opacity="0.4"/>
                            <ellipse cx={x-((i%3)-1)*4} cy={120+(i%5)*8} rx={4+(i%3)} ry={8+(i%3)}
                                fill={['#00ffcc22','#aa44ff22','#0088ff22','#00ccff22'][i%4]} opacity="0.6"/>
                        </g>
                    ))}
                </svg>
            </div>

            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs italic z-10 tracking-widest pointer-events-none"
                style={{ color: '#00ffcc88' }}>EASY. BOOK. ENJOY.</p>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-8">
                    <img src="/logo.png" alt="BYE" className="h-14 w-14 rounded-full object-cover shadow-lg cursor-pointer"
                        style={{ boxShadow: '0 0 20px rgba(0,255,204,0.3)' }}
                        onClick={() => navigate('/')}
                        onError={(e)=>{e.target.style.display='none'}}/>
                    {['venues','users','bookings'].map(tab => (
                        <button key={tab} onClick={()=>setActiveTab(tab)}
                            className="text-sm font-medium transition capitalize"
                            style={{ color: activeTab===tab ? '#00ffcc' : 'rgba(255,255,255,0.5)' }}>
                            {tab === 'venues' ? 'Manage Venues' : tab === 'users' ? 'Manage Users' : 'All Bookings'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(0,255,204,0.05)', border: '1px solid rgba(0,255,204,0.2)' }}>
                    <input type="text" placeholder="Search..." value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm focus:outline-none w-44"
                        style={{ color: 'rgba(255,255,255,0.7)', caretColor: '#00ffcc' }}/>
                    <span style={{ color: '#00ffcc88' }}>🔍</span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Hi, {user?.name?.split(' ')[0]}
                    </span>
                    <button onClick={handleLogout}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition"
                        style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', color: '#ff8080' }}>
                        Log Out
                    </button>
                </div>
            </nav>

            {/* Page Title */}
            <div className="relative z-10 px-8 pt-2 pb-4">
                <h1 className="text-2xl font-bold" style={{ color: '#00ffcc' }}>Admin Dashboard</h1>
                <p className="text-xs tracking-widest uppercase mt-0.5" style={{ color: 'rgba(170,68,255,0.8)' }}>
                    System Overview & Management
                </p>
            </div>

            {/* Alerts */}
            <div className="relative z-10 px-8">
                {error && <div className="px-4 py-2 rounded-lg mb-3 text-sm" style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff8080' }}>{error}</div>}
                {success && <div className="px-4 py-2 rounded-lg mb-3 text-sm" style={{ background: 'rgba(0,255,204,0.08)', border: '1px solid rgba(0,255,204,0.3)', color: '#00ffcc' }}>{success}</div>}
            </div>

            {/* Stats */}
            <div className="relative z-10 px-8 mb-4">
                <div className="grid grid-cols-5 gap-4">
                    {[
                        { label: 'Total Users', value: users.length, color: '#00ffcc', glow: 'rgba(0,255,204,0.1)' },
                        { label: 'Bookers', value: bookers.length, color: '#0088ff', glow: 'rgba(0,136,255,0.1)' },
                        { label: 'Venue Owners', value: owners.length, color: '#aa44ff', glow: 'rgba(170,68,255,0.1)' },
                        { label: 'Pending Venues', value: pendingVenues.length, color: '#ffaa00', glow: 'rgba(255,170,0,0.1)' },
                        { label: 'Total Bookings', value: bookings.length, color: '#00ccff', glow: 'rgba(0,204,255,0.1)' },
                    ].map((stat, i) => (
                        <div key={i} className="rounded-xl p-4"
                            style={{ background: stat.glow, border: `1px solid ${stat.color}33` }}>
                            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</p>
                            <p className="text-3xl font-bold" style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}` }}>
                                {loading ? '—' : stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 px-8 pb-24 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <p className="text-sm" style={{ color: '#00ffcc88' }}>Loading system data...</p>
                    </div>
                ) : (
                    <>
                        {/* VENUES TAB */}
                        {activeTab === 'venues' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {venues
                                    .filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(venue => (
                                    <div key={venue._id} className="rounded-xl overflow-hidden transition hover:-translate-y-0.5"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,204,0.15)' }}>
                                        <div className="h-24 flex items-center justify-center text-4xl"
                                            style={{ background: 'linear-gradient(135deg, rgba(0,255,204,0.1), rgba(170,68,255,0.1))' }}>
                                            {venueEmoji(venue.type)}
                                        </div>
                                        <div className="p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{ background: 'rgba(0,255,204,0.1)', color: '#00ffcc88', border: '1px solid rgba(0,255,204,0.2)' }}>
                                                    {venue.type}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full"
                                                    style={venue.isApproved
                                                        ? { background: 'rgba(0,255,100,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,100,0.2)' }
                                                        : { background: 'rgba(255,170,0,0.1)', color: '#ffaa00', border: '1px solid rgba(255,170,0,0.2)' }}>
                                                    {venue.isApproved ? '✓ Live' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="font-bold text-sm truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{venue.name}</p>
                                            <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>👤 {venue.owner?.name}</p>
                                            <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>📍 {venue.location?.city}</p>
                                            <div className="flex justify-between items-center mt-3 pt-2"
                                                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                                <span className="font-bold text-sm" style={{ color: '#00ffcc' }}>
                                                    ₹{venue.pricePerHour}<span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>/hr</span>
                                                </span>
                                                <div className="flex gap-1">
                                                    {!venue.isApproved && (
                                                        <button onClick={()=>handleApproveVenue(venue._id)}
                                                            className="text-xs px-2 py-1 rounded-lg font-medium transition"
                                                            style={{ background: 'rgba(0,255,100,0.1)', border: '1px solid rgba(0,255,100,0.3)', color: '#00ff88' }}>
                                                            Approve
                                                        </button>
                                                    )}
                                                    <button onClick={()=>handleDeleteVenue(venue._id)}
                                                        className="text-xs px-2 py-1 rounded-lg font-medium transition"
                                                        style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff8080' }}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* USERS TAB */}
                        {activeTab === 'users' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {users
                                    .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(u => (
                                    <div key={u._id} className="rounded-xl p-4 transition hover:-translate-y-0.5"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(170,68,255,0.2)' }}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                                                style={{ background: 'rgba(170,68,255,0.15)', color: '#aa44ff', border: '1px solid rgba(170,68,255,0.3)' }}>
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded-full"
                                                style={u.role==='admin'
                                                    ? { background: 'rgba(255,80,80,0.1)', color: '#ff8080', border: '1px solid rgba(255,80,80,0.2)' }
                                                    : u.role==='venueOwner'
                                                    ? { background: 'rgba(0,255,204,0.1)', color: '#00ffcc', border: '1px solid rgba(0,255,204,0.2)' }
                                                    : { background: 'rgba(0,136,255,0.1)', color: '#0088ff', border: '1px solid rgba(0,136,255,0.2)' }}>
                                                {u.role}
                                            </span>
                                        </div>
                                        <p className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{u.name}</p>
                                        <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{u.email}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{u.phone}</p>
                                        <p className="text-xs mt-1" style={{ color: 'rgba(170,68,255,0.6)' }}>
                                            Joined: {new Date(u.createdAt).toLocaleDateString()}
                                        </p>

                                        {/* Role Changer */}
                                        <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                            <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Change Role:</p>
                                            <div className="flex gap-1 flex-wrap">
                                                {['booker', 'venueOwner', 'admin'].map(role => (
                                                    <button key={role} onClick={()=>handleRoleChange(u._id, role)}
                                                        disabled={u.role === role}
                                                        className="text-xs px-2 py-1 rounded-lg transition"
                                                        style={u.role === role
                                                            ? { background: 'rgba(0,255,204,0.15)', color: '#00ffcc', border: '1px solid rgba(0,255,204,0.3)', cursor: 'default' }
                                                            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                                                        {role === 'venueOwner' ? 'Owner' : role.charAt(0).toUpperCase() + role.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Delete */}
                                        {u.role !== 'admin' && (
                                            <button onClick={()=>handleDeleteUser(u._id)}
                                                className="mt-2 w-full text-xs py-1.5 rounded-lg transition"
                                                style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080' }}>
                                                Delete User
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* BOOKINGS TAB */}
                        {activeTab === 'bookings' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {bookings
                                    .filter(b => b.booker?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                 b.venue?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(booking => (
                                    <div key={booking._id} className="rounded-xl p-4"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,204,255,0.2)' }}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                                                    {booking.booker?.name}
                                                </p>
                                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{booking.booker?.email}</p>
                                            </div>
                                            <span className="text-xs px-2 py-1 rounded-full"
                                                style={booking.status==='approved'
                                                    ? { background: 'rgba(0,255,100,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,100,0.2)' }
                                                    : booking.status==='rejected'
                                                    ? { background: 'rgba(255,80,80,0.1)', color: '#ff8080', border: '1px solid rgba(255,80,80,0.2)' }
                                                    : { background: 'rgba(255,170,0,0.1)', color: '#ffaa00', border: '1px solid rgba(255,170,0,0.2)' }}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <p className="text-xs mb-2 font-medium" style={{ color: '#00ccff' }}>
                                            📍 {booking.venue?.name}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div><p style={{ color: 'rgba(255,255,255,0.3)' }}>Date</p>
                                                <p style={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(booking.eventDate).toLocaleDateString()}</p></div>
                                            <div><p style={{ color: 'rgba(255,255,255,0.3)' }}>Time</p>
                                                <p style={{ color: 'rgba(255,255,255,0.7)' }}>{booking.startTime} - {booking.endTime}</p></div>
                                            <div><p style={{ color: 'rgba(255,255,255,0.3)' }}>Guests</p>
                                                <p style={{ color: 'rgba(255,255,255,0.7)' }}>{booking.guestCount}</p></div>
                                            <div><p style={{ color: 'rgba(255,255,255,0.3)' }}>Total</p>
                                                <p style={{ color: '#00ffcc', fontWeight: 'bold' }}>₹{booking.totalPrice}</p></div>
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

export default AdminDashboard;