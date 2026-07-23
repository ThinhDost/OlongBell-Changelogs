const DISCORD_CLIENT_ID = '123456789012345678'; // Developer thay thế Client ID Discord ở đây
const BACKEND_URL = ''; // Điền link Cloudflare Worker vào đây khi đã cấu hình xong

class DiscordAuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.loginBtn = document.getElementById('discord-login-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.userProfile = document.getElementById('user-profile');
        this.userAvatar = document.getElementById('user-avatar');
        this.userName = document.getElementById('user-name');
        
        this.init();
    }

    init() {
        this.checkOAuthHash();
        this.loadStoredUser();
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => this.login());
        }
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    login() {
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify`;
        window.location.href = url;
    }

    logout() {
        localStorage.removeItem('discord_user');
        localStorage.removeItem('discord_token');
        this.user = null;
        this.token = null;
        this.updateUI();
        window.location.reload();
    }

    checkOAuthHash() {
        const hash = window.location.hash;
        if (hash.includes('access_token=')) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get('access_token');
            if (token) {
                this.token = token;
                localStorage.setItem('discord_token', token);
                this.fetchDiscordUser(token);
                // Xóa hash trên thanh URL cho sạch
                window.history.replaceState(null, null, window.location.pathname);
            }
        }
    }

    loadStoredUser() {
        const storedUser = localStorage.getItem('discord_user');
        const storedToken = localStorage.getItem('discord_token');
        if (storedUser && storedToken) {
            this.user = JSON.parse(storedUser);
            this.token = storedToken;
        }
    }

    async fetchDiscordUser(token) {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                this.user = {
                    id: data.id,
                    username: data.username,
                    avatar: data.avatar 
                        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(data.id) % 5}.png`
                };
                localStorage.setItem('discord_user', JSON.stringify(this.user));
                this.updateUI();
                window.location.reload();
            } else {
                this.logout();
            }
        } catch (err) {
            console.error('Lỗi khi fetch Discord user:', err);
        }
    }

    updateUI() {
        const isAuth = this.isLoggedIn();
        
        if (isAuth && this.user) {
            if (this.loginBtn) this.loginBtn.classList.add('hidden');
            if (this.userProfile) this.userProfile.classList.remove('hidden');
            if (this.userAvatar) this.userAvatar.src = this.user.avatar;
            if (this.userName) this.userName.innerText = this.user.username;
            document.body.classList.remove('is-unauth');
        } else {
            if (this.loginBtn) this.loginBtn.classList.remove('hidden');
            if (this.userProfile) this.userProfile.classList.add('hidden');
            document.body.classList.add('is-unauth');
        }

        // Cập nhật lại giao diện changelog để làm mới trạng thái thả tim
        if (window.uiInteractions) {
            window.uiInteractions.renderChangelogs();
        }
    }

    isLoggedIn() {
        return this.user !== null;
    }
}
