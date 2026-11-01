import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    getWidgetData, 
    clearWidgetData, 
    saveWidgetData
} from '../services/widgetStorage';
import type { WidgetRoomData } from '../services/widgetStorage';
import { MobileLiveWidget } from './MobileLiveWidget';
import { 
    Smartphone, 
    ArrowLeft, 
    Zap, 
    Copy, 
    Check,
    RefreshCw
} from 'lucide-react';
import { getBackendUrls } from '../config/apiConfig';

export const PhoneSimulatorView: React.FC = () => {
    const navigate = useNavigate();
    const [widgetData, setWidgetData] = useState<WidgetRoomData | null>(null);
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const activeRoomId = widgetData?.roomId || 'collab-demo-room';

    useEffect(() => {
        // Load initial widget state
        const stored = getWidgetData();
        if (stored) {
            setWidgetData(stored);
        } else {
            // Setup demo data if empty
            const initial: WidgetRoomData = {
                roomId: 'collab-demo-room',
                roomName: 'Project Planning Board',
                userName: 'Alex',
                userColor: '#3b82f6',
                lastUpdated: Date.now(),
                strokeCount: 4,
                participantCount: 2,
                connectionState: 'Connected',
                isSharingActive: true
            };
            saveWidgetData(initial);
            setWidgetData(initial);
        }

        // Listen for storage updates across tabs or windows
        const handleStorage = () => {
            const updated = getWidgetData();
            if (updated) setWidgetData(updated);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const handleOpenWhiteboard = (roomId: string) => {
        navigate(`/room/${roomId}`);
    };

    const handleStopSharing = () => {
        clearWidgetData();
        setWidgetData(null);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const { apiUrl } = getBackendUrls();
            if (widgetData?.roomId) {
                const res = await fetch(`${apiUrl}/api/whiteboard/${widgetData.roomId}/state`);
                if (res.ok) {
                    const data = await res.json();
                    const updated: WidgetRoomData = {
                        ...(widgetData || {
                            roomId: data.roomId,
                            roomName: 'Project Board',
                            userName: 'Collaborator',
                            userColor: '#3b82f6',
                            isSharingActive: true
                        }),
                        lastUpdated: data.lastUpdatedAt || Date.now(),
                        strokeCount: data.elements?.length || 0,
                        participantCount: Math.max(1, data.participantCount || 1),
                        connectionState: 'Connected'
                    };
                    saveWidgetData(updated);
                    setWidgetData(updated);
                }
            }
        } catch (e) {
            console.log('Using cached preview', e);
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] text-white overflow-x-hidden overflow-y-auto p-3 sm:p-6 md:p-8 flex flex-col items-center justify-between">
            {/* Top Navigation & Action Bar */}
            <div className="w-full max-w-7xl flex flex-wrap items-center justify-between gap-3 py-3 border-b border-white/20">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full font-bold text-xs sm:text-sm backdrop-blur-md transition-all shadow-md shrink-0"
                >
                    <ArrowLeft size={16} /> Back to Studio
                </button>

                <div className="text-center order-3 sm:order-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight drop-shadow-md">
                        Always-Live Collaborative Whiteboard
                    </h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-blue-100 font-semibold opacity-90">
                        Multi-Device Real-Time Sync & Mobile Home Screen Live Widget Experience
                    </p>
                </div>

                <div className="flex items-center gap-2 order-2 sm:order-3 shrink-0">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-blue-900 rounded-full font-bold text-xs shadow-lg hover:bg-blue-50 active:scale-95 transition-all"
                    >
                        <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                        <span>Refresh State</span>
                    </button>
                </div>
            </div>

            {/* Main Stage: Two Mobile Phones Showcase matching the concept illustration */}
            <div className="w-full max-w-6xl my-6 sm:my-8 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center justify-items-center relative">
                
                {/* Visual Connection Diagram Arrows (Center Indicator matching the prompt image) */}
                <div className="hidden lg:flex flex-col items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                    <motion.div 
                        animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        className="bg-[#0f172a]/90 border border-cyan-400/40 text-cyan-300 px-5 py-2.5 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] backdrop-blur-xl flex flex-col items-center text-center gap-1 mb-4"
                    >
                        <span className="text-xs font-black tracking-wider uppercase text-white">Live Updates Delivered Instantly</span>
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                            <Zap size={16} className="animate-pulse" />
                        </div>
                    </motion.div>

                    <div className="bg-[#0f172a]/90 border border-indigo-400/40 text-indigo-200 px-4 py-2 rounded-xl text-[11px] font-bold shadow-lg backdrop-blur-md">
                        Live Preview Widget Keeps Board Active
                    </div>
                </div>

                {/* PHONE 1: Home Screen (Phone 1 - iOS Concept) */}
                <div className="flex flex-col items-center">
                    <div className="mb-4 text-center">
                        <h2 className="text-lg md:text-xl font-black text-white tracking-wide">
                            Home Screen (Phone 1)
                        </h2>
                        <p className="text-xs text-blue-100 font-semibold">
                            Shows the real-time shared whiteboard live
                        </p>
                    </div>

                    {/* Realistic iPhone Bezel & Screen - scale nicely on mobile */}
                    <div className="w-[320px] xs:w-[340px] h-[640px] xs:h-[680px] bg-slate-900 rounded-[44px] xs:rounded-[50px] p-3 xs:p-3.5 shadow-[0_30px_100px_rgba(0,0,0,0.6)] border-4 border-slate-700/80 relative overflow-hidden flex flex-col justify-between shrink-0">
                        {/* Dynamic Island / Notch */}
                        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
                        </div>

                        {/* Phone 1 Screen Wallpaper & Content */}
                        <div className="w-full h-full rounded-[34px] xs:rounded-[38px] bg-gradient-to-b from-[#0a192f] via-[#172554] to-[#1e1b4b] p-3 xs:p-4 pt-9 xs:pt-10 flex flex-col justify-between relative overflow-y-auto">
                            
                            {/* Status Bar */}
                            <div className="flex items-center justify-between text-white/90 text-xs font-semibold px-2">
                                <span>10:24</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-2 border border-white rounded-xs">
                                        <div className="w-2 h-full bg-white" />
                                    </div>
                                    <span className="text-[10px]">5G</span>
                                </div>
                            </div>

                            {/* Top Mock iOS Widgets Row (Weather & Apps) */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {/* Cupertino Weather Widget */}
                                <div className="bg-[#1e293b]/70 border border-white/10 rounded-3xl p-3.5 flex flex-col justify-between h-32 backdrop-blur-md shadow-md text-white">
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold">Cupertino</div>
                                        <div className="text-3xl font-black">72°</div>
                                    </div>
                                    <div className="text-[10px] text-amber-300 font-bold flex items-center justify-between">
                                        <span>Sunny</span>
                                        <span>H:85° L:68°</span>
                                    </div>
                                </div>

                                {/* App Icons Grid 2x2 */}
                                <div className="grid grid-cols-2 gap-3 h-32">
                                    <div className="bg-gradient-to-tr from-amber-400 to-red-400 rounded-2xl flex items-center justify-center text-xs font-black shadow-md">
                                        Photos
                                    </div>
                                    <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-xs font-black shadow-md">
                                        Mail
                                    </div>
                                    <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-xs font-black shadow-md">
                                        Facetime
                                    </div>
                                    <div className="bg-gradient-to-tr from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-xs font-black shadow-md">
                                        Notes
                                    </div>
                                </div>
                            </div>

                            {/* The CollabSphere Mobile Live Widget & Control Menu */}
                            <div className="my-auto py-2 flex flex-col items-center">
                                <MobileLiveWidget 
                                    widgetData={widgetData}
                                    deviceType="ios"
                                    onOpenWhiteboard={() => handleOpenWhiteboard(activeRoomId)}
                                    onStopSharing={handleStopSharing}
                                    onRefreshPreview={handleRefresh}
                                    isRefreshing={isRefreshing}
                                />
                            </div>

                            {/* iOS Dock Bar */}
                            <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-[28px] p-2 flex items-center justify-around shadow-xl mb-1">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-green-600 flex items-center justify-center text-white shadow-md">📞</div>
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-400 to-cyan-500 flex items-center justify-center text-white shadow-md">🧭</div>
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-md">💬</div>
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md">🎵</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PHONE 2: Home Screen (Phone 2 - Android 14 Concept) */}
                <div className="flex flex-col items-center">
                    <div className="mb-4 text-center">
                        <h2 className="text-lg md:text-xl font-black text-white tracking-wide">
                            Home Screen (Phone 2)
                        </h2>
                        <p className="text-xs text-blue-100 font-semibold">
                            Shows the same drawing live and connected until you exit
                        </p>
                    </div>

                    {/* Realistic Android Curved Phone Bezel & Screen - scale nicely on mobile */}
                    <div className="w-[320px] xs:w-[340px] h-[640px] xs:h-[680px] bg-slate-900 rounded-[44px] xs:rounded-[46px] p-3 xs:p-3.5 shadow-[0_30px_100px_rgba(0,0,0,0.6)] border-4 border-slate-700/80 relative overflow-hidden flex flex-col justify-between shrink-0">
                        {/* Android Camera Punch Hole */}
                        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-50 border border-slate-800" />

                        {/* Phone 2 Screen Wallpaper & Content */}
                        <div className="w-full h-full rounded-[34px] bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f766e] p-3 xs:p-4 pt-9 xs:pt-10 flex flex-col justify-between relative overflow-y-auto">
                            
                            {/* Android Status Bar */}
                            <div className="flex items-center justify-between text-white/90 text-xs font-semibold px-2">
                                <span>10:24</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px]">LTE</span>
                                    <div className="w-2.5 h-3.5 border border-white rounded-xs bg-white" />
                                </div>
                            </div>

                            {/* Android App Icons Rows */}
                            <div className="grid grid-cols-4 gap-2.5 text-center mt-3">
                                {[
                                    { name: 'Calendar', icon: '📅', color: 'from-blue-600 to-indigo-600' },
                                    { name: 'Maps', icon: '🗺️', color: 'from-emerald-500 to-green-600' },
                                    { name: 'Drive', icon: '📁', color: 'from-amber-500 to-yellow-600' },
                                    { name: 'Chrome', icon: '🌐', color: 'from-red-500 to-amber-500' },
                                    { name: 'Camera', icon: '📷', color: 'from-slate-700 to-slate-900' },
                                    { name: 'Settings', icon: '⚙️', color: 'from-slate-600 to-slate-800' },
                                    { name: 'Messages', icon: '💬', color: 'from-blue-500 to-cyan-500' },
                                    { name: 'Music', icon: '🎧', color: 'from-orange-500 to-pink-500' },
                                ].map((app, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${app.color} flex items-center justify-center text-lg shadow-md`}>
                                            {app.icon}
                                        </div>
                                        <span className="text-[9px] text-slate-300 font-medium truncate max-w-[50px]">{app.name}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Android Shared Whiteboard Widget */}
                            <div className="my-auto py-2 flex flex-col items-center">
                                <MobileLiveWidget 
                                    widgetData={widgetData}
                                    deviceType="android"
                                    onOpenWhiteboard={() => handleOpenWhiteboard(activeRoomId)}
                                    onStopSharing={handleStopSharing}
                                    onRefreshPreview={handleRefresh}
                                    isRefreshing={isRefreshing}
                                />
                            </div>

                            {/* Android Search / Dock */}
                            <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 flex items-center justify-between text-xs text-slate-300 shadow-md mb-1">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                    <span className="text-cyan-400">G</span> Search apps & web
                                </span>
                                <span>🎙️</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Real-Device Instructions Card */}
            <div className="w-full max-w-4xl bg-[#0b1329]/90 border border-white/15 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Smartphone size={18} className="text-cyan-400" />
                        <span>Ready for Two Separate Mobile Devices</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        Open the shareable invitation URL on Phone A and Phone B over your local Wi-Fi or public host. When leaving the browser, the board state is preserved on the server and cached in the local home-screen widget preview.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/room/${activeRoomId}`;
                            navigator.clipboard.writeText(url);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2500);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'Copied Room URL!' : 'Copy Room Invite'}</span>
                    </button>
                    <button
                        onClick={() => handleOpenWhiteboard(activeRoomId)}
                        className="px-5 py-2.5 bg-white text-blue-900 font-bold text-xs rounded-xl shadow-lg hover:bg-slate-100 active:scale-95 transition-all"
                    >
                        Launch Whiteboard
                    </button>
                </div>
            </div>
        </div>
    );
};
