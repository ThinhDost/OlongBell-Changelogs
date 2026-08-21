/**
 * OlongBell Minecraft Server Integration Engine
 * Connects to Minecraft server queries and provides real-time player & server telemetry
 * Target Server: ancient.pikamc.vn:25238
 * Public Display Address: olongbel.raumasmp.online
 */

class MinecraftServerManager {
    constructor(options = {}) {
        this.queryHost = options.queryHost || 'ancient.pikamc.vn';
        this.queryPort = options.queryPort || 25238;
        this.queryAddress = `${this.queryHost}:${this.queryPort}`;
        this.displayAddress = options.displayAddress || 'olongbel.raumasmp.online';
        this.intervalMs = options.intervalMs || 30000; // 30 seconds

        this.state = {
            online: false,
            onlinePlayers: 0,
            maxPlayers: 20,
            players: [],
            version: '26.2 Fabric',
            motd: 'OlongBell Minecraft Server',
            icon: null,
            loading: true,
            lastChecked: null,
            error: null
        };

        this.listeners = [];
        this.pollTimer = null;
        this.isFetching = false;
    }

    /**
     * Subscribe to real-time server status updates
     * @param {Function} callback (state) => void
     */
    subscribe(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
            // Immediately send cached state
            callback(this.state);
        }
    }

    /**
     * Notify all subscribers with fresh state
     */
    notify() {
        this.listeners.forEach(cb => {
            try {
                cb(this.state);
            } catch (err) {
                console.error('[MC Server] Error in subscriber callback:', err);
            }
        });
    }

    /**
     * Helper to get avatar URL for a player
     * @param {string} playerName 
     * @param {number} size 
     * @returns {string} URL to 2D head avatar
     */
    getPlayerAvatarUrl(playerName, size = 32) {
        return `https://mc-heads.net/avatar/${encodeURIComponent(playerName)}/${size}`;
    }

    /**
     * Helper to get 3D head avatar URL
     * @param {string} playerName 
     * @param {number} size 
     * @returns {string} URL to 3D head avatar
     */
    getPlayerHead3DUrl(playerName, size = 32) {
        return `https://mc-heads.net/head/${encodeURIComponent(playerName)}/${size}`;
    }

    /**
     * Fetch status from primary and fallback APIs
     */
    async fetchStatus() {
        if (this.isFetching) return;
        this.isFetching = true;

        try {
            // 1. Primary Endpoint: mcsrvstat.us
            const primarySuccess = await this.fetchPrimary();
            if (!primarySuccess) {
                // 2. Fallback Endpoint 1: minetools.eu
                const fallbackSuccess = await this.fetchFallbackMinetools();
                if (!fallbackSuccess) {
                    // 3. Fallback Endpoint 2: mcapi.us
                    await this.fetchFallbackMcApi();
                }
            }
        } catch (globalErr) {
            console.error('[MC Server] Global fetch error:', globalErr);
            this.state = {
                ...this.state,
                online: false,
                onlinePlayers: 0,
                loading: false,
                lastChecked: new Date(),
                error: globalErr.message
            };
        } finally {
            this.isFetching = false;
            this.notify();
        }
    }

    async fetchPrimary() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(`https://api.mcsrvstat.us/3/${this.queryAddress}`, {
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timeoutId);

            if (!res.ok) return false;
            const data = await res.json();

            if (data.online) {
                let cleanMotd = 'OlongBell Minecraft Server';
                if (data.motd && Array.isArray(data.motd.clean) && data.motd.clean.length > 0) {
                    cleanMotd = data.motd.clean.join(' ').trim();
                } else if (typeof data.motd === 'string') {
                    cleanMotd = data.motd;
                }

                const playerList = (data.players && Array.isArray(data.players.list))
                    ? data.players.list.map(p => typeof p === 'string' ? { name: p, uuid: '' } : p)
                    : [];

                this.state = {
                    online: true,
                    onlinePlayers: data.players ? (data.players.online || 0) : 0,
                    maxPlayers: data.players ? (data.players.max || 20) : 20,
                    players: playerList,
                    version: data.version || '26.2 Fabric',
                    motd: cleanMotd,
                    icon: data.icon || null,
                    loading: false,
                    lastChecked: new Date(),
                    error: null
                };
                return true;
            } else {
                this.state = {
                    ...this.state,
                    online: false,
                    onlinePlayers: 0,
                    loading: false,
                    lastChecked: new Date(),
                    error: null
                };
                return true; // Received valid offline response
            }
        } catch (e) {
            console.warn('[MC Server] Primary API (mcsrvstat.us) failed, trying fallback...', e);
            return false;
        }
    }

    async fetchFallbackMinetools() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(`https://api.minetools.eu/ping/${this.queryHost}/${this.queryPort}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) return false;
            const data = await res.json();

            if (!data.error && data.players) {
                const sampleList = Array.isArray(data.players.sample)
                    ? data.players.sample.map(p => ({ name: p.name, uuid: p.id || '' }))
                    : [];

                this.state = {
                    online: true,
                    onlinePlayers: data.players.online || 0,
                    maxPlayers: data.players.max || 20,
                    players: sampleList,
                    version: data.version ? data.version.name : '26.2 Fabric',
                    motd: typeof data.description === 'string' ? data.description : 'OlongBell Minecraft Server',
                    icon: data.favicon || null,
                    loading: false,
                    lastChecked: new Date(),
                    error: null
                };
                return true;
            }
            return false;
        } catch (e) {
            console.warn('[MC Server] Fallback 1 (minetools) failed:', e);
            return false;
        }
    }

    async fetchFallbackMcApi() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(`https://mcapi.us/server/status?ip=${this.queryHost}&port=${this.queryPort}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) return false;
            const data = await res.json();

            if (data.status === 'success' && data.online) {
                this.state = {
                    online: true,
                    onlinePlayers: data.players ? (data.players.now || 0) : 0,
                    maxPlayers: data.players ? (data.players.max || 20) : 20,
                    players: (data.players && Array.isArray(data.players.sample))
                        ? data.players.sample.map(p => ({ name: p.name, uuid: p.id || '' }))
                        : [],
                    version: data.server ? data.server.name : '26.2 Fabric',
                    motd: data.motd || 'OlongBell Minecraft Server',
                    icon: data.favicon || null,
                    loading: false,
                    lastChecked: new Date(),
                    error: null
                };
                return true;
            }
            return false;
        } catch (e) {
            console.warn('[MC Server] Fallback 2 (mcapi.us) failed:', e);
            return false;
        }
    }

    /**
     * Start background polling
     */
    start() {
        this.fetchStatus();
        if (this.pollTimer) clearInterval(this.pollTimer);
        this.pollTimer = setInterval(() => this.fetchStatus(), this.intervalMs);
    }

    /**
     * Stop background polling
     */
    stop() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
}

// Global Singleton Instance
window.mcServerManager = new MinecraftServerManager();
