import { useEffect, useState } from 'react';
import { gsap } from 'gsap';

const toFormState = (venue) => ({
    name: venue?.name || '',
    description: venue?.description || '',
    pricePerHour: venue?.pricePerHour || '',
    pricePerDay: venue?.pricePerDay || '',
    capacity: venue?.capacity || '',
    location: {
        address: venue?.location?.address || '',
        city: venue?.location?.city || '',
        pincode: venue?.location?.pincode || '',
    },
});

const EditVenueModal = ({ venue, onClose, onSave, saving }) => {
    const [form, setForm] = useState(toFormState(venue));

    useEffect(() => {
        setForm(toFormState(venue));
    }, [venue]);

    useEffect(() => {
        if (!venue) return;
        gsap.fromTo(
            '.owner-edit-modal',
            { y: 50, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
    }, [venue]);

    if (!venue) return null;

    const handleChange = (event) => {
        const { name, value } = event.target;
        if (name.startsWith('location.')) {
            const field = name.split('.')[1];
            setForm((current) => ({
                ...current,
                location: { ...current.location, [field]: value },
            }));
            return;
        }
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        await onSave({
            ...form,
            pricePerHour: Number(form.pricePerHour) || 0,
            pricePerDay: Number(form.pricePerDay) || 0,
            capacity: Number(form.capacity) || 0,
        });
    };

    return (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#022c22]/80 p-4 backdrop-blur-md">
            <div className="owner-edit-modal w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-[#064e3b] p-8 md:p-10 shadow-2xl relative overflow-hidden text-white">
                {/* Decorative orbs */}
                <div className="absolute -right-20 -top-20 w-60 h-60 bg-[var(--primary)] opacity-10 blur-[80px] rounded-full" />

                <div className="relative z-10 mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-['Outfit'] text-3xl font-black text-white leading-tight">
                            Refine Property
                        </h3>
                        <p className="mt-2 text-sm text-emerald-100/60 font-medium">
                            Adjusting details for <span className="text-[var(--accent)]">@{venue.name}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-xl"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/40 px-1">Venue Identity</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Venue Name"
                            className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-white outline-none focus:border-[var(--primary)] focus:bg-white/10 transition-all font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/40 px-1">City Hub</label>
                        <input
                            name="location.city"
                            value={form.location.city}
                            onChange={handleChange}
                            placeholder="City"
                            className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-white outline-none focus:border-[var(--primary)] focus:bg-white/10 transition-all font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/40 px-1">Postal Code</label>
                        <input
                            name="location.pincode"
                            value={form.location.pincode}
                            onChange={handleChange}
                            placeholder="Pincode"
                            className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-white outline-none focus:border-[var(--primary)] focus:bg-white/10 transition-all font-bold"
                            required
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/40 px-1">Street Address</label>
                        <input
                            name="location.address"
                            value={form.location.address}
                            onChange={handleChange}
                            placeholder="Detailed Address"
                            className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-white outline-none focus:border-[var(--primary)] focus:bg-white/10 transition-all font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/40 px-1">Hourly Rate (₹)</label>
                        <input
                            name="pricePerHour"
                            type="number"
                            value={form.pricePerHour}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-white outline-none focus:border-[var(--primary)] focus:bg-white/10 transition-all font-bold"
                            min={0}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/40 px-1">Guest Capacity</label>
                        <input
                            name="capacity"
                            type="number"
                            value={form.capacity}
                            onChange={handleChange}
                            className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-white outline-none focus:border-[var(--primary)] focus:bg-white/10 transition-all font-bold"
                            min={1}
                            required
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/40 px-1">Venue Narrative</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe the vibe, amenities, and unique features..."
                            className="w-full min-h-32 rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-white outline-none focus:border-[var(--primary)] focus:bg-white/10 transition-all font-bold resize-none"
                            required
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-emerald-100/60 hover:text-white transition-colors"
                        >
                            Dismiss
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-4 rounded-2xl bg-[var(--primary)] hover:bg-[var(--accent)] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Syncing...' : 'Commit Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVenueModal;
