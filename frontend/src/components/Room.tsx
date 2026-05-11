
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWhiteboardStore } from '../store/useWhiteboardStore';
import { useThemeStore } from '../store/useThemeStore';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import ThemeToggle from './ThemeToggle';
import CursorOverlay from './CursorOverlay';
import HistorySidebar from './HistorySidebar';
import { Share2, Users, Wifi, WifiOff, Home, Copy, X, Check, History as HistoryIcon, Download, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

const { useState, useEffect, useRef } = React;

// ── Name Gate: shown when userName is empty ──────────────────────────────────
const NameGate = ({ userColor, onEnter }: { userColor: string; onEnter: (name: string) => void }) => {
    const [draft, setDraft] = useState('');
    const [error, setError] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const submit = () => {
        if (!draft.trim()) { setError(true); return; }
        onEnter(draft.trim());
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-2xl"
        >
            <motion.div
                initial={{ scale: 0.85, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 160 }}
                className="glass-panel rounded-[3rem] p-10 sm:p-14 w-full max-w-md shadow-2xl flex flex-col gap-8 relative overflow-hidden"
            >
                {/* Color preview sphere */}
                <div
                    className="w-14 h-14 rounded-full shadow-2xl mx-auto"
                    style={{ background: userColor, boxShadow: `0 0 40px ${userColor}99` }}
                />
                <div className="text-center">
                    <h2 className="text-3xl font-black text-[var(--text-color)] tracking-tighter">What's your name?</h2>
                    <p className="text-[var(--secondary-text)] text-sm mt-2 opacity-70">You'll be shown to others with this name and color</p>
                </div>

                <div className="flex flex-col gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Enter your name..."
                        value={draft}
                        maxLength={24}
                        onChange={(e) => { setDraft(e.target.value); setError(false); }}
                        onKeyDown={(e) => e.key === 'Enter' && submit()}
                        className={`w-full px-6 py-4 bg-[var(--bg-color)]/60 border text-[var(--text-color)] rounded-2xl focus:outline-none focus:ring-4 transition-all font-bold text-lg placeholder:opacity-30 ${error
                            ? 'border-red-400 focus:ring-red-400/20'
                            : 'border-[var(--border-color)] focus:ring-[var(--accent-primary)]/30 focus:border-[var(--accent-primary)]/60'
                            }`}
                    />
                    {error && <p className="text-red-400 text-xs font-bold px-1">⚠ Please enter your name</p>}
                </div>

                <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={submit}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all"
                    style={{ background: `linear-gradient(135deg, ${userColor}, ${userColor}aa)` }}
                >
                    <ArrowRight size={18} strokeWidth={3} /> Join Room
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

// ── Room ─────────────────────────────────────────────────────────────────────
const Room = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const {
        connect, disconnect,
        isConnected, activeUsers, connectionError,
        userName, setUserName, userColor
    } = useWhiteboardStore();
    const { theme } = useThemeStore();
    const [showShareModal, setShowShareModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [copied, setCopied] = useState(false);
    const [nameReady, setNameReady] = useState(!!userName.trim());

    // Connect only after name is set
    useEffect(() => {
        if (!roomId) { navigate('/'); return; }
        // If the user pasted the ID with spaces instead of hyphens, auto-correct the URL
        if (roomId.includes(' ')) {
            navigate(`/room/${roomId.replace(/ /g, '-')}`, { replace: true });
            return;
        }
        if (!nameReady) return;
        connect(roomId);

        // Fetch version history
        fetch(`https://collab-sphere-digitalwhiteboard.onrender.com/api/version/${roomId}`)
            .then(res => res.json())
            .then(data => {
                console.log("History:", data);

                if (data.length > 0) {
                    const latest = data[0]; // only latest snapshot
                    const elements = JSON.parse(latest.snapshot);

                    if (Array.isArray(elements)) {
                        elements.forEach((el: any) => {
                            useWhiteboardStore.getState()._applyPoint(el);
                        });
                    } else if (elements && typeof elements === 'object') {
                        // The elements are stored as a map of strokes
                        Object.values(elements as Record<string, any>).forEach(stroke => {
                            if (stroke && Array.isArray(stroke.points)) {
                                stroke.points.forEach((p: any) => useWhiteboardStore.getState()._applyPoint(p));
                            }
                        });
                    }
                }
            })
            .catch(err => console.error("History fetch error:", err));

        return () => {
            // only disconnect if leaving page
            if (!window.location.pathname.includes('/room')) {
                disconnect();
            }
        };
    }, [roomId, nameReady, connect, disconnect, navigate]);

    useEffect(() => {
        document.documentElement.classList.toggle('light', theme === 'light');
    }, [theme]);

    const handleNameEnter = (name: string) => {
        setUserName(name);
        setNameReady(true);
    };

    const userCount = Math.max(1, Object.keys(activeUsers).length);

    const handleLeave = () => {
        useWhiteboardStore.getState().disconnect();
        window.location.href = "/";
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(roomId || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch { }
    };

    const exportToPDF = () => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tctx = tempCanvas.getContext('2d');
        if (!tctx) return;
        tctx.fillStyle = theme === 'light' ? '#f8fafc' : '#0b071a';
        tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tctx.drawImage(canvas, 0, 0);
        const imgData = tempCanvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`whiteboard-${roomId}.pdf`);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-screen h-screen overflow-hidden bg-[var(--bg-color)] transition-colors duration-700 font-bold"
        >
            <div className="mesh-gradient" />

            {/* Dot grid */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(var(--accent-primary) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}
            />

            <Canvas />
            <CursorOverlay />

            <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} />

            {/* Name gate overlay — shown when user hasn't set a name yet */}
            <AnimatePresence>
                {!nameReady && (
                    <NameGate userColor={userColor} onEnter={handleNameEnter} />
                )}
            </AnimatePresence>

            {/* Connection error toast */}
            <AnimatePresence>
                {connectionError && (
                    <motion.div
                        initial={{ y: -50, opacity: 0, x: '-50%' }}
                        animate={{ y: 0, opacity: 1, x: '-50%' }}
                        exit={{ y: -50, opacity: 0, x: '-50%' }}
                        className="absolute top-8 left-1/2 transform bg-red-500/10 backdrop-blur-3xl text-red-500 px-8 py-4 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.2)] z-[200] flex items-center gap-4 border border-red-500/30"
                    >
                        <WifiOff size={20} className="animate-bounce" />
                        <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-widest leading-none mb-1">Connection Lost</span>
                            <span className="text-[10px] opacity-70 font-semibold tracking-wide">Sync offline. Retrying…</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top nav */}
            <motion.div
                initial={{ y: -20, x: '-50%', opacity: 0 }}
                animate={{ y: 0, x: '-50%', opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.2 }}
                className="absolute left-1/2 top-4 md:top-8 w-[92%] md:w-auto z-[50] flex items-center justify-between md:justify-start gap-4 md:gap-6 px-4 md:px-8 py-3 md:py-4 glass-panel rounded-full shadow-2xl"
            >
                <div className="flex items-center gap-2 md:gap-4 border-r border-[var(--border-color)] pr-3 md:pr-6 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: -90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/')}
                        className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--accent-primary)] transition-all"
                        title="Home"
                    >
                        <Home size={20} strokeWidth={3} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1, x: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLeave}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        title="Leave Room"
                    >
                        <X size={16} strokeWidth={3} />
                        <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Leave</span>
                    </motion.button>

                    <div className="flex flex-col ml-2">
                        <span className="hidden md:block text-[9px] uppercase tracking-[0.3em] text-[var(--accent-primary)] font-black opacity-80 leading-none mb-1">Node</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs md:text-sm font-black text-[var(--text-color)] tracking-tighter">{roomId?.substring(0, 8)}</span>
                            <motion.button
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.8 }}
                                onClick={handleCopy}
                                className="text-[var(--secondary-text)] hover:text-[var(--accent-primary)] transition-all"
                            >
                                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            </motion.button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6 flex-1 md:flex-none justify-center">
                    {/* Current user chip */}
                    <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-[var(--bg-color)]/50 border border-[var(--border-color)] rounded-full overflow-hidden">
                        <div
                            className="w-2 h-2 rounded-full animate-pulse shrink-0"
                            style={{ backgroundColor: userColor, boxShadow: `0 0 8px ${userColor}` }}
                        />
                        <span className="text-[10px] md:text-[11px] font-black text-[var(--text-color)] uppercase tracking-widest truncate max-w-[60px] md:max-w-[120px]">
                            {userName || 'You'}
                        </span>
                    </div>

                    {/* Other users' color dots */}
                    <div className="hidden sm:flex items-center gap-2">
                        {Object.values(activeUsers).slice(0, 4).map((u, i) => (
                            <div
                                key={i}
                                title={u.name}
                                className="w-6 h-6 rounded-full border-2 border-[var(--border-color)] flex items-center justify-center text-[8px] font-black text-white"
                                style={{ backgroundColor: u.color, boxShadow: `0 0 8px ${u.color}80` }}
                            >
                                {u.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                        ))}
                    </div>

                    <div className="hidden sm:flex items-center gap-4">
                        <div
                            className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-color)]/40"
                            title={`${userCount} user${userCount !== 1 ? 's' : ''} in room`}
                        >
                            <Users size={13} className="text-[var(--accent-secondary)]" />
                            <span className="text-[11px] font-black text-[var(--text-color)]">{userCount}</span>
                        </div>
                        {isConnected ? (
                            <div className="relative">
                                <Wifi size={14} className="text-green-500" />
                                <div className="absolute inset-0 animate-ping bg-green-500/40 rounded-full" />
                            </div>
                        ) : <WifiOff size={14} className="text-red-500 animate-pulse" />}
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 border-l border-[var(--border-color)] pl-3 md:pl-6 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowHistory(true)}
                        className="hidden md:flex p-2 text-[var(--secondary-text)] hover:text-[var(--accent-primary)] transition-all"
                    >
                        <HistoryIcon size={20} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={exportToPDF}
                        className="p-1 md:p-2 text-[var(--secondary-text)] hover:text-[var(--accent-secondary)] transition-all"
                    >
                        <Download size={20} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowShareModal(true)}
                        className="px-4 md:px-8 py-2 md:py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all shadow-xl"
                    >
                        Invite
                    </motion.button>
                </div>
            </motion.div>

            {/* Theme toggle */}
            <div className="fixed top-8 right-8 z-[60] flex flex-col gap-4">
                <ThemeToggle />
            </div>

            <Toolbar />

            {/* Share modal */}
            <AnimatePresence>
                {showShareModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[200]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 100 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 100 }}
                            className="fixed inset-0 flex items-center justify-center z-[201] pointer-events-none p-4"
                        >
                            <div className="glass-panel rounded-[3rem] p-12 sm:p-16 shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-xl pointer-events-auto relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                    <Share2 size={200} />
                                </div>
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-5xl font-black text-[var(--text-color)] tracking-tighter mb-2">Invite Link</h2>
                                        <p className="text-[var(--secondary-text)] text-sm font-bold uppercase tracking-widest opacity-60">Share with collaborators</p>
                                    </div>
                                    <button onClick={() => setShowShareModal(false)} className="p-3 hover:bg-[var(--border-color)] rounded-full text-[var(--secondary-text)] hover:text-[var(--text-color)] transition-all">
                                        <X size={28} />
                                    </button>
                                </div>
                                <div className="bg-[var(--bg-color)]/80 border border-[var(--border-color)] rounded-[2.5rem] px-10 py-8 mb-12 shadow-inner group">
                                    <p className="text-[10px] text-[var(--accent-primary)] uppercase tracking-[0.4em] font-black mb-4">Room ID</p>
                                    <p className="text-[var(--text-color)] font-black text-2xl break-all tracking-tighter group-hover:text-[var(--accent-primary)] transition-colors">{roomId}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-5">
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCopy}
                                        className={`flex-1 flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all shadow-2xl ${copied ? 'bg-emerald-500 text-white' : 'bg-[var(--text-color)] text-[var(--bg-color)]'}`}
                                    >
                                        {copied ? <Check size={24} strokeWidth={4} /> : <Copy size={24} strokeWidth={4} />} {copied ? 'Copied!' : 'Copy ID'}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
                                        className="flex-1 flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-2xl transition-all"
                                    >
                                        <Share2 size={24} strokeWidth={3} /> Copy Link
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Room;
