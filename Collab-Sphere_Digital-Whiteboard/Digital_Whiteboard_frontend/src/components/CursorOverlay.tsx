import { useWhiteboardStore, fromVirX, fromVirY } from '../store/useWhiteboardStore';
import { MousePointer2 } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CursorOverlay: React.FC = () => {
    const cursors = useWhiteboardStore((state) => state.cursors);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });

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

    return (
        <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[40] overflow-hidden">
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
                        className="absolute flex flex-col items-start"
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
                            className="px-3 py-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-white rounded-xl whitespace-nowrap backdrop-blur-xl shadow-2xl border border-white/10"
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
