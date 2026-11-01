import { getBackendUrls } from '../config/apiConfig';

export interface UserAuth {
    token: string;
    username: string;
    email: string;
    color?: string;
}

export interface RoomSummary {
    roomCode: string;
    roomName: string;
    createdBy: string;
    joinedAt: string;
    lastAccessedAt: string;
    participantCount: number;
    isActive: boolean;
    hasExited: boolean;
    participants: string[];
}

const AUTH_KEY = 'collab_sphere_auth_user';

export const authService = {
    getCurrentUser(): UserAuth | null {
        try {
            const data = localStorage.getItem(AUTH_KEY);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    setCurrentUser(user: UserAuth): void {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    },

    clearCurrentUser(): void {
        localStorage.removeItem(AUTH_KEY);
    },

    async signUp(username: string, email: string, password: string): Promise<UserAuth> {
        const { apiUrl } = getBackendUrls();
        let res: Response;
        try {
            res = await fetch(`${apiUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
        } catch (fetchErr: any) {
            throw new Error(`Cannot connect to server at ${apiUrl}. Please ensure the backend is running.`);
        }

        const rawText = await res.text();
        let data: any = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            data = { message: rawText };
        }

        if (!res.ok) {
            throw new Error(data.message || data.error || (res.status === 400 ? 'An account with this email already exists or invalid details.' : 'Failed to sign up'));
        }

        const authUser: UserAuth = {
            token: data.token,
            username: data.username,
            email: data.email,
            color: data.color,
        };
        this.setCurrentUser(authUser);
        return authUser;
    },

    async signIn(email: string, password: string): Promise<UserAuth> {
        const { apiUrl } = getBackendUrls();
        let res: Response;
        try {
            res = await fetch(`${apiUrl}/api/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
        } catch (fetchErr: any) {
            throw new Error(`Cannot connect to server at ${apiUrl}. Please ensure the backend is running.`);
        }

        const rawText = await res.text();
        let data: any = {};
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch {
            data = { message: rawText };
        }

        if (!res.ok) {
            throw new Error(data.message || data.error || (res.status === 400 ? 'Invalid email or password' : 'Failed to sign in'));
        }

        const authUser: UserAuth = {
            token: data.token,
            username: data.username,
            email: data.email,
            color: data.color,
        };
        this.setCurrentUser(authUser);
        return authUser;
    },

    async createRoom(roomName: string, customCode?: string): Promise<{ code: string; name: string }> {
        const { apiUrl } = getBackendUrls();
        const user = this.getCurrentUser();
        const res = await fetch(`${apiUrl}/api/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: roomName,
                code: customCode || undefined,
                createdBy: user?.email || user?.username || 'Guest',
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to create room');
        }

        const data = await res.json();
        const generatedCode = data.code || data.roomCode || customCode || Math.random().toString(36).substring(2, 10).toUpperCase();
        return { code: generatedCode, name: data.name || roomName };
    },

    async joinRoom(roomCode: string): Promise<{ code: string; name: string }> {
        const { apiUrl } = getBackendUrls();
        const user = this.getCurrentUser();
        const res = await fetch(`${apiUrl}/api/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: roomCode,
                userEmail: user?.email || '',
                username: user?.username || '',
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to join room');
        }

        const data = await res.json();
        return { code: data.code, name: data.name };
    },

    async getRoomHistory(): Promise<RoomSummary[]> {
        const user = this.getCurrentUser();
        if (!user || !user.email) return [];

        const { apiUrl } = getBackendUrls();
        const res = await fetch(`${apiUrl}/api/rooms/history?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) return [];
        return await res.json();
    },

    async exitRoom(roomCode: string): Promise<void> {
        const user = this.getCurrentUser();
        if (!user || !user.email) return;

        const { apiUrl } = getBackendUrls();
        await fetch(`${apiUrl}/api/rooms/exit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomCode,
                userEmail: user.email,
            }),
        });
    },

    async deleteRoomHistory(roomCode: string): Promise<void> {
        const user = this.getCurrentUser();
        if (!user || !user.email) return;

        const { apiUrl } = getBackendUrls();
        await fetch(`${apiUrl}/api/rooms/history?email=${encodeURIComponent(user.email)}&roomCode=${encodeURIComponent(roomCode)}`, {
            method: 'DELETE',
        });
    }
};
