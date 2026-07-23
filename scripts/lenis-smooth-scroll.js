class SmoothScrollAndMarquee {
    constructor() {
        // Khóa tính năng khôi phục cuộn của trình duyệt
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        this.marqueeTween = null;
        this.marqueeInner = document.querySelector('.scroll-marquee-inner');

        if (this.marqueeInner && typeof gsap !== 'undefined') {
            this.initMarquee();
        }

        // Lắng nghe sự kiện load để đưa trang về đầu sau khi dựng hình xong
        window.addEventListener('load', () => {
            window.scrollTo(0, 0);
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        });
    }

    initMarquee() {
        // Tạo hiệu ứng loop chạy chữ vô tận
        this.marqueeTween = gsap.to(this.marqueeInner, {
            xPercent: -50,
            repeat: -1,
            duration: 20,
            ease: "none"
        });

        this.currentSpeed = 1;
        this.targetSpeed = 1;

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                onUpdate: (self) => {
                    const velocity = self.getVelocity(); // Tốc độ cuộn chuột
                    const direction = self.direction; // 1 (cuộn xuống), -1 (cuộn lên)
                    
                    // Gia tăng tốc độ chạy chữ tương ứng với tốc độ cuộn chuột
                    this.targetSpeed = (1 + Math.abs(velocity / 180)) * direction;
                }
            });

            // Lerp đưa tốc độ trở về bình thường (1 hoặc -1) khi người dùng dừng cuộn
            gsap.ticker.add(() => {
                const baseDir = this.targetSpeed >= 0 ? 1 : -1;
                this.targetSpeed += (baseDir - this.targetSpeed) * 0.05;

                this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 0.08;
                if (this.marqueeTween) {
                    this.marqueeTween.timeScale(this.currentSpeed);
                }
            });
        }
    }
}
