import type React from 'react';
import { useInView } from '../../hooks/useInView';

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
    const { ref, inView } = useInView();
    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out
                   ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}