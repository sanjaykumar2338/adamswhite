import { useEffect, useState } from "react";

export default function AnimatedNumber({ value, locale, duration = 600 }) {
    const target = Number(value) || 0;
    const [display, setDisplay] = useState(target);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setDisplay(target);
            return undefined;
        }

        let frame;
        const started = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - started) / duration, 1);
            setDisplay(target * (1 - (1 - progress) ** 3));
            if (progress < 1) frame = window.requestAnimationFrame(animate);
        };
        frame = window.requestAnimationFrame(animate);
        return () => window.cancelAnimationFrame(frame);
    }, [target, duration]);

    return Math.round(display).toLocaleString(locale);
}
