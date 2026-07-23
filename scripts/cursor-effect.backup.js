class AmbientCursorEffect {
    constructor() {
        this.canvas = document.getElementById('ambient-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.cursorGlow = document.getElementById('cursor-glow');
        this.cursorDot = document.getElementById('cursor-dot');
        
        // Mouse Coordinates & Lerp Physics
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.lerpAmount = 0.12; // Physics smoothness factor

        // Canvas Grid Settings
        this.gridGap = 32;
        this.dots = [];
        
        this.init();
    }

    init() {
        if (!this.canvas || !this.ctx) return;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Mouse Listeners
        window.addEventListener('mousemove', (e) => {
            this.target.x = e.clientX;
            this.target.y = e.clientY;
            
            // Update Card Spotlight Position for hovered elements
            this.updateCardSpotlight(e);
        });

        // Touch support for mobile devices
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.target.x = e.touches[0].clientX;
                this.target.y = e.touches[0].clientY;
            }
        });

        // Start 60fps Animation Loop
        this.render();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initGridDots();
    }

    initGridDots() {
        this.dots = [];
        const cols = Math.ceil(this.canvas.width / this.gridGap) + 1;
        const rows = Math.ceil(this.canvas.height / this.gridGap) + 1;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                this.dots.push({
                    x: i * this.gridGap,
                    y: j * this.gridGap,
                    baseRadius: 1.2,
                    currentRadius: 1.2,
                    alpha: 0.18
                });
            }
        }
    }

    updateCardSpotlight(e) {
        const cards = document.querySelectorAll('.changelog-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    }

    render() {
        // Linear Interpolation (LERP) for liquid smooth cursor movement
        this.mouse.x += (this.target.x - this.mouse.x) * this.lerpAmount;
        this.mouse.y += (this.target.y - this.mouse.y) * this.lerpAmount;

        // Position DOM Cursor Glow Element
        if (this.cursorGlow) {
            this.cursorGlow.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0)`;
        }
        if (this.cursorDot) {
            this.cursorDot.style.transform = `translate3d(${this.target.x}px, ${this.target.y}px, 0)`;
        }

        // Draw Interactive Dot Matrix Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const isDark = document.documentElement.classList.contains('dark');
        const dotBaseColor = isDark ? '255, 255, 255' : '148, 163, 184';
        const glowColor = isDark ? '129, 140, 248' : '99, 102, 241';

        const radiusThreshold = 180;

        for (let i = 0; i < this.dots.length; i++) {
            const dot = this.dots[i];
            const dx = this.mouse.x - dot.x;
            const dy = this.mouse.y - dot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radiusThreshold) {
                const factor = 1 - dist / radiusThreshold;
                dot.currentRadius = dot.baseRadius + factor * 2.5;
                dot.alpha = 0.15 + factor * 0.65;

                // Draw glowing active dot
                this.ctx.beginPath();
                this.ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${glowColor}, ${dot.alpha})`;
                this.ctx.fill();
            } else {
                dot.currentRadius = dot.baseRadius;
                dot.alpha = isDark ? 0.12 : 0.2;

                // Draw standard grid dot
                this.ctx.beginPath();
                this.ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${dotBaseColor}, ${dot.alpha})`;
                this.ctx.fill();
            }
        }

        requestAnimationFrame(() => this.render());
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.ambientCursor = new AmbientCursorEffect();
});
