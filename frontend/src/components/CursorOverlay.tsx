import { useWhiteboardStore, fromVirX, fromVirY } from '../store/useWhiteboardStore';
import { MousePointer2 } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CursorOverlay: React.FC = () => {
    const cursors = useWhiteboardStore((state) => state.cursors);
    const userName = useWhiteboardStore((state) => state.userName);
    const userColor = useWhiteboardStore((state) => state.userColor);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
    const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                setDims({
                    w: containerRef.current.clientWidth,
                    h: containerRef.current.clientHeight
                });
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Track user's own cursor across the board
    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            setLocalPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        };

        const handlePointerLeave = () => {
            setLocalPos(null);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerleave', handlePointerLeave);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerleave', handlePointerLeave);
        };
    }, []);

    // Determine own display name: prioritize store, then auth/local storage
    const getMyDisplayName = (): string => {
        if (userName && userName.trim()) return userName.trim();
        try {
            const authStr = localStorage.getItem('collab_sphere_auth_user');
            if (authStr) {
                const parsed = JSON.parse(authStr);
                if (parsed.username) return parsed.username;
            }
            const stored = localStorage.getItem('collab_sphere_username');
            if (stored && stored.trim()) return stored.trim();
        } catch {}
        return 'You';
    };

    const myName = getMyDisplayName();

    return (
        <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[40] overflow-hidden">
            {/* Own Local Cursor Tag */}
            {localPos && (
                <div
                    className="absolute flex flex-col items-start pointer-events-none transition-transform duration-75 ease-out"
                    style={{
                        transform: `translate3d(${localPos.x}px, ${localPos.y}px, 0)`,
                        left: 0,
                        top: 0,
                    }}
                >
                    <MousePointer2
                        color={userColor}
                        fill={userColor}
                        strokeWidth={2.5}
                        className="w-5 h-5 -ml-1 -mt-1 drop-shadow-xl"
                        style={{ filter: `drop-shadow(0 0 8px ${userColor}80)` }}
                    />
                    <div
                        className="px-2.5 py-1 mt-1 text-[10px] font-black uppercase tracking-wider text-white rounded-lg whitespace-nowrap backdrop-blur-xl shadow-xl border border-white/20 select-none"
                        style={{
                            backgroundColor: userColor,
                            boxShadow: `0 8px 20px -4px ${userColor}70`
                        }}
                    >
                        <span className="drop-shadow-sm">{myName}</span>
                    </div>
                </div>
            )}

            {/* Remote Collaborators' Cursors */}
            <AnimatePresence>
                {Object.entries(cursors).map(([id, cursor]) => (
                    <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            x: fromVirX(cursor.x, dims.w),
                            y: fromVirY(cursor.y, dims.h)
                        }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 30, 
                            stiffness: 300, 
                            mass: 0.8,
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute flex flex-col items-start pointer-events-none"
                        style={{ left: 0, top: 0 }}
                    >
                        <MousePointer2
                            color={cursor.color}
                            fill={cursor.color}
                            strokeWidth={2.5}
                            className="w-5 h-5 -ml-1 -mt-1 drop-shadow-xl"
                            style={{ filter: `drop-shadow(0 0 8px ${cursor.color}80)` }}
                        />
                        <motion.div
                            initial={{ y: 8, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            className="px-3 py-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-white rounded-xl whitespace-nowrap backdrop-blur-xl shadow-2xl border border-white/10 select-none"
                            style={{
                                backgroundColor: cursor.color,
                                boxShadow: `0 10px 25px -5px ${cursor.color}60`
                            }}
                        >
                            <span className="drop-shadow-sm">{cursor.userName || `User ${id.substring(0, 4)}`}</span>
                        </motion.div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default CursorOverlay;