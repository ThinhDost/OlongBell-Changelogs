class AmbientCursorEffect {
    constructor() {
        this.canvas = document.getElementById('ambient-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.cursorDot = document.getElementById('cursor-dot');
        
        // Mouse Coordinates & Lerp Physics
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.lerpAmount = 0.08; // Physics smoothness factor

        // Particles Setting (Constellation)
        this.particles = [];
        this.connectionDistance = 120; // Khoảng cách nối dây giữa các vì sao
        this.mouseConnectionDistance = 180; // Khoảng cách nối dây tới con trỏ chuột
        
        // Cache for card spotlight performance
        this.activeCard = null;
        this.activeCardRect = null;
        
        this.init();
    }

    init() {
        if (!this.canvas || !this.ctx) return;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Mouse global coordinates updates
        window.addEventListener('mousemove', (e) => {
            this.target.x = e.clientX;
            this.target.y = e.clientY;
        });

        // Event delegation for caching card bounds
        document.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.changelog-card');
            if (card) {
                if (this.activeCard !== card) {
                    this.activeCard = card;
                    this.activeCardRect = card.getBoundingClientRect();
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.activeCard && this.activeCardRect) {
                const x = e.clientX - this.activeCardRect.left;
                const y = e.clientY - this.activeCardRect.top;
                this.activeCard.style.setProperty('--mouse-x', `${x}px`);
                this.activeCard.style.setProperty('--mouse-y', `${y}px`);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.changelog-card');
            if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
                this.activeCard = null;
                this.activeCardRect = null;
            }
        });

        // Touch support for mobile devices
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.target.x = e.touches[0].clientX;
                this.target.y = e.touches[0].clientY;
            }
        }, { passive: true });

        // Start 60fps Animation Loop
        this.render();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        // Điều chỉnh mật độ hạt dựa trên diện tích màn hình
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 14000); 

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.7, // Vận tốc di chuyển ngang
                vy: (Math.random() - 0.5) * 0.7, // Vận tốc di chuyển dọc
                radius: Math.random() * 1.5 + 0.5,
                // Trộn màu hạt: Đôi khi Cyan, đôi khi Gold
                colorType: Math.random() > 0.5 ? 'cyan' : 'gold'
            });
        }
    }

    render() {
        // Linear Interpolation (LERP) for liquid smooth cursor movement
        this.mouse.x += (this.target.x - this.mouse.x) * this.lerpAmount;
        this.mouse.y += (this.target.y - this.mouse.y) * this.lerpAmount;

        if (this.cursorDot) {
            // Use LERP coordinates for physics-based smoothed following
            this.cursorDot.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0)`;
        }

        // Clear Canvas for next frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const isDark = document.documentElement.classList.contains('dark');
        const colorCyan = isDark ? '142, 212, 232' : '107, 205, 232';
        const colorGold = isDark ? '214, 172, 104' : '201, 154, 76';
        const baseLineColor = isDark ? '255, 255, 255' : '140, 132, 117';

        const mouseLimitSq = this.mouseConnectionDistance * this.mouseConnectionDistance;
        const connectionLimitSq = this.connectionDistance * this.connectionDistance;

        // Update & Draw Particles
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            // Di chuyển hạt
            p.x += p.vx;
            p.y += p.vy;

            // Dội lại (Bounce) khi chạm mép màn hình
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Tương tác vật lý kéo dạt khi trỏ chuột đến quá gần (Lực đẩy nhẹ)
            let dxMouse = this.mouse.x - p.x;
            let dyMouse = this.mouse.y - p.y;
            let distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
            
            if (distMouseSq < 6400) { // 80 * 80
                p.x -= dxMouse * 0.02;
                p.y -= dyMouse * 0.02;
            }

            // Vẽ hạt
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${p.colorType === 'cyan' ? colorCyan : colorGold}, 0.8)`;
            this.ctx.fill();

            // Nối dây tới trỏ chuột
            if (distMouseSq < mouseLimitSq) {
                let distMouse = Math.sqrt(distMouseSq);
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(this.mouse.x, this.mouse.y);
                const alpha = 1 - (distMouse / this.mouseConnectionDistance);
                this.ctx.strokeStyle = `rgba(${colorCyan}, ${alpha * 0.5})`; // Dây tới chuột có màu sáng xanh
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }

            // Nối dây giữa các hạt với nhau (Bình phương kiểm tra trước để tránh Math.sqrt không cần thiết)
            for (let j = i + 1; j < this.particles.length; j++) {
                let p2 = this.particles[j];
                let dx = p.x - p2.x;
                let dy = p.y - p2.y;
                let distSq = dx * dx + dy * dy;

                if (distSq < connectionLimitSq) {
                    let dist = Math.sqrt(distSq);
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    const alpha = 1 - (dist / this.connectionDistance);
                    this.ctx.strokeStyle = `rgba(${baseLineColor}, ${alpha * 0.25})`;
                    this.ctx.lineWidth = 0.6;
                    this.ctx.stroke();
                }
            }
        }

        requestAnimationFrame(() => this.render());
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.ambientCursor = new AmbientCursorEffect();
});
