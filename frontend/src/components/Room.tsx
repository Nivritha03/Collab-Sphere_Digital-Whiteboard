
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWhiteboardStore } from '../store/useWhiteboardStore';
import { useThemeStore } from '../store/useThemeStore';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import ThemeToggle from './ThemeToggle';
import CursorOverlay from './CursorOverlay';
import HistorySidebar from './HistorySidebar';
import { Share2, Users, WifiOff, Home, Copy, X, Check, ArrowRight, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { getBackendUrls } from '../config/apiConfig';
import { authService } from '../services/authService';

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
    const [nameReady, setNameReady] = useState(() => {
        if (userName && userName.trim()) return true;
        try {
            const authStr = localStorage.getItem('collab_sphere_auth_user');
            if (authStr) {
                const parsed = JSON.parse(authStr);
                if (parsed.username) {
                    setUserName(parsed.username);
                    return true;
                }
            }
            const stored = localStorage.getItem('collab_sphere_username');
            if (stored && stored.trim()) {
                setUserName(stored.trim());
                return true;
            }
        } catch {}
        return false;
    });
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [roomDetails, setRoomDetails] = useState<{ name: string; createdBy: string } | null>(null);

    // Fetch room name and creator
    useEffect(() => {
        if (!roomId) return;
        const { apiUrl } = getBackendUrls();
        fetch(`${apiUrl}/api/whiteboard/${roomId}/state`)
            .then(res => res.json())
            .then(data => {
                if (data && data.roomName) {
                    setRoomDetails({ name: data.roomName, createdBy: data.createdBy || '' });
                }
            })
            .catch(() => {});
    }, [roomId]);

    // Generate QR code whenever share modal opens
    useEffect(() => {
        if (showShareModal && roomId) {
            const inviteUrl = `${window.location.origin}/room/${roomId}`;
            QRCode.toDataURL(inviteUrl, { width: 220, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
                .then(setQrCodeUrl)
                .catch(() => {});
        }
    }, [showShareModal, roomId]);

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

        // Ensure persistent membership is recorded in database for history tracking
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser && currentUser.email) {
                authService.joinRoom(roomId).catch(() => {});
            }
        } catch {}

        // Fetch version history & initial board snapshot
        const { apiUrl } = getBackendUrls();
        fetch(`${apiUrl}/api/version/${roomId}`)
            .then(res => res.json())
            .then(data => {
                if (data.length > 0) {
                    const latest = data[0]; // only latest snapshot
                    const elements = JSON.parse(latest.snapshot);

                    if (Array.isArray(elements)) {
                        elements.forEach((el: any) => {
                            useWhiteboardStore.getState()._applyPoint(el);
                        });
                    } else if (elements && typeof elements === 'object') {
                        Object.values(elements as Record<string, any>).forEach(stroke => {
                            if (stroke && Array.isArray(stroke.points)) {
                                stroke.points.forEach((p: any) => useWhiteboardStore.getState()._applyPoint(p));
                            }
                        });
                    }
                }
            })
            .catch(err => console.log("History fetch note:", err));

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

    // Explicit Exit Room (keeps drawing and room history intact in DB, but marks membership exited)
    const handleExitRoom = async () => {
        if (roomId) {
            try {
                await authService.exitRoom(roomId);
            } catch (e) {
                console.error('Failed to notify room exit:', e);
            }
        }
        useWhiteboardStore.getState().disconnect();
        navigate('/');
    };

    const handleCopy = async () => {
        const textToCopy = roomId || '';
        if (!textToCopy) return;

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                throw new Error('Clipboard API unavailable');
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Mobile Safari / HTTP fallback
            try {
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                }
            } catch (err) {
                console.error('Copy fallback failed:', err);
            }
        }
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

            {/* Top nav - ultra-responsive for mobile & iPhone */}
            <motion.div
                initial={{ y: -20, x: '-50%', opacity: 0 }}
                animate={{ y: 0, x: '-50%', opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.2 }}
                className="fixed left-1/2 top-1.5 sm:top-4 z-[50] flex items-center justify-between gap-1.5 px-2 sm:px-4 py-1.5 w-[calc(100%-0.75rem)] max-w-2xl glass-panel rounded-2xl sm:rounded-full shadow-2xl backdrop-blur-2xl border border-white/10 overflow-x-auto no-scrollbar"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.35rem)',
                }}
            >
                {/* Left group */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/')}
                        className="p-1 sm:p-1.5 text-[var(--secondary-text)] hover:text-[var(--accent-primary)] transition-all rounded-full"
                        title="Home"
                    >
                        <Home size={15} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExitRoom}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shrink-0"
                        title="Explicitly Exit Room"
                    >
                        <X size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Exit</span>
                    </motion.button>

                    {/* Room Name & ID pill with copy */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-color)]/60 border border-[var(--border-color)] max-w-[105px] sm:max-w-[180px] shrink-0">
                        <span className="text-[10px] sm:text-xs font-bold text-[var(--text-color)] truncate">
                            {roomDetails?.name || (roomId ? `#${roomId.substring(0, Math.min(6, roomId.length))}` : 'Board')}
                        </span>
                        <button
                            onClick={handleCopy}
                            className="text-[var(--secondary-text)] hover:text-[var(--accent-primary)] p-0.5 transition-all shrink-0"
                            title="Copy Room ID"
                        >
                            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        </button>
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">

                    {/* Participant count */}
                    <div
                        className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-color)]/40 text-[9px] sm:text-[10px] font-bold shrink-0"
                        title={`${userCount} active in room`}
                    >
                        <Users size={10} className="text-[var(--accent-secondary)]" />
                        <span>{userCount}</span>
                    </div>

                    {/* Live status dot */}
                    <span 
                        className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-red-500 animate-pulse'}`} 
                        title={isConnected ? 'Connected' : 'Offline'} 
                    />

                    {/* Share Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowShareModal(true)}
                        className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md shrink-0"
                    >
                        Share
                    </motion.button>

                    {/* Theme Toggle */}
                    <div className="shrink-0 scale-90 sm:scale-100">
                        <ThemeToggle />
                    </div>
                </div>
            </motion.div>

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
                            <div className="glass-panel rounded-3xl sm:rounded-[3rem] p-6 sm:p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-lg pointer-events-auto relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                    <Share2 size={120} />
                                </div>
                                <div className="flex justify-between items-start mb-6 sm:mb-8">
                                    <div>
                                        <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-color)] tracking-tighter mb-1">Invite Link</h2>
                                        <p className="text-[var(--secondary-text)] text-xs font-bold uppercase tracking-widest opacity-60">Share with collaborators</p>
                                    </div>
                                    <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-[var(--border-color)] rounded-full text-[var(--secondary-text)] hover:text-[var(--text-color)] transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="bg-[var(--bg-color)]/80 border border-[var(--border-color)] rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 mb-6 shadow-inner flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                    {qrCodeUrl && (
                                        <div className="bg-white p-2.5 rounded-2xl shadow-md shrink-0">
                                            <img src={qrCodeUrl} alt="Room QR Code" className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg" />
                                            <p className="text-[9px] text-center font-bold text-slate-700 mt-1 uppercase tracking-wider">Scan with Phone</p>
                                        </div>
                                    )}
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="text-[10px] text-[var(--accent-primary)] uppercase tracking-[0.3em] font-black mb-1">Room ID</p>
                                        <p className="text-[var(--text-color)] font-mono font-black text-base sm:text-lg break-all tracking-tight mb-2">{roomId}</p>
                                        <p className="text-xs text-[var(--secondary-text)] opacity-80">Scan the QR code with another mobile phone camera to join this whiteboard directly.</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCopy}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-xl ${copied ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white'}`}
                                    >
                                        {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} strokeWidth={3} />} {copied ? 'Room ID Copied!' : 'Copy Room ID'}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={exportToPDF}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-wider text-xs bg-white/10 text-[var(--text-color)] hover:bg-white/20 border border-[var(--border-color)] transition-all"
                                    >
                                        <Download size={16} /> Export PDF
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
