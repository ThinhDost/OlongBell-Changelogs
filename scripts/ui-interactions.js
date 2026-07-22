class UIInteractions {
    constructor() {
        this.changelogsList = document.getElementById('changelogs-list');
        this.emptyState = document.getElementById('empty-state');
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search-btn');
        this.categoryFilters = document.getElementById('category-filters');
        this.modal = document.getElementById('update-modal');
        this.modalContent = document.getElementById('modal-content');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.copyIpBtn = document.getElementById('copy-ip-btn');

        this.currentCategory = 'all';
        this.searchQuery = '';
        this.observer = null;

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
        this.setupEventListeners();
        this.initWaterInertiaEngine();
        this.startOnlinePlayerSimulator();
    }

    setupIntersectionObserver() {
        // Scroll Reveal Observer for Cards and Sections
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });
    }

    observeElements() {
        if (!this.observer) return;
        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        revealElements.forEach(el => this.observer.observe(el));
    }

    initWaterInertiaEngine() {
        this.initWordPhysicsData();

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY || window.pageYOffset;
            const scrollDelta = currentScrollY - this.lastScrollY;
            this.lastScrollY = currentScrollY;

            const forceMultiplier = 1.2;
            this.inertiaTargetY -= scrollDelta * forceMultiplier;
            this.inertiaTargetY = Math.max(-35, Math.min(35, this.inertiaTargetY));
        });

        const animatePhysics = () => {
            this.inertiaY += (this.inertiaTargetY - this.inertiaY) * 0.18;
            this.inertiaTargetY *= 0.85;

            const time = Date.now() * 0.002;
            const words = document.querySelectorAll('.float-word');

            words.forEach((word, idx) => {
                const physics = this.wordPhysicsData[idx] || {
                    baseY: 0,
                    baseX: 0,
                    rot: 0,
                    mass: 1
                };

                const floatWaveY = Math.sin(time * 1.5 + idx * 0.7) * 3;
                const floatWaveX = Math.cos(time * 1.2 + idx * 0.5) * 2;
                
                const currentY = physics.baseY + floatWaveY + (this.inertiaY / physics.mass);
                const currentX = physics.baseX + floatWaveX + Math.sin(time + idx) * 2;
                const currentRot = physics.rot + (this.inertiaY * 0.05 * (idx % 2 === 0 ? 1 : -1));

                word.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${currentRot}deg)`;
            });

            requestAnimationFrame(animatePhysics);
        };

        requestAnimationFrame(animatePhysics);
    }

    initWordPhysicsData() {
        const words = document.querySelectorAll('.float-word');
        this.wordPhysicsData = [];

        words.forEach((_, idx) => {
            const randomY = (Math.random() - 0.5) * 8;
            const randomX = (Math.random() - 0.5) * 6;
            const randomRot = (Math.random() - 0.5) * 4;
            const mass = 0.85 + Math.random() * 0.4;

            this.wordPhysicsData.push({
                baseY: randomY,
                baseX: randomX,
                rot: randomRot,
                mass: mass
            });
        });
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
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
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

        if (filtered.length === 0) {
            this.changelogsList.innerHTML = '';
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.emptyState.classList.add('hidden');

        let htmlBuffer = '';

        filtered.forEach((log, index) => {
            // Render Compact Preview Card
            htmlBuffer += this.createCompactCardHTML(log);

            // Render Section Divider harmoniously
            if (index > 0 && index % 2 === 1 && index < filtered.length - 1) {
                htmlBuffer += this.createSectionDividerHTML(Math.floor(index / 2));
            }
        });

        this.changelogsList.innerHTML = htmlBuffer;

        this.initWordPhysicsData();
        this.observeElements();

        // Attach Double-Click & Button Detail Event Listeners to Cards
        this.changelogsList.querySelectorAll('.changelog-card').forEach(card => {
            const logId = card.id;
            const log = CHANGELOGS_DATA.find(item => item.id === logId);

            // Double Click anywhere on card to open full details smoothly
            card.addEventListener('dblclick', (e) => {
                // Prevent opening if double-clicked directly on share button
                if (!e.target.closest('.btn-share') && log) {
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
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                });
            }
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

    openModal(log) {
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
    }

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        
        // Wait for smooth fade-out animation to finish before adding hidden
        setTimeout(() => {
            this.modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 320);
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
}
