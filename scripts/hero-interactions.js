class HeroInteractions {
    constructor() {
        this.ctaBtn = document.querySelector('.btn-primary-action');
        this.introScreen = document.getElementById('intro-screen');
        this.progressFill = document.querySelector('.intro-progress-fill');

        // Khởi tạo và nạp trước âm thanh Intro-Voice
        this.introVoice = new Audio('assets/music/Intro-Voice.mp3');
        this.introVoice.preload = 'auto';
        this.introVoice.volume = 0.85;

        // Trạng thái âm thanh & tiến trình
        this.isIntroVoicePlaying = false;
        this.introVoicePlayed = false;
        this.isIntroDismissed = false;
        window.isIntroVoicePlaying = false;
        window.heroInteractions = this;

        if (typeof gsap !== 'undefined') {
            this.initIntroScreen();
            this.initMagneticButton();
        }
    }

    initIntroScreen() {
        // Đảm bảo cuộn về đầu trang ngay từ khi bắt đầu chạy Intro
        window.scrollTo(0, 0);
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        if (!this.introScreen) {
            this.playEntranceAnimations();
            this.triggerVoiceAndSubtitle();
            return;
        }

        // Setup ban đầu cho các thành phần trang chính (ẩn đi trước để chờ Intro)
        this.setupEntranceElements();

        // 1. Cho phép người dùng nhấp hoặc chạm vào bất kỳ đâu trên màn hình Intro để vào trang ngay lập tức
        const onIntroClick = () => {
            if (this.isIntroDismissed) return;
            this.dismissIntroScreen(true);
        };
        this.introScreen.addEventListener('click', onIntroClick, { once: true });
        this.introScreen.addEventListener('touchend', onIntroClick, { once: true });

        // 2. Chạy thanh tiến trình loading tự động
        this.loadingTween = gsap.to(this.progressFill, {
            width: '100%',
            duration: 1.8, // Thời gian mô phỏng Fubuki ngủ
            ease: 'power2.inOut',
            onComplete: () => {
                if (!this.isIntroDismissed) {
                    this.dismissIntroScreen(false);
                }
            }
        });
    }

    dismissIntroScreen(fromUserClick = false) {
        if (this.isIntroDismissed) return;
        this.isIntroDismissed = true;

        if (this.loadingTween) {
            this.loadingTween.kill();
        }
        if (this.progressFill) {
            gsap.set(this.progressFill, { width: '100%' });
        }

        // Nếu người dùng chủ động nhấp chuột, kích hoạt giọng nói ngay trong luồng tương tác này (đảm bảo 100% không bị chặn)
        if (fromUserClick) {
            this.triggerVoiceAndSubtitle(true);
        }

        // Mờ dần Intro
        gsap.to(this.introScreen, {
            opacity: 0,
            duration: fromUserClick ? 0.5 : 0.8,
            ease: 'power2.out',
            onComplete: () => {
                this.introScreen.style.display = 'none';
                
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }

                // Kiểm tra nếu URL có chứa hash (ví dụ #vote-section)
                const hash = window.location.hash;
                if (hash) {
                    try {
                        const target = document.querySelector(hash);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                        } else {
                            window.scrollTo(0, 0);
                        }
                    } catch (e) {
                        window.scrollTo(0, 0);
                    }
                } else {
                    window.scrollTo(0, 0);
                }

                // Intro biến mất -> Đánh thức trang chính
                this.playEntranceAnimations();

                // Nếu là chuyển cảnh tự động (không click) và âm thanh chưa phát, thử phát âm thanh hoặc chuẩn bị fallback
                if (!fromUserClick && !this.introVoicePlayed) {
                    this.triggerVoiceAndSubtitle(false);
                }
            }
        });
    }

    setupEntranceElements() {
        const elements = [
            '.hero-live-badge',
            '.title-brand',
            '.title-sub-text',
            '.hero-tagline',
            '.hero-btn-group',
            '.hero-mc-radar'
        ];

        // Ẩn ban đầu để chống giật chớp (FOUC)
        gsap.set(elements, { opacity: 0, y: 35 });
        gsap.set('.hero-fubuki-character', { opacity: 0, scale: 0.95 });
    }

    playEntranceAnimations() {
        const elements = [
            '.hero-live-badge',
            '.title-brand',
            '.title-sub-text',
            '.hero-tagline',
            '.hero-btn-group',
            '.hero-mc-radar'
        ];

        // Animation xuất hiện mượt mà (Stagger)
        gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out"
        });

        // Nhân vật Fubuki mờ dần và to lên nhẹ nhàng
        gsap.to('.hero-fubuki-character', {
            opacity: 1,
            scale: 1,
            duration: 1.5,
            ease: "power2.out",
            delay: 0.3
        });
    }

    triggerVoiceAndSubtitle(isUserGesture = false) {
        if (this.introVoicePlayed) return;

        const playPromise = this.introVoice.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Phát thành công!
                this.introVoicePlayed = true;
                this.isIntroVoicePlaying = true;
                window.isIntroVoicePlaying = true;

                // Hiển thị phụ đề đồng bộ với giọng nói
                this.renderSubtitleAnimation();

                // Khi âm thanh kết thúc -> Báo hiệu cho Music Player
                this.introVoice.addEventListener('ended', () => {
                    this.isIntroVoicePlaying = false;
                    window.isIntroVoicePlaying = false;
                    window.dispatchEvent(new CustomEvent('introVoiceEnded'));
                }, { once: true });

            }).catch(err => {
                console.log("ℹ️ Trình duyệt chặn autoplay khi chưa có tương tác. Giọng nói sẽ phát ngay khi người dùng chạm vào trang.");
                this.isIntroVoicePlaying = false;
                window.isIntroVoicePlaying = false;

                // Không hiển thị phụ đề trong im lặng!
                // Gắn listener 1 lần cho lần tương tác đầu tiên trên toàn trang:
                const onFirstInteraction = () => {
                    window.removeEventListener('pointerdown', onFirstInteraction);
                    window.removeEventListener('keydown', onFirstInteraction);
                    window.removeEventListener('click', onFirstInteraction);
                    window.removeEventListener('touchstart', onFirstInteraction);

                    if (!this.introVoicePlayed) {
                        this.triggerVoiceAndSubtitle(true);
                    }
                };

                window.addEventListener('pointerdown', onFirstInteraction, { once: true });
                window.addEventListener('keydown', onFirstInteraction, { once: true });
                window.addEventListener('click', onFirstInteraction, { once: true });
                window.addEventListener('touchstart', onFirstInteraction, { once: true });
            });
        }
    }

    renderSubtitleAnimation() {
        // Xóa subtitle cũ nếu có
        const existingSub = document.querySelector('.japanese-subtitle');
        if (existingSub) existingSub.remove();

        // Tạo element subtitle
        const sub = document.createElement('div');
        sub.className = 'japanese-subtitle';
        sub.innerText = '私たちの土地へようこそ！';
        document.body.appendChild(sub);

        // Thiết lập vị trí ban đầu lệch xuống dưới và ẩn đi
        gsap.set(sub, { y: 40, opacity: 0 });

        // Tạo chuỗi hoạt ảnh trượt lên và mờ dần biến mất
        gsap.timeline()
            .to(sub, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out'
            })
            .to(sub, {
                opacity: 0,
                y: -30,
                duration: 0.8,
                delay: 2.2, // hiển thị trong 2.2 giây
                ease: 'power2.in',
                onComplete: () => {
                    sub.remove();
                }
            });
    }

    initMagneticButton() {
        if (!this.ctaBtn) return;
        
        let rect = null;

        this.ctaBtn.addEventListener('mouseenter', () => {
            rect = this.ctaBtn.getBoundingClientRect();
        });
        
        this.ctaBtn.addEventListener('mousemove', (e) => {
            if (!rect) rect = this.ctaBtn.getBoundingClientRect();
            // Tính toán vị trí chuột so với tâm của nút
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Tắt transition CSS để GSAP không bị xung đột
            this.ctaBtn.style.transition = 'none';
            
            gsap.to(this.ctaBtn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        this.ctaBtn.addEventListener('mouseleave', () => {
            rect = null;
            // Phục hồi lại Transition CSS
            this.ctaBtn.style.transition = 'all var(--transition-normal)';
            
            gsap.to(this.ctaBtn, {
                x: 0,
                y: 0,
                duration: 0.6,
                ease: "elastic.out(1.2, 0.4)"
            });
        });
    }
}
