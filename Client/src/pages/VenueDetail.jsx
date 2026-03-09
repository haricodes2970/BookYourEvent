import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVenueById } from '../services/venueService';
import { createBooking } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { getVenueReviews, addReview } from '../services/reviewService';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ChatModal from '../components/ChatModal';
import { useLanguage } from '../context/LanguageContext';

/* ══════════════════════════════════════ DARK MODE ══════════════════════════════════════ */
const useDark = () => { const [dark, setDark] = useState(false); return { dark, toggle: () => setDark(d => !d) }; };

const ThemeToggle = ({ dark, toggle }) => (
    <motion.button onClick={toggle} whileTap={{ scale: 0.95 }}
        style={{ width:60, height:30, borderRadius:999, padding:3, display:'flex', alignItems:'center',
            cursor:'pointer', border:'none', flexShrink:0,
            background: dark ? '#2a2a2a' : '#f1ede5', transition:'background 0.35s ease' }}>
        <motion.div layout animate={{ x: dark ? 30 : 0 }} transition={{ type:'spring', stiffness:500, damping:30 }}
            style={{ width:24, height:24, borderRadius:'50%', background: dark?'#D4AF37':'#C8A45B',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
            {dark ? '🌙' : '☀️'}
        </motion.div>
    </motion.button>
);

const GoldInput = ({ dark, label, children, required }) => (
    <div>
        <label style={{ fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase',
            color: dark?'#D4AF37':'#C8A45B', display:'block', marginBottom:8 }}>
            {label}{required && <span style={{ color:'#ef4444', marginLeft:2 }}>*</span>}
        </label>
        {children}
    </div>
);

const StarInput = ({ value, onChange, dark }) => (
    <div style={{ display:'flex', gap:4 }}>
        {[1,2,3,4,5].map(star => (
            <motion.button key={star} type="button" whileHover={{ scale:1.2 }} whileTap={{ scale:0.9 }}
                onClick={() => onChange(star)}
                style={{ fontSize:26, background:'none', border:'none', cursor:'pointer', padding:0, lineHeight:1,
                    color: star <= value ? '#D4AF37' : dark?'#333':'#e2d9c8', transition:'color 0.15s ease' }}>★</motion.button>
        ))}
    </div>
);

const ReviewCard = ({ review, dark, index, inView }) => {
    const T = { card: dark?'#1E1E1E':'#FFFFFF', border: dark?'#2a2a2a':'#EDE8DE',
        name: dark?'#F3F3F3':'#1F1F1F', comment: dark?'#9a9a9a':'#6b7280', date: dark?'#666':'#9ca3af' };
    return (
        <motion.div initial={{ opacity:0, y:30 }} animate={inView?{opacity:1,y:0}:{}}
            transition={{ duration:0.5, delay:index*0.08 }}
            style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:'18px 20px',
                boxShadow: dark?'0 4px 16px rgba(0,0,0,0.3)':'0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'white', fontSize:13, fontWeight:800, flexShrink:0 }}>
                        {review.reviewer?.name?.charAt(0)?.toUpperCase()||'U'}
                    </div>
                    <div>
                        <p style={{ fontSize:13, fontWeight:700, color:T.name }}>{review.reviewer?.name}</p>
                        <div style={{ display:'flex', gap:1, marginTop:2 }}>
                            {[1,2,3,4,5].map(s=>(
                                <span key={s} style={{ fontSize:11, color:s<=review.rating?'#D4AF37':dark?'#333':'#e2d9c8' }}>★</span>
                            ))}
                        </div>
                    </div>
                </div>
                <span style={{ fontSize:11, color:T.date }}>
                    {new Date(review.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                </span>
            </div>
            <p style={{ fontSize:13, color:T.comment, lineHeight:1.65 }}>{review.comment}</p>
        </motion.div>
    );
};

/* ══════════════════════════════════════
   VENUE DETAIL PAGE
══════════════════════════════════════ */
const VenueDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { dark, toggle } = useDark();
    const { t } = useLanguage();

    const [venue, setVenue]             = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [success, setSuccess]         = useState('');
    const [bidLoading, setBidLoading]   = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [reviews, setReviews]         = useState([]);
    const [avgRating, setAvgRating]     = useState(0);
    const [reviewForm, setReviewForm]   = useState({ rating:5, comment:'' });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');
    const [activeThumb, setActiveThumb] = useState(0);
    const [chatOpen, setChatOpen] = useState(false);

    const [bookingData, setBookingData] = useState({
        eventDate:'', startTime:'', endTime:'', guestCount:'', bidAmount:'', message:''
    });

    const reviewsRef  = useRef(null);
    const reviewsInView = useInView(reviewsRef, { once:true, amount:0.1 });

    useEffect(() => {
        const fetchVenue = async () => {
            try {
                const data = await getVenueById(id);
                setVenue(data.venue);
                const reviewData = await getVenueReviews(id);
                setReviews(reviewData.reviews);
                setAvgRating(reviewData.avgRating);
            } catch { setError('Failed to load venue'); }
            finally { setLoading(false); }
        };
        fetchVenue();
    }, [id]);

    useEffect(() => {
        const handleKey = e => {
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowRight' && lightboxIndex !== null)
                setLightboxIndex(i => Math.min(i+1, venue.images.length-1));
            if (e.key === 'ArrowLeft' && lightboxIndex !== null)
                setLightboxIndex(i => Math.max(i-1, 0));
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [lightboxIndex, venue]);

    const handleChange = e => setBookingData({ ...bookingData, [e.target.name]: e.target.value });

    const calculatePrice = () => {
        if (!bookingData.startTime || !bookingData.endTime) return 0;
        const start = parseInt(bookingData.startTime.split(':')[0]);
        const end   = parseInt(bookingData.endTime.split(':')[0]);
        const hours = end - start;
        return hours > 0 ? hours * venue.pricePerHour : 0;
    };

    /* ── PLACE BID — no payment here anymore ── */
    const handleBid = async e => {
        e.preventDefault();
        setError(''); setSuccess('');

        const basePrice = calculatePrice();
        if (basePrice <= 0) { setError(t('venue.error.invalidTime')); return; }

        const bidAmount = bookingData.bidAmount ? Number(bookingData.bidAmount) : basePrice;
        if (bidAmount < basePrice) {
            setError(t('venue.error.minBid', { amount: basePrice.toLocaleString('en-IN') }));
            return;
        }

        setBidLoading(true);
        try {
            await createBooking({
                venueId:    id,
                eventDate:  bookingData.eventDate,
                startTime:  bookingData.startTime,
                endTime:    bookingData.endTime,
                guestCount: parseInt(bookingData.guestCount),
                bidAmount,
                message:    bookingData.message,
            });
            setSuccess(t('venue.success.bidPlaced'));
            setBookingData({ eventDate:'', startTime:'', endTime:'', guestCount:'', bidAmount:'', message:'' });
        } catch (err) {
            setError(err.response?.data?.message || t('venue.error.placeBidFailed'));
        } finally {
            setBidLoading(false);
        }
    };

    const handleReviewSubmit = async e => {
        e.preventDefault();
        setReviewLoading(true); setReviewError(''); setReviewSuccess('');
        try {
            const data = await addReview({ venueId: id, ...reviewForm });
            setReviews([data.review, ...reviews]);
            setReviewSuccess('✓ Review posted!');
            setReviewForm({ rating:5, comment:'' });
            const newAvg = ((avgRating * reviews.length) + reviewForm.rating) / (reviews.length + 1);
            setAvgRating(parseFloat(newAvg.toFixed(1)));
        } catch (err) {
            setReviewError(err.response?.data?.message || 'Failed to post review');
        } finally { setReviewLoading(false); }
    };

    const getGoogleMapsUrl = v => {
        const q = encodeURIComponent(`${v.location?.address}, ${v.location?.city}`);
        return `https://www.google.com/maps/search/?api=1&query=${q}`;
    };

    const canShowOwnerChat = Boolean(venue?.owner?._id && user?.id !== venue.owner._id);

    const handleOpenOwnerChat = () => {
        if (!venue?.owner?._id) return;

        if (!user) {
            navigate('/login');
            return;
        }

        if (user.id === venue.owner._id) {
            setError(t('chat.cannotChatSelf'));
            return;
        }

        setChatOpen(true);
    };

    const bidAmountDisplay = bookingData.bidAmount
        ? Number(bookingData.bidAmount).toLocaleString('en-IN')
        : calculatePrice() > 0
            ? calculatePrice().toLocaleString('en-IN')
            : '';

    /* ── THEME ── */
    const T = {
        bg: dark?'#121212':'#F8F6F2', navBg: dark?'rgba(18,18,18,0.92)':'rgba(248,246,242,0.92)',
        navBorder: dark?'#2a2a2a':'#E6E2D9', card: dark?'#1E1E1E':'#FFFFFF',
        card2: dark?'#191919':'#FDFBF7', border: dark?'#2a2a2a':'#E6E2D9',
        title: dark?'#F3F3F3':'#1F1F1F', sub: dark?'#9a9a9a':'#6b7280',
        gold: dark?'#D4AF37':'#C8A45B', goldLight: dark?'rgba(212,175,55,0.1)':'rgba(200,164,91,0.08)',
        goldBorder: dark?'rgba(212,175,55,0.3)':'rgba(200,164,91,0.3)',
        inputBorder: dark?'rgba(212,175,55,0.3)':'rgba(200,164,91,0.35)',
        shadow: dark?'0 8px 32px rgba(0,0,0,0.5)':'0 8px 32px rgba(0,0,0,0.08)',
        statBg: dark?'#252525':'#F5F0E8', divider: dark?'#2a2a2a':'#EDE8DE',
        tagBg: dark?'rgba(212,175,55,0.1)':'rgba(200,164,91,0.1)', tagText: dark?'#D4AF37':'#C8A45B',
        errorBg: dark?'rgba(239,68,68,0.1)':'#fef2f2', successBg: dark?'rgba(34,197,94,0.1)':'#f0fdf4',
    };

    const inputStyle = {
        width:'100%', background:'transparent', borderBottom:`2px solid ${T.inputBorder}`,
        color:T.title, padding:'9px 4px', fontSize:14, outline:'none',
        fontFamily:'inherit', transition:'border-color 0.2s', caretColor:T.gold,
        border:'none',
    };

    if (loading) return (
        <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
            background:'#F8F6F2', fontFamily:"'DM Sans', sans-serif" }}>
            <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1.5, repeat:Infinity }}>
                <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>🏛️</div>
                    <p style={{ color:'#C8A45B', fontWeight:600, fontSize:14, letterSpacing:'1px' }}>LOADING VENUE...</p>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'DM Sans', sans-serif", position:'relative' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');
                ::-webkit-scrollbar{width:5px;height:5px}
                ::-webkit-scrollbar-track{background:${dark?'#1a1a1a':'#f1ede5'}}
                ::-webkit-scrollbar-thumb{background:#C8A45B;border-radius:10px}
                input[type=date]::-webkit-calendar-picker-indicator{filter:${dark?'invert(0.7)':'none'};cursor:pointer}
                input[type=time]::-webkit-calendar-picker-indicator{filter:${dark?'invert(0.7)':'none'};cursor:pointer}
                textarea::placeholder,input::placeholder{color:${T.sub}}
                textarea{resize:none} select{appearance:none}
            `}</style>

            {/* LIGHTBOX */}
            <AnimatePresence>
                {lightboxIndex !== null && venue?.images?.length > 0 && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                        style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.95)',
                            display:'flex', alignItems:'center', justifyContent:'center' }}
                        onClick={()=>setLightboxIndex(null)}>
                        <motion.button whileHover={{scale:1.1}} onClick={()=>setLightboxIndex(null)}
                            style={{ position:'absolute', top:20, right:24, background:'rgba(212,175,55,0.15)',
                                border:'1px solid rgba(212,175,55,0.4)', color:'#D4AF37', width:40, height:40,
                                borderRadius:'50%', fontSize:18, cursor:'pointer', display:'flex',
                                alignItems:'center', justifyContent:'center' }}>✕</motion.button>
                        {lightboxIndex > 0 && (
                            <motion.button whileHover={{scale:1.1,x:-3}}
                                onClick={e=>{e.stopPropagation();setLightboxIndex(i=>i-1);}}
                                style={{ position:'absolute', left:20, background:'rgba(212,175,55,0.15)',
                                    border:'1px solid rgba(212,175,55,0.4)', color:'#D4AF37', width:48, height:48,
                                    borderRadius:'50%', fontSize:22, cursor:'pointer', display:'flex',
                                    alignItems:'center', justifyContent:'center' }}>‹</motion.button>
                        )}
                        <motion.img key={lightboxIndex} initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}}
                            src={venue.images[lightboxIndex]} alt={`venue-${lightboxIndex}`}
                            style={{ maxHeight:'85vh', maxWidth:'80vw', objectFit:'contain', borderRadius:16,
                                boxShadow:'0 0 80px rgba(212,175,55,0.15)' }}
                            onClick={e=>e.stopPropagation()}/>
                        {lightboxIndex < venue.images.length-1 && (
                            <motion.button whileHover={{scale:1.1,x:3}}
                                onClick={e=>{e.stopPropagation();setLightboxIndex(i=>i+1);}}
                                style={{ position:'absolute', right:20, background:'rgba(212,175,55,0.15)',
                                    border:'1px solid rgba(212,175,55,0.4)', color:'#D4AF37', width:48, height:48,
                                    borderRadius:'50%', fontSize:22, cursor:'pointer', display:'flex',
                                    alignItems:'center', justifyContent:'center' }}>›</motion.button>
                        )}
                        <p style={{ position:'absolute', bottom:20, color:'rgba(212,175,55,0.7)', fontSize:13, letterSpacing:'1px' }}>
                            {lightboxIndex+1} / {venue.images.length}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* NAVBAR */}
            <motion.nav initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:0.5}}
                style={{ position:'sticky', top:0, zIndex:100, background:T.navBg, backdropFilter:'blur(20px)',
                    borderBottom:`1px solid ${T.navBorder}`, padding:'0 28px',
                    boxShadow:dark?'0 4px 24px rgba(0,0,0,0.4)':'0 4px 24px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <motion.div whileHover={{scale:1.05}} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}
                            onClick={()=>navigate('/')}>
                            <img src="/logo.png" alt="BYE" className="h-10 w-10 rounded-full object-cover"
                                style={{ boxShadow:`0 0 0 2px ${T.gold}` }}
                                onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/>
                            <div style={{ display:'none', width:38, height:38, borderRadius:'50%',
                                background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                alignItems:'center', justifyContent:'center', color:'white', fontSize:10, fontWeight:800 }}>BYE</div>
                        </motion.div>
                        <div style={{ width:1, height:24, background:T.border, margin:'0 8px' }}/>
                        <motion.button whileHover={{color:T.gold}} onClick={()=>navigate('/booker/dashboard')}
                            style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
                                cursor:'pointer', color:T.sub, fontSize:13, fontWeight:500, fontFamily:'inherit', transition:'color 0.2s' }}>
                            {t('venue.navBrowse')}
                        </motion.button>
                        <motion.button whileHover={{color:T.gold}} onClick={()=>navigate('/booker/my-bookings')}
                            style={{ background:'none', border:'none', cursor:'pointer', color:T.sub,
                                fontSize:13, fontWeight:500, fontFamily:'inherit', padding:'6px 12px', transition:'color 0.2s' }}>
                            {t('venue.navMyBookings')}
                        </motion.button>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <ThemeToggle dark={dark} toggle={toggle}/>
                        <motion.button whileHover={{scale:1.03}} onClick={()=>navigate('/booker/dashboard')}
                            style={{ padding:'7px 18px', borderRadius:50, background:T.goldLight,
                                border:`1.5px solid ${T.goldBorder}`, color:T.gold, fontSize:13,
                                fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{t('venue.navDashboard')}</motion.button>
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 14px 5px 8px',
                            borderRadius:50, background:T.goldLight, border:`1.5px solid ${T.goldBorder}` }}>
                            <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:800 }}>
                                {user?.name?.charAt(0)?.toUpperCase()||'U'}
                            </div>
                            <span style={{ fontSize:13, fontWeight:600, color:T.title }}>{user?.name?.split(' ')[0]||'User'}</span>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* HEADER */}
            <div style={{ padding:'28px 28px 16px', maxWidth:1400, margin:'0 auto' }}>
                <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:T.goldLight,
                        borderRadius:50, padding:'4px 14px', border:`1px solid ${T.goldBorder}`, marginBottom:8 }}>
                        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'1px',
                            textTransform:'uppercase', color:T.gold }}>🏛️ {t('venue.badge')}</span>
                    </div>
                    <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(1.6rem,3vw,2.2rem)',
                        fontWeight:900, color:T.title, marginBottom:4 }}>{t('venue.title')}</h1>
                    <p style={{ fontSize:13, color:T.sub }}>{t('venue.subtitle')}</p>
                </motion.div>
            </div>

            {/* ALERTS */}
            <div style={{ padding:'0 28px', maxWidth:1400, margin:'0 auto' }}>
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                            style={{ background:T.errorBg, border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444',
                                padding:'12px 18px', borderRadius:12, marginBottom:14, fontSize:13 }}>
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                            style={{ background:T.successBg, border:'1px solid rgba(34,197,94,0.3)', color:'#16a34a',
                                padding:'14px 18px', borderRadius:12, marginBottom:14, fontSize:13, fontWeight:600 }}>
                            {success}
                            <button onClick={()=>navigate('/booker/my-bookings')}
                                style={{ marginLeft:12, padding:'4px 14px', borderRadius:50, border:'none',
                                    background:'rgba(34,197,94,0.2)', color:'#16a34a', fontSize:12,
                                    fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                                {t('venue.viewMyBookings')}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MAIN CONTENT */}
            {venue && (
                <div style={{ padding:'0 28px 80px', maxWidth:1400, margin:'0 auto' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:24 }}>

                        {/* LEFT COLUMN */}
                        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

                            {/* HERO IMAGE */}
                            <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6}}
                                style={{ background:T.card, borderRadius:20, border:`1px solid ${T.border}`,
                                    overflow:'hidden', boxShadow:T.shadow }}>
                                <div style={{ position:'relative', height:340, overflow:'hidden', cursor:'pointer',
                                    background:dark?'#1a1a1a':'#ede8de' }}
                                    onClick={()=>venue.images?.length>0&&setLightboxIndex(activeThumb)}>
                                    {venue.images?.length > 0 ? (
                                        <motion.img key={activeThumb} initial={{opacity:0}} animate={{opacity:1}}
                                            transition={{duration:0.3}} src={venue.images[activeThumb]} alt={venue.name}
                                            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                                    ) : (
                                        <div style={{ width:'100%', height:'100%', display:'flex',
                                            alignItems:'center', justifyContent:'center', fontSize:80 }}>🏛️</div>
                                    )}
                                    <div style={{ position:'absolute', inset:0,
                                        background:'linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 55%)' }}/>
                                    <div style={{ position:'absolute', top:14, right:14,
                                        background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)',
                                        borderRadius:50, padding:'5px 12px', color:'white', fontSize:11, fontWeight:600 }}>
                                        ⤢ View Gallery
                                    </div>
                                    <div style={{ position:'absolute', bottom:14, left:14, display:'flex', gap:8 }}>
                                        <div style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
                                            borderRadius:50, padding:'4px 12px', color:'#D4AF37', fontSize:12,
                                            fontWeight:700, border:'1px solid rgba(212,175,55,0.4)' }}>{venue.type}</div>
                                        <div style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
                                            borderRadius:50, padding:'4px 12px', color:'rgba(255,255,255,0.85)', fontSize:12, fontWeight:600 }}>
                                            {venue.bookingType==='instant'?'⚡ Instant Booking':'📋 Manual Approval'}
                                        </div>
                                    </div>
                                </div>
                                {venue.images?.length > 1 && (
                                    <div style={{ display:'flex', gap:8, padding:'12px 16px', overflowX:'auto' }}>
                                        {venue.images.map((img,i)=>(
                                            <motion.div key={i} whileHover={{scale:1.05}} onClick={()=>setActiveThumb(i)}
                                                style={{ width:72, height:54, borderRadius:10, overflow:'hidden', flexShrink:0,
                                                    cursor:'pointer', border:`2px solid ${i===activeThumb?T.gold:T.border}`,
                                                    opacity:i===activeThumb?1:0.6, transition:'all 0.2s',
                                                    boxShadow:i===activeThumb?`0 0 0 2px ${T.gold}40`:'none' }}>
                                                <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* VENUE INFO */}
                            <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.1}}
                                style={{ background:T.card, borderRadius:20, border:`1px solid ${T.border}`,
                                    padding:'28px', boxShadow:T.shadow }}>
                                <h2 style={{ fontFamily:"'Playfair Display', serif",
                                    fontSize:'clamp(1.6rem,3vw,2rem)', fontWeight:900, color:T.title, marginBottom:10 }}>
                                    {venue.name}
                                </h2>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                                    <div style={{ display:'flex', gap:2 }}>
                                        {[1,2,3,4,5].map(s=>(
                                            <span key={s} style={{ fontSize:16, color:s<=Math.round(avgRating)?'#D4AF37':dark?'#333':'#e2d9c8' }}>★</span>
                                        ))}
                                    </div>
                                    <span style={{ fontSize:14, fontWeight:700, color:T.title }}>{avgRating||0}</span>
                                    <span style={{ fontSize:13, color:T.sub }}>({reviews.length} reviews)</span>
                                </div>
                                <motion.a whileHover={{color:T.gold}} href={getGoogleMapsUrl(venue)}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{ display:'inline-flex', alignItems:'center', gap:6,
                                        color:dark?'#6aafff':'#1a73e8', fontSize:14, marginBottom:20,
                                        textDecoration:'none', transition:'color 0.2s' }}>
                                    📍 <span style={{ textDecoration:'underline', textUnderlineOffset:3 }}>
                                        {venue.location?.address}, {venue.location?.city}
                                    </span> <span style={{ fontSize:11 }}>↗</span>
                                </motion.a>
                                <p style={{ fontSize:14, color:T.sub, lineHeight:1.8, marginBottom:24 }}>{venue.description}</p>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
                                    {[
                                        { label:'Capacity', value:venue.capacity, unit:'max guests', icon:'👥' },
                                        { label:'Base Price', value:`₹${venue.pricePerHour?.toLocaleString('en-IN')}`, unit:'per hour', icon:'💰' },
                                    ].map((stat,i)=>(
                                        <div key={i} style={{ background:T.statBg, borderRadius:14, padding:'16px 18px',
                                            border:`1px solid ${T.goldBorder}` }}>
                                            <div style={{ fontSize:20, marginBottom:6 }}>{stat.icon}</div>
                                            <p style={{ fontSize:11, color:T.sub, textTransform:'uppercase',
                                                letterSpacing:'0.8px', fontWeight:600 }}>{stat.label}</p>
                                            <p style={{ fontFamily:"'Playfair Display', serif", fontSize:22,
                                                fontWeight:900, color:T.gold, lineHeight:1.2 }}>{stat.value}</p>
                                            <p style={{ fontSize:11, color:T.sub, marginTop:2 }}>{stat.unit}</p>
                                        </div>
                                    ))}
                                </div>
                                {venue.amenities?.length > 0 && (
                                    <div style={{ marginBottom:24 }}>
                                        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'1px',
                                            textTransform:'uppercase', color:T.gold, marginBottom:12 }}>Amenities</p>
                                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                            {venue.amenities.map((a,i)=>(
                                                <motion.span key={i} whileHover={{scale:1.05}}
                                                    style={{ fontSize:12, padding:'5px 14px', borderRadius:50,
                                                        background:T.tagBg, color:T.tagText,
                                                        border:`1px solid ${T.goldBorder}`, fontWeight:600 }}>{a}</motion.span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div style={{ paddingTop:20, borderTop:`1px solid ${T.divider}`,
                                    display:'flex', alignItems:'center', gap:14 }}>
                                    <div style={{ width:44, height:44, borderRadius:'50%',
                                        background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        color:'white', fontSize:16, fontWeight:800,
                                        boxShadow:'0 4px 12px rgba(200,164,91,0.3)' }}>
                                        {venue.owner?.name?.charAt(0)?.toUpperCase()||'O'}
                                    </div>
                                    <div>
                                        <p style={{ fontSize:11, color:T.sub, textTransform:'uppercase',
                                            letterSpacing:'0.8px', fontWeight:600, marginBottom:2 }}>{t('venue.ownerLabel')}</p>
                                        <p style={{ fontSize:14, fontWeight:700, color:T.title }}>{venue.owner?.name}</p>
                                        {venue.owner?.phone && <p style={{ fontSize:12, color:T.sub }}>📞 {venue.owner.phone}</p>}
                                    </div>
                                    {canShowOwnerChat && (
                                        <motion.button
                                            whileHover={{scale:1.03, boxShadow:'0 8px 20px rgba(30,77,92,0.16)'}}
                                            whileTap={{scale:0.98}}
                                            onClick={handleOpenOwnerChat}
                                            style={{
                                                marginLeft: 'auto',
                                                border: '1.5px solid rgba(30,77,92,0.25)',
                                                background: 'rgba(30,77,92,0.06)',
                                                color: '#1e4d5c',
                                                borderRadius: 50,
                                                padding: '9px 14px',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            {t('chat.withOwner')}
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN — BID FORM */}
                        <motion.div initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} transition={{duration:0.6,delay:0.15}}
                            style={{ background:T.card, borderRadius:20, border:`1px solid ${T.border}`,
                                boxShadow:T.shadow, position:'sticky', top:80, height:'fit-content',
                                maxHeight:'calc(100vh - 100px)', overflowY:'auto' }}>
                            <div style={{ padding:'28px' }}>

                                {/* Header */}
                                <div style={{ marginBottom:20 }}>
                                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:T.goldLight,
                                        borderRadius:50, padding:'4px 12px', border:`1px solid ${T.goldBorder}`, marginBottom:10 }}>
                                        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'1px',
                                            textTransform:'uppercase', color:T.gold }}>🏷️ {t('venue.bidBadge')}</span>
                                    </div>
                                    <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:22,
                                        fontWeight:900, color:T.title, marginBottom:4 }}>{t('venue.bidTitle')}</h3>
                                    <p style={{ fontSize:12, color:T.sub, lineHeight:1.6 }}>
                                        {t('venue.bidSubtitle1')}<br/>
                                        {t('venue.bidSubtitle2')}
                                    </p>
                                </div>

                                {/* How it works */}
                                <div style={{ background:T.goldLight, border:`1px solid ${T.goldBorder}`,
                                    borderRadius:14, padding:'14px 16px', marginBottom:20 }}>
                                    {[
                                        { step:'1', text:t('venue.step1') },
                                        { step:'2', text:t('venue.step2') },
                                        { step:'3', text:t('venue.step3') },
                                        { step:'4', text:t('venue.step4') },
                                    ].map((s,i)=>(
                                        <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                                            marginBottom:i<3?8:0 }}>
                                            <div style={{ width:20, height:20, borderRadius:'50%',
                                                background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                color:'white', fontSize:10, fontWeight:800, flexShrink:0 }}>{s.step}</div>
                                            <p style={{ fontSize:12, color:T.sub }}>{s.text}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Base price */}
                                <div style={{ background:T.goldLight, border:`1px solid ${T.goldBorder}`,
                                    borderRadius:14, padding:'14px 16px', marginBottom:22,
                                    display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                    <div>
                                        <p style={{ fontSize:11, color:T.sub, textTransform:'uppercase',
                                            letterSpacing:'0.8px', fontWeight:600 }}>Base Price</p>
                                        <p style={{ fontFamily:"'Playfair Display', serif", fontSize:22,
                                            fontWeight:900, color:T.gold }}>
                                            ₹{venue.pricePerHour?.toLocaleString('en-IN')}
                                            <span style={{ fontSize:12, fontWeight:500, color:T.sub }}>/hr</span>
                                        </p>
                                    </div>
                                    <div style={{ textAlign:'right' }}>
                                        <p style={{ fontSize:11, color:T.sub }}>Capacity</p>
                                        <p style={{ fontSize:14, fontWeight:700, color:T.title }}>{venue.capacity} guests</p>
                                    </div>
                                </div>

                                {/* BID FORM */}
                                <form onSubmit={handleBid} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                                    <GoldInput dark={dark} label="Event Date" required>
                                        <input type="date" name="eventDate" value={bookingData.eventDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={e=>{
                                                const d=e.target.value;
                                                const blocked=venue.blockedDates?.map(bd=>new Date(bd).toISOString().split('T')[0])||[];
                                                if(blocked.includes(d)){setError(t('venue.error.dateUnavailable'));return;}
                                                setError(''); setBookingData({...bookingData,eventDate:d});
                                            }}
                                            required style={inputStyle}/>
                                    </GoldInput>

                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                                        <GoldInput dark={dark} label="Start Time" required>
                                            <input type="time" name="startTime" value={bookingData.startTime}
                                                onChange={handleChange} required style={inputStyle}/>
                                        </GoldInput>
                                        <GoldInput dark={dark} label="End Time" required>
                                            <input type="time" name="endTime" value={bookingData.endTime}
                                                onChange={handleChange} required style={inputStyle}/>
                                        </GoldInput>
                                    </div>

                                    <GoldInput dark={dark} label="Number of Guests" required>
                                        <input type="number" name="guestCount" value={bookingData.guestCount}
                                            onChange={handleChange} placeholder={`Max ${venue.capacity}`}
                                            max={venue.capacity} required style={inputStyle}/>
                                    </GoldInput>

                                    {/* Estimated price */}
                                    <AnimatePresence>
                                        {calculatePrice() > 0 && (
                                            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}
                                                exit={{opacity:0,height:0}}
                                                style={{ background:T.goldLight, border:`1px solid ${T.goldBorder}`,
                                                    borderRadius:14, padding:'12px 16px' }}>
                                                <p style={{ fontSize:11, color:T.sub, marginBottom:2,
                                                    textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 }}>
                                                    Base Total
                                                </p>
                                                <p style={{ fontFamily:"'Playfair Display', serif",
                                                    fontSize:22, fontWeight:900, color:T.gold }}>
                                                    ₹{calculatePrice().toLocaleString('en-IN')}
                                                </p>
                                                <p style={{ fontSize:11, color:T.sub, marginTop:2 }}>
                                                    Minimum bid amount
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Bid amount — optional, can offer more */}
                                    <GoldInput dark={dark} label={`Your Bid Amount (₹) — Optional, offer more to stand out`}>
                                        <input type="number" name="bidAmount" value={bookingData.bidAmount}
                                            onChange={handleChange}
                                            placeholder={calculatePrice()>0
                                                ? `Min ₹${calculatePrice().toLocaleString('en-IN')} — offer more to win`
                                                : 'Select times first'}
                                            min={calculatePrice()||0}
                                            style={inputStyle}/>
                                    </GoldInput>

                                    {/* Message to owner */}
                                    <GoldInput dark={dark} label={t('venue.messageLabel')}>
                                        <input type="text" name="message" value={bookingData.message}
                                            onChange={handleChange}
                                            placeholder={t('venue.messagePlaceholder')}
                                            style={inputStyle}/>
                                    </GoldInput>

                                    {/* Availability calendar */}
                                    <div>
                                        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'1px',
                                            textTransform:'uppercase', color:T.gold, marginBottom:10 }}>{t('venue.availability')}</p>
                                        <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${T.border}` }}>
                                            <AvailabilityCalendar blockedDates={venue.blockedDates||[]} mode="view"/>
                                        </div>
                                    </div>

                                    {/* SUBMIT BID BUTTON */}
                                    <motion.button type="submit" disabled={bidLoading}
                                        whileHover={!bidLoading?{scale:1.03,boxShadow:'0 16px 40px rgba(200,164,91,0.4)'}:{}}
                                        whileTap={!bidLoading?{scale:0.98}:{}}
                                        style={{ width:'100%', padding:'14px', borderRadius:14, border:'none',
                                            fontWeight:700, fontSize:15,
                                            cursor:bidLoading?'not-allowed':'pointer', fontFamily:'inherit',
                                            background:bidLoading?(dark?'#2a2a2a':'#e2d9c8'):'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                            color:bidLoading?T.sub:'white',
                                            boxShadow:bidLoading?'none':'0 8px 24px rgba(200,164,91,0.3)',
                                            transition:'all 0.3s ease' }}>
                                        {bidLoading ? (
                                            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                                                <motion.span animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:'linear'}}
                                                    style={{ display:'inline-block', width:14, height:14,
                                                        border:'2px solid rgba(255,255,255,0.3)',
                                                        borderTopColor:'white', borderRadius:'50%' }}/>
                                                {t('venue.placingBid')}
                                            </span>
                                        ) : `${t('venue.placeBidBtn')}${bidAmountDisplay ? ` - Rs ${bidAmountDisplay}` : ''}`}
                                    </motion.button>

                                    <p style={{ fontSize:11, color:T.sub, textAlign:'center', lineHeight:1.6 }}>
                                        {t('venue.paymentNote')}
                                    </p>
                                </form>
                            </div>
                        </motion.div>
                    </div>

                    {/* REVIEWS */}
                    <motion.div initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}}
                        viewport={{once:true,amount:0.1}} transition={{duration:0.65}}
                        style={{ marginTop:24, background:T.card, borderRadius:20,
                            border:`1px solid ${T.border}`, padding:'32px', boxShadow:T.shadow }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                            marginBottom:28, flexWrap:'wrap', gap:12 }}>
                            <div>
                                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:T.goldLight,
                                    borderRadius:50, padding:'4px 14px', border:`1px solid ${T.goldBorder}`, marginBottom:10 }}>
                                    <span style={{ fontSize:11, fontWeight:700, letterSpacing:'1px',
                                        textTransform:'uppercase', color:T.gold }}>⭐ Reviews</span>
                                </div>
                                <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:22,
                                    fontWeight:900, color:T.title, marginBottom:6 }}>Guest Reviews</h3>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{ display:'flex', gap:2 }}>
                                        {[1,2,3,4,5].map(s=>(
                                            <span key={s} style={{ fontSize:18, color:s<=Math.round(avgRating)?'#D4AF37':dark?'#333':'#e2d9c8' }}>★</span>
                                        ))}
                                    </div>
                                    <span style={{ fontFamily:"'Playfair Display', serif", fontSize:22, fontWeight:900, color:T.gold }}>
                                        {avgRating||'0.0'}
                                    </span>
                                    <span style={{ fontSize:13, color:T.sub }}>
                                        ({reviews.length} {reviews.length===1?'review':'reviews'})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Write Review */}
                        <div style={{ background:T.card2, border:`1px solid ${T.goldBorder}`,
                            borderRadius:16, padding:'22px', marginBottom:28 }}>
                            <h4 style={{ fontSize:14, fontWeight:700, color:T.title, marginBottom:16 }}>✍️ Write a Review</h4>
                            <AnimatePresence>
                                {reviewError && <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                    style={{ color:'#ef4444', fontSize:12, marginBottom:10 }}>{reviewError}</motion.p>}
                                {reviewSuccess && <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                                    style={{ color:'#16a34a', fontSize:12, marginBottom:10, fontWeight:600 }}>{reviewSuccess}</motion.p>}
                            </AnimatePresence>
                            <form onSubmit={handleReviewSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                                <div>
                                    <p style={{ fontSize:11, fontWeight:700, letterSpacing:'1px',
                                        textTransform:'uppercase', color:T.gold, marginBottom:10 }}>Rating</p>
                                    <StarInput value={reviewForm.rating} onChange={v=>setReviewForm({...reviewForm,rating:v})} dark={dark}/>
                                </div>
                                <div>
                                    <p style={{ fontSize:11, fontWeight:700, letterSpacing:'1px',
                                        textTransform:'uppercase', color:T.gold, marginBottom:8 }}>Comment</p>
                                    <textarea value={reviewForm.comment}
                                        onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})}
                                        placeholder="Share your experience with this venue..."
                                        rows={3} required
                                        style={{ width:'100%', background:'transparent', border:'none',
                                            borderBottom:`2px solid ${T.inputBorder}`, color:T.title,
                                            padding:'8px 4px', fontSize:14, outline:'none',
                                            fontFamily:'inherit', caretColor:T.gold }}/>
                                </div>
                                <motion.button type="submit" disabled={reviewLoading}
                                    whileHover={!reviewLoading?{scale:1.03}:{}} whileTap={!reviewLoading?{scale:0.97}:{}}
                                    style={{ alignSelf:'flex-start', padding:'10px 24px', borderRadius:50, border:'none',
                                        background:reviewLoading?(dark?'#2a2a2a':'#e2d9c8'):'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                        color:reviewLoading?T.sub:'white', fontWeight:700, fontSize:13,
                                        cursor:reviewLoading?'not-allowed':'pointer', fontFamily:'inherit',
                                        boxShadow:reviewLoading?'none':'0 6px 16px rgba(200,164,91,0.25)' }}>
                                    {reviewLoading?'Posting...':'Post Review ★'}
                                </motion.button>
                            </form>
                        </div>

                        <div ref={reviewsRef}>
                            {reviews.length===0 ? (
                                <div style={{ textAlign:'center', padding:'40px 0' }}>
                                    <div style={{ fontSize:40, marginBottom:12 }}>⭐</div>
                                    <p style={{ color:T.sub, fontSize:14 }}>No reviews yet. Be the first to review!</p>
                                </div>
                            ) : (
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
                                    {reviews.map((review,i)=>(
                                        <ReviewCard key={review._id} review={review} dark={dark} index={i} inView={reviewsInView}/>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
            {chatOpen && venue?.owner?._id && (
                <ChatModal
                    isOpen={chatOpen}
                    otherUser={{
                        id: venue.owner._id,
                        name: venue.owner.name || 'Venue Owner',
                        role: 'venueOwner',
                    }}
                    onClose={() => setChatOpen(false)}
                />
            )}

            <p style={{ textAlign:'center', padding:'20px 0 32px',
                color:T.sub, fontSize:11, fontStyle:'italic', letterSpacing:'2px' }}>EASY. BOOK. ENJOY.</p>
        </div>
    );
};

export default VenueDetail;
