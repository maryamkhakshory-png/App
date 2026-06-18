class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // تنظیم اندازه canvas
        this.gridSize = 20;
        this.tileCount = 20;
        this.canvas.width = this.canvas.height = this.gridSize * this.tileCount;
        
        // متغیرهای بازی
        this.snake = [];
        this.food = {};
        this.specialFood = null;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameSpeed = 100;
        this.gameLoop = null;
        this.isRunning = false;
        this.specialFoodTimer = null;
        
        // ذرات
        this.particles = [];
        
        // المان‌های DOM
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.speedElement = document.getElementById('speed');
        this.gameOverScreen = document.getElementById('gameOver');
        this.startScreen = document.getElementById('startScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        
        // تنظیمات اولیه
        this.highScoreElement.textContent = this.highScore;
        
        // event listeners
        this.setupEventListeners();
        this.drawInitialScreen();
    }
    
    setupEventListeners() {
        // کنترل‌های لمسی
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.changeDirection(direction);
            });
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.changeDirection(direction);
            });
        });
        
        // کنترل کیبورد
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            const keyActions = {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'ArrowRight': 'right',
                'w': 'up',
                's': 'down',
                'a': 'left',
                'd': 'right'
            };
            
            const direction = keyActions[e.key];
            if (direction) {
                e.preventDefault();
                this.changeDirection(direction);
            }
        });
        
        // سوایپ برای موبایل
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isRunning) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.changeDirection(dx > 0 ? 'right' : 'left');
            } else {
                this.changeDirection(dy > 0 ? 'down' : 'up');
            }
        });
        
        // دکمه‌های بازی
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        
        // تنظیم سختی
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gameSpeed = parseInt(btn.dataset.speed);
                this.speedElement.textContent = this.gameSpeed === 100 ? '1' : this.gameSpeed === 70 ? '2' : '3';
                
                if (this.isRunning) {
                    clearInterval(this.gameLoop);
                    this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
                }
            });
        });
    }
    
    changeDirection(newDirection) {
        const directionMap = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };
        
        const newDir = directionMap[newDirection];
        
        // جلوگیری از حرکت معکوس
        if (this.direction.x !== 0 && newDir.x === -this.direction.x) return;
        if (this.direction.y !== 0 && newDir.y === -this.direction.y) return;
        if (newDir.x === 0 && newDir.y === 0) return;
        
        this.nextDirection = newDir;
    }
    
    startGame() {
        // تنظیم مجدد بازی
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.particles = [];
        
        this.scoreElement.textContent = '0';
        this.gameOverScreen.classList.add('hidden');
        this.startScreen.classList.add('hidden');
        
        this.generateFood();
        
        if (this.specialFoodTimer) clearTimeout(this.specialFoodTimer);
        this.scheduleSpecialFood();
        
        this.isRunning = true;
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
    }
    
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                type: 'normal'
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }
    
    scheduleSpecialFood() {
        this.specialFoodTimer = setTimeout(() => {
            if (this.isRunning) {
                do {
                    this.specialFood = {
                        x: Math.floor(Math.random() * this.tileCount),
                        y: Math.floor(Math.random() * this.tileCount),
                        type: 'special'
                    };
                } while (
                    this.snake.some(segment => segment.x === this.specialFood.x && segment.y === this.specialFood.y) ||
                    (this.food.x === this.specialFood.x && this.food.y === this.specialFood.y)
                );
            }
        }, 5000);
    }
    
    createParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x * this.gridSize + this.gridSize / 2,
                y: y * this.gridSize + this.gridSize / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }
    }
    
    update() {
        // اعمال جهت جدید
        this.direction = this.nextDirection;
        
        // محاسبه موقعیت جدید سر
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // بررسی برخورد با دیوار
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // بررسی برخورد با خود
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        // اضافه کردن سر جدید
        this.snake.unshift(head);
        
        // بررسی خوردن غذا
        let ate = false;
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.createParticles(this.food.x, this.food.y);
            this.generateFood();
            ate = true;
        } else if (this.specialFood && head.x === this.specialFood.x && head.y === this.specialFood.y) {
            this.score += 25;
            this.createParticles(this.specialFood.x, this.specialFood.y);
            this.specialFood = null;
            this.scheduleSpecialFood();
            ate = true;
        }
        
        if (!ate) {
            this.snake.pop();
        }
        
        // به‌روزرسانی امتیاز
        this.scoreElement.textContent = this.score;
        
        // به‌روزرسانی ذرات
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            return p.life > 0;
        });
        
        this.draw();
    }
    
    draw() {
        // پاک کردن canvas
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم خطوط شبکه
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // رسم مار
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // گرادیان برای مار
            const gradient = this.ctx.createLinearGradient(x, y, x + this.gridSize, y + this.gridSize);
            
            if (index === 0) {
                gradient.addColorStop(0, '#48bb78');
                gradient.addColorStop(1, '#38a169');
            } else {
                const alpha = 1 - (index / this.snake.length) * 0.5;
                gradient.addColorStop(0, `rgba(72, 187, 120, ${alpha})`);
                gradient.addColorStop(1, `rgba(56, 161, 105, ${alpha})`);
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.shadowBlur = index === 0 ? 10 : 0;
            this.ctx.shadowColor = '#48bb78';
            this.roundRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, 5);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // چشم‌های سر مار
            if (index === 0) {
                this.ctx.fillStyle = 'white';
                const eyeSize = 3;
                let eyeX1, eyeY1, eyeX2, eyeY2;
                
                if (this.direction.x === 1) {
                    eyeX1 = x + this.gridSize - 6;
                    eyeY1 = y + 5;
                    eyeX2 = x + this.gridSize - 6;
                    eyeY2 = y + this.gridSize - 5;
                } else if (this.direction.x === -1) {
                    eyeX1 = x + 6;
                    eyeY1 = y + 5;
                    eyeX2 = x + 6;
                    eyeY2 = y + this.gridSize - 5;
                } else if (this.direction.y === 1) {
                    eyeX1 = x + 5;
                    eyeY1 = y + this.gridSize - 6;
                    eyeX2 = x + this.gridSize - 5;
                    eyeY2 = y + this.gridSize - 6;
                } else {
                    eyeX1 = x + 5;
                    eyeY1 = y + 6;
                    eyeX2 = x + this.gridSize - 5;
                    eyeY2 = y + 6;
                }
                
                this.ctx.beginPath();
                this.ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
                this.ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(eyeX1, eyeY1, 1.5, 0, Math.PI * 2);
                this.ctx.arc(eyeX2, eyeY2, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // رسم غذای معمولی
        this.ctx.fillStyle = '#fc8181';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#fc8181';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // رسم غذای ویژه
        if (this.specialFood) {
            const timeLeft = this.specialFoodTimer ? 1 : 0;
            if (Math.floor(Date.now() / 200) % 2 === 0) {
                this.ctx.fillStyle = '#f6e05e';
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#f6e05e';
                
                const cx = this.specialFood.x * this.gridSize + this.gridSize / 2;
                const cy = this.specialFood.y * this.gridSize + this.gridSize / 2;
                
                this.ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const radius = i === 0 ? this.gridSize / 2 - 2 : (this.gridSize / 2 - 2) * 0.5;
                    const x = cx + radius * Math.cos(angle);
                    const y = cy + radius * Math.sin(angle);
                    
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }
        
        // رسم ذرات
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
    }
    
    gameOver() {
        this.isRunning = false;
        clearInterval(this.gameLoop);
        clearTimeout(this.specialFoodTimer);
        
        // بررسی رکورد
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.highScoreElement.textContent = this.highScore;
        }
        
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
        
        // انیمیشن Game Over
        this.draw();
    }
    
    drawInitialScreen() {
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#48bb78';
        this.ctx.font = 'bold 20px Tahoma';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐍', this.canvas.width / 2, this.canvas.height / 2);
    }
}

// شروع بازی وقتی صفحه لود شد
window.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
