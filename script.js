// --- 1. 变量定义 ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const bgm = document.getElementById('bgm');
const galleryContainer = document.getElementById('gallery-container');
const galleryImages = document.querySelectorAll('.gallery-img');

// --- 2. 画布适配 ---
let w, h;
function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- 3. 烟花核心逻辑 (恢复原版) ---
let fireworks = [];
let particles = [];
let hue = 120;
let limiterTotal = 5; // 发射频率
let limiterTick = 0;

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function calculateDistance(p1x, p1y, p2x, p2y) {
    let xDistance = p1x - p2x;
    let yDistance = p1y - p2y;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

// 烟花弹类
class Firework {
    constructor(sx, sy, tx, ty) {
        this.x = sx;
        this.y = sy;
        this.sx = sx;
        this.sy = sy;
        this.tx = tx;
        this.ty = ty;
        this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
        this.distanceTraveled = 0;
        this.angle = Math.atan2(ty - sy, tx - sx);
        this.speed = 2;
        this.acceleration = 1.05;
        this.brightness = random(50, 70);
        this.targetRadius = 1;
    }

    update(index) {
        if (this.targetRadius < 8) {
            this.targetRadius += 0.3;
        } else {
            this.targetRadius = 1;
        }

        this.speed *= this.acceleration;
        let vx = Math.cos(this.angle) * this.speed;
        let vy = Math.sin(this.angle) * this.speed;
        this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

        if (this.distanceTraveled >= this.distanceToTarget) {
            createParticles(this.tx, this.ty);
            fireworks.splice(index, 1);
        } else {
            this.x += vx;
            this.y += vy;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x - Math.cos(this.angle) * 5, this.y - Math.sin(this.angle) * 5); 
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// 爆炸粒子类
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = random(0, Math.PI * 2);
        this.speed = random(1, 10);
        this.friction = 0.95;
        this.gravity = 1;
        this.hue = random(hue - 20, hue + 20);
        this.brightness = random(50, 80);
        this.alpha = 1;
        this.decay = random(0.015, 0.03);
    }

    update(index) {
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;

        if (this.alpha <= this.decay) {
            particles.splice(index, 1);
        }
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(' + this.hue + ', 100%, ' + this.brightness + '%)';
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createParticles(x, y) {
    let particleCount = 30; 
    while (particleCount--) {
        particles.push(new Particle(x, y));
    }
}

// --- 4. 动画循环 (核心) ---
function loop() {
    requestAnimationFrame(loop);

    hue += 0.5;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    let i = fireworks.length;
    while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }

    let j = particles.length;
    while (j--) {
        particles[j].draw();
        particles[j].update(j);
    }

    // 自动发射逻辑 (保持原版)
    if (limiterTick >= limiterTotal) {
        fireworks.push(new Firework(w / 2, h, random(0, w), random(0, h / 2)));
        limiterTick = 0;
    } else {
        limiterTick++;
    }
}

// --- 5. 照片轮播逻辑 (新增) ---
let currentImageIndex = 0;
function startGallery() {
    galleryContainer.style.opacity = 1;
    if(galleryImages.length > 0) {
        galleryImages[0].classList.add('active');
    }
    setInterval(() => {
        if(galleryImages.length > 0) {
            galleryImages[currentImageIndex].classList.remove('active');
            currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
            galleryImages[currentImageIndex].classList.add('active');
        }
    }, 3000);
}

// --- 6. 事件监听 (修复音乐延迟) ---
startBtn.addEventListener('click', () => {
    // 按钮反馈
    const originalText = startBtn.innerText;
    startBtn.innerText = "加载中...";
    startBtn.disabled = true;

    // 确保音乐加载后再开始
    bgm.play().then(() => {
        
        startBtn.innerText = originalText;
        startBtn.disabled = false;
        
        // 隐藏界面
        startScreen.style.opacity = 0;
        setTimeout(() => {
            startScreen.style.display = 'none';
        }, 1000);
        
        // 开始动画和轮播
        loop();
        startGallery();

    }).catch(error => {
        console.log("播放失败:", error);
        startBtn.innerText = "播放失败，请重试";
        startBtn.disabled = false;
    });
});