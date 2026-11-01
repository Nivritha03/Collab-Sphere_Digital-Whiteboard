import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ExternalLink, 
    Settings, 
    RefreshCw, 
    Users
} from 'lucide-react';
import type { WidgetRoomData } from '../services/widgetStorage';

interface MobileLiveWidgetProps {
    widgetData: WidgetRoomData | null;
    deviceType?: 'ios' | 'android';
    onOpenWhiteboard: () => void;
    onStopSharing: () => void;
    onRefreshPreview?: () => void;
    isRefreshing?: boolean;
}

export const MobileLiveWidget: React.FC<MobileLiveWidgetProps> = ({
    widgetData,
    onOpenWhiteboard,
    onStopSharing,
    onRefreshPreview,
    isRefreshing = false
}) => {
    const [showControlMenu, setShowControlMenu] = useState(false);
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [autoSync, setAutoSync] = useState(true);

    const lastUpdatedText = widgetData?.lastUpdated 
        ? new Date(widgetData.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Just now';

    return (
        <div className="w-full max-w-[310px] select-none flex flex-col items-center">
            {/* Widget Container - Apple iOS / Android Pure White Live Widget matching screenshot */}
            <div 
                className="relative overflow-hidden rounded-[2rem] bg-white text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/90 transition-all duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] group cursor-pointer w-full"
                onClick={onOpenWhiteboard}
            >
                {/* Top Header matching mockup */}
                <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20" />
                        <span className="text-[10px] font-black tracking-wider uppercase text-slate-700">
                            COLLAB-SPHERE
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                            #{widgetData?.roomId ? widgetData.roomId.substring(0, 5) : 'LIVE'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                        <div className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            <Users size={10} className="text-indigo-600" />
                            <span>{widgetData?.participantCount || 1}</span>
                        </div>
                        <span className="text-emerald-600 font-black">● Live</span>
                    </div>
                </div>

                {/* Whiteboard Drawing Canvas Area */}
                <div className="relative w-full h-[155px] bg-white flex items-center justify-center p-2.5 overflow-hidden">
                    {widgetData?.previewDataUrl && widgetData.strokeCount > 0 ? (
                        <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-100">
                            <img 
                                src={widgetData.previewDataUrl} 
                                alt="Live Whiteboard Preview" 
                                className="w-full h-full object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                        </div>
                    ) : (
                        // Exact Concept Drawing matching the user's uploaded illustration
                        <div className="w-full h-full bg-white rounded-xl p-1.5 flex flex-col justify-between relative overflow-hidden font-sans">
                            {/* Top Row: Green Note, Yellow Note, and Title */}
                            <div className="flex items-start justify-between gap-1 z-10">
                                {/* Left Green Sticky Note */}
                                <div className="w-[52px] bg-[#dcfce7] border border-[#86efac] rounded-md p-1 shadow-xs transform -rotate-1">
                                    <div className="text-[6.5px] font-black text-emerald-800 border-b border-emerald-300 pb-0.5">Created</div>
                                    <div className="text-[6px] text-emerald-900 leading-tight mt-0.5 font-medium">Great job! 💡</div>
                                </div>

                                {/* Center Yellow Note */}
                                <div className="w-[46px] bg-[#fef08a] border border-[#fde047] rounded-md p-1 shadow-xs transform rotate-1 text-center">
                                    <div className="text-[6.5px] font-black text-amber-900">Great!</div>
                                    <div className="text-[8px]">😊</div>
                                </div>

                                {/* Right Project Plan Header */}
                                <div className="flex-1 pl-1">
                                    <p className="text-[8.5px] font-black text-slate-800 tracking-tight">Project Plan</p>
                                    <p className="text-[6px] text-fuchsia-600 font-semibold">• Design System</p>
                                    <p className="text-[6px] text-fuchsia-600 font-semibold">• Brainstorm</p>
                                </div>
                            </div>

                            {/* Middle Row: Meeting Note & Plan Bullets */}
                            <div className="flex items-center justify-between gap-1 z-10 pl-1 mt-1">
                                <div className="text-[6.5px] text-slate-600 leading-tight">
                                    <p className="font-bold text-slate-700">Project Plan</p>
                                    <p>• Design</p>
                                    <p>• Development</p>
                                    <p>• Marketing</p>
                                    <p>• Launch</p>
                                </div>

                                {/* Right Small Green Meeting Note */}
                                <div className="w-[44px] bg-[#bbf7d0] border border-[#86efac] rounded-md p-0.5 text-center shadow-xs">
                                    <p className="text-[6px] font-black text-emerald-900 leading-none">Meeting at</p>
                                    <p className="text-[6.5px] font-black text-emerald-950">10 AM</p>
                                </div>
                            </div>

                            {/* Bottom Drawing Curves (matches prompt concept) */}
                            <div className="relative w-full h-5 mt-auto flex items-center justify-between px-1">
                                <svg className="w-14 h-4 text-indigo-400 stroke-current fill-none" viewBox="0 0 80 25">
                                    <path d="M2,18 C15,2 35,22 55,8 S75,20 78,5" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <svg className="w-12 h-3.5 text-cyan-500 stroke-current fill-none" viewBox="0 0 60 20">
                                    <path d="M2,15 Q18,2 32,12 T58,4" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Refresh Overlay Spinner */}
                    {isRefreshing && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-20">
                            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg">
                                <RefreshCw size={10} className="animate-spin text-cyan-400" />
                                <span>Syncing...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Bar: Update time */}
                <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                    <span>Updated {lastUpdatedText}</span>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowControlMenu(!showControlMenu);
                        }}
                        className="text-cyan-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                        <span>{showControlMenu ? 'Hide Menu' : 'Quick Actions'}</span>
                    </button>
                </div>
            </div>

            {/* CONTROL MENU Quick Actions Card (Exactly as pictured in concept image) */}
            <div className="w-full mt-2.5">
                <div className="overflow-hidden rounded-2xl bg-[#0b1021]/95 text-white shadow-xl border border-white/15 backdrop-blur-xl p-1.5">
                    {/* Item 1: Open Whiteboard */}
                    <button
                        onClick={onOpenWhiteboard}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all text-left text-xs font-semibold group/btn"
                    >
                        <span className="text-slate-100 group-hover/btn:text-white">Open Whiteboard</span>
                        <ExternalLink size={13} className="text-slate-400 group-hover/btn:text-cyan-400 transition-colors" />
                    </button>

                    {/* Item 2: Preferences */}
                    <button
                        onClick={() => setPreferencesOpen(!preferencesOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all text-left text-xs font-semibold group/btn"
                    >
                        <span className="text-slate-100 group-hover/btn:text-white">Preferences</span>
                        <Settings size={13} className="text-slate-400 group-hover/btn:text-indigo-400 transition-colors" />
                    </button>

                    {/* Preferences Dropdown */}
                    <AnimatePresence>
                        {preferencesOpen && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-3 py-1.5 bg-white/5 rounded-xl my-1 flex flex-col gap-1.5 text-[10px] text-slate-300"
                            >
                                <div className="flex items-center justify-between">
                                    <span>Live Background Sync</span>
                                    <button 
                                        onClick={() => setAutoSync(!autoSync)}
                                        className={`w-7 h-4 rounded-full transition-colors relative ${autoSync ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${autoSync ? 'left-3.5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                {onRefreshPreview && (
                                    <button 
                                        onClick={onRefreshPreview}
                                        className="w-full py-1 bg-white/10 hover:bg-white/15 rounded-md font-bold text-center flex items-center justify-center gap-1 text-cyan-300"
                                    >
                                        <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
                                        <span>Force Sync</span>
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Item 3: Stop Sharing (With glowing red pill toggle matching image) */}
                    <button
                        onClick={onStopSharing}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold text-xs transition-all text-left mt-0.5"
                    >
                        <span className="font-bold text-red-300">Stop Sharing</span>
                        <div className="w-6 h-3.5 rounded-full border border-red-400 flex items-center px-0.5 bg-red-950/50">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_6px_#f87171]" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileLiveWidget;
