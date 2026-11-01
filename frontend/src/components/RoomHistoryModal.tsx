import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Clock,
    Users,
    Trash2,
    ExternalLink,
    Search,
    SortDesc,
    RefreshCw,
    FolderKanban,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { authService } from '../services/authService';
import type { RoomSummary } from '../services/authService';

interface RoomHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRoom: (roomCode: string) => void;
}

export const RoomHistoryModal: React.FC<RoomHistoryModalProps> = ({
    isOpen,
    onClose,
    onSelectRoom,
}) => {
    const [rooms, setRooms] = useState<RoomSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'participants'>('recent');
    const [deletingCode, setDeletingCode] = useState<string | null>(null);

    const currentUser = authService.getCurrentUser();

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await authService.getRoomHistory();
            setRooms(data);
        } catch {
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen]);

    const handleDelete = async (roomCode: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingCode(roomCode);
        try {
            await authService.deleteRoomHistory(roomCode);
            setRooms((prev) => prev.filter((r) => r.roomCode !== roomCode));
        } catch (err) {
            console.error('Failed to delete history', err);
        } finally {
            setDeletingCode(null);
        }
    };

    if (!isOpen) return null;

    const filteredRooms = rooms
        .filter((r) =>
            r.roomName.toLowerCase().includes(search.toLowerCase()) ||
            r.roomCode.toLowerCase().includes(search.toLowerCase()) ||
            r.participants.some((p) => p.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            if (sortBy === 'name') return a.roomName.localeCompare(b.roomName);
            if (sortBy === 'participants') return b.participantCount - a.participantCount;
            return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
        });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 text-white shrink-0 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                                <FolderKanban className="w-5 h-5 text-indigo-300" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">My Whiteboard Rooms & History</h2>
                                <p className="text-xs text-indigo-200">
                                    All your persistent collaborative workspaces & participant records
                                </p>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by room name, ID, or participant..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs placeholder-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-white/10 border border-white/20 rounded-xl p-1 text-xs">
                                    <SortDesc className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="bg-transparent text-white text-xs border-none focus:outline-none pr-1"
                                    >
                                        <option value="recent" className="bg-slate-900 text-white">Recent</option>
                                        <option value="name" className="bg-slate-900 text-white">Name</option>
                                        <option value="participants" className="bg-slate-900 text-white">Most People</option>
                                    </select>
                                </div>
                                <button
                                    onClick={fetchHistory}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Room List Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
                        {loading && rooms.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <span>Loading your room history...</span>
                            </div>
                        ) : filteredRooms.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <Sparkles className="w-8 h-8 mx-auto text-indigo-400/50 mb-2" />
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No rooms found</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {search
                                        ? 'Try searching with a different room name or ID'
                                        : 'Create or join a room above — it will be permanently saved here until you delete it!'}
                                </p>
                            </div>
                        ) : (
                            filteredRooms.map((room) => {
                                const isCreator = room.createdBy === (currentUser?.email || currentUser?.username);
                                return (
                                    <div
                                        key={room.roomCode}
                                        onClick={() => {
                                            onSelectRoom(room.roomCode);
                                            onClose();
                                        }}
                                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-slate-800/90 transition-all cursor-pointer gap-3 shadow-xs"
                                    >
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                                    {room.roomName || 'Untitled Board'}
                                                </h3>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                                                    #{room.roomCode}
                                                </span>
                                                {isCreator ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> Created by you
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400">
                                                        by {room.createdBy || 'Unknown'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    Last active: {new Date(room.lastAccessedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                                                    {room.participantCount} joined ({room.participants.join(', ') || 'None'})
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(room.roomCode, e)}
                                                disabled={deletingCode === room.roomCode}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                                                title="Delete room from history"
                                            >
                                                {deletingCode === room.roomCode ? (
                                                    <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold group-hover:bg-indigo-700 transition-colors shadow-sm">
                                                <span>Reopen</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
