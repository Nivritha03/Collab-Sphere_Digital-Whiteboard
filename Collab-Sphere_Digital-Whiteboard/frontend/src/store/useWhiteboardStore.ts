import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import { v4 as uuidv4 } from 'uuid';

export type ToolType = 'freehand' | 'rectangle' | 'circle' | 'line' | 'eraser' | 'hand' | 'text';

export interface DrawData {
    tool: ToolType;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    color: string;
    size: number;
    strokeId: string;
    senderId?: string;
    isFinished?: boolean;
    text?: string;
}

export interface Stroke {
    strokeId: string;
    userId: string;
    points: DrawData[];
}

interface CursorEntry {
    x: number;
    y: number;
    color: string;
    userName?: string;
    ts: number;
}

interface WhiteboardState {
    stompClient: Client | null;
    isConnected: boolean;
    roomId: string | null;
    userId: string;
    userName: string;
    userColor: string;
    cursors: Record<string, CursorEntry>;
    strokes: Record<string, Stroke>;
    strokeOrder: string[];
    undoHistory: string[];
    connectionError: string | null;
    activeTool: ToolType;
    currentColor: string;
    currentSize: number;
    currentStrokeId: string;
    historyIndex: number;
    activeUsers: Record<string, { name: string; color: string; lastSeen: number }>;

    setHistoryIndex: (index: number) => void;
    setConnectionError: (err: string | null) => void;
    generateAIContent: (prompt: string) => void;
    setActiveTool: (tool: ToolType) => void;
    setCurrentColor: (color: string) => void;
    setCurrentSize: (size: number) => void;
    setUserName: (name: string) => void;
    newStroke: () => void;

    connect: (roomId: string) => void;
    disconnect: () => void;

    sendDraw: (data: DrawData, width: number, height: number) => boolean;
    sendCursor: (x: number, y: number, width: number, height: number) => void;
    sendUndo: () => void;
    sendRedo: () => void;
    sendClear: () => void;

    _applyPoint: (point: DrawData) => void;
    _applyCursor: (userId: string, x: number, y: number, color: string, userName?: string) => void;
    _applyUndo: (targetUserId: string) => void;
    _applyRedo: (targetUserId: string) => void;
    _applyClear: () => void;
}

// 16 visually distinct colors — each userId hashes to one deterministically
const USER_COLORS = [
    '#ff6b6b', '#ff9f43', '#ffd32a', '#0be881',
    '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd',
    '#00d2d3', '#ff6348', '#2ed573', '#eccc68',
    '#a29bfe', '#fd79a8', '#55efc4', '#fdcb6e',
];

function pickUserColor(uid: string): string {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
    }
    return USER_COLORS[hash % USER_COLORS.length];
}

// Generate a fresh ID for every tab load to prevent identical IDs when tabs are duplicated
const MY_USER_ID = uuidv4();
const MY_USER_COLOR = pickUserColor(MY_USER_ID);

// BroadcastChannel — works across tabs on the same browser
const BC_CHANNEL_NAME = 'wb_sync';
let bc: BroadcastChannel | null = null;
try { bc = new BroadcastChannel(BC_CHANNEL_NAME); } catch { /* Safari private mode etc */ }

export const VIRTUAL_WIDTH = 10000;
export const VIRTUAL_HEIGHT = 10000;

export const toVirX = (val: number, max: number) => (val / max) * VIRTUAL_WIDTH;
export const toVirY = (val: number, max: number) => (val / max) * VIRTUAL_HEIGHT;
export const fromVirX = (val: number, max: number) => (val / VIRTUAL_WIDTH) * max;
export const fromVirY = (val: number, max: number) => (val / VIRTUAL_HEIGHT) * max;

export const useWhiteboardStore = create<WhiteboardState>((set, get) => {
    // Throttle for freehand draw sends
    let lastSendTime = 0;
    const THROTTLE_MS = 30;

    // Intervals kept outside state so they survive re-renders
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    let cursorPruneInterval: ReturnType<typeof setInterval> | null = null;

    // ── BroadcastChannel handler ───────────────────────────────────────────
    // This is the PRIMARY sync mechanism for same-browser cross-tab communication
    if (bc && !(bc as any)._initialized) {
        (bc as any)._initialized = true;
        bc.onmessage = (event: MessageEvent) => {
            const msg = event.data;
            const state = get();

            // Only process messages for our current room
            if (!msg || msg.roomId !== state.roomId) return;
            // Never process our own messages (except ALIVE)
            if (
                (msg.senderId && msg.senderId === MY_USER_ID) ||
                (msg.userId && msg.userId === MY_USER_ID && msg.type !== 'ALIVE')
            ) return;

            if (msg.tool && msg.strokeId) {
                state._applyPoint(msg);
                return;
            }

            switch (msg.type) {
                case 'CURSOR':
                    state._applyCursor(msg.userId, msg.x, msg.y, msg.color, msg.userName);
                    break;
                case 'UNDO':
                    state._applyUndo(msg.userId);
                    break;
                case 'REDO':
                    state._applyRedo(msg.userId);
                    break;
                case 'CLEAR':
                    state._applyClear();
                    break;
                case 'ALIVE':
                    set((s) => ({
                        activeUsers: {
                            ...s.activeUsers,
                            [msg.userId]: {
                                name: msg.userName || '',
                                color: msg.userColor,
                                lastSeen: Date.now(),
                            },
                        },
                    }));
                    break;
                case 'LEAVE':
                    set((s) => {
                        const next = { ...s.activeUsers };
                        delete next[msg.userId];
                        return { activeUsers: next };
                    });
                    break;
            }
        };
    }

    // ── Helper: broadcast to all other same-browser tabs ──────────────────
    const bcSend = (payload: object) => {
        try { bc?.postMessage(payload); } catch { /* ignore */ }
    };

    // ── Helper: send to backend (WebSocket) ───────────────────────────────
    const wsSend = (destination: string, body: any) => {
        const { stompClient } = get();
        if (stompClient?.connected) {
            try {
                // if body is already string, send directly, else stringify
                const toSend = typeof body === 'string' ? body : JSON.stringify(body);
                stompClient.publish({ destination, body: toSend });
            } catch { /* ignore */ }
        }
    };

    const saveSnapshot = () => {
        const state = get();
        if (!state.roomId) return;
        const snapshot = JSON.stringify(
            Object.values(state.strokes).flatMap(s => s.points)
        );
        wsSend(`/app/save/${state.roomId}`, snapshot);
    };

    return {
        stompClient: null,
        isConnected: false,
        roomId: null,
        userId: MY_USER_ID,
        userName: '',
        userColor: MY_USER_COLOR,
        cursors: {},
        strokes: {},
        strokeOrder: [],
        undoHistory: [],
        connectionError: null,
        activeTool: 'freehand',
        currentColor: MY_USER_COLOR,
        currentSize: 4,
        currentStrokeId: uuidv4(),
        historyIndex: -1,
        activeUsers: {},

        setHistoryIndex: (index) => set({ historyIndex: index }),
        setConnectionError: (err) => set({ connectionError: err }),
        setActiveTool: (tool) => set({ activeTool: tool }),
        setCurrentColor: (color) => set({ currentColor: color }),
        setCurrentSize: (size) => set({ currentSize: size }),
        setUserName: (name) => set({ userName: name }),
        newStroke: () => set({ currentStrokeId: uuidv4() }),

        generateAIContent: (prompt) => {
            const { roomId, userColor } = get();
            if (!roomId) return;
            const mid = 5000;
            const baseId = uuidv4().substring(0, 8);
            const items: DrawData[] = [
                { tool: 'rectangle', x0: mid - 1500, y0: mid - 1500, x1: mid + 1500, y1: mid - 500, color: userColor, size: 20, strokeId: `${baseId}-1`, senderId: MY_USER_ID, isFinished: true },
                { tool: 'text', x0: mid, y0: mid - 1000, x1: mid, y1: mid - 1000, color: userColor, size: 40, strokeId: `${baseId}-2`, senderId: MY_USER_ID, isFinished: true, text: 'AI: ' + prompt.toUpperCase() },
            ];
            items.forEach((d) => get()._applyPoint(d));
        },

        // ── connect ──────────────────────────────────────────────────────────
        // IMPORTANT: Set roomId IMMEDIATELY so BroadcastChannel + sends work
        // even if the WebSocket backend is unavailable.
        connect: (roomId: string) => {
            if (get().roomId === roomId && get().stompClient?.connected) {
                return; // already connected
            }
            const state = get();
            // Prevent double-connect for the same room
            if (state.roomId === roomId && state.stompClient?.connected) return;

            // ★ Set roomId right away — this is the critical fix.
            //   Without this, all BC sends are gated on roomId and they fail.
            set({ roomId, connectionError: null });

            // ── Heartbeat: announces presence to other tabs ──────────────────
            const sendHeartbeat = () => {
                const { userName, userColor } = get();
                const payload = {
                    type: 'ALIVE',
                    room: roomId,  // Added room property explicitly
                    roomId,
                    userId: MY_USER_ID,
                    userName,
                    userColor,
                };
                bcSend(payload);
                wsSend(`/app/presence/${roomId}`, payload);
            };

            const pruneStaleUsers = () => {
                const now = Date.now();
                set((s) => {
                    const next = { ...s.activeUsers };
                    let changed = false;
                    for (const uid of Object.keys(next)) {
                        if (now - next[uid].lastSeen > 30000) {
                            delete next[uid];
                            changed = true;
                        }
                    }
                    return changed ? { activeUsers: next } : s;
                });
            };

            const pruneStaleCursors = () => {
                const now = Date.now();
                set((s) => {
                    const next = { ...s.cursors };
                    let changed = false;
                    for (const uid of Object.keys(next)) {
                        if (now - next[uid].ts > 10000) {
                            delete next[uid];
                            changed = true;
                        }
                    }
                    return changed ? { cursors: next } : s;
                });
            };

            // Send first heartbeat immediately so other tabs see us right away
            sendHeartbeat();

            set((s) => ({
                activeUsers: {
                    ...s.activeUsers,
                    [MY_USER_ID]: {
                        name: get().userName,
                        color: get().userColor,
                        lastSeen: Date.now(),
                    }
                }
            }));

            // Clear old intervals in case of reconnect
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            if (cursorPruneInterval) clearInterval(cursorPruneInterval);

            heartbeatInterval = setInterval(() => {
                sendHeartbeat();
                pruneStaleUsers();
            }, 5000);

            cursorPruneInterval = setInterval(pruneStaleCursors, 3000);

            // ── Try WebSocket backend (optional) ───────────────────────────
            try {
                const client = new Client({
                    brokerURL: 'ws://localhost:8080/ws-native',
                    reconnectDelay: 5000,
                    heartbeatIncoming: 0,
                    heartbeatOutgoing: 20000,
                });

                client.onConnect = () => {
                    set({ isConnected: true, stompClient: client });

                    // 🔥 RESYNC EVERYTHING AFTER RECONNECT
                    setTimeout(() => {
                        const { roomId } = get();
                        if (!roomId) return;

                        const payload = {
                            type: 'ALIVE',
                            roomId,
                            userId: MY_USER_ID,
                            userName: get().userName,
                            userColor: get().userColor
                        };

                        bcSend(payload);
                        wsSend(`/app/presence/${roomId}`, payload);
                    }, 300);

                    const currentRoomId = get().roomId;
                    if (!currentRoomId) return;

                    client.subscribe(`/topic/whiteboard/${currentRoomId}`, (frame) => {
                        try {
                            const msg = JSON.parse(frame.body);
                            // Avoid processing our own messages (except ALIVE)
                            if (msg.senderId === MY_USER_ID) return;

                            // Check for raw draw data directly (backend sends plain object)
                            if (msg.tool && msg.strokeId) {
                                get()._applyPoint(msg);
                                return;
                            }

                            switch (msg.type) {
                                case 'CURSOR':
                                    get()._applyCursor(msg.userId, msg.x, msg.y, msg.color, msg.userName);
                                    break;
                                case 'ALIVE':
                                    set((s) => ({
                                        activeUsers: {
                                            ...s.activeUsers,
                                            [msg.userId]: {
                                                name: msg.userName || '',
                                                color: msg.userColor,
                                                lastSeen: Date.now(),
                                            },
                                        },
                                    }));
                                    break;
                                case 'LEAVE':
                                    set((s) => {
                                        const next = { ...s.activeUsers };
                                        delete next[msg.userId];
                                        return { activeUsers: next };
                                    });
                                    break;
                                case 'CLEAR':
                                    get()._applyClear();
                                    break;
                                case 'UNDO':
                                    get()._applyUndo(msg.userId);
                                    break;
                                case 'REDO':
                                    get()._applyRedo(msg.userId);
                                    break;
                            }
                        } catch { /* ignore parse errors */ }
                    });

                    client.subscribe(`/topic/cursor/${currentRoomId}`, (frame) => {
                        try {
                            const msg = JSON.parse(frame.body);
                            get()._applyCursor(msg.userId, msg.x, msg.y, msg.color, msg.userName);
                        } catch { /* ignore parse errors */ }
                    });

                    client.subscribe(`/topic/presence/${currentRoomId}`, (frame) => {
                        try {
                            const msg = JSON.parse(frame.body);
                            set((s) => ({
                                activeUsers: {
                                    ...s.activeUsers,
                                    [msg.userId]: {
                                        name: msg.userName || '',
                                        color: msg.userColor,
                                        lastSeen: Date.now(),
                                    }
                                }
                            }));
                        } catch { /* ignore parse errors */ }
                    });

                    client.subscribe(`/topic/undo/${currentRoomId}`, (frame) => {
                        const userId = frame.body.replace(/"/g, '');
                        get()._applyUndo(userId);
                    });

                    client.subscribe(`/topic/redo/${currentRoomId}`, (frame) => {
                        const userId = frame.body.replace(/"/g, '');
                        get()._applyRedo(userId);
                    });

                    client.subscribe(`/topic/clear/${currentRoomId}`, (frame) => {
                        try {
                            const msg = JSON.parse(frame.body);
                            if (msg.type === 'CLEAR') {
                                get()._applyClear();
                            }
                        } catch { }
                    });
                };

                client.onWebSocketClose = () => {
                    set({ isConnected: false });
                };

                client.onStompError = () => {
                    set({ isConnected: false });
                };

                client.activate();
                set({ stompClient: client });
            } catch {
                // Backend may not be running — that's OK, BroadcastChannel still works
            }
        },

        // ── disconnect ───────────────────────────────────────────────────────
        disconnect: () => {
            const { stompClient, roomId } = get();

            // Tell other tabs we're leaving
            if (roomId) {
                bcSend({ type: 'LEAVE', roomId, room: roomId, userId: MY_USER_ID });
                wsSend(`/app/presence/${roomId}`, { type: 'LEAVE', roomId, room: roomId, userId: MY_USER_ID });
            }

            try {
                stompClient?.deactivate();
            } catch { }

            if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
            if (cursorPruneInterval) { clearInterval(cursorPruneInterval); cursorPruneInterval = null; }

            set({
                isConnected: false,
                stompClient: null,
                roomId: null,
                activeUsers: {},
                cursors: {},
            });
        },

        // ── sendDraw ─────────────────────────────────────────────────────────
        sendDraw: (data, width, height) => {
            const { roomId } = get();
            if (!roomId) return false;  // should never happen now

            const now = Date.now();
            const vData: DrawData = {
                ...data,
                x0: (data.x0 / width) * VIRTUAL_WIDTH,
                y0: (data.y0 / height) * VIRTUAL_HEIGHT,
                x1: (data.x1 / width) * VIRTUAL_WIDTH,
                y1: (data.y1 / height) * VIRTUAL_HEIGHT,
                senderId: MY_USER_ID,
            };

            // Apply locally first (optimistic)
            get()._applyPoint(vData);

            const shouldSync = vData.isFinished || now - lastSendTime >= THROTTLE_MS;
            if (shouldSync) {
                lastSendTime = now;
                // BroadcastChannel → other tabs on same browser
                bcSend({ ...vData, roomId });
                // WebSocket → other clients on network
                wsSend(`/app/draw/${roomId}`, vData);
                if (vData.isFinished) {
                    saveSnapshot();
                }
                return true;
            }
            return false;
        },

        // ── sendCursor ───────────────────────────────────────────────────────
        sendCursor: (x, y, width, height) => {
            const { roomId, userName, userColor } = get();
            if (!roomId) return;
            const vx = toVirX(x, width);
            const vy = toVirY(y, height);
            const payload = { type: 'CURSOR', roomId, room: roomId, userId: MY_USER_ID, x: vx, y: vy, color: userColor, userName };
            bcSend(payload);
            wsSend(`/app/cursor/${roomId}`, payload);
        },

        // ── sendUndo ─────────────────────────────────────────────────────────
        sendUndo: () => {
            const { roomId } = get();
            if (!roomId) return;
            get()._applyUndo(MY_USER_ID);
            bcSend({ type: 'UNDO', roomId, room: roomId, userId: MY_USER_ID });
            wsSend(`/app/room/${roomId}/undo`, MY_USER_ID);
            saveSnapshot();
        },

        // ── sendRedo ─────────────────────────────────────────────────────────
        sendRedo: () => {
            const { roomId } = get();
            if (!roomId) return;
            get()._applyRedo(MY_USER_ID);
            bcSend({ type: 'REDO', roomId, room: roomId, userId: MY_USER_ID });
            wsSend(`/app/room/${roomId}/redo`, MY_USER_ID);
            saveSnapshot();
        },

        // ── sendClear ────────────────────────────────────────────────────────
        sendClear: () => {
            const { roomId } = get();
            if (!roomId) return;
            get()._applyClear();
            const payload = { type: 'CLEAR', roomId, userId: MY_USER_ID };

            bcSend(payload);
            wsSend(`/app/room/${roomId}/clear`, payload);
        },

        // ── _applyPoint ──────────────────────────────────────────────────────
        _applyPoint: (point) => {
            const p = point;

            set((state) => {
                const sid = p.strokeId;
                if (!sid) return state;
                const existing = state.strokes[sid];
                if (existing) {
                    const last = existing.points[existing.points.length - 1];
                    if (last.x1 === p.x1 && last.y1 === p.y1 && last.isFinished === p.isFinished) {
                        return state; // duplicate, skip
                    }
                }
                const nextStrokes = { ...state.strokes };
                nextStrokes[sid] = existing
                    ? { ...existing, points: [...existing.points, p] }
                    : { strokeId: sid, userId: p.senderId || 'remote', points: [p] };
                return {
                    strokes: nextStrokes,
                    strokeOrder: existing ? state.strokeOrder : [...state.strokeOrder, sid],
                    historyIndex: -1,
                };
            });
        },

        // ── _applyCursor ─────────────────────────────────────────────────────
        _applyCursor: (uid, x, y, color, userName) => {
            set((state) => {
                const prev = state.cursors[uid];
                if (prev && Math.hypot(prev.x - x, prev.y - y) < 3) {
                    return state; // skip tiny movement
                }
                return {
                    cursors: {
                        ...state.cursors,
                        [uid]: { x, y, color, userName, ts: Date.now() },
                    },
                };
            });
        },

        // ── _applyUndo ───────────────────────────────────────────────────────
        _applyUndo: (uid) => {
            set((state) => {
                const lastIdx = [...state.strokeOrder]
                    .reverse()
                    .findIndex((sid) => state.strokes[sid]?.userId === uid);
                if (lastIdx === -1) return state;
                const actualIdx = state.strokeOrder.length - 1 - lastIdx;
                const sid = state.strokeOrder[actualIdx];
                const newOrder = [...state.strokeOrder];
                newOrder.splice(actualIdx, 1);
                return { strokeOrder: newOrder, undoHistory: [...state.undoHistory, sid] };
            });
        },

        // ── _applyRedo ───────────────────────────────────────────────────────
        _applyRedo: (uid) => {
            set((state) => {
                for (let i = state.undoHistory.length - 1; i >= 0; i--) {
                    const sid = state.undoHistory[i];
                    if (state.strokes[sid]?.userId === uid) {
                        return {
                            strokeOrder: [...state.strokeOrder, sid],
                            undoHistory: state.undoHistory.filter((_, idx) => idx !== i),
                        };
                    }
                }
                return state;
            });
        },

        // ── _applyClear ──────────────────────────────────────────────────────
        _applyClear: () =>
            set({ strokes: {}, strokeOrder: [], undoHistory: [], historyIndex: -1 }),
    };
});
