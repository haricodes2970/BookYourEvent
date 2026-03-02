import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllVenues } from '../services/venueService';

const BookerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('browse');

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const data = await getAllVenues();
                setVenues(data.venues);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVenues();
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const filteredVenues = venues.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col" style={{
            background: 'linear-gradient(180deg, #b8dff0 0%, #cce8f4 20%, #dff0f8 45%, #eef7fb 70%, #f5fafd 100%)'
        }}>

            {/* Birds */}
            <svg className="absolute top-20 left-16 opacity-25 z-0 pointer-events-none" width="180" height="80" viewBox="0 0 180 80">
                <path d="M10 40 Q24 26 38 40 Q24 33 10 40Z" fill="#4a8aaa"/>
                <path d="M48 25 Q62 12 76 25 Q62 18 48 25Z" fill="#4a8aaa" opacity="0.8"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8aaa" opacity="0.7"/>
                <path d="M22 58 Q36 45 50 58 Q36 51 22 58Z" fill="#4a8aaa" opacity="0.5"/>
            </svg>
            <svg className="absolute top-14 right-24 opacity-25 z-0 pointer-events-none" width="160" height="70" viewBox="0 0 160 70">
                <path d="M120 30 Q134 17 148 30 Q134 23 120 30Z" fill="#4a8aaa"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8aaa" opacity="0.8"/>
                <path d="M130 52 Q144 39 158 52 Q144 45 130 52Z" fill="#4a8aaa" opacity="0.6"/>
            </svg>
            <svg className="absolute top-40 left-1/3 opacity-15 z-0 pointer-events-none" width="120" height="60" viewBox="0 0 120 60">
                <path d="M10 30 Q22 18 34 30 Q22 24 10 30Z" fill="#6aaac8"/>
                <path d="M44 18 Q56 6 68 18 Q56 12 44 18Z" fill="#6aaac8" opacity="0.8"/>
                <path d="M78 34 Q90 22 102 34 Q90 28 78 34Z" fill="#6aaac8" opacity="0.6"/>
            </svg>

            {/* Wildflowers at bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
                    <path d="M0 180 Q180 110 360 145 Q540 100 720 138 Q900 105 1080 135 Q1260 108 1440 128 L1440 180Z" fill="#a8d4e8" opacity="0.25"/>
                    <path d="M0 180 Q220 130 440 155 Q660 120 880 148 Q1100 125 1320 142 L1440 138 L1440 180Z" fill="#88bcd8" opacity="0.2"/>
                    {[30,90,160,240,320,400,490,570,650,730,820,900,990,1070,1150,1230,1310,1390].map((x,i)=>(
                        <g key={i}>
                            <line x1={x} y1="180" x2={x-((i%3)-1)*4} y2={130+(i%5)*8} stroke="#7aaabb" strokeWidth="1.5" opacity="0.5"/>
                            <ellipse cx={x-((i%3)-1)*4} cy={122+(i%5)*8} rx={5+(i%3)} ry={9+(i%3)} 
                                fill={['#b8d8ec','#c8dff0','#d4c8e0','#c0d8e8','#d8e8c0','#e8d4b8'][i%6]} opacity="0.7"/>
                            {i%3===0 && <ellipse cx={x+8} cy={118+(i%4)*9} rx="4" ry="7" fill="#d0b8dc" opacity="0.5"/>}
                        </g>
                    ))}
                </svg>
            </div>

            {/* EASY. BOOK. ENJOY. */}
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-slate-400 text-xs italic z-10 tracking-widest pointer-events-none">
                EASY. BOOK. ENJOY.
            </p>

            {/* Navbar */}
<nav className="relative z-10 flex items-center justify-between px-8 py-4">

    {/* Left — Logo + Nav Links */}
    <div className="flex items-center gap-8">
        <img src="/logo.png" alt="BYE" className="h-14 w-14 rounded-full object-cover shadow-md"
            onError={(e)=>{e.target.style.display='none'}}/>
        <button onClick={()=>setActiveTab('browse')}
            className={`text-sm font-medium transition ${activeTab==='browse' ? 'text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
            Browse Venues
        </button>
        <button onClick={()=>navigate('/booker/my-bookings')}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">
            My Bookings
        </button>
        <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">About</a>
        <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">Contact</a>
    </div>

    {/* Center — Search Bar */}
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
        <input
            type="text"
            placeholder="Search Venues"
            value={searchQuery}
            onChange={(e)=>setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-600 text-sm focus:outline-none placeholder-slate-400 w-44"
        />
        <span className="text-slate-400 text-sm">🔍</span>
    </div>

    {/* Right — Action Buttons */}
    <div className="flex items-center gap-3">
        <span className="text-slate-500 text-sm font-medium">Hi, {user?.name?.split(' ')[0]}</span>
        <button onClick={()=>navigate('/booker/my-bookings')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition hover:shadow-md"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
            My Bookings
        </button>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition hover:shadow-md"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
            Account Settings
        </button>
        <button onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition hover:shadow-md"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
            Log Out
        </button>
    </div>
</nav>

            {/* Page Title */}
<div className="relative z-10 px-8 pt-2 pb-4">
    <h1 className="text-2xl font-bold text-slate-700">Booker Dashboard</h1>
    <p className="text-slate-400 text-xs tracking-widest uppercase mt-0.5">Explore & Manage Your Events</p>
</div>

            {/* Venues Grid — Full Screen */}
            <div className="relative z-10 flex-1 px-8 pb-24 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <p className="text-slate-400 text-sm">Loading venues...</p>
                    </div>
                ) : filteredVenues.length === 0 ? (
                    <div className="flex items-center justify-center h-48">
                        <p className="text-slate-400 text-sm">No venues found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredVenues.map(venue => (
                            <div key={venue._id}
                                onClick={()=>navigate(`/venue/${venue._id}`)}
                                className="rounded-2xl overflow-hidden cursor-pointer transition hover:shadow-xl hover:-translate-y-1"
                                style={{
                                    background: 'rgba(255,255,255,0.72)',
                                    border: '1px solid rgba(255,255,255,0.95)',
                                    backdropFilter: 'blur(8px)'
                                }}>

                                {/* Venue Emoji Banner */}
                                <div className="h-28 flex items-center justify-center text-5xl"
                                    style={{ background: 'linear-gradient(135deg, #c8e8f8, #b0d8f0)' }}>
                                    {venue.type === 'Resort' ? '🏖️' :
                                     venue.type === 'Rooftop' ? '🌆' :
                                     venue.type === 'Farmhouse' ? '🌾' :
                                     venue.type === 'Marriage Hall' ? '💒' :
                                     venue.type === 'Party Hall' ? '🎉' :
                                     venue.type === 'Conference Room' ? '🏢' :
                                     venue.type === 'Banquet Hall' ? '🍽️' :
                                     venue.type === 'Turf' ? '⚽' :
                                     venue.type === 'Studio' ? '🎨' :
                                     venue.type === 'Auditorium' ? '🎭' : '🏛️'}
                                </div>

                                <div className="p-3">
                                    <span className="text-xs px-2 py-0.5 rounded-full text-slate-500"
                                        style={{ background: 'rgba(150,200,220,0.2)' }}>
                                        {venue.type}
                                    </span>
                                    <p className="text-slate-700 font-bold text-sm mt-2 truncate">{venue.name}</p>
                                    <p className="text-slate-400 text-xs truncate mt-0.5">📍 {venue.location?.address}, {venue.location?.city}</p>

                                    <div className="flex items-center gap-1 mt-1.5">
                                        <span className="text-yellow-400 text-xs">★★★★★</span>
                                        <span className="text-slate-400 text-xs">({Math.floor(Math.random()*50)+10})</span>
                                    </div>

                                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                                        <span className="text-slate-700 font-bold text-sm">₹{venue.pricePerHour}<span className="text-slate-400 font-normal text-xs">/hr</span></span>
                                        <button
                                            onClick={(e)=>{e.stopPropagation(); navigate(`/venue/${venue._id}`)}}
                                            className="text-xs px-3 py-1.5 rounded-lg font-medium text-slate-600 transition hover:shadow-md"
                                            style={{ background: 'rgba(150,200,220,0.3)', border: '1px solid rgba(150,200,220,0.4)' }}>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookerDashboard;