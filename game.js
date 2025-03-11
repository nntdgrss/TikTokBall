class Particle {
  constructor(x, y, color, radius, lifetime = 1000, options = {}) {
    this.x = x;
    this.y = y;
    this.startColor = color;
    this.endColor = options.endColor || this.adjustColor(color, -50);
    this.currentColor = this.startColor;
    this.radius = radius;
    this.lifetime = lifetime;
    this.createdAt = performance.now();
    this.alpha = 1;
    this.useGradient = options.useGradient || false;
    this.gradient = null;
  }

  adjustColor(color, amount) {
    const hex = color.replace("#", "");
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  interpolateColor(color1, color2, factor) {
    const hex1 = parseInt(color1.replace("#", ""), 16);
    const hex2 = parseInt(color2.replace("#", ""), 16);

    const r1 = hex1 >> 16;
    const g1 = (hex1 >> 8) & 0xff;
    const b1 = hex1 & 0xff;

    const r2 = hex2 >> 16;
    const g2 = (hex2 >> 8) & 0xff;
    const b2 = hex2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  update() {
    const age = performance.now() - this.createdAt;
    this.alpha = Math.max(0, 1 - age / this.lifetime);

    // Интерполируем цвет на основе возраста частицы
    const colorFactor = 1 - this.alpha;
    this.currentColor = this.interpolateColor(
      this.startColor,
      this.endColor,
      colorFactor
    );

    return this.alpha > 0;
  }

  createGradient(ctx) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    gradient.addColorStop(0, this.currentColor);
    gradient.addColorStop(1, this.adjustColor(this.currentColor, -30));
    return gradient;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);

    if (this.useGradient) {
      ctx.fillStyle = this.createGradient(ctx);
    } else {
      ctx.fillStyle = this.currentColor;
    }

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Ball {
  constructor(x, y, radius, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.lastCollisionTime = 0;
    this.resetVelocity();

    // Параметры градиента
    this.gradient = null;
    this.useGradient = false;
    this.glowSize = 0;
    this.color = "#ffffff";

    // Параметры следа
    this.particles = [];
    this.lastParticleTime = 0;
    this.useTrail = false; // Включен ли след
    this.particleInterval = 50; // Интервал создания частиц
    this.particleLifetime = 1000; // Время жизни частиц
    this.maxParticles = 20; // Максимальное количество частиц
  }

  updateGradient(ctx) {
    if (this.useGradient) {
      this.gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
      this.gradient.addColorStop(0, this.color);
      this.gradient.addColorStop(1, this.adjustColor(this.color, -30));
    }
  }

  adjustColor(color, amount) {
    const hex = color.replace("#", "");
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  resetVelocity() {
    // Случайное начальное направление
    const angle = Math.random() * Math.PI * 2;
    const deviation = ((Math.random() - 0.5) * Math.PI) / 6;
    this.dx = Math.cos(angle + deviation) * this.speed;
    this.dy = Math.sin(angle + deviation) * this.speed;
  }

  move() {
    this.x += this.dx;
    this.y += this.dy;
    if (this.useTrail) {
      this.createParticle();
      this.updateParticles();
    }
  }

  setSpeed(speed) {
    this.speed = speed;
    const currentAngle = Math.atan2(this.dy, this.dx);
    this.dx = Math.cos(currentAngle) * speed;
    this.dy = Math.sin(currentAngle) * speed;
  }

  createParticle() {
    const now = performance.now();
    if (now - this.lastParticleTime >= this.particleInterval) {
      this.lastParticleTime = now;
      const particle = new Particle(
        this.x,
        this.y,
        this.color,
        this.radius * 0.7,
        this.particleLifetime,
        {
          useGradient: this.useGradient,
          endColor: this.adjustColor(this.color, -50),
        }
      );
      this.particles.unshift(particle);
      if (this.particles.length > this.maxParticles) {
        this.particles.pop();
      }
    }
  }

  updateParticles() {
    this.particles = this.particles.filter((particle) => particle.update());
  }

  bounce(normal) {
    const now = performance.now();
    if (now - this.lastCollisionTime < 50) return;
    this.lastCollisionTime = now;

    const dot = this.dx * normal.x + this.dy * normal.y;
    const reflection = {
      x: this.dx - 2 * dot * normal.x,
      y: this.dy - 2 * dot * normal.y,
    };

    const length = Math.sqrt(
      reflection.x * reflection.x + reflection.y * reflection.y
    );
    const normalized = {
      x: reflection.x / length,
      y: reflection.y / length,
    };

    const deviation = ((Math.random() - 0.5) * Math.PI) / 8;
    const angle = Math.atan2(normalized.y, normalized.x) + deviation;

    this.dx = Math.cos(angle) * this.speed;
    this.dy = Math.sin(angle) * this.speed;
  }

  draw(ctx) {
    if (this.useTrail) {
      for (const particle of this.particles) {
        particle.draw(ctx);
      }
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.glowSize > 0) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.glowSize;
    }

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);

    if (this.useGradient && this.gradient) {
      ctx.fillStyle = this.gradient;
    } else {
      ctx.fillStyle = this.color;
    }

    ctx.fill();
    ctx.restore();
  }
}

class Ring {
  constructor(radius, rotationSpeed, gapSizeDegrees = 45, color = "#ffffff") {
    this.radius = radius;
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = rotationSpeed;
    this.gapSize = (gapSizeDegrees * Math.PI) / 180;
    this.gapHalfSize = this.gapSize / 2;
    this.baseThickness = 5;
    this.thickness = this.baseThickness;
    this.active = true;
    this.color = color;
    this.gradient = null;
    this.useGradient = false;
    this.glowSize = 0;
    this.lastCollisionTime = 0;

    // Параметры пульсации
    this.pulseEnabled = true;
    this.pulsePhase = Math.random() * Math.PI * 2; // Случайная начальная фаза
    this.pulseSpeed = 0.1;
    this.pulseAmplitude = 0.15;
  }

  updateGradient(ctx) {
    if (this.useGradient) {
      this.gradient = ctx.createLinearGradient(
        -this.radius,
        -this.radius,
        this.radius,
        this.radius
      );
      this.gradient.addColorStop(0, this.color);
      this.gradient.addColorStop(1, this.adjustColor(this.color, -30));
    }
  }

  adjustColor(color, amount) {
    const hex = color.replace("#", "");
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  normalizeAngle(angle) {
    angle = angle % (Math.PI * 2);
    return angle < 0 ? angle + Math.PI * 2 : angle;
  }

  rotate() {
    this.angle = this.normalizeAngle(this.angle + this.rotationSpeed);
  }

  isMovingTowards(ball) {
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    const distanceFromRing = distance - this.radius;
    const dotProduct = (ball.x * ball.dx + ball.y * ball.dy) / distance;
    return Math.abs(distanceFromRing) <= this.thickness + ball.radius
      ? dotProduct * Math.sign(distanceFromRing) < 0
      : dotProduct > 0;
  }

  isInGap(ballAngle) {
    const normalized = this.normalizeAngle(ballAngle - this.angle);
    return (
      normalized <= this.gapSize || normalized >= Math.PI * 2 - this.gapSize
    );
  }

  checkCollision(ball) {
    if (!this.active) return false;

    const now = performance.now();
    if (now - this.lastCollisionTime < 50) return false;

    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    const collisionRange = this.thickness + ball.radius;
    const distanceFromRing = Math.abs(distance - this.radius);

    if (distanceFromRing <= collisionRange) {
      const ballAngle = Math.atan2(ball.y, ball.x);

      if (!this.isInGap(ballAngle) && this.isMovingTowards(ball)) {
        this.lastCollisionTime = now;
        return {
          x: ball.x / distance,
          y: ball.y / distance,
        };
      }
    } else if (distance > this.radius + collisionRange) {
      this.active = false;
    }

    return false;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    if (this.glowSize > 0) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.glowSize;
    }

    ctx.beginPath();
    const startAngle = this.normalizeAngle(this.angle + this.gapSize);
    const endAngle = this.normalizeAngle(
      this.angle + Math.PI * 2 - this.gapSize
    );
    ctx.arc(0, 0, this.radius, startAngle, endAngle);

    if (this.useGradient && this.gradient) {
      ctx.strokeStyle = this.gradient;
    } else {
      ctx.strokeStyle = this.color;
    }

    ctx.lineWidth = this.thickness;
    ctx.stroke();
    ctx.restore();
  }
}

class Settings {
  constructor() {
    this.modal = document.getElementById("settingsModal");
    this.modalContent = this.modal.querySelector(".modal-content");
    this.settingsBtn = document.getElementById("settingsButton");
    this.closeBtn = document.getElementById("closeSettings");
    this.saveBtn = document.getElementById("saveSettings");

    // Переменные для отслеживания свайпа
    this.touchStartY = 0;
    this.touchMoveY = 0;

    this.ranges = {
      ballSize: { min: 5, max: 20, default: 10 },
      ballSpeed: { min: 1, max: 15, default: 8 },
      ballGlow: { min: 0, max: 20, default: 0 },
      ringCount: { min: 1, max: 20, default: 5 },
      ringSpeed: { min: 1, max: 50, default: 10 },
      gapSize: { min: 15, max: 180, default: 45 },
      ringGlow: { min: 0, max: 20, default: 0 },
    };

    this.inputs = {
      ballSize: document.getElementById("ballSize"),
      ballSpeed: document.getElementById("ballSpeed"),
      ballGlow: document.getElementById("ballGlow"),
      ballColor: document.getElementById("ballColor"),
      ballGradient: document.getElementById("ballGradient"),
      ballTrail: document.getElementById("ballTrail"), // Новая настройка
      ringCount: document.getElementById("ringCount"),
      ringSpeed: document.getElementById("ringSpeed"),
      gapSize: document.getElementById("gapSize"),
      ringGlow: document.getElementById("ringGlow"),
      ringColor: document.getElementById("ringColor"),
      ringGradient: document.getElementById("ringGradient"),
      randomRingColors: document.getElementById("randomRingColors"),
      synchronizedMovement: document.getElementById("synchronizedMovement"),
      infiniteMode: document.getElementById("infiniteMode"),
    };

    this.valueDisplays = {
      ballSize: document.getElementById("ballSizeValue"),
      ballSpeed: document.getElementById("ballSpeedValue"),
      ballGlow: document.getElementById("ballGlowValue"),
      ringCount: document.getElementById("ringCountValue"),
      ringSpeed: document.getElementById("ringSpeedValue"),
      gapSize: document.getElementById("gapSizeValue"),
      ringGlow: document.getElementById("ringGlowValue"),
    };

    this.defaults = {
      ...Object.fromEntries(
        Object.entries(this.ranges).map(([key, value]) => [key, value.default])
      ),
      ballColor: "#ffffff",
      ringColor: "#ffffff",
      ballGradient: false,
      ballTrail: true, // След по умолчанию включен
      ringGradient: false,
      randomRingColors: false,
      synchronizedMovement: false,
      infiniteMode: false,
    };

    this.setupEventListeners();
    this.loadSettings();
  }

  validateValue(key, value) {
    if (this.ranges[key]) {
      const numValue = Number(value);
      return Math.min(
        Math.max(numValue, this.ranges[key].min),
        this.ranges[key].max
      );
    }
    return value;
  }

  setupEventListeners() {
    // Основные кнопки
    this.settingsBtn.addEventListener("click", () => {
      this.vibrate();
      this.openModal();
    });

    this.closeBtn.addEventListener("click", () => {
      this.vibrate();
      this.closeModal();
    });

    this.saveBtn.addEventListener("click", () => {
      this.vibrate();
      this.saveSettings();
    });

    // Обработчики свайпа
    this.modal.addEventListener("touchstart", (e) => {
      this.touchStartY = e.touches[0].clientY;
      this.modalContent.style.transition = "none";
    });

    this.modal.addEventListener("touchmove", (e) => {
      this.touchMoveY = e.touches[0].clientY;
      const diff = this.touchMoveY - this.touchStartY;

      // Если свайп вниз и мы в начале прокрутки
      if (diff > 0 && this.modal.scrollTop === 0) {
        e.preventDefault();
        this.modalContent.style.transform = `translateY(${diff}px) scale(${
          1 - diff / 1000
        })`;
      }
    });

    this.modal.addEventListener("touchend", (e) => {
      const diff = this.touchMoveY - this.touchStartY;
      this.modalContent.style.transition = "transform 0.3s ease";

      if (diff > 100) {
        this.closeModal();
      } else {
        this.modalContent.style.transform = "";
      }
    });

    Object.entries(this.inputs).forEach(([key, input]) => {
      if (input.type === "range") {
        input.addEventListener("input", () => {
          const validValue = this.validateValue(key, input.value);
          input.value = validValue;
          if (key === "gapSize") {
            this.valueDisplays[key].textContent = validValue + "°";
          } else {
            this.valueDisplays[key].textContent = validValue;
          }
        });
      }
    });
  }

  vibrate() {
    if ("vibrate" in navigator) {
      navigator.vibrate(30);
    }
  }

  openModal() {
    this.modal.style.display = "block";
    this.modalContent.style.transform = "";
    setTimeout(() => this.modal.classList.add("visible"), 10);
  }

  closeModal() {
    this.modal.classList.remove("visible");
    setTimeout(() => (this.modal.style.display = "none"), 300);
  }

  generateRandomColor() {
    const hue = Math.random() * 360;
    return `hsl(${hue}, 80%, 60%)`;
  }

  loadSettings() {
    let settings;
    try {
      const saved = localStorage.getItem("gameSettings");
      settings = saved ? JSON.parse(saved) : this.defaults;

      Object.entries(this.ranges).forEach(([key]) => {
        settings[key] = this.validateValue(
          key,
          settings[key] ?? this.defaults[key]
        );
      });

      [
        "ballGradient",
        "ballTrail",
        "ringGradient",
        "randomRingColors",
        "synchronizedMovement",
        "infiniteMode",
      ].forEach((key) => {
        settings[key] =
          typeof settings[key] === "boolean"
            ? settings[key]
            : this.defaults[key];
      });

      ["ballColor", "ringColor"].forEach((key) => {
        if (!/^#[0-9A-F]{6}$/i.test(settings[key])) {
          settings[key] = this.defaults[key];
        }
      });
    } catch (e) {
      console.error("Error loading settings:", e);
      settings = this.defaults;
    }

    Object.entries(this.inputs).forEach(([key, input]) => {
      if (input.type === "checkbox") {
        input.checked = settings[key];
      } else {
        input.value = settings[key];
      }

      if (input.type === "range") {
        if (key === "gapSize") {
          this.valueDisplays[key].textContent = settings[key] + "°";
        } else {
          this.valueDisplays[key].textContent = settings[key];
        }
      }
    });

    return settings;
  }

  saveSettings() {
    const settings = {};
    Object.entries(this.inputs).forEach(([key, input]) => {
      if (input.type === "checkbox") {
        settings[key] = input.checked;
      } else {
        settings[key] = this.validateValue(key, input.value);
      }
    });

    localStorage.setItem("gameSettings", JSON.stringify(settings));
    this.closeModal();
    window.game.reset();
  }

  getSettings() {
    return this.loadSettings();
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.resetButton = document.getElementById("resetButton");
    this.settings = new Settings();

    this.updateCanvasSize();
    window.addEventListener("resize", () => this.updateCanvasSize());

    this.resetButton.addEventListener("click", () => this.reset());
    this.reset();
    window.game = this;
  }

  updateCanvasSize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    const gameSettings = this.settings.getSettings();
    const ringCount = Number(gameSettings.ringCount);
    const maxRadius = 100 + (ringCount - 1) * 50;

    this.scale = Math.min(
      this.canvas.width / (maxRadius * 2.5),
      this.canvas.height / (maxRadius * 2.5)
    );
  }

  reset(withFade = false) {
    if (this.isResetting) return;
    this.isResetting = true;

    if (withFade) {
      this.fadeOutAndReset();
      return;
    }

    const gameSettings = this.settings.getSettings();
    this.updateCanvasSize();

    const ballRadius = Number(gameSettings.ballSize);
    this.ball = new Ball(0, 0, ballRadius, Number(gameSettings.ballSpeed));
    this.ball.color = gameSettings.ballColor;
    this.ball.useGradient = gameSettings.ballGradient;
    this.ball.useTrail = gameSettings.ballTrail; // Включаем/выключаем след
    this.ball.glowSize = Number(gameSettings.ballGlow);
    this.ball.updateGradient(this.ctx);

    const ringCount = Number(gameSettings.ringCount);
    const baseRadius = 100;
    const radiusStep = 50;
    const baseSpeed = Number(gameSettings.ringSpeed) * 0.001;

    this.rings = Array.from({ length: ringCount }, (_, i) => {
      const radius = baseRadius + i * radiusStep;
      let speed;

      if (gameSettings.synchronizedMovement) {
        speed = baseSpeed * (1 - i / ringCount);
      } else {
        speed = baseSpeed * (i % 2 ? -1 : 1) * (1 + i * 0.2);
      }

      const ring = new Ring(
        radius,
        speed,
        Number(gameSettings.gapSize),
        gameSettings.randomRingColors
          ? this.settings.generateRandomColor()
          : gameSettings.ringColor
      );

      ring.useGradient = gameSettings.ringGradient;
      ring.glowSize = Number(gameSettings.ringGlow);
      ring.updateGradient(this.ctx);

      return ring;
    });

    this.resetButton.style.display = "none";
    this.infiniteMode = gameSettings.infiniteMode;
    this.isResetting = false;
    this.gameLoop();
  }

  update() {
    if (!this.ball || !this.rings) return false;

    this.ball.move();

    let activeRings = 0;
    for (let ring of this.rings) {
      if (ring.active) {
        activeRings++;
        ring.rotate();
        const normal = ring.checkCollision(this.ball);
        if (normal) {
          this.ball.bounce(normal);
        }
      }
    }

    if (activeRings === 0) {
      if (this.infiniteMode) {
        this.reset(true);
        return false;
      } else {
        this.resetButton.style.display = "block";
        return false;
      }
    }

    return true;
  }

  fadeOutAndReset() {
    let opacity = 0;
    const fadeOut = () => {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      if (opacity < 1) {
        opacity += 0.15; // Ускорим затухание
        requestAnimationFrame(fadeOut);
      } else {
        // Полностью очищаем экран перед сбросом
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.isResetting = false;
        this.reset();
      }
    };
    fadeOut();
  }

  draw() {
    if (this.isResetting) {
      return;
    }

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.rings && this.ball) {
      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.scale(this.scale, this.scale);

      for (let ring of this.rings) {
        ring.draw(this.ctx);
      }

      this.ball.draw(this.ctx);

      this.ctx.restore();
    }
  }

  gameLoop() {
    if (!this.isResetting && this.update()) {
      this.draw();
      requestAnimationFrame(() => this.gameLoop());
    }
  }
}

window.onload = () => new Game();
