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

    async signUp(username: string, email: string, password: string, confirmPassword?: string): Promise<UserAuth> {
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim();

        // Check if already registered locally
        const existingUsers: Record<string, { password: string; username: string; color: string; email: string }> = 
            JSON.parse(localStorage.getItem('collab_sphere_registered_users') || '{}');

        const { apiUrl } = getBackendUrls();
        try {
            const res = await fetch(`${apiUrl}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: cleanUsername, email: cleanEmail, password, confirmPassword }),
            });

            const rawText = await res.text();
            let data: any = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch {
                data = { message: rawText };
            }

            if (!res.ok) {
                // If backend returned 400 or other status, parse exact error
                const errText = data.message || data.error;
                throw new Error(errText || 'Unable to create account. Please check your details.');
            }

            const authUser: UserAuth = {
                token: data.token,
                username: data.username,
                email: data.email,
                color: data.color || '#6366f1',
            };
            this.setCurrentUser(authUser);
            existingUsers[cleanEmail] = { password, username: cleanUsername, color: authUser.color || '#6366f1', email: cleanEmail };
            localStorage.setItem('collab_sphere_registered_users', JSON.stringify(existingUsers));
            return authUser;
        } catch (backendErr: any) {
            const msg = backendErr?.message || '';
            // If the error message was an explicit validation message from our code or backend, keep it!
            const isNetworkFailure = msg.includes('Failed to fetch') || 
                                     msg.includes('NetworkError') || 
                                     msg.includes('Cannot connect') ||
                                     msg.includes('Load failed');

            if (!isNetworkFailure && msg) {
                throw backendErr;
            }

            // Standalone / offline / cloud fallback when backend server is unreachable
            if (existingUsers[cleanEmail]) {
                // If this email already exists in local storage and passwords match, log them in or ask to sign in
                if (existingUsers[cleanEmail].password === password) {
                    const fallbackUser: UserAuth = {
                        token: 'AUTH-LOCAL-' + Math.random().toString(36).substring(2),
                        username: existingUsers[cleanEmail].username || cleanUsername,
                        email: cleanEmail,
                        color: existingUsers[cleanEmail].color || '#6366f1',
                    };
                    this.setCurrentUser(fallbackUser);
                    return fallbackUser;
                }
                throw new Error('An account with this email already exists. Please switch to Sign In.');
            }

            const fallbackUser: UserAuth = {
                token: 'AUTH-LOCAL-' + Math.random().toString(36).substring(2),
                username: cleanUsername,
                email: cleanEmail,
                color: '#6366f1',
            };
            existingUsers[cleanEmail] = { password, username: cleanUsername, color: fallbackUser.color || '#6366f1', email: cleanEmail };
            localStorage.setItem('collab_sphere_registered_users', JSON.stringify(existingUsers));
            this.setCurrentUser(fallbackUser);
            return fallbackUser;
        }
    },

    async signIn(email: string, password: string): Promise<UserAuth> {
        const cleanEmail = email.trim().toLowerCase();
        const existingUsers: Record<string, { password: string; username: string; color: string; email: string }> = 
            JSON.parse(localStorage.getItem('collab_sphere_registered_users') || '{}');

        const { apiUrl } = getBackendUrls();
        try {
            const res = await fetch(`${apiUrl}/api/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, password }),
            });

            const rawText = await res.text();
            let data: any = {};
            try {
                data = rawText ? JSON.parse(rawText) : {};
            } catch {
                data = { message: rawText };
            }

            if (!res.ok) {
                const errText = data.message || data.error;
                throw new Error(errText || 'Invalid email or password');
            }

            const authUser: UserAuth = {
                token: data.token,
                username: data.username,
                email: data.email,
                color: data.color || '#6366f1',
            };
            this.setCurrentUser(authUser);
            return authUser;
        } catch (backendErr: any) {
            if (backendErr.message && !backendErr.message.includes('Cannot connect') && !backendErr.message.includes('Failed to fetch')) {
                throw backendErr;
            }

            // Check local fallback accounts
            const localRecord = existingUsers[cleanEmail];
            if (localRecord) {
                if (localRecord.password === password) {
                    const localUser: UserAuth = {
                        token: 'AUTH-LOCAL-' + Math.random().toString(36).substring(2),
                        username: localRecord.username,
                        email: cleanEmail,
                        color: localRecord.color || '#6366f1',
                    };
                    this.setCurrentUser(localUser);
                    return localUser;
                } else {
                    throw new Error('Invalid email or password');
                }
            }

            throw new Error('Invalid email or password');
        }
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
