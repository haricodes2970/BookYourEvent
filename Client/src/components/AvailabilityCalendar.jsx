import { useState } from 'react';

const AvailabilityCalendar = ({ blockedDates = [], onDateClick, mode = 'view' }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ['January','February','March','April','May','June',
        'July','August','September','October','November','December'];

    const blockedSet = new Set(
        blockedDates.map(d => new Date(d).toISOString().split('T')[0])
    );

    const today = new Date().toISOString().split('T')[0];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const getDateStr = (day) => {
        const d = new Date(year, month, day);
        return d.toISOString().split('T')[0];
    };

    const isPast = (day) => getDateStr(day) < today;
    const isBlocked = (day) => blockedSet.has(getDateStr(day));
    const isToday = (day) => getDateStr(day) === today;

    return (
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(150,200,220,0.3)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">‹</button>
                <p className="text-slate-700 font-semibold text-sm">{monthNames[month]} {year}</p>
                <button onClick={nextMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">›</button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 mb-2">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for first day offset */}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`}/>
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const blocked = isBlocked(day);
                    const past = isPast(day);
                    const todayDay = isToday(day);

                    return (
                        <button
                            key={day}
                            onClick={() => !past && onDateClick && onDateClick(getDateStr(day))}
                            disabled={past}
                            className="aspect-square rounded-lg text-xs font-medium transition flex items-center justify-center"
                            style={{
                                background: blocked
                                    ? 'rgba(239,68,68,0.15)'
                                    : todayDay
                                    ? 'rgba(74,138,170,0.2)'
                                    : past
                                    ? 'transparent'
                                    : mode === 'owner' ? 'rgba(150,200,220,0.1)' : 'transparent',
                                color: blocked
                                    ? '#ef4444'
                                    : past
                                    ? '#cbd5e1'
                                    : todayDay
                                    ? '#4a8aaa'
                                    : '#475569',
                                border: todayDay ? '1px solid #4a8aaa' : '1px solid transparent',
                                cursor: past ? 'not-allowed' : mode === 'owner' ? 'pointer' : blocked ? 'not-allowed' : 'default',
                                textDecoration: blocked ? 'line-through' : 'none'
                            }}>
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid rgba(150,200,220,0.2)' }}>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444' }}/>
                    <span className="text-xs text-slate-400">Unavailable</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(74,138,170,0.2)', border: '1px solid #4a8aaa' }}/>
                    <span className="text-xs text-slate-400">Today</span>
                </div>
                {mode === 'owner' && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(150,200,220,0.1)' }}/>
                        <span className="text-xs text-slate-400">Click to block/unblock</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AvailabilityCalendar;