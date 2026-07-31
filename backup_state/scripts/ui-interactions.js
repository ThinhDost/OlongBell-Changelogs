class UIInteractions {
    constructor() {
        this.changelogsList = document.getElementById('changelogs-list');
        this.changelogsContainer = document.getElementById('changelogs-container');
        this.cylinderWrapper = document.getElementById('cylinder-viewport-wrapper');
        this.viewModeSwitcher = document.getElementById('view-mode-switcher');
        this.emptyState = document.getElementById('empty-state');
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search-btn');
        this.categoryFilters = document.getElementById('category-filters');
        this.modal = document.getElementById('update-modal');
        this.modalContent = document.getElementById('modal-content');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.copyIpBtn = document.getElementById('copy-ip-btn');
        this.sneakpeeksList = document.getElementById('sneakpeeks-list');

        this.currentCategory = 'all';
        this.searchQuery = '';
        this.currentViewMode = '3d'; // '3d' or 'grid'
        this.observer = null;
        this.isReacting = false;

        // Initialize 3D Cylinder Carousel Engine
        this.cylinder3D = new GSAP3DCylinderCarousel(this);

        // Water Bucket Inertia Physics Simulation State
        this.lastScrollY = window.scrollY;
        this.inertiaY = 0;
        this.inertiaTargetY = 0;
        this.wordPhysicsData = [];

        // Vote Section Elements
        this.voteSubmitForm = document.getElementById('vote-submit-form');
        this.voteModNameInput = document.getElementById('vote-mod-name');
        this.voteModUrlInput = document.getElementById('vote-mod-url');
        this.voteUnauthPrompt = document.getElementById('vote-unauth-prompt');
        this.voteLoginBtn = document.getElementById('vote-login-btn');
        this.voteModsList = document.getElementById('vote-mods-list');
        this.voteEmptyState = document.getElementById('vote-empty-state');
        
        this.isSubmittingMod = false;
        this.isVotingMod = false;

        this.init();
    }

    async init() {
        this.setupIntersectionObserver();
        this.initAuth();
        await this.loadGlobalReactions();
        this.renderChangelogs();
        this.renderSneakPeeks();
        this.setupEventListeners();
        this.startOnlinePlayerSimulator();
        this.checkInitialDeepLink();
        this.updateVoteUIAuth();
        this.loadModsAndVotes();
    }

    initAuth() {
        window.authManager = new DiscordAuthManager();
    }

    async loadGlobalReactions() {
        if (!window.BACKEND_URL) return;
        try {
            const res = await fetch(`${window.BACKEND_URL}/api/reactions`);
            if (res.ok) {
                const data = await res.json();
                window.globalReactions = data;
            }
        } catch (err) {
            console.error('Lỗi khi tải reactions từ backend:', err);
        }
    }

    setupEventListeners() {
        // Search Input Listener
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                if (this.searchQuery.length > 0) {
                    this.clearSearchBtn.classList.remove('hidden');
                } else {
                    this.clearSearchBtn.classList.add('hidden');
                }
                this.renderChangelogs();
            });
        }

        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                this.searchQuery = '';
                this.clearSearchBtn.classList.add('hidden');
                this.renderChangelogs();
            });
        }

        // View Mode Switcher Listener (3D Preview vs Standard Feed)
        if (this.viewModeSwitcher) {
            this.viewModeSwitcher.addEventListener('click', (e) => {
                const btn = e.target.closest('.view-btn');
                if (!btn) return;

                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.currentViewMode = btn.dataset.view;
                this.applyViewModeVisibility();
            });
        }

        // Category Chips Filter Listener
        if (this.categoryFilters) {
            this.categoryFilters.addEventListener('click', (e) => {
                const chip = e.target.closest('.filter-chip');
                if (!chip) return;

                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                this.currentCategory = chip.dataset.category;
                this.renderChangelogs();
            });
        }

        // Reset Filters Button in Empty State
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                this.searchQuery = '';
                this.currentCategory = 'all';
                this.clearSearchBtn.classList.add('hidden');
                document.querySelectorAll('.filter-chip').forEach(c => {
                    c.classList.toggle('active', c.dataset.category === 'all');
                });
                this.renderChangelogs();
            });
        }

        // Theme Toggle Listener (Silent mode)
        if (this.themeToggleBtn) {
            // Khởi tạo icon ban đầu khớp với trạng thái theme của trang (Dark mode thì hiện Sun để đổi sang Light, ngược lại)
            const isInitiallyDark = document.documentElement.classList.contains('dark');
            this.themeToggleBtn.innerHTML = isInitiallyDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';

            this.themeToggleBtn.addEventListener('click', () => {
                const html = document.documentElement;
                const isDark = html.classList.toggle('dark');
                this.themeToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        }

        // Copy IP Listener (Hiện toast thông báo trực quan cho người dùng)
        if (this.copyIpBtn) {
            this.copyIpBtn.addEventListener('click', () => {
                const ipText = 'onglongbel.raumasmp.online';
                navigator.clipboard.writeText(ipText).then(() => {
                    this.showToast('Đã sao chép địa chỉ IP máy chủ! 📋');
                }).catch(() => {
                    // Dự phòng nếu trình duyệt chặn Clipboard API
                    this.showToast('Địa chỉ IP: onglongbel.raumasmp.online');
                });
            });
        }

        // Copy PowerShell command listener
        const copyInstallerBtn = document.getElementById('copy-installer-btn');
        if (copyInstallerBtn) {
            copyInstallerBtn.addEventListener('click', () => {
                const commandEl = document.getElementById('powershell-command');
                if (!commandEl) return;
                const commandText = commandEl.innerText;
                navigator.clipboard.writeText(commandText).then(() => {
                    copyInstallerBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied! 📋';
                    copyInstallerBtn.classList.add('copied');
                    this.showToast('Đã sao chép lệnh cài đặt tự động! 💻');
                    setTimeout(() => {
                        copyInstallerBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Command';
                        copyInstallerBtn.classList.remove('copied');
                    }, 3000);
                }).catch(() => {
                    this.showToast('Lỗi: Không thể tự động sao chép!');
                });
            });
        }

        // Close Modal Listeners
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal());
        }
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }

        // ESC Key to Close Modal
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.modal && !this.modal.classList.contains('hidden')) {
                    this.closeModal();
                }
                const authModal = document.getElementById('auth-modal');
                if (authModal && !authModal.classList.contains('hidden')) {
                    this.closeAuthModal();
                }
            }
        });

        // Browser Back/Forward navigation (PopState)
        window.addEventListener('popstate', (e) => {
            const params = new URLSearchParams(window.location.search);
            const logId = params.get('id');
            if (logId) {
                const log = CHANGELOGS_DATA.find(item => item.id === logId);
                if (log) {
                    this.openModal(log, false);
                }
            } else {
                this.closeModal(false);
            }
        });

        // Submit Mod Proposal Form
        if (this.voteSubmitForm) {
            this.voteSubmitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleModSubmission();
            });
        }

        // Vote Login Button
        if (this.voteLoginBtn) {
            this.voteLoginBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.login();
                }
            });
        }
    }

    setupIntersectionObserver() {
        // Không dùng IntersectionObserver nữa, chuyển hoàn toàn sang GSAP ScrollTrigger
        this.observer = null;
    }

    observeElements() {
        const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (hasReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            // Dự phòng: Nếu người dùng hạn chế chuyển động hoặc thiếu thư viện GSAP
            document.querySelectorAll('.reveal-on-scroll').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
                el.style.filter = 'none';
            });
            return;
        }

        // Dọn dẹp các ScrollTrigger cũ của các thẻ để tránh trùng lặp/rò rỉ bộ nhớ khi re-render
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars.trigger && (
                trigger.vars.trigger.classList?.contains('reveal-on-scroll') ||
                (typeof trigger.vars.trigger === 'string' && trigger.vars.trigger.includes('reveal-on-scroll'))
            )) {
                trigger.kill();
            }
        });

        // Sử dụng ScrollTrigger.batch để nhóm các phần tử xuất hiện cùng lúc và chạy stagger mượt mà
        ScrollTrigger.batch(".reveal-on-scroll", {
            start: "top 88%",
            onEnter: batch => gsap.fromTo(batch, {
                opacity: 0,
                y: 45,
                filter: "blur(8px)"
            }, {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                stagger: 0.15,
                duration: 0.8,
                ease: "power2.out",
                overwrite: "auto"
            }),
            once: true
        });
    }

    applyViewModeVisibility() {
        if (this.currentViewMode === '3d') {
            if (this.cylinderWrapper) this.cylinderWrapper.classList.remove('hidden');
            if (this.changelogsContainer) this.changelogsContainer.classList.add('hidden');
            if (this.cylinder3D) this.cylinder3D.render(this.lastFilteredLogs || CHANGELOGS_DATA);
        } else {
            if (this.cylinderWrapper) this.cylinderWrapper.classList.add('hidden');
            if (this.changelogsContainer) this.changelogsContainer.classList.remove('hidden');
            if (this.cylinder3D) this.cylinder3D.destroy();
        }
    }

    renderChangelogs() {
        if (!this.changelogsList) return;

        const filtered = CHANGELOGS_DATA.filter(log => {
            const matchCategory = this.currentCategory === 'all' || log.categories.includes(this.currentCategory);
            const matchSearch = this.searchQuery === '' || 
                log.title.toLowerCase().includes(this.searchQuery) ||
                log.version.toLowerCase().includes(this.searchQuery) ||
                log.summary.toLowerCase().includes(this.searchQuery) ||
                log.sections.some(s => s.items.some(item => item.toLowerCase().includes(this.searchQuery)));

            return matchCategory && matchSearch;
        });

        this.lastFilteredLogs = filtered;

        if (filtered.length === 0) {
            this.changelogsList.innerHTML = '';
            if (this.emptyState) this.emptyState.classList.remove('hidden');
            if (this.cylinder3D) this.cylinder3D.render([]);
            return;
        }

        if (this.emptyState) this.emptyState.classList.add('hidden');

        // Render Standard Feed Cards
        let htmlBuffer = '';

        filtered.forEach((log) => {
            // Render Compact Preview Card
            htmlBuffer += this.createCompactCardHTML(log);
        });

        this.changelogsList.innerHTML = htmlBuffer;

        this.observeElements();
        this.applyViewModeVisibility();

        // Attach Double-Click & Button Detail Event Listeners to Standard Cards
        this.changelogsList.querySelectorAll('.changelog-card').forEach(card => {
            const logId = card.id;
            const log = CHANGELOGS_DATA.find(item => item.id === logId);

            // Double Click anywhere on card to open full details smoothly
            card.addEventListener('dblclick', (e) => {
                // Prevent opening if double-clicked directly on share or react button
                if (!e.target.closest('.btn-share') && !e.target.closest('.react-btn') && log) {
                    this.openModal(log);
                }
            });

            // Single click on detail button
            const detailBtn = card.querySelector('.btn-detail');
            if (detailBtn && log) {
                detailBtn.addEventListener('click', () => this.openModal(log));
            }

            // Single click on share button
            const shareBtn = card.querySelector('.btn-share');
            if (shareBtn) {
                shareBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const shareUrl = window.location.origin + window.location.pathname + '?id=' + log.id;
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        this.showToast(`Đã sao chép liên kết chia sẻ phiên bản ${log.version}! 📋`);
                    }).catch(() => {});
                });
            }

            // Single click on reaction buttons
            card.querySelectorAll('.react-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!window.authManager || !window.authManager.isLoggedIn()) {
                        this.showAuthModal();
                        return;
                    }
                    this.handleReaction(logId, btn.dataset.type);
                });
            });
        });
    }

    createSectionDividerHTML(index) {
        const rawThemes = [
            [
                ['OLONGBELL', '✧', '<span class="hl-orange">MAJOR UPDATE</span>', '✧', 'OVERWORLD', '✧', '<span class="hl-yellow">FEATURES</span>', '✧', 'OLONGBELL'],
                ['EXPANSION', '✧', '<span class="hl-blue">CREATIVITY</span>', '✧', 'NETHER', '✧', '<span class="hl-purple">COMMUNITY</span>', '✧', 'SEASON 3']
            ],
            [
                ['PATCH', '✧', '<span class="hl-purple">SYSTEM STABILITY</span>', '✧', 'OPTIMIZATION', '✧', '<span class="hl-blue">BUG FIXES</span>', '✧', 'PATCH'],
                ['NETWORK', '✧', '<span class="hl-green">20 TPS GUARANTEE</span>', '✧', 'ASYNC ENGINE', '✧', '<span class="hl-yellow">FOLIA</span>']
            ]
        ];

        const theme = rawThemes[index % rawThemes.length];

        const line1HTML = theme[0].map(w => `<span class="float-word">${w}</span>`).join(' ');
        const line2HTML = theme[1].map(w => `<span class="float-word">${w}</span>`).join(' ');

        return `
            <div class="section-divider reveal-on-scroll">
                <div class="divider-brackets"></div>
                <div class="divider-marquee">
                    <div class="marquee-line marquee-line-1">${line1HTML}</div>
                    <div class="marquee-line marquee-line-2">${line2HTML}</div>
                </div>
            </div>
        `;
    }

    createCompactCardHTML(log) {
        const badgesHTML = log.categories.map(cat => {
            const labelMap = {
                feature: 'Features',
                fix: 'Bug Fixes',
                balance: 'Balance',
                performance: 'Performance',
                event: 'Events'
            };
            return `<span class="badge badge-${cat}">${labelMap[cat] || cat}</span>`;
        }).join('');

        // Bổ sung Reactions Mock Database trong localStorage
        const getReactions = (logId) => {
            const defaultReactions = { like: 0, love: 0, fire: 0 };
            if (window.BACKEND_URL && window.globalReactions && window.globalReactions[logId]) {
                return window.globalReactions[logId];
            }
            const stored = localStorage.getItem(`reactions_${logId}`);
            return stored ? JSON.parse(stored) : defaultReactions;
        };

        const reactions = getReactions(log.id);
        const userReaction = localStorage.getItem(`user_react_${log.id}`);

        return `
            <article class="changelog-card reveal-on-scroll" id="${log.id}" title="Double-click to open full changelog details">
                <div class="card-header">
                    <div class="card-title-group">
                        <span class="version-tag">${log.version}</span>
                        <h2 class="card-title">${log.title}</h2>
                    </div>
                    <div class="card-meta">
                        <span class="release-date"><i class="fa-regular fa-calendar-days"></i> ${log.date}</span>
                        <span class="author-tag"><i class="fa-solid fa-user-pen"></i> ${log.author}</span>
                    </div>
                </div>

                <div class="category-badges">
                    ${badgesHTML}
                </div>

                <div class="card-summary-preview">
                    <p>${log.summary}</p>
                </div>

                <!-- Dải thả cảm xúc -->
                <div class="card-reactions" data-log-id="${log.id}">
                    <button class="react-btn ${userReaction === 'like' ? 'has-reacted' : ''}" data-type="like" title="Thích">
                        <span class="emoji">👍</span> <span class="count">${reactions.like}</span>
                    </button>
                    <button class="react-btn ${userReaction === 'love' ? 'has-reacted' : ''}" data-type="love" title="Yêu thích">
                        <span class="emoji">❤️</span> <span class="count">${reactions.love}</span>
                    </button>
                    <button class="react-btn ${userReaction === 'fire' ? 'has-reacted' : ''}" data-type="fire" title="Quá cháy">
                        <span class="emoji">🔥</span> <span class="count">${reactions.fire}</span>
                    </button>
                </div>

                <div class="card-footer">
                    <button class="btn-detail" data-id="${log.id}">
                        <i class="fa-solid fa-up-right-from-square"></i> Read Full Changelog
                    </button>
                    <button class="btn-share" data-version="${log.version}">
                        <i class="fa-solid fa-share-nodes"></i> Share
                    </button>
                </div>
            </article>
        `;
    }

    openModal(log, pushState = true) {
        if (!this.modal || !this.modalContent) return;

        this.modalContent.innerHTML = `
            <div style="margin-bottom: 24px;">
                <span class="version-tag" style="font-size: 1.2rem; padding: 8px 18px;">${log.version}</span>
                <h2 style="font-size: 2.2rem; margin-top: 14px; font-weight: 800; color: var(--text-primary);">${log.title}</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 6px;">
                    Released on ${log.date} by <b>${log.author}</b>
                </p>
            </div>
            ${log.image ? `<img src="${log.image}" style="width:100%; border-radius: var(--radius-lg); margin-bottom: 28px; max-height: 360px; object-fit: cover;" alt="${log.title}">` : ''}
            <p style="font-size: 1.1rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 28px;">${log.summary}</p>
            <div class="update-sections">
                ${log.sections.map(sec => `
                    <div class="section-block" style="margin-bottom: 24px;">
                        <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 12px;">${sec.heading}</h3>
                        <ul class="changes-list">
                            ${sec.items.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;

        // Smooth Entrance Animation Trigger
        this.modal.classList.remove('hidden');
        // Force reflow for CSS transition trigger
        void this.modal.offsetWidth;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (pushState) {
            const newUrl = window.location.origin + window.location.pathname + '?id=' + log.id;
            window.history.pushState({ logId: log.id }, '', newUrl);
        }
    }

    closeModal(pushState = true) {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        
        // Wait for smooth fade-out animation to finish before adding hidden
        setTimeout(() => {
            this.modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 320);

        if (pushState) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.pushState({ logId: null }, '', cleanUrl);
        }
    }

    startOnlinePlayerSimulator() {
        const countEl = document.getElementById('player-count');
        if (!countEl) return;

        let baseCount = 342;
        setInterval(() => {
            const delta = Math.floor(Math.random() * 7) - 3;
            baseCount = Math.max(280, Math.min(500, baseCount + delta));
            countEl.innerText = baseCount;
        }, 4000);
    }

    getYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    renderSneakPeeks() {
        if (!this.sneakpeeksList || typeof SNEAKPEEKS_DATA === 'undefined') return;

        let htmlBuffer = '';
        SNEAKPEEKS_DATA.forEach(sp => {
            let mediaHTML = '';

            if (sp.type === 'video') {
                const videoId = this.getYouTubeId(sp.youtubeUrl);
                if (videoId) {
                    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    mediaHTML = `
                        <div class="sneakpeek-thumbnail-wrapper" data-video-id="${videoId}">
                            <img src="${thumbnailUrl}" alt="${sp.title}" class="sneakpeek-thumbnail" loading="lazy">
                            <div class="sneakpeek-play-btn">
                                <i class="fa-solid fa-play"></i>
                            </div>
                            <div class="sneakpeek-video-container hidden"></div>
                        </div>
                    `;
                }
            } else if (sp.type === 'image') {
                mediaHTML = `
                    <div class="sneakpeek-image-wrapper">
                        <img src="${sp.imageUrl}" alt="${sp.title}" class="sneakpeek-image" loading="lazy">
                    </div>
                `;
            }

            htmlBuffer += `
                <article class="sneakpeek-item reveal-on-scroll">
                    <div class="sneakpeek-media">
                        ${mediaHTML}
                    </div>
                    <div class="sneakpeek-content">
                        <span class="sneakpeek-date"><i class="fa-regular fa-calendar-days"></i> ${sp.date}</span>
                        <h3 class="sneakpeek-title">${sp.title}</h3>
                        <p class="sneakpeek-summary">${sp.summary}</p>
                    </div>
                </article>
            `;
        });

        this.sneakpeeksList.innerHTML = htmlBuffer;

        // Đính kèm sự kiện Click Lazy-load Iframe cho các card Video
        this.sneakpeeksList.querySelectorAll('.sneakpeek-thumbnail-wrapper').forEach(wrapper => {
            const playBtn = wrapper.querySelector('.sneakpeek-play-btn');
            const videoContainer = wrapper.querySelector('.sneakpeek-video-container');
            const videoId = wrapper.dataset.videoId;

            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                if (videoContainer.classList.contains('hidden')) {
                    videoContainer.innerHTML = `
                        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                                title="YouTube video player" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowfullscreen>
                        </iframe>`;
                    videoContainer.classList.remove('hidden');
                    if (playBtn) playBtn.style.display = 'none';
                }
            });
        });

        // Kích hoạt lại ScrollTrigger để cập nhật các phần tử mới dựng
        if (typeof this.observeElements === 'function') {
            this.observeElements();
        }
    }

    async handleReaction(logId, type) {
        if (this.isReacting) {
            this.showToast('Hành động quá nhanh! Vui lòng đợi chút. ⏳');
            return;
        }

        if (window.BACKEND_URL) {
            const token = localStorage.getItem('discord_token');
            if (!token) {
                this.showAuthModal();
                return;
            }

            // Phát âm thanh phản hồi tức thì
            this.playReactionSound(type);

            // 1. Sao lưu trạng thái cũ để phục hồi nếu gặp lỗi (Rollback state)
            const getReactions = (id) => {
                const defaultReactions = { like: 0, love: 0, fire: 0 };
                if (window.globalReactions && window.globalReactions[id]) {
                    return { ...window.globalReactions[id] };
                }
                const stored = localStorage.getItem(`reactions_${id}`);
                return stored ? JSON.parse(stored) : defaultReactions;
            };

            const previousReactions = getReactions(logId);
            const previousUserReaction = localStorage.getItem(`user_react_${logId}`);

            // 2. Tính toán trạng thái mới trước (Optimistic State)
            const nextReactions = { ...previousReactions };
            let nextUserReaction = null;

            if (previousUserReaction === type) {
                // Click lại nút cũ -> Hủy thả tim
                nextReactions[type] = Math.max(0, (nextReactions[type] || 0) - 1);
                nextUserReaction = null;
                localStorage.removeItem(`user_react_${logId}`);
            } else {
                // Đổi loại tim hoặc thả tim lần đầu
                if (previousUserReaction) {
                    nextReactions[previousUserReaction] = Math.max(0, (nextReactions[previousUserReaction] || 0) - 1);
                }
                nextReactions[type] = (nextReactions[type] || 0) + 1;
                nextUserReaction = type;
                localStorage.setItem(`user_react_${logId}`, type);
            }

            // Cập nhật ngay lập tức lên UI
            if (!window.globalReactions) window.globalReactions = {};
            window.globalReactions[logId] = nextReactions;
            this.updateReactionsDOM(logId);

            // 3. Gửi request mạng chạy ngầm
            this.isReacting = true;
            try {
                const res = await fetch(`${window.BACKEND_URL}/api/react`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ logId, type })
                });

                if (res.ok) {
                    const data = await res.json();
                    // Cập nhật số liệu chuẩn cuối cùng từ server trả về
                    window.globalReactions = data.allReactions;
                    if (data.userReaction) {
                        localStorage.setItem(`user_react_${logId}`, data.userReaction);
                    } else {
                        localStorage.removeItem(`user_react_${logId}`);
                    }
                    this.updateReactionsDOM(logId);
                } else {
                    // Lỗi từ server -> Hoàn tác (Rollback) lại UI cũ
                    window.globalReactions[logId] = previousReactions;
                    if (previousUserReaction) {
                        localStorage.setItem(`user_react_${logId}`, previousUserReaction);
                    } else {
                        localStorage.removeItem(`user_react_${logId}`);
                    }
                    this.updateReactionsDOM(logId);

                    if (res.status === 401) {
                        if (window.authManager) window.authManager.logout();
                        this.showAuthModal();
                    } else if (res.status === 429) {
                        const data = await res.json();
                        this.showToast(data.error || 'Vui lòng đợi 1 giây giữa các lượt thả tim! ⏳');
                    } else {
                        this.showToast('Gặp lỗi khi gửi lượt tương tác! ❌');
                    }
                }
            } catch (err) {
                console.error('Lỗi khi gửi reaction tới backend:', err);
                // Lỗi mạng hoặc lỗi kết nối -> Hoàn tác (Rollback) lại UI cũ
                window.globalReactions[logId] = previousReactions;
                if (previousUserReaction) {
                    localStorage.setItem(`user_react_${logId}`, previousUserReaction);
                } else {
                    localStorage.removeItem(`user_react_${logId}`);
                }
                this.updateReactionsDOM(logId);
                this.showToast('Mất kết nối mạng! ❌');
            } finally {
                this.isReacting = false;
            }
            return;
        }

        // Phát âm thanh phản hồi ở chế độ Offline/Local
        this.playReactionSound(type);

        const key = `reactions_${logId}`;
        const userKey = `user_react_${logId}`;
        const stored = localStorage.getItem(key);
        const reactions = stored ? JSON.parse(stored) : { like: 0, love: 0, fire: 0 };
        const userReact = localStorage.getItem(userKey);

        if (userReact === type) {
            // Hủy reaction cũ
            reactions[type] = Math.max(0, reactions[type] - 1);
            localStorage.removeItem(userKey);
        } else {
            // Đổi hoặc thêm reaction mới
            if (userReact) {
                reactions[userReact] = Math.max(0, reactions[userReact] - 1);
            }
            reactions[type] = (reactions[type] || 0) + 1;
            localStorage.setItem(userKey, type);
        }

        localStorage.setItem(key, JSON.stringify(reactions));
        this.updateReactionsDOM(logId);
    }

    playReactionSound(type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const now = ctx.currentTime;
            
            if (type === 'like') {
                // 👍: Nốt nhạc sine trong sáng, nảy và ngắn
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'love') {
                // ❤️: Âm thanh ấm áp (triangle), âm hưởng nốt tròn dày hơn
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
                
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'fire') {
                // 🔥: Hiệu ứng trượt tần số cao tạo cảm giác xèo xèo/sét đánh (Chirp)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(450, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                
                osc.start(now);
                osc.stop(now + 0.06);
            }
        } catch (e) {
            console.warn("Không thể phát âm thanh phản hồi:", e);
        }
    }

    updateReactionsDOM(logId) {
        // Lấy reactions mới nhất
        const getReactions = (id) => {
            const defaultReactions = { like: 0, love: 0, fire: 0 };
            if (window.BACKEND_URL && window.globalReactions && window.globalReactions[id]) {
                return window.globalReactions[id];
            }
            const stored = localStorage.getItem(`reactions_${id}`);
            return stored ? JSON.parse(stored) : defaultReactions;
        };

        const reactions = getReactions(logId);
        const userReaction = localStorage.getItem(`user_react_${logId}`);

        // Tìm tất cả các khối reaction có cùng logId trên trang (bao gồm cả Feed và Carousel)
        const containers = document.querySelectorAll(`.card-reactions[data-log-id="${logId}"]`);
        
        containers.forEach(container => {
            // Cập nhật nút Like
            const likeBtn = container.querySelector('.react-btn[data-type="like"]');
            if (likeBtn) {
                if (userReaction === 'like') {
                    likeBtn.classList.add('has-reacted');
                } else {
                    likeBtn.classList.remove('has-reacted');
                }
                const countSpan = likeBtn.querySelector('.count');
                if (countSpan) countSpan.textContent = reactions.like || 0;
            }

            // Cập nhật nút Love
            const loveBtn = container.querySelector('.react-btn[data-type="love"]');
            if (loveBtn) {
                if (userReaction === 'love') {
                    loveBtn.classList.add('has-reacted');
                } else {
                    loveBtn.classList.remove('has-reacted');
                }
                const countSpan = loveBtn.querySelector('.count');
                if (countSpan) countSpan.textContent = reactions.love || 0;
            }

            // Cập nhật nút Fire
            const fireBtn = container.querySelector('.react-btn[data-type="fire"]');
            if (fireBtn) {
                if (userReaction === 'fire') {
                    fireBtn.classList.add('has-reacted');
                } else {
                    fireBtn.classList.remove('has-reacted');
                }
                const countSpan = fireBtn.querySelector('.count');
                if (countSpan) countSpan.textContent = reactions.fire || 0;
            }
        });
    }

    checkInitialDeepLink() {
        const params = new URLSearchParams(window.location.search);
        const logId = params.get('id');
        if (logId) {
            const log = CHANGELOGS_DATA.find(item => item.id === logId);
            if (log) {
                // Wait slightly for intro fade out to complete before opening
                setTimeout(() => {
                    this.openModal(log, false);
                }, 2600); // 1.8s progress bar + 0.8s fade out
            }
        }
    }

    showToast(message) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.innerHTML = `
            <i class="fa-solid fa-circle-check toast-icon"></i>
            <span class="toast-text">${message}</span>
        `;
        container.appendChild(toast);

        // Force reflow
        void toast.offsetWidth;

        // Transition entrance
        toast.classList.add('active');

        // Automatic dismissal after 3 seconds
        setTimeout(() => {
            toast.classList.remove('active');
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 3000);
    }

    showAuthModal() {
        let modal = document.getElementById('auth-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'auth-modal';
            modal.className = 'modal-overlay auth-modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal-card auth-modal-card">
                    <button class="close-modal-btn auth-close-btn" aria-label="Close Modal">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <div class="modal-content auth-modal-content">
                        <div class="auth-prompt-wrapper">
                            <div class="auth-prompt-icon">
                                <i class="fa-brands fa-discord"></i>
                            </div>
                            <h2 class="auth-prompt-title">Yêu cầu đăng nhập</h2>
                            <p class="auth-prompt-desc">
                                Bạn cần đăng nhập bằng tài khoản Discord để có thể thả cảm xúc (👍, ❤️, 🔥) hoặc tham gia bình chọn ý kiến cộng đồng trên máy chủ OlongBell.
                            </p>
                            <button class="btn-primary-action auth-prompt-btn" id="auth-prompt-login-btn">
                                <i class="fa-brands fa-discord"></i> Đăng nhập ngay
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close button listener
            const closeBtn = modal.querySelector('.auth-close-btn');
            closeBtn.addEventListener('click', () => this.closeAuthModal());

            // Click outside overlay listener
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAuthModal();
            });

            // Login button listener
            const loginBtn = modal.querySelector('#auth-prompt-login-btn');
            loginBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.login();
                }
            });
        }

        // Show modal with animation
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 320);
    }

    updateVoteUIAuth() {
        const isLoggedIn = window.authManager && window.authManager.isLoggedIn();
        if (isLoggedIn) {
            if (this.voteSubmitForm) this.voteSubmitForm.classList.remove('hidden');
            if (this.voteUnauthPrompt) this.voteUnauthPrompt.classList.add('hidden');
        } else {
            if (this.voteSubmitForm) this.voteSubmitForm.classList.add('hidden');
            if (this.voteUnauthPrompt) this.voteUnauthPrompt.classList.remove('hidden');
        }
    }

    async loadModsAndVotes() {
        if (!this.voteModsList) return;
        
        // Show loading state
        this.voteModsList.innerHTML = `
            <div class="vote-loading">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách bình chọn...
            </div>
        `;
        if (this.voteEmptyState) this.voteEmptyState.classList.add('hidden');

        let mods = [];
        
        if (window.BACKEND_URL) {
            try {
                const res = await fetch(`${window.BACKEND_URL}/api/votes`);
                if (res.ok) {
                    mods = await res.json();
                } else {
                    console.error('Lỗi khi tải danh sách mod từ backend');
                }
            } catch (err) {
                console.error('Lỗi mạng khi tải danh sách mod:', err);
            }
        } else {
            // Offline fallback from local storage
            const stored = localStorage.getItem('vote_mods_offline');
            mods = stored ? JSON.parse(stored) : [];
        }

        this.renderVoteMods(mods);
    }

    renderVoteMods(mods) {
        if (!this.voteModsList) return;
        
        this.voteModsList.innerHTML = '';
        
        if (!mods || mods.length === 0) {
            if (this.voteEmptyState) this.voteEmptyState.classList.remove('hidden');
            return;
        }
        
        if (this.voteEmptyState) this.voteEmptyState.classList.add('hidden');

        // Sắp xếp danh sách mod: nhiều vote nhất lên đầu
        const sortedMods = [...mods].sort((a, b) => {
            const votesA = a.voters ? a.voters.length : 0;
            const votesB = b.voters ? b.voters.length : 0;
            return votesB - votesA;
        });

        const currentUserId = window.authManager && window.authManager.user ? window.authManager.user.id : null;
        const isAdmin = window.authManager && window.authManager.user && window.authManager.user.username === "thinhdost";

        let htmlBuffer = '';
        sortedMods.forEach(mod => {
            const votesCount = mod.voters ? mod.voters.length : 0;
            const hasVoted = currentUserId && mod.voters && mod.voters.includes(currentUserId);
            
            // Check host to display badge icon
            let hostIcon = '<i class="fa-solid fa-link"></i>';
            if (mod.url.includes('curseforge.com')) {
                hostIcon = '<i class="fa-solid fa-puzzle-piece" style="color: #ff5a00;"></i>';
            } else if (mod.url.includes('modrinth.com')) {
                hostIcon = '<i class="fa-solid fa-leaf" style="color: #1bd96a;"></i>';
            }

            htmlBuffer += `
                <div class="vote-mod-card" id="mod-${mod.id}">
                    <div class="vote-mod-info">
                        <div class="vote-mod-name-row">
                            <span class="vote-mod-name" title="${mod.name}">${mod.name}</span>
                            <a href="${mod.url}" target="_blank" rel="noopener noreferrer" class="vote-mod-link" title="Xem trên web">
                                ${hostIcon} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i>
                            </a>
                        </div>
                        <div class="vote-mod-suggested-by">
                            <img src="${mod.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + mod.suggestedBy}" alt="Avatar">
                            <span>Đề xuất bởi <strong>${mod.suggestedBy}</strong></span>
                        </div>
                    </div>
                    <div class="vote-mod-actions">
                        ${isAdmin ? `
                            <button class="btn-delete-mod" data-mod-id="${mod.id}" title="Xóa đề xuất này">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        ` : ''}
                        <button class="btn-vote ${hasVoted ? 'has-voted' : ''}" data-mod-id="${mod.id}" title="${hasVoted ? 'Hủy bình chọn' : 'Bình chọn cho mod này'}">
                            <i class="fa-solid fa-heart vote-icon"></i>
                            <span class="vote-count">${votesCount}</span>
                        </button>
                    </div>
                </div>
            `;
        });

        this.voteModsList.innerHTML = htmlBuffer;

        // Attach event listeners to upvote buttons
        this.voteModsList.querySelectorAll('.btn-vote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!window.authManager || !window.authManager.isLoggedIn()) {
                    this.showAuthModal();
                    return;
                }
                const modId = btn.dataset.modId;
                this.handleModVote(modId);
            });
        });

        // Attach event listeners to delete buttons (for Admin)
        if (isAdmin) {
            this.voteModsList.querySelectorAll('.btn-delete-mod').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const modId = btn.dataset.modId;
                    this.handleModDeletion(modId);
                });
            });
        }
    }

    async handleModSubmission() {
        if (this.isSubmittingMod) return;
        
        const name = this.voteModNameInput.value.trim();
        const url = this.voteModUrlInput.value.trim();
        
        if (!name || !url) return;

        // Frontend validation for CurseForge/Modrinth links
        let isValidUrl = false;
        try {
            const parsed = new URL(url);
            const hostname = parsed.hostname.replace('www.', '');
            if (hostname === 'curseforge.com') {
                isValidUrl = parsed.pathname.includes('/mc-mods/');
            } else if (hostname === 'modrinth.com') {
                isValidUrl = parsed.pathname.includes('/mod/') || parsed.pathname.includes('/project/');
            }
        } catch (e) {}

        if (!isValidUrl) {
            this.showToast('Link đề xuất phải là liên kết mod từ curseforge.com hoặc modrinth.com! ❌');
            return;
        }

        this.isSubmittingMod = true;
        const submitBtn = this.voteSubmitForm.querySelector('.vote-submit-btn');
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang gửi...';
        submitBtn.disabled = true;

        if (window.BACKEND_URL) {
            const token = localStorage.getItem('discord_token');
            try {
                const res = await fetch(`${window.BACKEND_URL}/api/submit-mod`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, url })
                });

                if (res.ok) {
                    const updatedMods = await res.json();
                    this.renderVoteMods(updatedMods);
                    this.voteModNameInput.value = '';
                    this.voteModUrlInput.value = '';
                    this.showToast('Đã gửi đề xuất mod thành công! 🎉');
                    this.playVoteSound(true);
                } else {
                    const data = await res.json();
                    this.showToast(data.error || 'Lỗi khi gửi đề xuất! ❌');
                }
            } catch (err) {
                console.error('Lỗi mạng khi gửi đề xuất mod:', err);
                this.showToast('Lỗi kết nối mạng! ❌');
            } finally {
                this.isSubmittingMod = false;
                submitBtn.innerHTML = originalBtnHTML;
                submitBtn.disabled = false;
            }
        } else {
            // Local/offline simulation
            const stored = localStorage.getItem('vote_mods_offline');
            const mods = stored ? JSON.parse(stored) : [];
            
            // Check duplicates
            const isDuplicate = mods.some(m => m.url === url);
            if (isDuplicate) {
                this.showToast('Mod này đã được đề xuất trước đó! ❌');
                this.isSubmittingMod = false;
                submitBtn.innerHTML = originalBtnHTML;
                submitBtn.disabled = false;
                return;
            }

            const user = window.authManager.user;
            const newMod = {
                id: Math.random().toString(36).substring(2, 15),
                name,
                url,
                suggestedBy: user.username,
                avatar: user.avatar,
                voters: [user.id]
            };

            mods.push(newMod);
            localStorage.setItem('vote_mods_offline', JSON.stringify(mods));
            this.renderVoteMods(mods);
            this.voteModNameInput.value = '';
            this.voteModUrlInput.value = '';
            this.showToast('Đã gửi đề xuất mod thành công (Offline)! 🎉');
            this.playVoteSound(true);
            
            this.isSubmittingMod = false;
            submitBtn.innerHTML = originalBtnHTML;
            submitBtn.disabled = false;
        }
    }

    async handleModVote(modId) {
        if (this.isVotingMod) return;

        this.isVotingMod = true;
        const currentUserId = window.authManager && window.authManager.user ? window.authManager.user.id : null;
        if (!currentUserId) {
            this.showAuthModal();
            this.isVotingMod = false;
            return;
        }

        // Optimistic UI updates
        const card = document.getElementById(`mod-${modId}`);
        const btn = card ? card.querySelector('.btn-vote') : null;
        const countSpan = btn ? btn.querySelector('.vote-count') : null;
        
        let previousVoters = [];
        let modIndex = -1;
        let modsBackup = [];

        // Save backup and perform optimistic update locally
        if (!window.BACKEND_URL) {
            const stored = localStorage.getItem('vote_mods_offline');
            modsBackup = stored ? JSON.parse(stored) : [];
            modIndex = modsBackup.findIndex(m => m.id === modId);
            if (modIndex !== -1) {
                previousVoters = [...modsBackup[modIndex].voters];
            }
        }

        let isVoteIn = true;
        if (btn) {
            if (btn.classList.contains('has-voted')) {
                btn.classList.remove('has-voted');
                if (countSpan) countSpan.textContent = Math.max(0, parseInt(countSpan.textContent) - 1);
                isVoteIn = false;
            } else {
                btn.classList.add('has-voted');
                if (countSpan) countSpan.textContent = parseInt(countSpan.textContent) + 1;
                isVoteIn = true;
            }
            this.playVoteSound(isVoteIn);
        }

        if (window.BACKEND_URL) {
            const token = localStorage.getItem('discord_token');
            try {
                const res = await fetch(`${window.BACKEND_URL}/api/vote-mod`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ modId })
                });

                if (res.ok) {
                    const updatedMods = await res.json();
                    this.renderVoteMods(updatedMods);
                } else {
                    // Rollback UI
                    this.showToast('Lỗi khi bình chọn! ❌');
                    this.loadModsAndVotes(); // Reload from server
                }
            } catch (err) {
                console.error('Lỗi mạng khi bình chọn mod:', err);
                this.showToast('Lỗi kết nối mạng! ❌');
                this.loadModsAndVotes(); // Reload
            } finally {
                this.isVotingMod = false;
            }
        } else {
            // Local storage simulation
            if (modIndex !== -1) {
                const mod = modsBackup[modIndex];
                const voterIdx = mod.voters.indexOf(currentUserId);
                if (voterIdx === -1) {
                    mod.voters.push(currentUserId);
                } else {
                    mod.voters.splice(voterIdx, 1);
                }
                localStorage.setItem('vote_mods_offline', JSON.stringify(modsBackup));
                this.renderVoteMods(modsBackup);
            }
            this.isVotingMod = false;
        }
    }

    playVoteSound(isVoteIn) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const now = ctx.currentTime;
            osc.type = 'sine';
            
            if (isVoteIn) {
                // Chime tone: two short notes (E.g. C5 then G5)
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(783.99, now + 0.08); // G5
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                
                osc.start(now);
                osc.stop(now + 0.25);
            } else {
                // Short low drop tone for unvoting
                osc.frequency.setValueAtTime(392.00, now); // G4
                osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.12); // C4
                
                gain.gain.setValueAtTime(0.10, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                
                osc.start(now);
                osc.stop(now + 0.12);
            }
        } catch (e) {
            console.warn("Không thể phát âm thanh bình chọn:", e);
        }
    }

    async handleModDeletion(modId) {
        this.showConfirmModal('Bạn có chắc chắn muốn xóa đề xuất mod này khỏi danh sách bình chọn không?', async () => {
            // Visual optimistic removal from DOM
            const card = document.getElementById(`mod-${modId}`);
            if (card) {
                card.style.opacity = '0.3';
                card.style.pointerEvents = 'none';
            }

            if (window.BACKEND_URL) {
                const token = localStorage.getItem('discord_token');
                try {
                    const res = await fetch(`${window.BACKEND_URL}/api/delete-mod`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ modId })
                    });

                    if (res.ok) {
                        const updatedMods = await res.json();
                        this.renderVoteMods(updatedMods);
                        this.showToast('Đã xóa đề xuất mod thành công! 🗑️');
                        this.playDeleteSound();
                    } else {
                        const data = await res.json();
                        this.showToast(data.error || 'Lỗi khi xóa đề xuất! ❌');
                        this.loadModsAndVotes(); // rollback
                    }
                } catch (err) {
                    console.error('Lỗi mạng khi xóa đề xuất mod:', err);
                    this.showToast('Lỗi kết nối mạng! ❌');
                    this.loadModsAndVotes(); // rollback
                }
            } else {
                // Local offline simulation
                const stored = localStorage.getItem('vote_mods_offline');
                let mods = stored ? JSON.parse(stored) : [];
                mods = mods.filter(m => m.id !== modId);
                localStorage.setItem('vote_mods_offline', JSON.stringify(mods));
                this.renderVoteMods(mods);
                this.showToast('Đã xóa đề xuất mod thành công (Offline)! 🗑️');
                this.playDeleteSound();
            }
        });
    }

    showConfirmModal(message, onConfirm) {
        let modal = document.getElementById('confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'confirm-modal';
            modal.className = 'modal-overlay confirm-modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal-card confirm-modal-card" style="max-width: 420px;">
                    <div class="modal-content confirm-modal-content" style="text-align: center; padding: 20px 10px;">
                        <div class="confirm-icon-wrapper" style="font-size: 3rem; color: var(--accent-warm-rose); margin-bottom: 20px; animation: pulseGlowRose 2s infinite alternate; display: inline-block;">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <h3 class="confirm-title" style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">Xác nhận hành động</h3>
                        <p class="confirm-message" id="confirm-modal-msg" style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5; margin-bottom: 28px;"></p>
                        <div class="confirm-actions" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
                            <button id="confirm-cancel-btn" class="view-btn" style="padding: 10px 24px; font-size: 0.9rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);">Hủy</button>
                            <button id="confirm-agree-btn" class="btn-primary-action" style="padding: 10px 24px; font-size: 0.9rem; border-radius: var(--radius-sm); background: var(--accent-warm-rose); border: 1px solid rgba(229, 107, 111, 0.2); color: #ffffff; cursor: pointer; transition: all var(--transition-fast);">Đồng ý</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close actions
            const cancelBtn = modal.querySelector('#confirm-cancel-btn');
            cancelBtn.addEventListener('click', () => this.closeConfirmModal());

            // Click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeConfirmModal();
            });
        }

        // Set dynamic message
        const msgEl = modal.querySelector('#confirm-modal-msg');
        if (msgEl) msgEl.textContent = message;

        // Set action click
        const agreeBtn = modal.querySelector('#confirm-agree-btn');
        const newAgreeBtn = agreeBtn.cloneNode(true);
        agreeBtn.parentNode.replaceChild(newAgreeBtn, agreeBtn);
        newAgreeBtn.addEventListener('click', () => {
            this.closeConfirmModal();
            if (typeof onConfirm === 'function') onConfirm();
        });

        // Show modal with animation
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        if (!modal) return;
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 320);
    }

    playDeleteSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const now = ctx.currentTime;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.2);
            
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {
            console.warn("Không thể phát âm thanh xóa:", e);
        }
    }
}
