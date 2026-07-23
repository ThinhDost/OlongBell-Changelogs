/**
 * GSAP ScrollTrigger 3D Cylinder Carousel Engine for OlongBell Changelogs
 */
class GSAP3DCylinderCarousel {
    constructor(uiController) {
        this.uiController = uiController;
        this.wrapper = document.getElementById('cylinder-viewport-wrapper');
        this.stage = document.getElementById('cylinder-stage');
        this.scrollTriggerInstance = null;
        this.timeline = null;
        this.currentRotationY = 0;
        this.cardsData = [];
        this.cardElements = [];
        this.cardWidth = 320;
        this.cardHeight = 440;
    }

    render(changelogsData) {
        if (!this.stage || !this.wrapper) return;

        // Destroy existing ScrollTrigger instance to prevent memory leaks
        this.destroy();

        this.cardsData = changelogsData;
        this.stage.innerHTML = '';
        this.cardElements = [];

        if (!changelogsData || changelogsData.length === 0) {
            this.wrapper.style.display = 'none';
            return;
        }

        const count = changelogsData.length;
        this.wrapper.style.display = 'flex';

        // Calculate 3D Cylinder Radius based on card count
        const angleStep = 360 / count;
        const radius = count > 1 
            ? Math.max(300, Math.round((this.cardWidth / 2) / Math.tan(Math.PI / count)))
            : 0;

        // Center 3D stage by pushing it back by radius using GSAP
        this.radius = radius;
        if (typeof gsap !== 'undefined') {
            gsap.set(this.stage, { z: -radius, rotationY: 0 });
        } else {
            this.stage.style.transform = `translateZ(-${radius}px) rotateY(0deg)`;
        }

        changelogsData.forEach((log, index) => {
            const cardEl = this.create3DCardElement(log, index);
            const angleDeg = index * angleStep;
            
            // Set 3D transform position in cylinder circumference
            cardEl.style.transform = `rotateY(${angleDeg}deg) translateZ(${radius}px)`;
            cardEl.dataset.angle = angleDeg;
            cardEl.dataset.index = index;

            this.stage.appendChild(cardEl);
            this.cardElements.push(cardEl);
        });

        // Immediately highlight initial front card
        this.updateActiveFrontCard(0, angleStep);

        // Initialize GSAP ScrollTrigger timeline if GSAP is loaded
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            this.initGSAPScrollTrigger(angleStep, count);
        }

        // Add interactive drag to rotate support
        this.setupDragToRotate(angleStep);
    }

    setupDragToRotate(angleStep) {
        let isDragging = false;
        let startX = 0;
        let startRotY = 0;

        const onPointerDown = (e) => {
            isDragging = true;
            startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            startRotY = this.currentRotationY;
            this.stage.style.cursor = 'grabbing';
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            const deltaX = currentX - startX;
            this.currentRotationY = startRotY + (deltaX * 0.5);
            if (typeof gsap !== 'undefined') {
                gsap.set(this.stage, { rotationY: this.currentRotationY });
            } else {
                this.stage.style.transform = `translateZ(-${this.radius || 300}px) rotateY(${this.currentRotationY}deg)`;
            }
            this.updateActiveFrontCard(this.currentRotationY, angleStep);
        };

        const onPointerUp = () => {
            if (!isDragging) return;
            isDragging = false;
            this.stage.style.cursor = 'grab';
        };

        this.stage.style.cursor = 'grab';
        this.stage.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        this.stage.addEventListener('touchstart', onPointerDown, { passive: true });
        window.addEventListener('touchmove', onPointerMove, { passive: true });
        window.addEventListener('touchend', onPointerUp);
    }

    create3DCardElement(log, index) {
        const card = document.createElement('article');
        card.className = 'card-3d-item';
        card.id = `3d-card-${log.id}`;
        card.setAttribute('title', 'Double-click to open full changelog details');

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

        card.innerHTML = `
            <div class="card-3d-inner">
                <div class="card-3d-header">
                    <span class="version-tag">${log.version}</span>
                    <h3 class="card-3d-title">${log.title}</h3>
                    <div class="card-3d-meta">
                        <span><i class="fa-regular fa-calendar-days"></i> ${log.date}</span>
                    </div>
                </div>

                <div class="category-badges">
                    ${badgesHTML}
                </div>

                <div class="card-3d-summary">
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

                <div class="card-3d-footer">
                    <button class="btn-detail btn-3d-detail" data-id="${log.id}">
                        <i class="fa-solid fa-up-right-from-square"></i> Read Full
                    </button>
                    <button class="btn-share btn-3d-share" data-version="${log.version}">
                        <i class="fa-solid fa-share-nodes"></i> Share
                    </button>
                </div>
            </div>
        `;

        // Attach event listeners
        card.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.btn-share') && !e.target.closest('.react-btn')) {
                this.uiController.openModal(log);
            }
        });

        const detailBtn = card.querySelector('.btn-3d-detail');
        if (detailBtn) {
            detailBtn.addEventListener('click', () => this.uiController.openModal(log));
        }

        const shareBtn = card.querySelector('.btn-3d-share');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(window.location.href).catch(() => {});
            });
        }

        // Single click on reaction buttons
        card.querySelectorAll('.react-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!window.authManager || !window.authManager.isLoggedIn()) {
                    alert("Vui lòng đăng nhập bằng tài khoản Discord ở thanh menu trên cùng để thả cảm xúc!");
                    return;
                }
                this.uiController.handleReaction(log.id, btn.dataset.type);
            });
        });

        return card;
    }

    initGSAPScrollTrigger(angleStep, count) {
        const totalRotation = count > 1 ? 360 : 0;

        // Ensure wrapper is visible before GSAP calculations
        this.wrapper.style.display = 'flex';

        this.timeline = gsap.timeline({
            scrollTrigger: {
                trigger: this.wrapper,
                start: 'top bottom-=100',
                end: 'bottom top+=100',
                scrub: 0.8,
                onUpdate: (self) => {
                    const rotY = -self.progress * totalRotation;
                    this.currentRotationY = rotY;
                    this.updateActiveFrontCard(rotY, angleStep);
                }
            }
        });

        this.timeline.to(this.stage, {
            rotationY: `-=${totalRotation}`,
            ease: 'none'
        });

        // Set initial active card
        this.updateActiveFrontCard(0, angleStep);
    }

    updateActiveFrontCard(currentRotY, angleStep) {
        if (!this.cardElements || this.cardElements.length === 0) return;

        // Normalize current stage rotation to positive 0..360 range
        let normalizedStageRot = (-currentRotY) % 360;
        if (normalizedStageRot < 0) normalizedStageRot += 360;

        let closestIndex = 0;
        let minDiff = 360;

        this.cardElements.forEach((card, index) => {
            const cardAngle = parseFloat(card.dataset.angle);
            let diff = Math.abs(normalizedStageRot - cardAngle);
            if (diff > 180) diff = 360 - diff;

            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = index;
            }

            // Adjust opacity and scale based on distance to front face
            const opacity = Math.max(0.45, 1 - (diff / 160));
            card.style.opacity = opacity.toFixed(2);
        });

        // Highlight front-most card
        this.cardElements.forEach((card, index) => {
            if (index === closestIndex) {
                card.classList.add('is-active-front');
            } else {
                card.classList.remove('is-active-front');
            }
        });
    }

    destroy() {
        if (this.timeline) {
            if (this.timeline.scrollTrigger) {
                this.timeline.scrollTrigger.kill();
            }
            this.timeline.kill();
            this.timeline = null;
        }
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    }
}
