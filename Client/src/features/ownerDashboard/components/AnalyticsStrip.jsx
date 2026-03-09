import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const numberFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

const formatMetricValue = (metric, value) => {
    if (metric.kind === 'currency') {
        return `₹${numberFormatter.format(value)}`;
    }
    return numberFormatter.format(value);
};

const AnalyticsStrip = ({ metrics }) => {
    const valueRefs = useRef([]);

    useEffect(() => {
        const tweens = metrics.map((metric, index) => {
            const node = valueRefs.current[index];
            if (!node) return null;

            const counter = { value: 0 };
            return gsap.to(counter, {
                value: Number(metric.value) || 0,
                duration: 1.5,
                delay: 0.2,
                ease: 'power3.out',
                onUpdate: () => {
                    node.textContent = formatMetricValue(metric, Math.round(counter.value));
                },
            });
        });

        return () => {
            tweens.forEach((tween) => tween?.kill());
        };
    }, [metrics]);

    return (
        <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {metrics.map((metric, index) => (
                <article
                    key={metric.id}
                    className="relative overflow-hidden group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                    {/* Decorative Background Blob */}
                    <div
                        className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
                        style={{ background: metric.color || 'var(--primary)' }}
                    />

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">{metric.icon || '📈'}</span>
                            <div className="w-1.5 h-6 rounded-full" style={{ background: metric.color || 'var(--primary)' }} />
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                                {metric.label}
                            </p>
                            <p
                                ref={(el) => {
                                    valueRefs.current[index] = el;
                                }}
                                className="mt-1 font-['Outfit'] text-3xl font-black tracking-tight text-[var(--text)]"
                            >
                                {formatMetricValue(metric, 0)}
                            </p>
                        </div>
                    </div>
                </article>
            ))}
        </section>
    );
};

export default AnalyticsStrip;
