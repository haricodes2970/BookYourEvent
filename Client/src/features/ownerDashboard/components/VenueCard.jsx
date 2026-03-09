import { useRef } from 'react';
import { gsap } from 'gsap';

const VenueCard = ({ venue, bookingCount, selected, onEdit, onViewBookings, onToggleActive }) => {
    const cardRef = useRef(null);

    const statusLabel = !venue.isActive ? 'Disabled' : venue.isApproved ? 'Approved' : 'Pending';
    const statusTone = !venue.isActive
        ? 'bg-red-500/10 text-red-600'
        : venue.isApproved
            ? 'bg-emerald-500/10 text-emerald-600'
            : 'bg-amber-500/10 text-amber-600';

    return (
        <article
            ref={cardRef}
            className={`venue-card flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 transition-colors duration-300 ${
                selected ? 'ring-2 ring-[var(--accent)]/35' : ''
            }`}
            onMouseEnter={() =>
                gsap.to(cardRef.current, {
                    y: -6,
                    boxShadow: '0 22px 36px rgba(8, 28, 21, 0.16)',
                    duration: 0.26,
                    ease: 'power2.out',
                })
            }
            onMouseLeave={() =>
                gsap.to(cardRef.current, {
                    y: 0,
                    boxShadow: '0 0 0 rgba(0,0,0,0)',
                    duration: 0.26,
                    ease: 'power2.out',
                })
            }
        >
            <div className="relative h-44 overflow-hidden">
                {venue.images?.[0] ? (
                    <img
                        src={venue.images[0]}
                        alt={venue.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="grid h-full w-full place-items-center bg-[linear-gradient(120deg,#cfe9dc,#b8dccb)] text-3xl font-bold text-[var(--primary)]">
                        {venue.name?.slice(0, 2)?.toUpperCase() || 'VE'}
                    </div>
                )}
                <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
                    {statusLabel}
                </span>
            </div>

            <div className="flex flex-1 flex-col gap-3 px-5 py-5">
                <div>
                    <h3 className="font-['Outfit'] text-xl font-semibold text-[var(--text)]">
                        {venue.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        {venue.location?.city || 'City not set'} • {venue.location?.address || 'Address unavailable'}
                    </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--text)]">
                        ₹{new Intl.NumberFormat('en-IN').format(venue.pricePerHour || 0)}/hr
                    </span>
                    <span className="text-[var(--muted)]">{bookingCount} bookings</span>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                    >
                        Edit Venue
                    </button>
                    <button
                        type="button"
                        onClick={onViewBookings}
                        className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
                    >
                        View Bookings
                    </button>
                    <button
                        type="button"
                        onClick={onToggleActive}
                        className="col-span-2 rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--secondary)]"
                    >
                        {venue.isActive ? 'Disable Venue' : 'Enable Venue'}
                    </button>
                </div>
            </div>
        </article>
    );
};

export default VenueCard;
