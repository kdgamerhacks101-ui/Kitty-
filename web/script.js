// Elements
const videoElement = document.getElementById('webcam');
const flowerCanvas = document.getElementById('flowerCanvas');
const flowerCtx = flowerCanvas.getContext('2d');
const gestureStatusText = document.querySelector('#gestureStatus .status-text');
const gestureStatusDot = document.querySelector('#gestureStatus .pulse-dot');
const bloomCounterText = document.getElementById('bloomCounter');

// Stat values
const handDetectedVal = document.getElementById('handDetectedVal');
const handStateVal = document.getElementById('handStateVal');
const opennessVal = document.getElementById('opennessVal');
const opennessBar = document.getElementById('opennessBar');

// Audio Synthesizer using Web Audio API
class AudioSynth {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    playSparkle() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }
    playBurst() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.5);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);

        // High shimmer noise
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(8000, now + 0.4);
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.4);
    }
    playRoseBloom() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + index * 0.1);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 1.2 + index * 0.1);
            gain.gain.setValueAtTime(0, now + index * 0.1);
            gain.gain.linearRampToValueAtTime(0.06, now + 0.3 + index * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 + index * 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + index * 0.1);
            osc.stop(now + 1.6 + index * 0.1);
        });
    }
    playHeartbeat() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [0, 0.22].forEach(delay => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(60, now + delay);
            osc.frequency.exponentialRampToValueAtTime(15, now + delay + 0.15);
            gain.gain.setValueAtTime(0.4, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.15);
        });
    }
}
const synth = new AudioSynth();

// Particle System
class Particle {
    constructor(x, y, vx, vy, color, size, life, decay, type = 'glitter') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.decay = decay;
        this.type = type; // 'glitter', 'heart', 'star', 'petal'
        this.angle = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.angle += this.rotSpeed;
        if (this.type === 'petal') {
            this.vy += 0.04;
            this.vx += Math.sin(Date.now() / 250 + this.y / 15) * 0.05;
        } else if (this.type === 'heart' || this.type === 'paw' || this.type === 'cat') {
            this.vy += 0.02;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;

        if (this.type === 'heart') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-this.size, -this.size * 1.5, -this.size * 2, -this.size / 2, 0, this.size * 1.5);
            ctx.bezierCurveTo(this.size * 2, -this.size / 2, this.size, -this.size * 1.5, 0, 0);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'petal') {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 1.3, this.size * 0.8, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'paw') {
            ctx.font = `${this.size * 2.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐾', 0, 0);
        } else if (this.type === 'cat') {
            ctx.font = `${this.size * 2.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐱', 0, 0);
        } else {
            // Glitter Star
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                ctx.lineTo(Math.cos((i * 90) * Math.PI / 180) * this.size, Math.sin((i * 90) * Math.PI / 180) * this.size);
                ctx.lineTo(Math.cos((45 + i * 90) * Math.PI / 180) * (this.size / 3), Math.sin((45 + i * 90) * Math.PI / 180) * (this.size / 3));
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}

let particles = [];

// Spawning fireworks for Thumbs Up
function spawnFireworks(x, y) {
    const colors = ['#f43f5e', '#ec4899', '#fbbf24', '#f59e0b', '#ffffff'];
    for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 7;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 1.2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 3 + Math.random() * 4;
        particles.push(new Particle(x, y, vx, vy, color, size, 1.0, 0.015 + Math.random() * 0.02, 'heart'));
    }
}

// Reversible narrative state tracking
const handState = {
    active: false,
    x: 0,
    y: 0,
    openness: 0,
    targetOpenness: 0,
    // narrativeProgress ranges from 0.0 (fist/orb) to 4.0 (fully bloomed / celebration)
    narrativeProgress: 0.0,
    lastHeartBeatTime: 0,
    burstTriggered: false
};

// Distance calculation
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
}

// Hand Openness calculation
function getHandOpenness(landmarks) {
    const wrist = landmarks[0];
    const mcpMiddle = landmarks[9];
    const palmScale = getDistance(wrist, mcpMiddle);
    if (palmScale === 0) return 0;
    
    const fingerTips = [8, 12, 16, 20];
    const fingerBases = [5, 9, 13, 17];
    
    let sum = 0;
    for (let i = 0; i < 4; i++) {
        sum += getDistance(landmarks[fingerTips[i]], landmarks[fingerBases[i]]) / palmScale;
    }
    
    let openness = (sum / 4 - 0.45) / 0.5;
    return Math.max(0, Math.min(1, openness));
}

// Thumbs Up Detection
function isThumbsUp(landmarks) {
    const thumbExt = getDistance(landmarks[4], landmarks[2]);
    const indexFolded = getDistance(landmarks[8], landmarks[5]) < 0.12;
    const middleFolded = getDistance(landmarks[12], landmarks[9]) < 0.12;
    const ringFolded = getDistance(landmarks[16], landmarks[13]) < 0.12;
    const pinkyFolded = getDistance(landmarks[20], landmarks[17]) < 0.12;
    const thumbUp = landmarks[4].y < landmarks[2].y;
    return thumbExt > 0.15 && indexFolded && middleFolded && ringFolded && pinkyFolded && thumbUp;
}

// Draw realistic Blooming Red Rose procedurally
function drawRose(ctx, x, y, progress) {
    ctx.save();
    
    // Stem Growth
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + 100);
    
    const stemHeight = 100 * Math.min(progress * 1.5, 1.0);
    const controlX = x - 15 * Math.sin(progress * Math.PI);
    ctx.quadraticCurveTo(controlX, y + 100 - stemHeight / 2, x, y + 100 - stemHeight);
    ctx.stroke();
    
    const flowerY = y + 100 - stemHeight;
    
    // Leaves
    if (progress > 0.3) {
        const leafProgress = Math.min((progress - 0.3) * 2, 1.0);
        ctx.fillStyle = '#047857';
        
        ctx.beginPath();
        ctx.ellipse(x - 18 * leafProgress, y + 60, 16 * leafProgress, 7 * leafProgress, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + 18 * leafProgress, y + 45, 15 * leafProgress, 6 * leafProgress, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Flower Bud blooming
    if (progress > 0.6) {
        const bloomSize = 25 * Math.min((progress - 0.6) * 2.5, 1.0);
        
        // Sepals
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.ellipse(x, flowerY + 4, bloomSize * 0.8, bloomSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Layered petals
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(x - bloomSize * 0.3, flowerY - bloomSize * 0.1, bloomSize * 0.6, 0, Math.PI * 2);
        ctx.arc(x + bloomSize * 0.3, flowerY - bloomSize * 0.1, bloomSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(x, flowerY + bloomSize * 0.2, bloomSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.arc(x, flowerY - bloomSize * 0.2, bloomSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Draw giant glowing beating Heart
function drawBeatingHeart(ctx, x, y, progress, pulseSpeed = 150) {
    ctx.save();
    const beat = 1.0 + 0.12 * Math.sin(Date.now() / pulseSpeed) * progress;
    const baseSize = 42 * progress;
    const size = baseSize * beat;
    
    const glow = ctx.createRadialGradient(x, y, 2, x, y, size * 2.2);
    glow.addColorStop(0, 'rgba(244, 63, 94, 0.5)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 2.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#e11d48';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.5);
    ctx.bezierCurveTo(x - size, y - size, x - size * 2, y + size * 0.5, x, y + size * 2.2);
    ctx.bezierCurveTo(x + size * 2, y + size * 0.5, x + size, y - size, x, y + size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// MediaPipe Results Processing
let lastFireworksTime = 0;
function onHandResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        handState.active = true;
        
        // Track hand coordinates
        handState.x = (1.0 - landmarks[9].x) * flowerCanvas.width;
        handState.y = landmarks[9].y * flowerCanvas.height;
        
        handDetectedVal.textContent = "Yes";
        handDetectedVal.className = "stat-value badge badge-on";
        
        // Calculate real-time openness
        handState.targetOpenness = getHandOpenness(landmarks);
        handState.openness += (handState.targetOpenness - handState.openness) * 0.15;
        
        const pct = Math.round(handState.openness * 100);
        opennessVal.textContent = `${pct}%`;
        opennessBar.style.width = `${pct}%`;

        // Check for Thumbs Up fireworks trigger
        if (isThumbsUp(landmarks)) {
            const now = Date.now();
            if (now - lastFireworksTime > 1000) {
                lastFireworksTime = now;
                synth.playBurst();
                spawnFireworks(handState.x, handState.y - 120);
                handStateVal.textContent = "👍 Thumbs Up Fireworks";
            }
        } else {
            handStateVal.textContent = handState.openness > 0.75 ? "Open Hand 🖐️" : (handState.openness < 0.25 ? "Closed Fist ✊" : "Transitioning ✋");
        }
    } else {
        handState.active = false;
        handDetectedVal.textContent = "No";
        handDetectedVal.className = "stat-value badge badge-off";
        handStateVal.textContent = "Scanning...";
    }
}

// Main Canvas Render Frame
function updateFrame() {
    const width = flowerCanvas.width;
    const height = flowerCanvas.height;
    
    // Draw mirrored video
    flowerCtx.clearRect(0, 0, width, height);
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        flowerCtx.save();
        flowerCtx.translate(width, 0);
        flowerCtx.scale(-1, 1);
        flowerCtx.drawImage(videoElement, 0, 0, width, height);
        flowerCtx.restore();
    }
    
    if (handState.active) {
        // Reversible Narrative timeline: progress maps directly to openness * 4.0
        const targetProgress = handState.openness * 4.0;
        
        // Smoothly interpolate progress
        handState.narrativeProgress += (targetProgress - handState.narrativeProgress) * 0.08;
        
        const progress = handState.narrativeProgress;
        
        // Phase 1: Glowing Pink Orb (0.0 to 1.0)
        if (progress >= 0 && progress <= 1.0) {
            handState.burstTriggered = false;
            const orbSize = 8 + progress * 35;
            const pulse = 1.0 + 0.12 * Math.sin(Date.now() / 130);
            
            flowerCtx.save();
            const radGlow = flowerCtx.createRadialGradient(handState.x, handState.y - 30, 2, handState.x, handState.y - 30, orbSize * pulse * 2.0);
            radGlow.addColorStop(0, 'rgba(244, 63, 94, 0.95)');
            radGlow.addColorStop(0.3, 'rgba(217, 70, 239, 0.6)');
            radGlow.addColorStop(1, 'transparent');
            flowerCtx.fillStyle = radGlow;
            flowerCtx.beginPath();
            flowerCtx.arc(handState.x, handState.y - 30, orbSize * pulse * 2.0, 0, Math.PI * 2);
            flowerCtx.fill();
            flowerCtx.restore();
            
            // Orbiting sparkles
            const time = Date.now() * 0.003;
            const orbitRadius = 15 + progress * 20;
            const sx = handState.x + Math.cos(time) * orbitRadius;
            const sy = handState.y - 30 + Math.sin(time) * orbitRadius;
            
            if (Math.random() < 0.4) {
                particles.push(new Particle(sx, sy, (Math.random()-0.5)*1, (Math.random()-0.5)*1, '#fbcfe8', 2 + Math.random()*2, 0.8, 0.04));
            }
        }
        
        // Transition: Sparkle burst at progress >= 1.0 (moving forward)
        if (progress >= 1.0 && !handState.burstTriggered) {
            synth.playBurst();
            // Burst particles
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 5;
                particles.push(new Particle(handState.x, handState.y - 30, Math.cos(angle)*speed, Math.sin(angle)*speed - 2, '#f43f5e', 3 + Math.random()*2, 1.0, 0.02));
            }
            handState.burstTriggered = true;
        }
        
        // Phase 2: Blooming Rose (1.0 to 2.0)
        if (progress > 1.0 && progress <= 2.0) {
            const roseProgress = (progress - 1.0);
            drawRose(flowerCtx, handState.x, handState.y - 120, roseProgress);
            
            if (Math.random() < 0.25) {
                particles.push(new Particle(handState.x + (Math.random()-0.5)*20, handState.y - 100, (Math.random()-0.5)*2, -1, '#fbbf24', 2, 0.8, 0.03, 'star'));
            }
        }
        
        // Phase 3: Rose Dissolve into Petals merging to Heart (2.0 to 3.0)
        if (progress > 2.0 && progress <= 3.0) {
            const dissolveProgress = (progress - 2.0);
            
            // Draw shrinking/fading rose base
            flowerCtx.save();
            flowerCtx.globalAlpha = 1.0 - dissolveProgress;
            drawRose(flowerCtx, handState.x, handState.y - 120, 1.0);
            flowerCtx.restore();
            
            // Emit rose petals floating upwards towards target heart position
            const heartY = handState.y - 140;
            if (Math.random() < 0.35) {
                const px = handState.x + (Math.random()-0.5)*30;
                const py = handState.y - 60;
                const vx = (handState.x - px) * 0.05 + (Math.random()-0.5)*2;
                const vy = -3 - Math.random()*2;
                particles.push(new Particle(px, py, vx, vy, '#f43f5e', 5 + Math.random()*3, 1.0, 0.02, 'petal'));
            }
            
            // Draw growing heart preview
            drawBeatingHeart(flowerCtx, handState.x, heartY, dissolveProgress);
        }
        
        // Phase 4: Heart Float / Confetti / Celebration (3.0 to 4.0)
        if (progress > 3.0) {
            const celebrateProgress = (progress - 3.0);
            const heartY = handState.y - 140;
            
            // Draw main beating heart
            drawBeatingHeart(flowerCtx, handState.x, heartY, 1.0);
            
            // Heartbeat audio triggering
            const now = Date.now();
            if (now - handState.lastHeartBeatTime > 800) {
                synth.playHeartbeat();
                handState.lastHeartBeatTime = now;
            }
            
            // Fade-in Elegant cursive text at 90% openness (progress > 3.6)
            if (progress > 3.6) {
                const textAlpha = 1.0;
                flowerCtx.save();
                flowerCtx.globalAlpha = textAlpha;
                
                // Common shadow settings for readable overlay text
                flowerCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                flowerCtx.shadowBlur = 20;
                flowerCtx.shadowOffsetX = 4;
                flowerCtx.shadowOffsetY = 4;
                
                // Gradient for main text and "Luv u"
                const gradient = flowerCtx.createLinearGradient(width/2 - 250, 0, width/2 + 250, 0);
                gradient.addColorStop(0, '#ff9a9e');
                gradient.addColorStop(0.3, '#fecfef');
                gradient.addColorStop(0.7, '#fe9a8b');
                gradient.addColorStop(1, '#ff758c');
                
                // 1. Main Greeting (shifted up)
                flowerCtx.font = "bold italic 56px 'Great Vibes', cursive";
                flowerCtx.textAlign = 'center';
                flowerCtx.fillStyle = gradient;
                flowerCtx.fillText("Happy Girlfriend's Day, My Kitty! ❤️", width / 2, height / 2 + 60);
                
                // 2. Subtitle (shifted up)
                flowerCtx.font = "300 22px 'Outfit', sans-serif";
                flowerCtx.fillStyle = '#fce7f3';
                flowerCtx.shadowBlur = 8;
                flowerCtx.shadowColor = '#ec4899';
                flowerCtx.fillText("You make every single day magical ✨", width / 2, height / 2 + 110);
                
                // 3. Luv u text (larger, shifted up, using gradient + heavy shadow for visibility)
                flowerCtx.font = "bold italic 48px 'Great Vibes', cursive";
                flowerCtx.fillStyle = gradient;
                flowerCtx.shadowBlur = 20;
                flowerCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                flowerCtx.fillText("Luv u ❤️", width / 2, height / 2 + 165);
                
                flowerCtx.restore();
            }
            
            // Shower of heart, paw, cat confetti & sparkles (falls from top) - starts strictly at 90% (progress > 3.6)
            if (progress > 3.6 && Math.random() < 0.20) {
                const rand = Math.random();
                if (rand < 0.35) {
                    particles.push(new Particle(Math.random() * width, 0, (Math.random()-0.5)*3, 2 + Math.random()*2, '#f43f5e', 5 + Math.random()*5, 1.0, 0.008, 'heart'));
                } else if (rand < 0.60) {
                    particles.push(new Particle(Math.random() * width, 0, (Math.random()-0.5)*2, 1.5 + Math.random()*2, '#fbbf24', 3 + Math.random()*3, 1.0, 0.007, 'star'));
                } else if (rand < 0.82) {
                    particles.push(new Particle(Math.random() * width, 0, (Math.random()-0.5)*2, 1.5 + Math.random()*2, '#fbcfe8', 4 + Math.random()*3, 1.0, 0.008, 'paw'));
                } else {
                    particles.push(new Particle(Math.random() * width, 0, (Math.random()-0.5)*2, 1.5 + Math.random()*2, '#fda4af', 4 + Math.random()*3, 1.0, 0.008, 'cat'));
                }
            }
        }
        
        // Update bloom counter
        const progressPct = Math.round((progress / 4.0) * 100);
        bloomCounterText.textContent = `${progressPct}%`;
    } else {
        // Decay progress back to 0 when hand is lost
        handState.openness = Math.max(0, handState.openness - 0.03);
        handState.narrativeProgress = Math.max(0, handState.narrativeProgress - 0.05);
        bloomCounterText.textContent = "0%";
    }
    
    // Update and Draw Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(flowerCtx);
    });
    
    requestAnimationFrame(updateFrame);
}

// MediaPipe Hands setup
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1, // Single-hand focus
    modelComplexity: 1,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.65
});

hands.onResults(onHandResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

camera.start()
    .then(() => {
        gestureStatusText.textContent = "Webcam active! Show your hand.";
        gestureStatusDot.classList.add('active');
        
        function resizeCanvas() {
            const rect = flowerCanvas.parentElement.getBoundingClientRect();
            flowerCanvas.width = rect.width * window.devicePixelRatio;
            flowerCanvas.height = rect.height * window.devicePixelRatio;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        document.body.addEventListener('click', () => {
            synth.init();
        }, { once: true });
        
        requestAnimationFrame(updateFrame);
    })
    .catch(err => {
        console.error("Camera error:", err);
        gestureStatusText.textContent = "Camera Error";
        gestureStatusDot.className = "pulse-dot error";
    });
