import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const faqs = [
    {
        q: 'How do I book a venue?',
        a: 'Browse venues on the Booker Dashboard, click on a venue to view details, fill in your event date, time and guest count, then click Book Now or Send Booking Request.'
    },
    {
        q: 'What is the difference between Instant Booking and Manual Approval?',
        a: 'Instant Booking confirms your booking immediately. Manual Approval means the venue owner reviews and approves your request, which may take up to 24 hours.'
    },
    {
        q: 'How do I list my venue?',
        a: 'Register as a Venue Owner, go to your Owner Dashboard, click Add Venue, fill in the details and upload images. Your venue will go live after admin approval.'
    },
    {
        q: 'Can I cancel a booking?',
        a: 'Currently cancellations must be handled by contacting the venue owner directly. Cancellation policies vary by venue.'
    },
    {
        q: 'How do I reset my password?',
        a: 'Click Forgot Password on the login page, enter your email, and you will receive an OTP to reset your password.'
    },
    {
        q: 'Why is my venue pending approval?',
        a: 'All new venues are reviewed by our admin team to ensure quality. This usually takes 24-48 hours.'
    },
    {
        q: 'How do I contact a venue owner?',
        a: 'Venue owner contact details are shown on the Venue Detail page after you are logged in.'
    },
    {
        q: 'Is my payment information secure?',
        a: 'Yes. We use industry standard encryption and never store your payment details on our servers.'
    },
];

const HelpContact = () => {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate sending
        await new Promise(r => setTimeout(r, 1500));
        setSubmitted(true);
        setLoading(false);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col" style={{
            background: 'linear-gradient(180deg, #b8dff0 0%, #cce8f4 20%, #dff0f8 45%, #eef7fb 70%, #f5fafd 100%)'
        }}>
            {/* Birds */}
            <svg className="absolute top-20 left-16 opacity-25 z-0 pointer-events-none" width="180" height="80" viewBox="0 0 180 80">
                <path d="M10 40 Q24 26 38 40 Q24 33 10 40Z" fill="#4a8aaa"/>
                <path d="M48 25 Q62 12 76 25 Q62 18 48 25Z" fill="#4a8aaa" opacity="0.8"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8aaa" opacity="0.7"/>
            </svg>
            <svg className="absolute top-14 right-24 opacity-25 z-0 pointer-events-none" width="160" height="70" viewBox="0 0 160 70">
                <path d="M120 30 Q134 17 148 30 Q134 23 120 30Z" fill="#4a8aaa"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8aaa" opacity="0.8"/>
                <path d="M130 52 Q144 39 158 52 Q144 45 130 52Z" fill="#4a8aaa" opacity="0.6"/>
            </svg>

            {/* Wildflowers */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
                    <path d="M0 180 Q180 110 360 145 Q540 100 720 138 Q900 105 1080 135 Q1260 108 1440 128 L1440 180Z" fill="#a8d4e8" opacity="0.25"/>
                    {[30,90,160,240,320,400,490,570,650,730,820,900,990,1070,1150,1230,1310,1390].map((x,i)=>(
                        <g key={i}>
                            <line x1={x} y1="180" x2={x-((i%3)-1)*4} y2={130+(i%5)*8} stroke="#7aaabb" strokeWidth="1.5" opacity="0.5"/>
                            <ellipse cx={x-((i%3)-1)*4} cy={122+(i%5)*8} rx={5+(i%3)} ry={9+(i%3)}
                                fill={['#b8d8ec','#c8dff0','#d4c8e0','#c0d8e8','#d8e8c0','#e8d4b8'][i%6]} opacity="0.7"/>
                        </g>
                    ))}
                </svg>
            </div>

            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-slate-400 text-xs italic z-10 tracking-widest pointer-events-none">
                EASY. BOOK. ENJOY.
            </p>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-8">
                    <img src="/logo.png" alt="BYE" className="h-14 w-14 rounded-full object-cover shadow-md cursor-pointer"
                        onClick={() => navigate('/')}
                        onError={(e)=>{e.target.style.display='none'}}/>
                    <button onClick={()=>navigate(-1)}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                        ← Back
                    </button>
                    <button onClick={()=>navigate('/about')}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                        About
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={()=>navigate('/login')}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition hover:shadow-md"
                        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
                        Login
                    </button>
                    <button onClick={()=>navigate('/register')}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:shadow-md"
                        style={{ background: '#1e4d5c' }}>
                        Register
                    </button>
                </div>
            </nav>

            {/* Page Title */}
            <div className="relative z-10 px-8 pt-2 pb-6 text-center">
                <h1 className="text-3xl font-bold text-slate-700">Help & Contact</h1>
                <p className="text-slate-400 text-xs tracking-widest uppercase mt-1">We're here to help you</p>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 px-8 pb-24">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* FAQ Section */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-700 mb-4">Frequently Asked Questions</h2>
                        <div className="space-y-3">
                            {faqs.map((faq, i) => (
                                <div key={i} className="rounded-2xl overflow-hidden shadow-sm"
                                    style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.92)' }}>
                                    <button
                                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                        className="w-full flex items-center justify-between px-5 py-4 text-left">
                                        <span className="text-slate-700 font-semibold text-sm">{faq.q}</span>
                                        <span className="text-slate-400 text-lg ml-3 flex-shrink-0">
                                            {openIndex === i ? '−' : '+'}
                                        </span>
                                    </button>
                                    {openIndex === i && (
                                        <div className="px-5 pb-4">
                                            <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-700 mb-4">Send Us a Message</h2>
                        <div className="rounded-2xl shadow-lg p-6"
                            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.92)' }}>

                            {submitted ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <div className="text-5xl">✅</div>
                                    <h3 className="text-slate-700 font-bold text-lg">Message Sent!</h3>
                                    <p className="text-slate-400 text-sm text-center">
                                        We've received your message and will get back to you within 24 hours.
                                    </p>
                                    <button onClick={() => { setSubmitted(false); setForm({ name:'', email:'', subject:'', message:'' }); }}
                                        className="text-sm text-blue-400 hover:text-blue-500 transition">
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Your Name</label>
                                        <input type="text" name="name" value={form.name} onChange={handleChange}
                                            placeholder="John Doe" required
                                            className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm"/>
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Email Address</label>
                                        <input type="email" name="email" value={form.email} onChange={handleChange}
                                            placeholder="you@email.com" required
                                            className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm"/>
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Subject</label>
                                        <select name="subject" value={form.subject} onChange={handleChange} required
                                            className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 py-2 focus:outline-none focus:border-blue-400 transition text-sm">
                                            <option value="">Select a topic</option>
                                            <option value="booking">Booking Issue</option>
                                            <option value="venue">Venue Listing</option>
                                            <option value="payment">Payment</option>
                                            <option value="account">Account Problem</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Message</label>
                                        <textarea name="message" value={form.message} onChange={handleChange}
                                            placeholder="Describe your issue or question..." rows={5} required
                                            className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm resize-none"/>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="rounded-xl p-4" style={{ background: 'rgba(150,200,220,0.1)', border: '1px solid rgba(150,200,220,0.3)' }}>
                                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Direct Contact</p>
                                        <p className="text-slate-500 text-sm">📧 bookyourevnt@gmail.com</p>
                                        <p className="text-slate-500 text-sm mt-1">⏰ Response within 24 hours</p>
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="w-full py-3 rounded-xl font-semibold text-white transition"
                                        style={{ background: loading ? '#7a9aaa' : '#1e4d5c' }}>
                                        {loading ? 'Sending...' : 'Send Message'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpContact;