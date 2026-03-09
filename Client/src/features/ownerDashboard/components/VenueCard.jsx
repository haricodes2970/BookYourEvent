import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

const VenueCard = ({ venue, bookingCount, selected, onEdit, onViewBookings, onToggleActive }) => {
    const cardRef = useRef(null);
    const navigate = useNavigate();

    const statusLabel = !venue.isActive ? 'Disabled' : venue.isApproved ? 'Approved' : 'Pending';
    const statusTone = !venue.isActive
        ? 'bg-rose-500/10 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
        : venue.isApproved
            ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';

    return (
        <article
            ref={cardRef}
            className={`venue-card group flex flex-col overflow-hidden rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface)] transition-all duration-500 ${
                selected
                    ? 'ring-4 ring-[var(--primary)]/20 border-[var(--primary)]'
                    : 'hover:border-[var(--primary)]/30'
            } cursor-pointer`}
            onClick={() => navigate(`/owner/venues/${venue._id}`)}
        >
            <div className="relative h-56 overflow-hidden">
                {venue.images?.[0] ? (
                    <img
                        src={venue.images[0]}
                        alt={venue.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-emerald-100 to-emerald-200 text-4xl font-black text-emerald-800">
                        {venue.name?.slice(0, 2)?.toUpperCase() || 'VE'}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                <span className={`absolute left-6 top-6 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${statusTone}`}>
                    {statusLabel}
                </span>

                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Price per hour</p>
                        <p className="font-['Outfit'] text-2xl font-black">₹{new Intl.NumberFormat('en-IN').format(venue.pricePerHour || 0)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] font-bold">
                        {bookingCount} Bookings
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-6 p-7">
                <div>
                    <h3 className="font-['Outfit'] text-2xl font-black text-[var(--text)] leading-tight group-hover:text-[var(--primary)] transition-colors">
                        {venue.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-[var(--text-muted)] opacity-70">
                        <span className="text-base">📍</span>
                        <p className="text-xs font-bold truncate">
                            {venue.location?.city || 'City not set'} • {venue.location?.pincode}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-2xl border-2 border-[var(--border)] px-4 py-3 text-xs font-black uppercase tracking-widest text-[var(--text)] transition hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-white active:scale-95"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={onViewBookings}
                        className="rounded-2xl border-2 border-[var(--border)] px-4 py-3 text-xs font-black uppercase tracking-widest text-[var(--text)] transition hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-white active:scale-95"
                    >
                        History
                    </button>
                    <button
                        type="button"
                        onClick={onToggleActive}
                        className={`col-span-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition shadow-lg active:scale-95 ${venue.isActive
                                ? 'bg-[#102a23] hover:bg-black shadow-emerald-900/20'
                                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                            }`}
                    >
                        {venue.isActive ? 'Deactivate Venue' : 'Activate Venue'}
                    </button>
                </div>
            </div>
        </article>
    );
};

export default VenueCard;
