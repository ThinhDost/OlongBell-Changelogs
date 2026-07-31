class HeroInteractions {
    constructor() {
        this.ctaBtn = document.querySelector('.btn-primary-action');
        
        if (typeof gsap !== 'undefined') {
            this.initIntroScreen();
            this.initMagneticButton();
        }
    }

    initIntroScreen() {
        const introScreen = document.getElementById('intro-screen');
        const progressFill = document.querySelector('.intro-progress-fill');
        
        // Đảm bảo cuộn về đầu trang ngay từ khi bắt đầu chạy Intro
        window.scrollTo(0, 0);
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        if (!introScreen) {
            this.playEntranceAnimations();
            return;
        }

        // Setup ban đầu cho các thành phần trang chính (ẩn đi trước để chờ Intro)
        this.setupEntranceElements();

        // Chạy thanh tiến trình loading
        gsap.to(progressFill, {
            width: '100%',
            duration: 1.8, // Thời gian mô phỏng Fubuki ngủ
            ease: 'power2.inOut',
            onComplete: () => {
                // Hoàn thành loading -> Mờ dần Intro
                gsap.to(introScreen, {
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    onComplete: () => {
                        introScreen.style.display = 'none';
                        
                        if (typeof ScrollTrigger !== 'undefined') {
                            ScrollTrigger.refresh();
                        }

                        // Kiểm tra nếu URL có chứa hash (ví dụ #vote-section)
                        const hash = window.location.hash;
                        if (hash) {
                            try {
                                const target = document.querySelector(hash);
                                if (target) {
                                    // Tự động cuộn mượt mà đến section
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
                        // Phát giọng nói chào mừng & hiện phụ đề anime
                        this.showJapaneseSubtitle();
                    }
                });
            }
        });
    }

    setupEntranceElements() {
        const elements = [
            '.hero-live-badge',
            '.title-brand',
            '.title-sub-text',
            '.hero-tagline',
            '.hero-btn-group'
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
            '.hero-btn-group'
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

    showJapaneseSubtitle() {
        // Tạo element subtitle
        const sub = document.createElement('div');
        sub.className = 'japanese-subtitle';
        sub.innerText = '私たちの土地へようこそ！';
        document.body.appendChild(sub);

        // Chạy âm thanh Intro-Voice
        const introVoice = new Audio('assets/music/Intro-Voice.mp3');
        introVoice.volume = 0.8;
        introVoice.play().catch(err => {
            console.log("Audio play blocked by browser policy. Will play on first user interaction.", err);
        });

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
        
        this.ctaBtn.addEventListener('mousemove', (e) => {
            const rect = this.ctaBtn.getBoundingClientRect();
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
