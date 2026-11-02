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
        localStorage.removeItem('collab_sphere_username');
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

            // If server returned 500 (e.g. Vercel middleware invocation failure when no serverless function/backend exists)
            // or if the response is HTML rather than JSON, gracefully fall back to local account
            if (res.status >= 500 || res.status === 404 || res.status === 405 || rawText.includes('MIDDLEWARE_INVOCATION_FAILED') || rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html') || !res.headers.get('content-type')?.includes('application/json')) {
                throw new Error('BACKEND_UNAVAILABLE_FALLBACK');
            }

            if (!res.ok) {
                // If backend returned 400 Bad Request with a message (e.g., duplicate email)
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
            const isFallbackTrigger = msg === 'BACKEND_UNAVAILABLE_FALLBACK' ||
                                     msg.includes('Failed to fetch') || 
                                     msg.includes('NetworkError') || 
                                     msg.includes('Cannot connect') ||
                                     msg.includes('Load failed');

            if (!isFallbackTrigger && msg) {
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

            // If server returned 500 or HTML (e.g. Vercel backend proxy unavailable)
            if (res.status >= 500 || res.status === 404 || res.status === 405 || rawText.includes('MIDDLEWARE_INVOCATION_FAILED') || rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html') || !res.headers.get('content-type')?.includes('application/json')) {
                throw new Error('BACKEND_UNAVAILABLE_FALLBACK');
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
            const msg = backendErr?.message || '';
            const isFallback = msg === 'BACKEND_UNAVAILABLE_FALLBACK' ||
                               msg.includes('Cannot connect') ||
                               msg.includes('Failed to fetch') ||
                               msg.includes('NetworkError') ||
                               msg.includes('Load failed');

            if (!isFallback && msg) {
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

    getLocalHistory(userEmail: string): RoomSummary[] {
        try {
            const raw = localStorage.getItem(`collab_sphere_rooms_${userEmail.toLowerCase().trim()}`);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    saveLocalHistory(userEmail: string, rooms: RoomSummary[]): void {
        try {
            localStorage.setItem(`collab_sphere_rooms_${userEmail.toLowerCase().trim()}`, JSON.stringify(rooms));
        } catch {}
    },

    recordRoomAccess(roomCode: string, roomName: string, isCreatedByMe: boolean = false): void {
        const user = this.getCurrentUser();
        if (!user || !user.email) return;

        const email = user.email.toLowerCase().trim();
        const existing = this.getLocalHistory(email);
        const now = new Date().toISOString();

        const index = existing.findIndex((r) => r.roomCode.toUpperCase() === roomCode.toUpperCase());
        if (index >= 0) {
            existing[index].lastAccessedAt = now;
            existing[index].hasExited = false;
            existing[index].isActive = true;
            if (roomName && (!existing[index].roomName || existing[index].roomName.startsWith('Room '))) {
                existing[index].roomName = roomName;
            }
            if (user.username && !existing[index].participants.includes(user.username)) {
                existing[index].participants.push(user.username);
                existing[index].participantCount = existing[index].participants.length;
            }
        } else {
            const newSummary: RoomSummary = {
                roomCode: roomCode.toUpperCase(),
                roomName: roomName || `Board #${roomCode.toUpperCase()}`,
                createdBy: isCreatedByMe ? email : (user.username || 'Shared Board'),
                joinedAt: now,
                lastAccessedAt: now,
                participantCount: 1,
                isActive: true,
                hasExited: false,
                participants: [user.username || 'You'],
            };
            existing.unshift(newSummary);
        }

        this.saveLocalHistory(email, existing);
    },

    async createRoom(roomName: string, customCode?: string): Promise<{ code: string; name: string }> {
        const { apiUrl } = getBackendUrls();
        const user = this.getCurrentUser();
        const generatedCode = customCode || Math.random().toString(36).substring(2, 10).toUpperCase();
        let finalCode = generatedCode;
        let finalName = roomName;

        try {
            const res = await fetch(`${apiUrl}/api/rooms/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: roomName,
                    code: generatedCode,
                    createdBy: user?.email || user?.username || 'Guest',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                finalCode = data.code || data.roomCode || generatedCode;
                finalName = data.name || roomName;
            }
        } catch {
            // Cloud deployment fallback
        }

        // Always record room in persistent history so it displays immediately
        this.recordRoomAccess(finalCode, finalName, true);
        return { code: finalCode, name: finalName };
    },

    async joinRoom(roomCode: string): Promise<{ code: string; name: string }> {
        const { apiUrl } = getBackendUrls();
        const user = this.getCurrentUser();
        let finalCode = roomCode;
        let finalName = `Room ${roomCode}`;

        try {
            const res = await fetch(`${apiUrl}/api/rooms/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: roomCode,
                    userEmail: user?.email || '',
                    username: user?.username || '',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                finalCode = data.code || roomCode;
                finalName = data.name || `Room ${roomCode}`;
            }
        } catch {
            // Cloud deployment fallback
        }

        this.recordRoomAccess(finalCode, finalName, false);
        return { code: finalCode, name: finalName };
    },

    async getRoomHistory(): Promise<RoomSummary[]> {
        const user = this.getCurrentUser();
        if (!user || !user.email) return [];

        const localList = this.getLocalHistory(user.email);
        const { apiUrl } = getBackendUrls();

        try {
            const res = await fetch(`${apiUrl}/api/rooms/history?email=${encodeURIComponent(user.email)}`);
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                const serverList: RoomSummary[] = await res.json();
                // Merge server and local list, deduplicating by roomCode
                const map = new Map<string, RoomSummary>();
                serverList.forEach((r) => map.set(r.roomCode.toUpperCase(), r));
                localList.forEach((r) => {
                    const code = r.roomCode.toUpperCase();
                    if (!map.has(code)) {
                        map.set(code, r);
                    }
                });
                return Array.from(map.values()).sort((a, b) => 
                    new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
                );
            }
        } catch {
            // Fall back to local history if backend is offline or unreachable
        }

        return localList.sort((a, b) => 
            new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
        );
    },

    async exitRoom(roomCode: string): Promise<void> {
        const user = this.getCurrentUser();
        if (!user || !user.email) return;

        // Update local status
        const localList = this.getLocalHistory(user.email);
        const found = localList.find((r) => r.roomCode.toUpperCase() === roomCode.toUpperCase());
        if (found) {
            found.hasExited = true;
            found.isActive = false;
            this.saveLocalHistory(user.email, localList);
        }

        const { apiUrl } = getBackendUrls();
        try {
            await fetch(`${apiUrl}/api/rooms/exit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomCode,
                    userEmail: user.email,
                }),
            });
        } catch {}
    },

    async deleteRoomHistory(roomCode: string): Promise<void> {
        const user = this.getCurrentUser();
        if (!user || !user.email) return;

        // Delete from local history
        const localList = this.getLocalHistory(user.email);
        const filtered = localList.filter((r) => r.roomCode.toUpperCase() !== roomCode.toUpperCase());
        this.saveLocalHistory(user.email, filtered);

        const { apiUrl } = getBackendUrls();
        try {
            await fetch(`${apiUrl}/api/rooms/history?email=${encodeURIComponent(user.email)}&roomCode=${encodeURIComponent(roomCode)}`, {
                method: 'DELETE',
            });
        } catch {}
    }
};
