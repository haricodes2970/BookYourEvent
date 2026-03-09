import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createVenueWithImages, getAllVenues, deleteVenue, blockDates, unblockDate } from '../services/venueService';
import { getVenueBookings, updateBookingStatus } from '../services/bookingService';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import PaymentDetailsForm from '../components/PaymentDetailsForm';

const VENUE_TYPES = [
    'Marriage Hall','Party Hall','Conference Room','Shop/Retail','Farmhouse',
    'Rooftop','Studio','Theatre','Sports Ground','Banquet Hall','Resort',
    'Turf','Swimming Pool','Auditorium','Warehouse','Photoshoot Studio','Terrace','Community Hall'
];
const AMENITIES_LIST = [
    'AC','Parking','WiFi','Stage','Sound System','Projector','Catering Kitchen',
    'Generator','Washrooms','Changing Rooms','Security','Swimming Pool','Floodlights','Unlimited Food'
];
const venueEmoji = t => ({'Resort':'🏖️','Rooftop':'🌆','Farmhouse':'🌾','Marriage Hall':'💒',
    'Party Hall':'🎉','Conference Room':'🏢','Banquet Hall':'🍽️','Turf':'⚽',
    'Studio':'🎨','Auditorium':'🎭','Terrace':'🌅'}[t] || '🏛️');

/* ── Theme toggle ── */
const useDark = () => { const [d,s]=useState(false); return {dark:d,toggle:()=>s(x=>!x)}; };
const ThemeToggle = ({dark,toggle}) => (
    <motion.button onClick={toggle} whileTap={{scale:0.95}} style={{
        width:60,height:30,borderRadius:999,padding:3,display:'flex',
        alignItems:'center',cursor:'pointer',border:'none',flexShrink:0,
        background:dark?'#2a2a2a':'#f1ede5',transition:'background 0.35s ease',
    }}>
        <motion.div layout animate={{x:dark?30:0}} transition={{type:'spring',stiffness:500,damping:30}}
            style={{width:24,height:24,borderRadius:'50%',background:dark?'#D4AF37':'#C8A45B',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>
            {dark?'🌙':'☀️'}
        </motion.div>
    </motion.button>
);

/* ── Stat card ── */
const StatCard = ({icon,label,value,sub,color,dark,delay}) => (
    <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
        transition={{duration:0.5,delay,ease:'easeOut'}}
        whileHover={{y:-5}}
        style={{
            flex:'1 1 170px',background:dark?'#1E1E1E':'#FFFFFF',
            border:`1px solid ${dark?'#2a2a2a':'#E6E2D9'}`,borderRadius:16,padding:'18px 20px',
            boxShadow:dark?'0 4px 20px rgba(0,0,0,0.3)':'0 4px 20px rgba(0,0,0,0.06)',
            display:'flex',alignItems:'flex-start',gap:14,transition:'box-shadow 0.3s ease',
        }}>
        <div style={{width:44,height:44,borderRadius:12,flexShrink:0,background:`${color}18`,
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{icon}</div>
        <div>
            <p style={{fontSize:11,color:dark?'#9a9a9a':'#6b7280',textTransform:'uppercase',
                letterSpacing:'0.8px',fontWeight:700,marginBottom:4}}>{label}</p>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,
                color,lineHeight:1,marginBottom:2}}>{value}</p>
            {sub && <p style={{fontSize:11,color:dark?'#666':'#9ca3af'}}>{sub}</p>}
        </div>
    </motion.div>
);

/* ── Gold label ── */
const GL = ({label,dark}) => (
    <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',
        color:dark?'#D4AF37':'#C8A45B',marginBottom:6}}>{label}</p>
);

/* ── Section pill ── */
const Pill = ({label,gold,goldB,goldL}) => (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:goldL,
        borderRadius:50,padding:'4px 14px',border:`1px solid ${goldB}`,marginBottom:10}}>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:'1px',
            textTransform:'uppercase',color:gold}}>{label}</span>
    </div>
);

/* ═══════════════════════════════════════
   OWNER DASHBOARD
═══════════════════════════════════════ */
const OwnerDashboard = () => {
    const {user,logout} = useAuth();
    const navigate = useNavigate();
    const {dark,toggle} = useDark();

    const [venues,setVenues]                 = useState([]);
    const [loading,setLoading]               = useState(true);
    const [showForm,setShowForm]             = useState(false);
    const [formLoading,setFormLoading]       = useState(false);
    const [error,setError]                   = useState('');
    const [success,setSuccess]               = useState('');
    const [bookings,setBookings]             = useState([]);
    const [bookingsLoading,setBookingsLoading] = useState(false);
    const [activeTab,setActiveTab]           = useState('overview');
    const [searchQuery,setSearchQuery]       = useState('');
    const [images,setImages]                 = useState([]);
    const [imagePreviews,setImagePreviews]   = useState([]);
    const [selCalVenue,setSelCalVenue]       = useState(null);
    const [selBkVenue,setSelBkVenue]         = useState(null);
    const [profileOpen,setProfileOpen]       = useState(false);

    const venuesRef  = useRef(null);
    const venuesView = useInView(venuesRef,{once:true,amount:0.1});

    const [formData,setFormData] = useState({
        name:'',description:'',type:'Marriage Hall',
        location:{address:'',city:'Bangalore',pincode:''},
        capacity:'',pricePerHour:'',pricePerDay:'',
        amenities:[],bookingType:'manual',
    });

    useEffect(()=>{fetchMyVenues();},[]);

    const fetchMyVenues = async () => {
        try {
            const data = await getAllVenues();
            setVenues(data.venues.filter(v=>v.owner._id===user.id));
        } catch { setError('Failed to load venues'); }
        finally { setLoading(false); }
    };

    const fetchVenueBookings = async id => {
        setBookingsLoading(true); setSelBkVenue(id);
        try { const d=await getVenueBookings(id); setBookings(d.bookings); }
        catch { setError('Failed to load bookings'); }
        finally { setBookingsLoading(false); }
    };

    const handleStatusUpdate = async (id,status) => {
        try {
            await updateBookingStatus(id,status);
            setBookings(p=>p.map(b=>b._id===id?{...b,status}:b));
            setSuccess(`Booking ${status} ✓`);
            setTimeout(()=>setSuccess(''),3000);
        } catch { setError('Failed to update booking'); }
    };

    const handleChange = e => {
        const {name,value} = e.target;
        if (name==='address'||name==='pincode')
            setFormData({...formData,location:{...formData.location,[name]:value}});
        else setFormData({...formData,[name]:value});
    };

    const handleAmenityToggle = a =>
        setFormData({...formData,amenities:formData.amenities.includes(a)
            ?formData.amenities.filter(x=>x!==a):[...formData.amenities,a]});

    const handleImageChange = e => {
        const files=Array.from(e.target.files);
        setImages(files);
        setImagePreviews(files.map(f=>URL.createObjectURL(f)));
    };

    const handleSubmit = async e => {
        e.preventDefault(); setFormLoading(true); setError('');
        try {
            const d=new FormData();
            ['name','description','type','capacity','pricePerHour','pricePerDay','bookingType']
                .forEach(k=>d.append(k,formData[k]));
            d.append('location',JSON.stringify(formData.location));
            d.append('amenities',JSON.stringify(formData.amenities));
            images.forEach(img=>d.append('images',img));
            await createVenueWithImages(d);
            setSuccess('✓ Venue created! Awaiting admin approval.');
            setShowForm(false); setImages([]); setImagePreviews([]);
            fetchMyVenues(); setTimeout(()=>setSuccess(''),4000);
        } catch(err) { setError(err.response?.data?.message||'Failed to create venue'); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async id => {
        if (!window.confirm('Delete this venue permanently?')) return;
        try { await deleteVenue(id); setVenues(p=>p.filter(v=>v._id!==id)); }
        catch { setError('Failed to delete venue'); }
    };

    const handleCalDateClick = async date => {
        if (!selCalVenue) return;
        const venue=venues.find(v=>v._id===selCalVenue);
        const blocked=venue.blockedDates?.map(d=>new Date(d).toISOString().split('T')[0])||[];
        try {
            if (blocked.includes(date)) {
                const d=await unblockDate(selCalVenue,date);
                setVenues(p=>p.map(v=>v._id===selCalVenue?{...v,blockedDates:d.blockedDates}:v));
                setSuccess('✓ Date unblocked!');
            } else {
                const d=await blockDates(selCalVenue,[date]);
                setVenues(p=>p.map(v=>v._id===selCalVenue?{...v,blockedDates:d.blockedDates}:v));
                setSuccess('✓ Date blocked!');
            }
            setTimeout(()=>setSuccess(''),3000);
        } catch { setError('Failed to update availability'); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    /* ── Derived ── */
    const upcoming = bookings.filter(b=>b.status==='confirmed' || b.status==='payment_pending').length;
    const revenue  = bookings.filter(b=>b.status==='confirmed').reduce((s,b)=>s+(b.bidAmount||b.totalPrice||0),0);
    const pending  = bookings.filter(b=>b.status==='pending').length;

    /* ── Theme ── */
    const G = dark?'#D4AF37':'#C8A45B';
    const GL2 = dark?'rgba(212,175,55,0.1)':'rgba(200,164,91,0.08)';
    const GB  = dark?'rgba(212,175,55,0.3)':'rgba(200,164,91,0.3)';
    const T = {
        bg:dark?'#121212':'#F8F6F2', navBg:dark?'rgba(18,18,18,0.92)':'rgba(248,246,242,0.92)',
        navBorder:dark?'#2a2a2a':'#E6E2D9', card:dark?'#1E1E1E':'#FFFFFF',
        card2:dark?'#191919':'#FDFBF7', border:dark?'#2a2a2a':'#E6E2D9',
        title:dark?'#F3F3F3':'#1F1F1F', sub:dark?'#9a9a9a':'#6b7280',
        gold:G, goldL:GL2, goldB:GB,
        shadow:dark?'0 8px 32px rgba(0,0,0,0.5)':'0 8px 32px rgba(0,0,0,0.07)',
        statBg:dark?'#252525':'#F5F0E8', divider:dark?'#2a2a2a':'#EDE8DE',
        inp:{width:'100%',background:'transparent',
            borderBottom:`2px solid ${dark?'rgba(212,175,55,0.3)':'rgba(200,164,91,0.35)'}`,
            color:dark?'#F3F3F3':'#1F1F1F',padding:'8px 4px',fontSize:14,
            outline:'none',fontFamily:'inherit',caretColor:'#C8A45B'},
    };

    const TABS=[{id:'overview',label:'My Venues'},{id:'bookings',label:'Bookings'},{id:'calendar',label:'Availability'}];

    /* ── Venue card component (inline) ── */
    const VenueCard = ({venue,index,inView}) => {
        const isLive = venue.isApproved;
        return (
            <motion.div initial={{opacity:0,y:32}} animate={inView?{opacity:1,y:0}:{}}
                transition={{duration:0.5,delay:index*0.09}}
                whileHover={{y:-8,boxShadow:dark?'0 22px 44px rgba(212,175,55,0.12)':'0 22px 44px rgba(200,164,91,0.18)'}}
                style={{background:T.card,borderRadius:18,border:`1px solid ${T.border}`,
                    overflow:'hidden',boxShadow:T.shadow,transition:'box-shadow 0.3s ease'}}>
                <div style={{position:'relative',height:155,overflow:'hidden',background:dark?'#1a1a1a':'#ede8de'}}>
                    {venue.images?.length>0
                        ?<motion.img src={venue.images[0]} alt={venue.name}
                            whileHover={{scale:1.08}} transition={{duration:0.4}}
                            style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                        :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',
                            justifyContent:'center',fontSize:48}}>{venueEmoji(venue.type)}</div>
                    }
                    <div style={{position:'absolute',inset:0,
                        background:'linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 55%)'}}/>
                    <div style={{position:'absolute',top:10,right:10,
                        background:isLive?'rgba(34,197,94,0.9)':'rgba(234,179,8,0.9)',
                        backdropFilter:'blur(6px)',borderRadius:50,padding:'3px 10px',
                        fontSize:10,fontWeight:800,color:'white'}}>
                        {isLive?'✓ Active':'⏳ Pending'}
                    </div>
                    <div style={{position:'absolute',bottom:10,left:10,
                        background:'rgba(0,0,0,0.6)',backdropFilter:'blur(6px)',
                        borderRadius:50,padding:'3px 10px',fontSize:10,
                        fontWeight:700,color:'#D4AF37',border:'1px solid rgba(212,175,55,0.4)'}}>
                        {venue.type}
                    </div>
                </div>
                <div style={{padding:'14px 16px 16px'}}>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:800,
                        color:T.title,marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',
                        textOverflow:'ellipsis'}}>{venue.name}</p>
                    <p style={{fontSize:11,color:T.sub,marginBottom:8,whiteSpace:'nowrap',
                        overflow:'hidden',textOverflow:'ellipsis'}}>
                        📍 {venue.location?.address}, {venue.location?.city}
                    </p>
                    {/* Stars */}
                    <div style={{display:'flex',gap:1,marginBottom:10}}>
                        {[1,2,3,4,5].map(s=><span key={s} style={{fontSize:11,
                            color:s<=4?'#D4AF37':dark?'#333':'#e2d9c8'}}>★</span>)}
                        <span style={{fontSize:11,color:T.sub,marginLeft:5}}>
                            ₹{venue.pricePerHour?.toLocaleString('en-IN')} per hour
                        </span>
                    </div>
                    <div style={{borderTop:`1px solid ${T.divider}`,paddingTop:10,
                        display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}>
                        <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,
                            fontWeight:900,color:T.gold}}>₹{venue.pricePerHour?.toLocaleString('en-IN')}
                            <span style={{fontSize:10,fontWeight:400,color:T.sub}}>/hr</span></p>
                        <div style={{display:'flex',gap:6}}>
                            <motion.button
                                whileHover={{background:'linear-gradient(135deg,#C8A45B,#E3C67A)',color:'white'}}
                                onClick={()=>{fetchVenueBookings(venue._id);setActiveTab('bookings')}}
                                style={{padding:'5px 10px',borderRadius:50,fontSize:10,fontWeight:700,
                                    cursor:'pointer',fontFamily:'inherit',background:T.goldL,
                                    border:`1.5px solid ${T.goldB}`,color:T.gold,transition:'all 0.2s'}}>
                                View Bookings
                            </motion.button>
                            <motion.button whileHover={{background:'rgba(239,68,68,0.15)'}}
                                onClick={()=>handleDelete(venue._id)}
                                style={{padding:'5px 10px',borderRadius:50,fontSize:10,fontWeight:700,
                                    cursor:'pointer',fontFamily:'inherit',
                                    background:'rgba(239,68,68,0.07)',
                                    border:'1.5px solid rgba(239,68,68,0.25)',
                                    color:'#ef4444',transition:'all 0.2s'}}>Delete</motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    /* ── Booking status config ── */
    const sCfg = s => ({
        confirmed:       {color:'#16a34a',bg:'rgba(34,197,94,0.12)',  label:'✅ Confirmed'},
        approved:        {color:'#16a34a',bg:'rgba(34,197,94,0.12)',  label:'✅ Confirmed'},
        rejected:        {color:'#ef4444',bg:'rgba(239,68,68,0.1)',   label:'❌ Rejected'},
        pending:         {color:'#b45309',bg:'rgba(234,179,8,0.12)',  label:'⏳ Pending Bid'},
        payment_pending: {color:'#1d4ed8',bg:'rgba(59,130,246,0.1)', label:'💳 Awaiting Payment'},
        expired:         {color:'#6b7280',bg:'rgba(107,114,128,0.1)',label:'🕐 Expired'},
    }[s] || {color:'#6b7280',bg:'rgba(107,114,128,0.1)',label:s});

    return (
        <div style={{minHeight:'100vh',background:T.bg,fontFamily:"'DM Sans',sans-serif",position:'relative'}}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');
                ::-webkit-scrollbar{width:5px;height:5px}
                ::-webkit-scrollbar-track{background:${dark?'#1a1a1a':'#f1ede5'}}
                ::-webkit-scrollbar-thumb{background:#C8A45B;border-radius:10px}
                textarea{resize:none} select{appearance:none}
                input::placeholder,textarea::placeholder{color:${T.sub}}
                input[type=radio]{accent-color:#C8A45B}
                input[type=file]::file-selector-button{background:${T.goldL};border:1px solid ${T.goldB};
                    color:${T.gold};padding:5px 14px;border-radius:50px;font-size:12px;
                    font-weight:700;cursor:pointer;margin-right:10px;font-family:inherit;}
            `}</style>

            {/* ── NAVBAR ── */}
            <motion.nav initial={{y:-24,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:0.5}}
                style={{position:'sticky',top:0,zIndex:100,background:T.navBg,
                    backdropFilter:'blur(20px)',borderBottom:`1px solid ${T.navBorder}`,
                    padding:'0 28px',
                    boxShadow:dark?'0 4px 24px rgba(0,0,0,0.4)':'0 4px 24px rgba(0,0,0,0.05)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
                    {/* Left */}
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <motion.div whileHover={{scale:1.05}} onClick={()=>navigate('/')}
                            style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',marginRight:16}}>
                            <img src="/logo.png" alt="BYE" className="h-10 w-10 rounded-full object-cover"
                                style={{boxShadow:`0 0 0 2px ${T.gold}`}}
                                onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>
                            <div style={{display:'none',width:38,height:38,borderRadius:'50%',
                                background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                alignItems:'center',justifyContent:'center',
                                color:'white',fontSize:10,fontWeight:800}}>BYE</div>
                            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:T.title}}>
                                BookYourEvent
                            </span>
                        </motion.div>
                        {TABS.map(tab=>(
                            <motion.button key={tab.id} whileHover={{color:T.gold}}
                                onClick={()=>setActiveTab(tab.id)}
                                style={{padding:'6px 14px',borderRadius:8,border:'none',
                                    background:activeTab===tab.id?T.goldL:'transparent',
                                    borderBottom:activeTab===tab.id?`2px solid ${T.gold}`:'2px solid transparent',
                                    color:activeTab===tab.id?T.gold:T.sub,
                                    fontSize:13,fontWeight:activeTab===tab.id?700:500,
                                    cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'}}>
                                {tab.label}
                            </motion.button>
                        ))}
                        {[{l:'About',to:'/about'},{l:'Contact',to:'/#contact'}].map(item=>(
                            <motion.button key={item.l} whileHover={{color:T.gold}}
                                onClick={()=>navigate(item.to)}
                                style={{padding:'6px 12px',borderRadius:8,border:'none',
                                    background:'transparent',color:T.sub,fontSize:13,
                                    fontWeight:500,cursor:'pointer',fontFamily:'inherit',transition:'color 0.2s'}}>
                                {item.l}
                            </motion.button>
                        ))}
                    </div>
                    {/* Right */}
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,background:T.card,
                            borderRadius:50,padding:'7px 16px',border:`1px solid ${T.border}`,width:220}}>
                            <span style={{color:T.gold,fontSize:13}}>🔍</span>
                            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                                placeholder="Search venues..."
                                style={{background:'transparent',border:'none',outline:'none',
                                    fontSize:13,color:T.title,width:'100%',fontFamily:'inherit'}}/>
                        </div>
                        <ThemeToggle dark={dark} toggle={toggle}/>
                        <div style={{position:'relative'}}>
                            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                                onClick={()=>setProfileOpen(o=>!o)}
                                style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px 6px 8px',
                                    borderRadius:50,background:T.goldL,border:`1.5px solid ${T.goldB}`,
                                    cursor:'pointer',fontFamily:'inherit'}}>
                                <div style={{width:28,height:28,borderRadius:'50%',
                                    background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                    display:'flex',alignItems:'center',justifyContent:'center',
                                    color:'white',fontSize:12,fontWeight:800}}>
                                    {user?.name?.charAt(0)?.toUpperCase()||'O'}
                                </div>
                                <span style={{fontSize:13,fontWeight:600,color:T.title}}>
                                    Hi, {user?.name?.split(' ')[0]||'Owner'}
                                </span>
                                <span style={{fontSize:10,color:T.sub}}>▼</span>
                            </motion.button>
                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div initial={{opacity:0,y:-8,scale:0.95}}
                                        animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.95}}
                                        transition={{duration:0.2}}
                                        style={{position:'absolute',right:0,top:'110%',background:T.card,
                                            border:`1px solid ${T.border}`,borderRadius:14,padding:'8px 0',
                                            boxShadow:T.shadow,minWidth:190,zIndex:200}}>
                                        {[
                                            {label:'➕ Add Venue',action:()=>{setShowForm(true);setProfileOpen(false)},gold:true},
                                            {label:'⚙️ Account Settings',action:()=>setProfileOpen(false)},
                                            {label:'🚪 Log Out',action:()=>{handleLogout();setProfileOpen(false)},danger:true},
                                        ].map((item,i)=>(
                                            <motion.button key={i} whileHover={{background:T.goldL}}
                                                onClick={item.action}
                                                style={{width:'100%',padding:'10px 18px',textAlign:'left',
                                                    background:item.gold?T.goldL:'transparent',border:'none',
                                                    color:item.danger?'#ef4444':item.gold?T.gold:T.title,
                                                    fontSize:13,fontWeight:item.gold?700:500,
                                                    cursor:'pointer',fontFamily:'inherit',
                                                    borderTop:i===2?`1px solid ${T.divider}`:'none',
                                                    marginTop:i===2?4:0}}>
                                                {item.label}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* ── HERO BANNER ── */}
            <div style={{
                background:dark
                    ?'linear-gradient(135deg,#1a2a1a 0%,#1e3a2a 50%,#1a2a3a 100%)'
                    :'linear-gradient(135deg,#2e7d52 0%,#3a9a62 45%,#1e5c70 100%)',
                padding:'44px 28px 56px',position:'relative',overflow:'hidden',
            }}>
                {/* decorative circles */}
                {[['8%','15%',280,0.06],['75%','5%',200,0.05],['50%','55%',160,0.04]].map(([l,t,s,o],i)=>(
                    <div key={i} style={{position:'absolute',left:l,top:t,width:s,height:s,
                        borderRadius:'50%',background:`rgba(255,255,255,${o})`,
                        border:`1px solid rgba(255,255,255,${o*1.5})`,pointerEvents:'none'}}/>
                ))}
                {[[12,35],[78,22],[42,72],[88,58],[25,80]].map(([x,y],i)=>(
                    <motion.div key={i} animate={{scale:[1,1.6,1],opacity:[0.25,0.65,0.25]}}
                        transition={{duration:2.2+i*0.35,repeat:Infinity,delay:i*0.4}}
                        style={{position:'absolute',left:`${x}%`,top:`${y}%`,
                            width:6,height:6,borderRadius:'50%',
                            background:'rgba(212,175,55,0.55)',pointerEvents:'none'}}/>
                ))}
                <div style={{position:'relative',zIndex:1,maxWidth:1400,margin:'0 auto',
                    display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
                    <motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:0.7}}>
                        <div style={{display:'inline-flex',alignItems:'center',gap:6,
                            background:'rgba(212,175,55,0.18)',borderRadius:50,padding:'4px 16px',
                            marginBottom:14,border:'1px solid rgba(212,175,55,0.35)'}}>
                            <span style={{fontSize:11,fontWeight:700,letterSpacing:'1.2px',
                                textTransform:'uppercase',color:'#D4AF37'}}>🏛️ Owner Portal</span>
                        </div>
                        <h1 style={{fontFamily:"'Playfair Display',serif",
                            fontSize:'clamp(2.2rem,4.5vw,3.2rem)',fontWeight:900,
                            color:'white',lineHeight:1.08,marginBottom:10}}>Owner Dashboard</h1>
                        <p style={{color:'rgba(255,255,255,0.62)',fontSize:15}}>Oversee Venues & Bookings</p>
                    </motion.div>
                    <motion.button initial={{opacity:0,x:30}} animate={{opacity:1,x:0}}
                        transition={{duration:0.7,delay:0.15}}
                        whileHover={{scale:1.04,boxShadow:'0 14px 38px rgba(212,175,55,0.4)'}}
                        whileTap={{scale:0.97}}
                        onClick={()=>setShowForm(true)}
                        style={{padding:'13px 32px',borderRadius:50,border:'none',
                            background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                            color:'white',fontWeight:800,fontSize:14,cursor:'pointer',
                            fontFamily:'inherit',boxShadow:'0 8px 24px rgba(200,164,91,0.38)'}}>
                        ➕ Add New Venue
                    </motion.button>
                </div>
                <div style={{position:'absolute',bottom:0,left:0,right:0}}>
                    <svg viewBox="0 0 1440 36" preserveAspectRatio="none"
                        style={{width:'100%',height:36,display:'block'}}>
                        <path d="M0,18 C360,36 1080,0 1440,18 L1440,36 L0,36 Z"
                            fill={dark?'#121212':'#F8F6F2'}/>
                    </svg>
                </div>
            </div>

            {/* ── STATS ── */}
            <div style={{padding:'24px 28px 0',maxWidth:1400,margin:'0 auto'}}>
                <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                    <StatCard icon="🏛️" label="Total Venues" value={venues.length}
                        sub={`${venues.filter(v=>v.isApproved).length} live`}
                        color="#C8A45B" dark={dark} delay={0}/>
                    <StatCard icon="📅" label="Upcoming Bookings" value={upcoming}
                        sub="confirmed" color="#2e7d52" dark={dark} delay={0.1}/>
                    <StatCard icon="💰" label="Total Revenue"
                        value={`₹${revenue.toLocaleString('en-IN')}`}
                        sub="from approved" color="#D4AF37" dark={dark} delay={0.2}/>
                    <StatCard icon="⏳" label="Pending Requests"
                        value={`${pending}/${bookings.length}`}
                        sub="need action" color="#ef4444" dark={dark} delay={0.3}/>
                </div>
            </div>

            {/* ── ALERTS ── */}
            <div style={{padding:'14px 28px 0',maxWidth:1400,margin:'0 auto'}}>
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                            style={{background:dark?'rgba(239,68,68,0.1)':'#fef2f2',
                                border:'1px solid rgba(239,68,68,0.3)',color:'#ef4444',
                                padding:'12px 18px',borderRadius:12,marginBottom:12,fontSize:13}}>
                            {error}
                            <button onClick={()=>setError('')}
                                style={{float:'right',background:'none',border:'none',
                                    color:'#ef4444',cursor:'pointer',fontSize:14}}>✕</button>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                            style={{background:dark?'rgba(34,197,94,0.1)':'#f0fdf4',
                                border:'1px solid rgba(34,197,94,0.3)',color:'#16a34a',
                                padding:'12px 18px',borderRadius:12,marginBottom:12,
                                fontSize:13,fontWeight:600}}>{success}</motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── ADD VENUE FORM ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}
                        exit={{opacity:0,height:0}} transition={{duration:0.4,ease:'easeOut'}}
                        style={{overflow:'hidden',padding:'14px 28px 0',maxWidth:1400,margin:'0 auto'}}>
                        <div style={{background:T.card,borderRadius:20,border:`1px solid ${T.border}`,
                            padding:'28px',boxShadow:T.shadow}}>
                            <div style={{display:'flex',alignItems:'center',
                                justifyContent:'space-between',marginBottom:22}}>
                                <div>
                                    <Pill label="➕ New Venue" gold={T.gold} goldB={T.goldB} goldL={T.goldL}/>
                                    <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,
                                        fontWeight:900,color:T.title}}>Create New Venue</h3>
                                </div>
                                <motion.button whileHover={{scale:1.1}} onClick={()=>setShowForm(false)}
                                    style={{width:36,height:36,borderRadius:'50%',background:T.goldL,
                                        border:`1px solid ${T.goldB}`,color:T.gold,cursor:'pointer',
                                        fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    ✕
                                </motion.button>
                            </div>
                            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:20}}>
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                                    <div><GL label="Venue Name" dark={dark}/>
                                        <input name="name" value={formData.name} onChange={handleChange}
                                            placeholder="Enter venue name" required style={T.inp}/></div>
                                    <div><GL label="Venue Type" dark={dark}/>
                                        <select name="type" value={formData.type} onChange={handleChange} style={T.inp}>
                                            {VENUE_TYPES.map(t=><option key={t} value={t}
                                                style={{background:T.card,color:T.title}}>{t}</option>)}
                                        </select></div>
                                </div>
                                <div><GL label="Description" dark={dark}/>
                                    <textarea name="description" value={formData.description}
                                        onChange={handleChange} placeholder="Describe your venue..."
                                        rows={2} required style={T.inp}/></div>
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                                    <div><GL label="Address" dark={dark}/>
                                        <input name="address" value={formData.location.address}
                                            onChange={handleChange} placeholder="Street address"
                                            required style={T.inp}/></div>
                                    <div><GL label="Pincode" dark={dark}/>
                                        <input name="pincode" value={formData.location.pincode}
                                            onChange={handleChange} placeholder="560001"
                                            required style={T.inp}/></div>
                                </div>
                                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
                                    <div><GL label="Capacity" dark={dark}/>
                                        <input type="number" name="capacity" value={formData.capacity}
                                            onChange={handleChange} placeholder="Max guests" required style={T.inp}/></div>
                                    <div><GL label="Price/Hour (₹)" dark={dark}/>
                                        <input type="number" name="pricePerHour" value={formData.pricePerHour}
                                            onChange={handleChange} placeholder="2000" style={T.inp}/></div>
                                    <div><GL label="Price/Day (₹)" dark={dark}/>
                                        <input type="number" name="pricePerDay" value={formData.pricePerDay}
                                            onChange={handleChange} placeholder="15000" style={T.inp}/></div>
                                </div>
                                <div><GL label="Booking Type" dark={dark}/>
                                    <div style={{display:'flex',gap:24}}>
                                        {[{v:'manual',l:'📋 Manual Approval'},{v:'instant',l:'⚡ Instant Booking'}].map(o=>(
                                            <label key={o.v} style={{display:'flex',alignItems:'center',
                                                gap:8,cursor:'pointer',fontSize:13,color:T.title}}>
                                                <input type="radio" name="bookingType" value={o.v}
                                                    checked={formData.bookingType===o.v} onChange={handleChange}/>
                                                {o.l}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div><GL label="Amenities" dark={dark}/>
                                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                                        {AMENITIES_LIST.map(a=>{
                                            const on=formData.amenities.includes(a);
                                            return (
                                                <motion.button type="button" key={a}
                                                    whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                                                    onClick={()=>handleAmenityToggle(a)}
                                                    style={{padding:'5px 14px',borderRadius:50,fontSize:12,
                                                        fontWeight:600,cursor:'pointer',fontFamily:'inherit',
                                                        background:on?'linear-gradient(135deg,#C8A45B,#E3C67A)':T.goldL,
                                                        border:`1.5px solid ${on?'transparent':T.goldB}`,
                                                        color:on?'white':T.gold,transition:'all 0.2s ease'}}>
                                                    {a}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div><GL label="Venue Images (max 5)" dark={dark}/>
                                    <input type="file" accept="image/*" multiple onChange={handleImageChange}/>
                                    {imagePreviews.length>0 && (
                                        <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                                            {imagePreviews.map((src,i)=>(
                                                <motion.img key={i} src={src} alt="preview"
                                                    whileHover={{scale:1.08}}
                                                    style={{width:68,height:58,objectFit:'cover',
                                                        borderRadius:10,border:`2px solid ${T.goldB}`}}/>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{display:'flex',gap:12}}>
                                    <motion.button type="submit" disabled={formLoading}
                                        whileHover={!formLoading?{scale:1.03,boxShadow:'0 12px 30px rgba(200,164,91,0.35)'}:{}}
                                        whileTap={!formLoading?{scale:0.97}:{}}
                                        style={{padding:'12px 32px',borderRadius:50,border:'none',
                                            background:formLoading?'#9a8a6a':'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                            color:'white',fontWeight:700,fontSize:14,
                                            cursor:formLoading?'not-allowed':'pointer',fontFamily:'inherit',
                                            boxShadow:formLoading?'none':'0 6px 18px rgba(200,164,91,0.28)'}}>
                                        {formLoading?(
                                            <span style={{display:'flex',alignItems:'center',gap:8}}>
                                                <motion.span animate={{rotate:360}}
                                                    transition={{duration:0.8,repeat:Infinity,ease:'linear'}}
                                                    style={{display:'inline-block',width:14,height:14,
                                                        border:'2px solid rgba(255,255,255,0.4)',
                                                        borderTopColor:'white',borderRadius:'50%'}}/>
                                                Creating...
                                            </span>
                                        ):'Create Venue →'}
                                    </motion.button>
                                    <motion.button type="button" onClick={()=>setShowForm(false)}
                                        whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                                        style={{padding:'12px 24px',borderRadius:50,
                                            background:'transparent',border:`1.5px solid ${T.border}`,
                                            color:T.sub,fontWeight:600,fontSize:14,
                                            cursor:'pointer',fontFamily:'inherit'}}>Cancel</motion.button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════
                MAIN CONTENT
            ══════════════════════════════ */}
            <div style={{padding:'22px 28px 80px',maxWidth:1400,margin:'0 auto'}}>

                {/* ── OVERVIEW TAB ── */}
                {activeTab==='overview' && (
                    <div style={{display:'flex',flexDirection:'column',gap:24}}>
                        {/* ── PAYMENT DETAILS BANNER ── */}
                        <PaymentDetailsForm dark={dark} />

                        {/* My Venues */}
                        <div>
                            <div style={{display:'flex',alignItems:'flex-end',
                                justifyContent:'space-between',marginBottom:16}}>
                                <div>
                                    <Pill label="🏛️ My Venues" gold={T.gold} goldB={T.goldB} goldL={T.goldL}/>
                                    <h2 style={{fontFamily:"'Playfair Display',serif",
                                        fontSize:22,fontWeight:900,color:T.title}}>My Venues</h2>
                                </div>
                                <motion.button whileHover={{color:T.gold}} onClick={()=>setActiveTab('bookings')}
                                    style={{background:'none',border:'none',color:T.sub,
                                        fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                                    View all →
                                </motion.button>
                            </div>

                            {loading ? (
                                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
                                    {[1,2,3,4].map(i=>(
                                        <motion.div key={i} animate={{opacity:[0.4,0.8,0.4]}}
                                            transition={{duration:1.4,repeat:Infinity,delay:i*0.1}}
                                            style={{height:220,borderRadius:18,background:T.statBg,border:`1px solid ${T.border}`}}/>
                                    ))}
                                </div>
                            ) : venues.length===0 ? (
                                <div style={{textAlign:'center',padding:'60px',background:T.card,
                                    borderRadius:20,border:`1px dashed ${T.goldB}`}}>
                                    <div style={{fontSize:48,marginBottom:14}}>🏛️</div>
                                    <p style={{color:T.sub,fontSize:14,marginBottom:16}}>No venues yet. Create your first venue!</p>
                                    <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                                        onClick={()=>setShowForm(true)}
                                        style={{padding:'11px 26px',borderRadius:50,border:'none',
                                            background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                            color:'white',fontWeight:700,fontSize:13,
                                            cursor:'pointer',fontFamily:'inherit',
                                            boxShadow:'0 6px 18px rgba(200,164,91,0.3)'}}>
                                        Create Venue
                                    </motion.button>
                                </div>
                            ) : (
                                <div ref={venuesRef} style={{display:'grid',
                                    gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
                                    {venues.filter(v=>v.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .slice(0,4).map((venue,i)=>(
                                        <VenueCard key={venue._id} venue={venue} index={i} inView={venuesView}/>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Booking Activity */}
                        <div>
                            <div style={{marginBottom:16}}>
                                <Pill label="📅 Booking Activity" gold={T.gold} goldB={T.goldB} goldL={T.goldL}/>
                                <h2 style={{fontFamily:"'Playfair Display',serif",
                                    fontSize:22,fontWeight:900,color:T.title}}>Booking Activity</h2>
                            </div>

                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 340px',gap:16}}>

                                {/* Recent bookings table */}
                                <div style={{background:T.card,borderRadius:20,
                                    border:`1px solid ${T.border}`,padding:'22px',boxShadow:T.shadow}}>
                                    <div style={{display:'flex',alignItems:'center',
                                        justifyContent:'space-between',marginBottom:16}}>
                                        <p style={{fontFamily:"'Playfair Display',serif",
                                            fontSize:16,fontWeight:900,color:T.title}}>Recent Bookings</p>
                                        <motion.button whileHover={{color:T.gold}} onClick={()=>setActiveTab('bookings')}
                                            style={{background:'none',border:'none',color:T.sub,
                                                fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                                            Manage →
                                        </motion.button>
                                    </div>
                                    {/* Header */}
                                    <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:12,
                                        paddingBottom:10,borderBottom:`1px solid ${T.divider}`,marginBottom:4}}>
                                        {['Recent Bookings','Guests','Status'].map((h,i)=>(
                                            <p key={i} style={{fontSize:10,fontWeight:700,
                                                textTransform:'uppercase',letterSpacing:'0.8px',color:T.gold}}>{h}</p>
                                        ))}
                                    </div>
                                    {bookings.length===0?(
                                        <div style={{textAlign:'center',padding:'32px 0'}}>
                                            <div style={{fontSize:30,marginBottom:10}}>📭</div>
                                            <p style={{color:T.sub,fontSize:13}}>
                                                Select a venue in Bookings tab to view activity
                                            </p>
                                        </div>
                                    ):bookings.slice(0,5).map((b,i)=>{
                                        const sc=sCfg(b.status);
                                        return (
                                            <div key={b._id} style={{display:'grid',
                                                gridTemplateColumns:'1fr auto auto',gap:12,
                                                alignItems:'center',padding:'11px 0',
                                                borderBottom:`1px solid ${T.divider}`}}>
                                                <div style={{display:'flex',alignItems:'center',gap:9}}>
                                                    <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,
                                                        background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                                        display:'flex',alignItems:'center',justifyContent:'center',
                                                        color:'white',fontSize:12,fontWeight:800}}>
                                                        {b.booker?.name?.charAt(0)?.toUpperCase()||'?'}
                                                    </div>
                                                    <div>
                                                        <p style={{fontSize:12,fontWeight:700,color:T.title}}>{b.booker?.name}</p>
                                                        <p style={{fontSize:10,color:T.sub}}>
                                                            {new Date(b.eventDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{display:'flex',alignItems:'center',gap:3}}>
                                                    <span style={{fontSize:11,color:T.sub}}>👥</span>
                                                    <span style={{fontSize:12,fontWeight:600,color:T.title}}>{b.guestCount}</span>
                                                </div>
                                                <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',
                                                    borderRadius:50,background:sc.bg,color:sc.color,
                                                    border:`1px solid ${sc.color}40`,whiteSpace:'nowrap'}}>
                                                    {sc.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Quick venue switcher */}
                                <div style={{background:T.card,borderRadius:20,
                                    border:`1px solid ${T.border}`,padding:'22px',boxShadow:T.shadow}}>
                                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,
                                        fontWeight:900,color:T.title,marginBottom:14}}>Quick Actions</p>
                                    {venues.length===0?(
                                        <p style={{color:T.sub,fontSize:13}}>No venues yet.</p>
                                    ):(
                                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                            {venues.slice(0,5).map(venue=>(
                                                <motion.div key={venue._id} whileHover={{x:4}}
                                                    style={{display:'flex',alignItems:'center',
                                                        justifyContent:'space-between',
                                                        padding:'10px 12px',borderRadius:12,
                                                        background:T.statBg,border:`1px solid ${T.border}`}}>
                                                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                        <div style={{width:32,height:32,borderRadius:10,
                                                            overflow:'hidden',background:dark?'#2a2a2a':'#ede8de',flexShrink:0}}>
                                                            {venue.images?.[0]
                                                                ?<img src={venue.images[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                                                                :<div style={{width:'100%',height:'100%',display:'flex',
                                                                    alignItems:'center',justifyContent:'center',fontSize:14}}>
                                                                    {venueEmoji(venue.type)}</div>
                                                            }
                                                        </div>
                                                        <div>
                                                            <p style={{fontSize:12,fontWeight:700,color:T.title,
                                                                whiteSpace:'nowrap',overflow:'hidden',
                                                                textOverflow:'ellipsis',maxWidth:110}}>{venue.name}</p>
                                                            <p style={{fontSize:10,color:T.gold}}>
                                                                ₹{venue.pricePerHour?.toLocaleString('en-IN')}/hr
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{background:'linear-gradient(135deg,#C8A45B,#E3C67A)',color:'white'}}
                                                        onClick={()=>{fetchVenueBookings(venue._id);setActiveTab('bookings')}}
                                                        style={{padding:'4px 10px',borderRadius:50,fontSize:10,
                                                            fontWeight:700,cursor:'pointer',fontFamily:'inherit',
                                                            background:T.goldL,border:`1px solid ${T.goldB}`,
                                                            color:T.gold,transition:'all 0.2s',whiteSpace:'nowrap'}}>
                                                        Bookings
                                                    </motion.button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Availability calendar widget */}
                                <div style={{background:T.card,borderRadius:20,
                                    border:`1px solid ${T.border}`,padding:'22px',boxShadow:T.shadow}}>
                                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,
                                        fontWeight:900,color:T.title,marginBottom:6}}>
                                        📅 Availability Calendar
                                    </p>
                                    <p style={{fontSize:12,color:T.sub,marginBottom:14}}>Manage your dates</p>
                                    {venues.length===0?(
                                        <div style={{textAlign:'center',padding:'24px 0'}}>
                                            <div style={{fontSize:36,marginBottom:10}}>🏛️</div>
                                            <p style={{color:T.sub,fontSize:12,marginBottom:14}}>
                                                No venues yet.<br/>Create your first venue!
                                            </p>
                                            <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                                                onClick={()=>setShowForm(true)}
                                                style={{padding:'9px 22px',borderRadius:50,border:'none',
                                                    background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                                    color:'white',fontWeight:700,fontSize:13,
                                                    cursor:'pointer',fontFamily:'inherit',
                                                    boxShadow:'0 5px 16px rgba(200,164,91,0.3)'}}>
                                                Create Venue
                                            </motion.button>
                                        </div>
                                    ):!selCalVenue?(
                                        <div style={{display:'flex',flexDirection:'column',gap:6}}>
                                            {venues.slice(0,3).map(v=>(
                                                <motion.button key={v._id} whileHover={{x:4}}
                                                    onClick={()=>setSelCalVenue(v._id)}
                                                    style={{padding:'8px 12px',borderRadius:10,
                                                        background:T.statBg,border:`1px solid ${T.border}`,
                                                        color:T.title,fontSize:12,fontWeight:600,
                                                        cursor:'pointer',fontFamily:'inherit',
                                                        textAlign:'left',transition:'transform 0.2s'}}>
                                                    {venueEmoji(v.type)} {v.name}
                                                </motion.button>
                                            ))}
                                            <motion.button whileHover={{color:T.gold}}
                                                onClick={()=>setActiveTab('calendar')}
                                                style={{background:'none',border:'none',color:T.sub,
                                                    fontSize:12,fontWeight:600,cursor:'pointer',
                                                    fontFamily:'inherit',textAlign:'center',marginTop:4}}>
                                                Manage all →
                                            </motion.button>
                                        </div>
                                    ):(
                                        <div>
                                            <p style={{fontSize:12,color:T.gold,fontWeight:700,marginBottom:8}}>
                                                {venues.find(v=>v._id===selCalVenue)?.name}
                                                <button onClick={()=>setSelCalVenue(null)}
                                                    style={{marginLeft:8,background:'none',border:'none',
                                                        color:T.sub,cursor:'pointer',fontSize:12}}>✕</button>
                                            </p>
                                            <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${T.border}`}}>
                                                <AvailabilityCalendar
                                                    blockedDates={venues.find(v=>v._id===selCalVenue)?.blockedDates||[]}
                                                    onDateClick={handleCalDateClick} mode="owner"/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BOOKINGS TAB ── */}
                {activeTab==='bookings' && (
                    <div>
                        <div style={{marginBottom:20}}>
                            <Pill label="📅 Manage Bookings" gold={T.gold} goldB={T.goldB} goldL={T.goldL}/>
                            <h2 style={{fontFamily:"'Playfair Display',serif",
                                fontSize:22,fontWeight:900,color:T.title,marginBottom:4}}>Manage Bookings & Bids</h2>
                            <p style={{fontSize:13,color:T.sub}}>Bids are ranked highest first — approve the best bid to notify booker & start 4hr payment window</p>
                        </div>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
                            {venues.map(venue=>{
                                const active=selBkVenue===venue._id;
                                return (
                                    <motion.button key={venue._id} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                                        onClick={()=>fetchVenueBookings(venue._id)}
                                        style={{padding:'8px 20px',borderRadius:50,fontSize:13,fontWeight:600,
                                            cursor:'pointer',fontFamily:'inherit',
                                            background:active?'linear-gradient(135deg,#C8A45B,#E3C67A)':T.card,
                                            border:`1.5px solid ${active?'transparent':T.border}`,
                                            color:active?'white':T.sub,
                                            boxShadow:active?'0 4px 14px rgba(200,164,91,0.3)':T.shadow,
                                            transition:'all 0.2s ease'}}>
                                        {venue.name}
                                    </motion.button>
                                );
                            })}
                        </div>
                        {bookingsLoading?(
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
                                {[1,2,3].map(i=>(
                                    <motion.div key={i} animate={{opacity:[0.4,0.8,0.4]}}
                                        transition={{duration:1.4,repeat:Infinity,delay:i*0.15}}
                                        style={{height:180,borderRadius:16,background:T.statBg,border:`1px solid ${T.border}`}}/>
                                ))}
                            </div>
                        ):!selBkVenue?(
                            <div style={{textAlign:'center',padding:'70px 0'}}>
                                <div style={{fontSize:44,marginBottom:14}}>📅</div>
                                <p style={{color:T.sub,fontSize:14}}>Select a venue above to see its bookings.</p>
                            </div>
                        ):bookings.length===0?(
                            <div style={{textAlign:'center',padding:'70px 0'}}>
                                <div style={{fontSize:44,marginBottom:14}}>📭</div>
                                <p style={{color:T.sub,fontSize:14}}>No bookings for this venue yet.</p>
                            </div>
                        ):(
                            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:16}}>
                                {bookings.map((booking,i)=>{
                                    const sc=sCfg(booking.status);
                                    return (
                                        <motion.div key={booking._id}
                                            initial={{opacity:0,y:28}} animate={{opacity:1,y:0}}
                                            transition={{duration:0.5,delay:i*0.08}}
                                            style={{background:T.card,borderRadius:18,
                                                border:`1px solid ${T.border}`,padding:'20px',boxShadow:T.shadow}}>
                                            <div style={{display:'flex',alignItems:'center',
                                                justifyContent:'space-between',marginBottom:14}}>
                                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                    <div style={{width:38,height:38,borderRadius:'50%',flexShrink:0,
                                                        background:'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                                        display:'flex',alignItems:'center',justifyContent:'center',
                                                        color:'white',fontSize:14,fontWeight:800}}>
                                                        {booking.booker?.name?.charAt(0)?.toUpperCase()||'?'}
                                                    </div>
                                                    <div>
                                                        <p style={{fontSize:13,fontWeight:700,color:T.title}}>
                                                            {booking.booker?.name}
                                                        </p>
                                                        <p style={{fontSize:11,color:T.sub}}>{booking.booker?.email}</p>
                                                    </div>
                                                </div>
                                                <span style={{fontSize:11,fontWeight:700,padding:'4px 12px',
                                                    borderRadius:50,background:sc.bg,color:sc.color,
                                                    border:`1px solid ${sc.color}40`}}>{sc.label}</span>
                                            </div>
                                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',
                                                gap:10,marginBottom:16}}>
                                                {[
                                                    {l:'Date',v:new Date(booking.eventDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})},
                                                    {l:'Time',v:`${booking.startTime} – ${booking.endTime}`},
                                                    {l:'Guests',v:`${booking.guestCount} people`},
                                                    {l:'Bid Amount',v:`₹${(booking.bidAmount||booking.totalPrice||0).toLocaleString('en-IN')}`,gold:true},
                                                ].map((item,j)=>(
                                                    <div key={j} style={{background:T.statBg,borderRadius:10,padding:'10px 12px'}}>
                                                        <p style={{fontSize:10,color:T.sub,textTransform:'uppercase',
                                                            letterSpacing:'0.6px',fontWeight:600,marginBottom:3}}>{item.l}</p>
                                                        <p style={{fontSize:13,fontWeight:700,
                                                            color:item.gold?T.gold:T.title}}>{item.v}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Rank badge — highest bid */}
                                            {booking.status==='pending' && i===0 && (
                                                <div style={{background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.3)',
                                                    borderRadius:10,padding:'8px 12px',marginBottom:10}}>
                                                    <p style={{fontSize:11,fontWeight:700,color:'#b45309'}}>
                                                        🏆 Highest Bid — Approve to confirm this booker
                                                    </p>
                                                </div>
                                            )}
                                            {booking.status==='payment_pending' && (
                                                <div style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',
                                                    borderRadius:10,padding:'8px 12px',marginBottom:10}}>
                                                    <p style={{fontSize:11,fontWeight:700,color:'#1d4ed8'}}>
                                                        💳 Approved — Waiting for booker to pay
                                                    </p>
                                                    {booking.paymentDeadline && (
                                                        <p style={{fontSize:10,color:'#6b7280',marginTop:2}}>
                                                            Deadline: {new Date(booking.paymentDeadline).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {booking.status==='confirmed' && (
                                                <div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.25)',
                                                    borderRadius:10,padding:'8px 12px',marginBottom:10}}>
                                                    <p style={{fontSize:11,fontWeight:700,color:'#16a34a'}}>
                                                        ✅ Payment received — Booking confirmed!
                                                    </p>
                                                </div>
                                            )}
                                            {booking.status==='pending' && (
                                                <div style={{display:'flex',gap:8}}>
                                                    <motion.button
                                                        whileHover={{scale:1.03,boxShadow:'0 8px 20px rgba(34,197,94,0.2)'}}
                                                        whileTap={{scale:0.97}}
                                                        onClick={()=>handleStatusUpdate(booking._id,'approved')}
                                                        style={{flex:1,padding:'10px',borderRadius:50,border:'none',
                                                            background:'rgba(34,197,94,0.12)',
                                                            border:'1.5px solid rgba(34,197,94,0.3)',
                                                            color:'#16a34a',fontSize:13,fontWeight:700,
                                                            cursor:'pointer',fontFamily:'inherit'}}>
                                                        ✓ Approve & Notify Booker
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{scale:1.03,boxShadow:'0 8px 20px rgba(239,68,68,0.15)'}}
                                                        whileTap={{scale:0.97}}
                                                        onClick={()=>handleStatusUpdate(booking._id,'rejected')}
                                                        style={{flex:1,padding:'10px',borderRadius:50,
                                                            background:'rgba(239,68,68,0.08)',
                                                            border:'1.5px solid rgba(239,68,68,0.25)',
                                                            color:'#ef4444',fontSize:13,fontWeight:700,
                                                            cursor:'pointer',fontFamily:'inherit'}}>
                                                        ✕ Reject
                                                    </motion.button>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── CALENDAR TAB ── */}
                {activeTab==='calendar' && (
                    <div>
                        <div style={{marginBottom:20}}>
                            <Pill label="🗓️ Availability" gold={T.gold} goldB={T.goldB} goldL={T.goldL}/>
                            <h2 style={{fontFamily:"'Playfair Display',serif",
                                fontSize:22,fontWeight:900,color:T.title,marginBottom:4}}>
                                Manage Availability
                            </h2>
                            <p style={{fontSize:13,color:T.sub}}>Click a date to block or unblock it</p>
                        </div>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
                            {venues.map(venue=>{
                                const active=selCalVenue===venue._id;
                                return (
                                    <motion.button key={venue._id} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                                        onClick={()=>setSelCalVenue(venue._id)}
                                        style={{padding:'8px 20px',borderRadius:50,fontSize:13,fontWeight:600,
                                            cursor:'pointer',fontFamily:'inherit',
                                            background:active?'linear-gradient(135deg,#C8A45B,#E3C67A)':T.card,
                                            border:`1.5px solid ${active?'transparent':T.border}`,
                                            color:active?'white':T.sub,
                                            boxShadow:active?'0 4px 14px rgba(200,164,91,0.3)':T.shadow,
                                            transition:'all 0.2s ease'}}>
                                        {venue.name}
                                    </motion.button>
                                );
                            })}
                        </div>
                        {venues.length===0&&<p style={{color:T.sub,fontSize:14}}>No venues yet.</p>}
                        {selCalVenue && (
                            <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
                                <div style={{background:T.card,borderRadius:20,
                                    border:`1px solid ${T.border}`,padding:'24px',boxShadow:T.shadow}}>
                                    <p style={{fontSize:13,fontWeight:700,color:T.title,marginBottom:14}}>
                                        📅 {venues.find(v=>v._id===selCalVenue)?.name}
                                        <span style={{color:T.sub,fontWeight:400}}> — Click date to block/unblock</span>
                                    </p>
                                    <div style={{borderRadius:14,overflow:'hidden',border:`1px solid ${T.border}`}}>
                                        <AvailabilityCalendar
                                            blockedDates={venues.find(v=>v._id===selCalVenue)?.blockedDates||[]}
                                            onDateClick={handleCalDateClick} mode="owner"/>
                                    </div>
                                </div>
                                <div style={{background:T.card,borderRadius:20,
                                    border:`1px solid ${T.border}`,padding:'24px',boxShadow:T.shadow}}>
                                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,
                                        fontWeight:900,color:T.title,marginBottom:14}}>🚫 Blocked Dates</p>
                                    {(venues.find(v=>v._id===selCalVenue)?.blockedDates||[]).length===0?(
                                        <div style={{textAlign:'center',padding:'30px 0'}}>
                                            <div style={{fontSize:32,marginBottom:8}}>✅</div>
                                            <p style={{color:T.sub,fontSize:13}}>No dates blocked</p>
                                        </div>
                                    ):(
                                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                                            {venues.find(v=>v._id===selCalVenue)?.blockedDates
                                                .sort((a,b)=>new Date(a)-new Date(b))
                                                .map((date,i)=>(
                                                <motion.div key={i} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}}
                                                    transition={{delay:i*0.05}}
                                                    style={{display:'flex',alignItems:'center',
                                                        justifyContent:'space-between',padding:'8px 14px',
                                                        borderRadius:50,background:'rgba(239,68,68,0.08)',
                                                        border:'1px solid rgba(239,68,68,0.25)'}}>
                                                    <span style={{fontSize:12,color:'#ef4444',fontWeight:600}}>
                                                        {new Date(date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                                                    </span>
                                                    <motion.button whileHover={{scale:1.2}}
                                                        onClick={()=>handleCalDateClick(new Date(date).toISOString().split('T')[0])}
                                                        style={{background:'none',border:'none',
                                                            color:'#ef4444',cursor:'pointer',fontSize:14,fontWeight:700}}>
                                                        ✕
                                                    </motion.button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {!selCalVenue&&venues.length>0&&(
                            <div style={{textAlign:'center',padding:'70px 0'}}>
                                <div style={{fontSize:44,marginBottom:14}}>🗓️</div>
                                <p style={{color:T.sub,fontSize:14}}>Select a venue above to manage its calendar.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <p style={{textAlign:'center',padding:'16px 0 32px',color:T.sub,
                fontSize:11,fontStyle:'italic',letterSpacing:'2px'}}>EASY. BOOK. ENJOY.</p>
        </div>
    );
};

export default OwnerDashboard;
