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
            { y: 20, opacity: 0, scale: 0.98 },
            { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
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
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="owner-edit-modal w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_26px_60px_rgba(8,28,21,0.3)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-['Outfit'] text-2xl font-semibold text-[var(--text)]">
                            Edit Venue
                        </h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            Update core details shown to bookers.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text)]"
                    >
                        Close
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-[var(--muted)] md:col-span-2">
                        Venue Name
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
                        City
                        <input
                            name="location.city"
                            value={form.location.city}
                            onChange={handleChange}
                            className="rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
                        Pincode
                        <input
                            name="location.pincode"
                            value={form.location.pincode}
                            onChange={handleChange}
                            className="rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-[var(--muted)] md:col-span-2">
                        Address
                        <input
                            name="location.address"
                            value={form.location.address}
                            onChange={handleChange}
                            className="rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
                        Price Per Hour
                        <input
                            name="pricePerHour"
                            type="number"
                            value={form.pricePerHour}
                            onChange={handleChange}
                            className="rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            min={0}
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
                        Price Per Day
                        <input
                            name="pricePerDay"
                            type="number"
                            value={form.pricePerDay}
                            onChange={handleChange}
                            className="rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            min={0}
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-[var(--muted)]">
                        Capacity
                        <input
                            name="capacity"
                            type="number"
                            value={form.capacity}
                            onChange={handleChange}
                            className="rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            min={1}
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-[var(--muted)] md:col-span-2">
                        Description
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className="min-h-28 rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            required
                        />
                    </label>

                    <div className="md:col-span-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVenueModal;
