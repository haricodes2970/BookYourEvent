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
                duration: 1.2,
                ease: 'power2.out',
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
        <section className="owner-hero-item grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {metrics.map((metric, index) => (
                <article
                    key={metric.id}
                    className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 px-5 py-4 shadow-[0_10px_24px_rgba(8,28,21,0.08)] backdrop-blur transition-colors duration-300"
                    onMouseEnter={(event) =>
                        gsap.to(event.currentTarget, {
                            y: -4,
                            boxShadow: '0 20px 34px rgba(8, 28, 21, 0.14)',
                            duration: 0.24,
                            ease: 'power2.out',
                        })
                    }
                    onMouseLeave={(event) =>
                        gsap.to(event.currentTarget, {
                            y: 0,
                            boxShadow: '0 10px 24px rgba(8, 28, 21, 0.08)',
                            duration: 0.24,
                            ease: 'power2.out',
                        })
                    }
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {metric.label}
                    </p>
                    <p
                        ref={(el) => {
                            valueRefs.current[index] = el;
                        }}
                        className="mt-2 font-['Outfit'] text-3xl font-semibold tracking-tight text-[var(--text)]"
                    >
                        {formatMetricValue(metric, Number(metric.value) || 0)}
                    </p>
                    {metric.note && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                            {metric.note}
                        </p>
                    )}
                </article>
            ))}
        </section>
    );
};

export default AnalyticsStrip;
