
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import Room from './components/Room';
import { Users, Palette, Zap, Plus, ArrowRight } from 'lucide-react';
import { useWhiteboardStore } from './store/useWhiteboardStore';
import { useThemeStore } from './store/useThemeStore';
import { useState, useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';


const Home = () => {
    const navigate = useNavigate();
    const { userName, setUserName } = useWhiteboardStore();
    const { theme } = useThemeStore();
    const [isJoining, setIsJoining] = useState(false);
    const [roomIdInput, setRoomIdInput] = useState('');
    const [nameError, setNameError] = useState(false);

    useEffect(() => {
        // Theme class management is now handled in ThemeToggle for global consistency, 
        // but we'll ensure it's set here for the home page too.
        document.documentElement.classList.add(theme);
        return () => document.documentElement.classList.remove(theme);
    }, [theme]);

    const handleStartBoard = () => {
        if (!userName.trim()) { setNameError(true); return; }
        setNameError(false);
        const newRoomId = uuidv4();
        navigate(`/room/${newRoomId}`);
    };

    const handleJoinBoard = () => {
        if (!isJoining) {
            setIsJoining(true);
            return;
        }
        if (!userName.trim()) { setNameError(true); return; }
        if (!roomIdInput.trim()) return;
        setNameError(false);
        navigate(`/room/${roomIdInput.trim()}`);
    };

    return (
        <div className="relative flex flex-col items-center justify-start min-h-screen bg-[var(--bg-color)] overflow-y-auto overflow-x-hidden transition-all duration-700 p-6 sm:p-12 py-12 md:py-24">
            <div className="mesh-gradient" />

            {/* Background floating elements for "Wicked" feel */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ 
                            x: [0, Math.random() * 100 - 50, 0],
                            y: [0, Math.random() * 100 - 50, 0],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-64 h-64 rounded-full blur-[100px]"
                        style={{ 
                            background: i % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center pt-10 md:pt-0"
            >
                {/* Left Side: Creative Portal */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left pt-8 lg:pt-0">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2 px-4 py-2 mb-6 md:mb-8 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 rounded-full border border-[var(--accent-primary)]/20 shadow-lg backdrop-blur-md"
                    >
                        <Zap size={14} fill="currentColor" className="animate-pulse" /> Studio Engine 2.0
                    </motion.div>
                    
                    <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tightest mb-6 md:mb-8 leading-[0.9] text-[var(--text-color)] drop-shadow-2xl">
                        Collab<br />
                        <span className="glow-text font-outline-2 italic">Sphere</span>
                    </h1>

                    <p className="text-[var(--secondary-text)] text-base md:text-xl font-semibold max-w-lg mb-8 md:mb-12 leading-relaxed opacity-80">
                        The world's most vibrant real-time canvas. Redefine collaboration with high-energy tools and immersive environments.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 md:gap-6 justify-center lg:justify-start">
                        <FeatureTag icon={<Users size={16} />} text="Team Hub" />
                        <FeatureTag icon={<Palette size={16} />} text="Themes" />
                        <FeatureTag icon={<Zap size={16} />} text="Fast" />
                    </div>
                </div>

                {/* Right Side: Command Center */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full max-w-md mx-auto glass-panel rounded-[2rem] md:rounded-[3rem] p-6 sm:p-14 flex flex-col gap-6 md:gap-8 relative overflow-hidden group"
                >
                    <div className="absolute top-4 md:top-8 right-6 md:right-8">
                        <ThemeToggle />
                    </div>

                    <div className="relative z-10 space-y-8 mt-4">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--secondary-text)] px-2 opacity-60">Your Display Name</label>
                            <input
                                type="text"
                                placeholder="Enter your name..."
                                value={userName}
                                onChange={(e) => { setUserName(e.target.value); setNameError(false); }}
                                className={`w-full px-8 py-5 bg-[var(--bg-color)]/50 border text-[var(--text-color)] rounded-[2rem] focus:outline-none focus:ring-4 transition-all font-bold text-lg placeholder:opacity-30 ${
                                    nameError
                                        ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
                                        : 'border-[var(--border-color)] focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]/50'
                                }`}
                            />
                            {nameError && (
                                <p className="text-red-400 text-[11px] font-bold px-2 mt-1">⚠ Please enter your name before joining</p>
                            )}
                        </div>

                        <AnimatePresence>
                            {isJoining && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                    className="space-y-3"
                                >
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--secondary-text)] px-2 opacity-60">Space Destination</label>
                                    <input
                                        type="text"
                                        placeholder="Paste Room ID..."
                                        value={roomIdInput}
                                        onChange={(e) => setRoomIdInput(e.target.value)}
                                        className="w-full px-8 py-5 bg-[var(--bg-color)]/50 border border-[var(--border-color)] text-[var(--text-color)] rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-[var(--accent-secondary)]/20 focus:border-[var(--accent-secondary)]/50 transition-all font-bold text-md"
                                        autoFocus
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleStartBoard}
                                className="w-full flex items-center justify-center gap-4 px-10 py-6 bg-[var(--text-color)] text-[var(--bg-color)] rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:shadow-[var(--accent-primary)]/20 transition-all"
                            >
                                <Plus size={20} strokeWidth={3} /> Initialize Space
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleJoinBoard}
                                className={`w-full flex items-center justify-center gap-4 px-10 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl
                                    ${isJoining && !roomIdInput.trim()
                                        ? 'bg-[var(--bg-color)] text-[var(--secondary-text)] cursor-not-allowed border border-[var(--border-color)]'
                                        : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white hover:brightness-110'
                                    }`}
                            >
                                {!isJoining ? (
                                    <><Users size={20} strokeWidth={3} /> Sync to Room</>
                                ) : (
                                    <><ArrowRight size={20} strokeWidth={3} /> Secure Access</>
                                )}
                            </motion.button>
                        </div>
                    </div>

                    {/* Decorative Background for the card */}
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--accent-primary)]/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-[var(--accent-primary)]/20 transition-all" />
                </motion.div>
            </motion.div>
        </div>
    );
};

const FeatureTag = ({ icon, text }: { icon: any, text: string }) => (
    <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-color)] text-[10px] font-black uppercase tracking-widest shadow-md hover:border-[var(--accent-primary)]/50 transition-all cursor-default interactive-hover">
        <span className="text-[var(--accent-primary)]">{icon}</span>
        {text}
    </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
