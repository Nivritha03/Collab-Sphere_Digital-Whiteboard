// Configuration helper for API and WebSocket URLs
// Automatically uses window.location.hostname so phones and laptops on the same Wi-Fi / LAN connect seamlessly

export const getBackendUrls = () => {
    // Check if custom environment variables exist
    const customApi = import.meta.env.VITE_BACKEND_API_URL;
    const customWs = import.meta.env.VITE_BACKEND_WS_URL;

    if (customApi && customWs) {
        return { apiUrl: customApi, wsUrl: customWs };
    }

    const hostname = window.location.hostname || 'localhost';
    const isHttps = window.location.protocol === 'https:';

    // In local dev, backend runs on port 8080
    // If running in production (e.g. Render / Cloud / Vercel proxy), port 8080 or same origin can be configured
    const isLocalhostOrLAN = hostname === 'localhost' || hostname === '127.0.0.1' || /^192\.168\./.test(hostname) || /^10\./.test(hostname) || /^172\./.test(hostname);

    const apiPort = isLocalhostOrLAN ? ':8080' : '';
    const apiProtocol = isHttps ? 'https:' : 'http:';
    const wsProtocol = isHttps ? 'wss:' : 'ws:';

    const apiUrl = `${apiProtocol}//${hostname}${apiPort}`;
    const wsUrl = `${wsProtocol}//${hostname}${apiPort}/ws-native`;

    return { apiUrl, wsUrl };
};
