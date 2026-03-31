
import React from 'react';
import { useWhiteboardStore } from '../store/useWhiteboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose }) => {
    const { strokeOrder, strokes, historyIndex, setHistoryIndex } = useWhiteboardStore();

    const count = strokeOrder.length;
    const currentIndex = historyIndex === -1 ? count - 1 : historyIndex;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        layout
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-96 glass-panel z-[70] p-6 sm:p-8 flex flex-col gap-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-purple-500">
                                <History size={28} strokeWidth={2.5} />
                                <h2 className="text-2xl font-black text-[var(--text-color)] tracking-tight">Timeline</h2>
                            </div>
                            <motion.button 
                                whileHover={{ rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose} 
                                className="p-2.5 hover:bg-white/5 rounded-2xl transition-colors text-[var(--secondary-text)]"
                            >
                                <X size={24} />
                            </motion.button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                            {strokeOrder.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-[var(--secondary-text)] opacity-50">
                                    <Play size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">No activity captured</p>
                                    <p className="text-xs">Start drawing to see history</p>
                                </div>
                            ) : (
                                strokeOrder.map((sid, index) => {
                                    const stroke = strokes[sid];
                                    const isTarget = index === currentIndex;
                                    const isFuture = index > currentIndex && historyIndex !== -1;

                                    return (
                                        <motion.div
                                            key={sid}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: (strokeOrder.length - 1 - index) * 0.05 }}
                                            onClick={() => setHistoryIndex(index)}
                                            className={`group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${isTarget
                                                ? 'bg-purple-500/10 border-purple-500/50 text-[var(--text-color)] shadow-lg'
                                                : isFuture
                                                    ? 'bg-[var(--bg-color)] border-transparent opacity-30 text-[var(--secondary-text)]'
                                                    : 'bg-[var(--bg-color)] border-[var(--border-color)] hover:border-purple-500/30 text-[var(--secondary-text)]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isTarget ? 'text-purple-400' : 'opacity-30'}`}>
                                                    Step {index + 1}
                                                </span>
                                                <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: stroke?.points[0]?.color }} />
                                            </div>
                                            <div className="text-sm font-bold flex items-center gap-2">
                                                <span className="capitalize">{stroke?.points[0]?.tool || 'Stroke'}</span>
                                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full opacity-50">@{stroke?.userId?.substring(0, 4)}</span>
                                            </div>
                                            {isTarget && (
                                                <motion.div 
                                                    layoutId="indicator" 
                                                    className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"
                                                />
                                            )}
                                        </motion.div>
                                    );
                                }).reverse()
                            )}
                        </div>

                        {/* Controls */}
                        <div className="pt-6 border-t border-[var(--border-color)] space-y-6 bg-gradient-to-t from-[var(--card-bg)] to-transparent -mx-2 px-2">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80">
                                <span>Rewind Timeline</span>
                                <span>{currentIndex + 1} / {count}</span>
                            </div>

                            <input
                                type="range"
                                min={-1}
                                max={count - 1}
                                value={historyIndex}
                                onChange={(e) => setHistoryIndex(parseInt(e.target.value))}
                                className="w-full accent-purple-500 h-1.5 bg-[var(--bg-color)] rounded-lg appearance-none cursor-pointer border border-[var(--border-color)]"
                            />

                            <div className="flex items-center justify-center gap-4 pb-2">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    disabled={currentIndex <= 0}
                                    onClick={() => setHistoryIndex(currentIndex - 1)}
                                    className="p-4 bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-purple-500/30 disabled:opacity-30 rounded-[1.25rem] transition-all text-[var(--text-color)] shadow-xl"
                                >
                                    <ChevronLeft size={24} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setHistoryIndex(-1)}
                                    className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-sm uppercase tracking-widest rounded-[1.25rem] transition-all shadow-xl shadow-purple-500/20"
                                >
                                    Current Live
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    disabled={currentIndex >= count - 1 && historyIndex !== -1}
                                    onClick={() => setHistoryIndex(currentIndex + 1)}
                                    className="p-4 bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-purple-500/30 disabled:opacity-30 rounded-[1.25rem] transition-all text-[var(--text-color)] shadow-xl"
                                >
                                    <ChevronRight size={24} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default HistorySidebar;
