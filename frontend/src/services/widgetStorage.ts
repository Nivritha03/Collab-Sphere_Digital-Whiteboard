// Local storage keys and helpers for persistent room session and widget state

export interface WidgetRoomData {
    roomId: string;
    roomName: string;
    userName: string;
    userColor: string;
    lastUpdated: number;
    previewDataUrl?: string;
    strokeCount: number;
    participantCount: number;
    connectionState: 'Connected' | 'Reconnecting' | 'Offline' | 'Sync Pending';
    isSharingActive: boolean;
}

const WIDGET_STORAGE_KEY = 'collabsphere_active_widget';
const ACTIVE_ROOM_KEY = 'collabsphere_current_room';

// Safe runtime bridge for native Capacitor environments (iOS/Android)
// Prevents missing module build errors on web platforms like Vercel/Netlify
const getNativeWidgetBridge = () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
        try {
            return (window as any).Capacitor?.Plugins?.NativeWidgetBridge || null;
        } catch {
            return null;
        }
    }
    return null;
};

export const saveWidgetData = (data: WidgetRoomData): void => {
    try {
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(ACTIVE_ROOM_KEY, data.roomId);

        // Bridge to native Android/iOS widget when running natively
        const bridge = getNativeWidgetBridge();
        if (bridge && data.previewDataUrl) {
            bridge.updateWidgetPreview?.({
                previewDataUrl: data.previewDataUrl,
                roomId: data.roomId,
                status: data.connectionState
            })?.catch?.(() => {});
        }
    } catch (e) {
        console.warn('Failed to save widget data to localStorage', e);
    }
};

export const getWidgetData = (): WidgetRoomData | null => {
    try {
        const item = localStorage.getItem(WIDGET_STORAGE_KEY);
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

export const clearWidgetData = (): void => {
    try {
        localStorage.removeItem(WIDGET_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_ROOM_KEY);

        const bridge = getNativeWidgetBridge();
        if (bridge) {
            bridge.stopSharingWidget?.()?.catch?.(() => {});
        }
    } catch (e) {
        console.warn('Failed to clear widget data', e);
    }
};

export const getSavedRoomId = (): string | null => {
    try {
        return localStorage.getItem(ACTIVE_ROOM_KEY);
    } catch {
        return null;
    }
};
