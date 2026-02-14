// 获取DOM元素
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const bgm = document.getElementById('bgm');
// 新增：获取相册容器和所有图片
const galleryContainer = document.getElementById('gallery-container');
const galleryImages = document.querySelectorAll('.gallery-img');
let currentImageIndex = 0;

// 设置画布大小
let w, h;
function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// 烟花逻辑变量
let fireworks = [];
let particles = [];

// ---------------------------------------------------------
// 类定义：烟花弹（升空阶段）
// ---------------------------------------------------------
class Firework {
    constructor(sx, sy, tx, ty) {
        this.x = sx; // 起点
        this.y = sy;
        this.sx = sx;
        this.sy = sy;
        this.tx = tx; // 目标点
        this.ty = ty;
        this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
        this.distanceTraveled = 0;
        // 计算角度和速度
        this.angle = Math.atan2(ty - sy, tx - sx);
        this.speed = 2;
        this.acceleration = 1.05;
        this.brightness = random(50, 70);
        this.targetRadius = 1;
    }

    update(index) {
        // 更新目标点光圈动画
        if (this.targetRadius < 8) {
            this.targetRadius += 0.3;
        } else {
            this.targetRadius = 1;
        }

        // 加速
        this.speed *= this.acceleration;

        // 计算当前速度分量
        let vx = Math.cos(this.angle) * this.speed;
        let vy = Math.sin(this.angle) * this.speed;

        // 移动距离
        this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

        // 如果到达目标点，爆炸
        if (this.distanceTraveled >= this.distanceToTarget) {
            createParticles(this.tx, this.ty); // 创建爆炸粒子
            fireworks.splice(index, 1); // 删除烟花弹
        } else {
            this.x += vx;
            this.y += vy;
        }
    }

    draw() {
        ctx.beginPath();
        // 绘制尾迹
        ctx.moveTo(this.x - Math.cos(this.angle) * 5, this.y - Math.sin(this.angle) * 5); 
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
        ctx.stroke();
        
        // 绘制目标点微光
        ctx.beginPath();
        ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ---------------------------------------------------------
// 类定义：爆炸粒子（爆炸阶段）
// ---------------------------------------------------------
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = random(0, Math.PI * 2); // 随机散开角度
        this.speed = random(1, 10); // 随机速度
        this.friction = 0.95; // 摩擦力（减速）
        this.gravity = 1; // 重力（下坠）
        this.hue = random(hue - 20, hue + 20); // 颜色
        this.brightness = random(50, 80);
        this.alpha = 1; // 透明度
        this.decay = random(0.015, 0.03); // 消失速度
    }

    update(index) {
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;

        // 如果完全透明，移除粒子
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
        ctx.globalAlpha = 1; // 重置透明度
    }
}

// ---------------------------------------------------------
// 辅助函数与核心循环
// ---------------------------------------------------------
let hue = 120;
let limiterTotal = 5; // 发射频率控制
let limiterTick = 0;

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function calculateDistance(p1x, p1y, p2x, p2y) {
    let xDistance = p1x - p2x;
    let yDistance = p1y - p2y;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

function createParticles(x, y) {
    let particleCount = 50; // 粒子数量
    while (particleCount--) {
        particles.push(new Particle(x, y));
    }
}

function loop() {
    // 使用 requestAnimationFrame 实现动画循环
    requestAnimationFrame(loop);

    // 绘制半透明背景，产生拖尾效果
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    // 变换颜色
    hue += 0.5;

    // 更新和绘制烟花弹
    let i = fireworks.length;
    while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }

    // 更新和绘制粒子
    let j = particles.length;
    while (j--) {
        particles[j].draw();
        particles[j].update(j);
    }

    // 自动发射烟花
    if (limiterTick >= limiterTotal) {
        // 从底部随机位置发射到上方随机位置
        fireworks.push(new Firework(w / 2, h, random(0, w), random(0, h / 2)));
        limiterTick = 0;
    } else {
        limiterTick++;
    }
}

// ---------------------------------------------------------
// 事件监听：开始按钮（修复延迟版）
// ---------------------------------------------------------
startBtn.addEventListener('click', () => {
    // 更改按钮文字，提示用户正在缓冲
    const originalText = startBtn.innerText;
    startBtn.innerText = "加载音乐中...";
    startBtn.disabled = true; // 防止重复点击

    // 尝试播放音乐
    bgm.play().then(() => {
        // --- 只有音乐成功开始播放后，才会执行这里的代码 ---
        
        // 1. 恢复按钮（虽然马上就要消失了）
        startBtn.innerText = originalText;
        startBtn.disabled = false;

        // 2. 隐藏开始界面
        startScreen.style.opacity = 0;
        setTimeout(() => {
            startScreen.style.display = 'none';
        }, 1000);

        // 3. 音乐响了，烟花再开始！
        loop(); 
        startGallery(); // <--- 新增这一行！

    }).catch(error => {
        // 如果出错（比如浏览器限制），恢复按钮让用户重试
        console.log("播放失败:", error);
        startBtn.innerText = "播放失败，请重试";
        startBtn.disabled = false;
    });
});

// 轮播逻辑
function startGallery() {
    // 1. 显示相册容器
    galleryContainer.style.opacity = 1;

    // 2. 设置定时器，每隔 3000 毫秒 (3秒) 换一张图
    let galleryInterval = setInterval(() => {
        // 当前图片淡出
        galleryImages[currentImageIndex].classList.remove('active');

        // 计算下一张图片的索引
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;

        // 下一张图片淡入
        galleryImages[currentImageIndex].classList.add('active');

        // 当轮播完成一周期后，停止轮播并显示红包
        if (currentImageIndex === 0) {
            clearInterval(galleryInterval);
            showRedPacket();
        }
    }, 6000); // 这里的 3000 可以改，比如 4000 就是 4秒
}

// 红包互动逻辑
const redPacketContainer = document.getElementById('red-packet-container');
const redPacketBox = document.getElementById('red-packet-box');
const packetContentModal = document.getElementById('packet-content-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

function showRedPacket() {
    // 隐藏相册
    galleryContainer.style.opacity = 0;
    galleryContainer.style.pointerEvents = 'none';

    // 显示红包
    setTimeout(() => {
        redPacketContainer.classList.add('show');
    }, 500);
}

// 点击红包打开
redPacketBox.addEventListener('click', () => {
    // 添加打开动画
    redPacketBox.classList.add('opening');

    // 显示内容模态框
    setTimeout(() => {
        packetContentModal.classList.add('show');
        redPacketContainer.classList.remove('show');
    }, 600);
});

// 关闭模态框并继续开红包
closeModalBtn.addEventListener('click', () => {
    packetContentModal.classList.remove('show');

    // 重置红包状态
    setTimeout(() => {
        redPacketBox.classList.remove('opening');
        redPacketContainer.classList.add('show');
    }, 500);
});
