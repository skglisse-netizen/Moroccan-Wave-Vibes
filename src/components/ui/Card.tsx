import React from 'react';

export const Card = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
    <div {...props} className={`bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden transition-all duration-300 ${className}`}>
        {children}
    </div>
);
