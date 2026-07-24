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

        // Initialize 3D Cylinder Carousel Engine
        this.cylinder3D = new GSAP3DCylinderCarousel(this);

        // Water Bucket Inertia Physics Simulation State
        this.lastScrollY = window.scrollY;
        this.inertiaY = 0;
        this.inertiaTargetY = 0;
        this.wordPhysicsData = [];

        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.renderChangelogs();
        this.renderSneakPeeks();
        this.initAuth();
        this.setupEventListeners();
        this.startOnlinePlayerSimulator();
        this.checkInitialDeepLink();
    }

    initAuth() {
        window.authManager = new DiscordAuthManager();
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
            this.themeToggleBtn.addEventListener('click', () => {
                const html = document.documentElement;
                const isDark = html.classList.toggle('dark');
                this.themeToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
            });
        }

        // Copy IP Listener (Silent Clipboard Copy)
        if (this.copyIpBtn) {
            this.copyIpBtn.addEventListener('click', () => {
                const ipText = 'onglongbel.raumasmp.online';
                navigator.clipboard.writeText(ipText).catch(() => {});
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

    handleReaction(logId, type) {
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
        this.renderChangelogs();
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
}
