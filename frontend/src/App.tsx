import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Room from './components/Room';
import { Users, Palette, Zap, Plus, ArrowRight, LogIn, LogOut, FolderKanban, ShieldCheck } from 'lucide-react';
import { useWhiteboardStore } from './store/useWhiteboardStore';
import { useThemeStore } from './store/useThemeStore';
import { useState, useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';
import { AuthModal } from './components/AuthModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { RoomHistoryModal } from './components/RoomHistoryModal';
import { authService } from './services/authService';
import type { UserAuth } from './services/authService';

const Home = () => {
    const navigate = useNavigate();
    const { userName, setUserName } = useWhiteboardStore();
    const { theme } = useThemeStore();
    const [isJoining, setIsJoining] = useState(false);
    const [roomIdInput, setRoomIdInput] = useState('');
    const [nameError, setNameError] = useState(false);

    // Modals
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Current Auth State
    const [currentUser, setCurrentUser] = useState<UserAuth | null>(authService.getCurrentUser());

    useEffect(() => {
        document.documentElement.classList.add(theme);
        return () => document.documentElement.classList.remove(theme);
    }, [theme]);

    useEffect(() => {
        if (currentUser && currentUser.username && !userName) {
            setUserName(currentUser.username);
        }
    }, [currentUser]);

    const handleAuthSuccess = (user: UserAuth) => {
        setCurrentUser(user);
        setUserName(user.username);
    };

    const handleSignOut = () => {
        authService.clearCurrentUser();
        setUserName('');
        setCurrentUser(null);
    };

    const handleStartBoard = () => {
        // Open Create Room modal with custom name option
        setIsCreateOpen(true);
    };

    const handleRoomCreated = (roomCode: string) => {
        navigate(`/room/${roomCode}`);
    };

    const handleJoinBoard = async () => {
        if (!isJoining) {
            setIsJoining(true);
            return;
        }
        if (!userName.trim() && !currentUser) {
            setNameError(true);
            return;
        }
        if (!roomIdInput.trim()) return;
        setNameError(false);

        try {
            await authService.joinRoom(roomIdInput.trim());
        } catch (e) {
            console.warn('Could not register room join in backend, joining directly:', e);
        }
        navigate(`/room/${roomIdInput.trim()}`);
    };

    return (
        <div className="relative flex flex-col items-center justify-start min-h-screen bg-[var(--bg-color)] overflow-y-auto overflow-x-hidden transition-all duration-700 p-4 sm:p-8 py-8 md:py-16">
            <div className="mesh-gradient" />

            {/* Top Navigation Bar with Authentication & History */}
            <header className="z-20 w-full max-w-6xl flex items-center justify-between py-3 px-4 mb-6 glass-panel rounded-2xl border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                        CS
                    </div>
                    <span className="font-bold text-sm tracking-tight text-[var(--text-color)] hidden sm:inline">
                        Collab-Sphere
                    </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {currentUser ? (
                        <>
                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-color)] hover:border-indigo-500/50 transition-colors shadow-xs"
                            >
                                <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                                <span>My Rooms</span>
                            </button>

                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="max-w-[100px] truncate">{currentUser.username}</span>
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setAuthMode('signin'); setIsAuthOpen(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-color)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Sign In</span>
                            </button>
                            <button
                                onClick={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                <span>Sign Up</span>
                            </button>
                        </>
                    )}

                    <ThemeToggle />
                </div>
            </header>

            {/* Background floating elements */}
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
                className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center pt-4 md:pt-0"
            >
                {/* Left Side: Creative Portal */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left pt-4 lg:pt-0">
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
                        The world's most vibrant real-time canvas with instant phone home-screen live whiteboard sync.
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
                    className="w-full max-w-md mx-auto glass-panel rounded-[2rem] md:rounded-[3rem] p-6 sm:p-12 flex flex-col gap-6 md:gap-8 relative overflow-hidden group shadow-2xl"
                >
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--secondary-text)] opacity-70">
                                    Display Name
                                </label>
                                {!currentUser && (
                                    <button
                                        onClick={() => { setAuthMode('signin'); setIsAuthOpen(true); }}
                                        className="text-[10px] text-indigo-500 font-bold hover:underline"
                                    >
                                        Sign in to save rooms
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder={currentUser ? currentUser.username : "Enter your name..."}
                                value={userName}
                                onChange={(e) => { setUserName(e.target.value); setNameError(false); }}
                                className={`w-full px-6 py-4 bg-[var(--bg-color)]/50 border text-[var(--text-color)] rounded-[2rem] focus:outline-none focus:ring-4 transition-all font-bold text-base placeholder:opacity-30 ${
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
                                    className="space-y-2"
                                >
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--secondary-text)] px-2 opacity-70">Room ID / Code</label>
                                    <input
                                        type="text"
                                        placeholder="Paste Room ID..."
                                        value={roomIdInput}
                                        onChange={(e) => setRoomIdInput(e.target.value)}
                                        className="w-full px-6 py-4 bg-[var(--bg-color)]/50 border border-[var(--border-color)] text-[var(--text-color)] rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-[var(--accent-secondary)]/20 focus:border-[var(--accent-secondary)]/50 transition-all font-bold text-base font-mono uppercase"
                                        autoFocus
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleStartBoard}
                                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[var(--text-color)] text-[var(--bg-color)] rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:shadow-[var(--accent-primary)]/20 transition-all"
                            >
                                <Plus size={18} strokeWidth={3} /> Create Named Room
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleJoinBoard}
                                className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl
                                    ${isJoining && !roomIdInput.trim()
                                        ? 'bg-[var(--bg-color)] text-[var(--secondary-text)] cursor-not-allowed border border-[var(--border-color)]'
                                        : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white hover:brightness-110'
                                    }`}
                            >
                                {!isJoining ? (
                                    <><Users size={18} strokeWidth={3} /> Join Existing Room</>
                                ) : (
                                    <><ArrowRight size={18} strokeWidth={3} /> Secure Access</>
                                )}
                            </motion.button>
                        </div>

                        {currentUser && (
                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                            >
                                <FolderKanban className="w-4 h-4" />
                                <span>View Your Room & Participation History</span>
                            </button>
                        )}
                    </div>

                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--accent-primary)]/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-[var(--accent-primary)]/20 transition-all" />
                </motion.div>
            </motion.div>

            {/* Modals */}
            <AuthModal
                isOpen={isAuthOpen}
                initialMode={authMode}
                onClose={() => setIsAuthOpen(false)}
                onSuccess={handleAuthSuccess}
            />

            <CreateRoomModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onRoomCreated={handleRoomCreated}
            />

            <RoomHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                onSelectRoom={(code) => navigate(`/room/${code}`)}
            />
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
