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
      let particleColor = "#ffffff";
      try {
        if (window.game && window.game.settings) {
          const gameSettings = window.game.settings.getSettings();
          if (gameSettings && gameSettings.particleColor) {
            particleColor = gameSettings.particleColor;
          }
        }
      } catch (e) {
        console.warn("Failed to get particle color from settings");
      }

      const particle = new Particle(
        this.x,
        this.y,
        particleColor,
        this.radius * 0.7,
        this.particleLifetime,
        {
          useGradient: this.useGradient,
          endColor: this.adjustColor(particleColor, -50),
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

class SparkParticle extends Particle {
  constructor(x, y, color, angle, speed, radius = 2, lifetime = 500) {
    super(x, y, color, radius, lifetime);
    this.dx = Math.cos(angle) * speed;
    this.dy = Math.sin(angle) * speed;
    this.friction = 0.95;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.dx *= this.friction;
    this.dy *= this.friction;
    return super.update();
  }
}

class RingParticle extends Particle {
  constructor(x, y, color, angle, speed, radius = 2, lifetime = 800) {
    super(x, y, color, radius, lifetime);
    this.dx = Math.cos(angle) * speed;
    this.dy = Math.sin(angle) * speed;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.angle = Math.random() * Math.PI * 2;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.dx *= 0.98;
    this.dy *= 0.98;
    this.angle += this.rotationSpeed;
    return super.update();
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
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.1;
    this.pulseAmplitude = 0.15;

    // Параметры искр и частиц
    this.sparks = [];
    this.sparkCount = 8;
    this.deathParticles = [];
    this.particleCount = 20;
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

  updatePulse() {
    if (this.pulseEnabled && this.active) {
      this.pulsePhase += this.pulseSpeed;
      const pulseFactor = Math.sin(this.pulsePhase) * this.pulseAmplitude;
      this.thickness = this.baseThickness * (1 + pulseFactor);
    } else {
      this.thickness = this.baseThickness;
    }
  }

  rotate() {
    this.angle = this.normalizeAngle(this.angle + this.rotationSpeed);
    this.updatePulse();
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

  getSparkColor() {
    try {
      let sparkColor = this.color; // По умолчанию используем цвет кольца

      if (window.game && window.game.settings) {
        const gameSettings = window.game.settings.getSettings();
        if (gameSettings) {
          switch (gameSettings.sparkColor) {
            case "same":
              sparkColor = this.color;
              break;
            case "contrast":
              sparkColor = this.adjustColor(this.color, 100);
              break;
            case "random":
              sparkColor = window.game.settings.generateRandomColor();
              break;
            default:
              sparkColor = gameSettings.particleColor || "#ffffff";
          }
        }
      }

      return sparkColor;
    } catch (e) {
      console.warn("Failed to get spark color from settings");
      return this.color;
    }
  }

  createSparks(x, y, normal) {
    const baseAngle = Math.atan2(normal.y, normal.x);
    const sparkColor = this.getSparkColor();

    for (let i = 0; i < this.sparkCount; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * Math.PI;
      const speed = 2 + Math.random() * 3;
      this.sparks.push(new SparkParticle(x, y, sparkColor, angle, speed));
    }
  }

  updateSparks() {
    this.sparks = this.sparks.filter((spark) => spark.update());
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
        const normal = {
          x: ball.x / distance,
          y: ball.y / distance,
        };
        this.createSparks(ball.x, ball.y, normal);
        return normal;
      }
    } else if (distance > this.radius + collisionRange) {
      this.explode();
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
    // Отрисовка искр и частиц
    for (const spark of this.sparks) {
      spark.draw(ctx);
    }
    for (const particle of this.deathParticles) {
      particle.draw(ctx);
    }

    ctx.restore();
  }

  explode() {
    const segmentAngle = (Math.PI * 2 - this.gapSize * 2) / this.particleCount;
    const particleColor = window.game.settings.getSettings().particleColor;
    for (let i = 0; i < this.particleCount; i++) {
      const angle = this.angle + this.gapSize + segmentAngle * i;
      const speed = 1 + Math.random() * 2;
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;
      this.deathParticles.push(
        new RingParticle(x, y, particleColor, angle, speed)
      );
    }
    this.active = false;
  }

  update() {
    this.updateSparks();
    this.rotate();
    if (!this.active) {
      this.deathParticles = this.deathParticles.filter((p) => p.update());
    }
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
      pulseSpeed: { min: 1, max: 10, default: 5 },
      pulseSize: { min: 1, max: 20, default: 10 },
    };

    this.inputs = {
      ballSize: document.getElementById("ballSize"),
      ballSpeed: document.getElementById("ballSpeed"),
      ballGlow: document.getElementById("ballGlow"),
      ballColor: document.getElementById("ballColor"),
      ballGradient: document.getElementById("ballGradient"),
      ballTrail: document.getElementById("ballTrail"),
      ringCount: document.getElementById("ringCount"),
      ringSpeed: document.getElementById("ringSpeed"),
      gapSize: document.getElementById("gapSize"),
      ringGlow: document.getElementById("ringGlow"),
      ringColor: document.getElementById("ringColor"),
      ringGradient: document.getElementById("ringGradient"),
      randomRingColors: document.getElementById("randomRingColors"),
      synchronizedMovement: document.getElementById("synchronizedMovement"),
      infiniteMode: document.getElementById("infiniteMode"),
      ringPulse: document.getElementById("ringPulse"),
      pulseSpeed: document.getElementById("pulseSpeed"),
      pulseSize: document.getElementById("pulseSize"),
      particleColor: document.getElementById("particleColor"),
      finalExplosionColors: document.getElementById("finalExplosionColors"),
      sparkColor: document.getElementById("sparkColor"),
    };

    this.valueDisplays = {
      ballSize: document.getElementById("ballSizeValue"),
      ballSpeed: document.getElementById("ballSpeedValue"),
      ballGlow: document.getElementById("ballGlowValue"),
      ringCount: document.getElementById("ringCountValue"),
      ringSpeed: document.getElementById("ringSpeedValue"),
      gapSize: document.getElementById("gapSizeValue"),
      ringGlow: document.getElementById("ringGlowValue"),
      pulseSpeed: document.getElementById("pulseSpeedValue"),
      pulseSize: document.getElementById("pulseSizeValue"),
    };

    this.defaults = {
      ...Object.fromEntries(
        Object.entries(this.ranges).map(([key, value]) => [key, value.default])
      ),
      ballColor: "#ffffff",
      ringColor: "#ffffff",
      ballGradient: false,
      ballTrail: true,
      ringGradient: false,
      randomRingColors: false,
      synchronizedMovement: false,
      infiniteMode: false,
      ringPulse: true,
      particleColor: "#ffffff",
      sparkColor: "same",
      finalExplosionColors: true,
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
      // Сначала применяем все значения по умолчанию
      settings = { ...this.defaults };

      // Затем загружаем сохраненные настройки, если они есть
      if (saved) {
        const savedSettings = JSON.parse(saved);

        // Проверяем числовые значения
        Object.entries(this.ranges).forEach(([key]) => {
          if (typeof savedSettings[key] !== "undefined") {
            settings[key] = this.validateValue(key, savedSettings[key]);
          }
        });

        // Проверяем булевы значения
        [
          "ballGradient",
          "ballTrail",
          "ringGradient",
          "randomRingColors",
          "synchronizedMovement",
          "infiniteMode",
          "finalExplosionColors",
        ].forEach((key) => {
          if (typeof savedSettings[key] === "boolean") {
            settings[key] = savedSettings[key];
          }
        });

        // Проверяем цвета
        ["ballColor", "ringColor", "particleColor"].forEach((key) => {
          if (
            savedSettings[key] &&
            /^#[0-9A-F]{6}$/i.test(savedSettings[key])
          ) {
            settings[key] = savedSettings[key];
          }
        });

        // Проверяем выпадающие списки
        if (["same", "contrast", "random"].includes(savedSettings.sparkColor)) {
          settings.sparkColor = savedSettings.sparkColor;
        }
      }
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
    // Начинаем с настроек по умолчанию
    const settings = { ...this.defaults };

    // Загружаем значения из инпутов
    Object.entries(this.inputs).forEach(([key, input]) => {
      if (!input) return; // Пропускаем, если элемент не найден

      if (input.type === "checkbox") {
        settings[key] = input.checked;
      } else if (input.type === "range") {
        settings[key] = this.validateValue(key, input.value);
      } else if (input.type === "color") {
        if (/^#[0-9A-F]{6}$/i.test(input.value)) {
          settings[key] = input.value;
        }
      } else if (key === "sparkColor") {
        if (["same", "contrast", "random"].includes(input.value)) {
          settings[key] = input.value;
        }
      } else {
        settings[key] = input.value;
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
  createFinalExplosion() {
    const gameSettings = this.settings.getSettings();
    const particles = [];
    const colors = gameSettings.finalExplosionColors
      ? [
          this.ball.color,
          this.settings.generateRandomColor(),
          this.settings.generateRandomColor(),
        ]
      : [gameSettings.particleColor];

    for (let i = 0; i < 100; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const speed = 2 + Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const radius = 2 + Math.random() * 3;
      particles.push(
        new SparkParticle(
          this.ball.x,
          this.ball.y,
          color,
          angle,
          speed,
          radius,
          2000
        )
      );
    }

    const updateAndDraw = () => {
      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.scale(this.scale, this.scale);

      particles.forEach((particle, index) => {
        if (particle.update()) {
          particle.draw(this.ctx);
        } else {
          particles.splice(index, 1);
        }
      });

      this.ctx.restore();

      if (particles.length > 0) {
        requestAnimationFrame(updateAndDraw);
      }
    };

    updateAndDraw();
  }

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

    const gameSettings = this.settings.getSettings() || this.settings.defaults;
    this.updateCanvasSize();

    const ballRadius = Number(gameSettings.ballSize) || 10;
    this.ball = new Ball(0, 0, ballRadius, Number(gameSettings.ballSpeed));
    this.ball.color = gameSettings.ballColor;
    this.ball.useGradient = gameSettings.ballGradient;
    this.ball.useTrail = gameSettings.ballTrail; // Включаем/выключаем след
    this.ball.glowSize = Number(gameSettings.ballGlow);
    this.ball.updateGradient(this.ctx);

    const ringCount = Number(gameSettings.ringCount) || 5;
    const baseRadius = 100;
    const radiusStep = 50;
    const baseSpeed = (Number(gameSettings.ringSpeed) || 10) * 0.001;

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
      ring.pulseEnabled = gameSettings.ringPulse;
      ring.pulseSpeed = Number(gameSettings.pulseSpeed) * 0.02;
      ring.pulseAmplitude = Number(gameSettings.pulseSize) * 0.01;
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
        ring.update();
        const normal = ring.checkCollision(this.ball);
        if (normal) {
          this.ball.bounce(normal);
        }
      }
    }

    if (activeRings === 0) {
      this.createFinalExplosion();
      if (this.infiniteMode) {
        setTimeout(() => {
          this.reset(true);
        }, 500);
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
