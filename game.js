class Ball {
  constructor(x, y, radius, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed; // Фиксированная скорость
    this.lastCollisionTime = 0;

    // Случайное начальное направление с небольшим отклонением
    const angle = Math.random() * Math.PI * 2;
    const deviation = ((Math.random() - 0.5) * Math.PI) / 6;
    this.dx = Math.cos(angle + deviation) * speed;
    this.dy = Math.sin(angle + deviation) * speed;

    // Параметры градиента
    this.gradient = null;
    this.useGradient = false;
    this.glowSize = 0;
    this.color = "#ffffff";
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

  move() {
    this.x += this.dx;
    this.y += this.dy;
  }

  bounce(normal) {
    const now = performance.now();
    if (now - this.lastCollisionTime < 50) return;
    this.lastCollisionTime = now;

    // Базовое отражение с сохранением направления
    const dot = this.dx * normal.x + this.dy * normal.y;
    const reflection = {
      x: this.dx - 2 * dot * normal.x,
      y: this.dy - 2 * dot * normal.y,
    };

    // Нормализуем вектор отражения
    const length = Math.sqrt(
      reflection.x * reflection.x + reflection.y * reflection.y
    );
    const normalized = {
      x: reflection.x / length,
      y: reflection.y / length,
    };

    // Добавляем небольшое случайное отклонение
    const deviation = ((Math.random() - 0.5) * Math.PI) / 8; // Уменьшили до ±22.5 градусов
    const angle = Math.atan2(normalized.y, normalized.x) + deviation;

    // Применяем фиксированную скорость
    this.dx = Math.cos(angle) * this.speed;
    this.dy = Math.sin(angle) * this.speed;
  }

  draw(ctx) {
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
    this.thickness = 5;
    this.active = true;
    this.color = color;
    this.gradient = null;
    this.useGradient = false;
    this.glowSize = 0;
    this.lastCollisionTime = 0;
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

    // Проверяем множественные столкновения
    const now = performance.now();
    if (now - this.lastCollisionTime < 50) return false;

    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    const collisionRange = this.thickness + ball.radius;
    const distanceFromRing = Math.abs(distance - this.radius);

    // Шарик в диапазоне кольца?
    if (distanceFromRing <= collisionRange) {
      const ballAngle = Math.atan2(ball.y, ball.x);

      // Шарик не в проеме и движется к кольцу?
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

    // Отрисовываем кольцо с проёмом
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
    this.settingsBtn = document.getElementById("settingsButton");
    this.closeBtn = document.getElementById("closeSettings");
    this.saveBtn = document.getElementById("saveSettings");

    // Определяем диапазоны значений для валидации
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
    this.settingsBtn.addEventListener("click", () => this.openModal());
    this.closeBtn.addEventListener("click", () => this.closeModal());
    this.saveBtn.addEventListener("click", () => this.saveSettings());

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

  openModal() {
    this.modal.style.display = "block";
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

      // Валидация всех числовых значений
      Object.entries(this.ranges).forEach(([key]) => {
        settings[key] = this.validateValue(
          key,
          settings[key] ?? this.defaults[key]
        );
      });

      // Проверка булевых значений
      [
        "ballGradient",
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

      // Проверка цветов
      ["ballColor", "ringColor"].forEach((key) => {
        if (!/^#[0-9A-F]{6}$/i.test(settings[key])) {
          settings[key] = this.defaults[key];
        }
      });
    } catch (e) {
      console.error("Error loading settings:", e);
      settings = this.defaults;
    }

    // Обновляем значения в интерфейсе
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

    // Вычисляем масштаб, чтобы все кольца помещались на экране
    this.scale = Math.min(
      this.canvas.width / (maxRadius * 2.5),
      this.canvas.height / (maxRadius * 2.5)
    );
  }

  reset() {
    const gameSettings = this.settings.getSettings();
    this.updateCanvasSize();

    // Создаем шарик
    const ballRadius = Number(gameSettings.ballSize);
    this.ball = new Ball(0, 0, ballRadius, Number(gameSettings.ballSpeed));
    this.ball.color = gameSettings.ballColor;
    this.ball.useGradient = gameSettings.ballGradient;
    this.ball.glowSize = Number(gameSettings.ballGlow);
    this.ball.updateGradient(this.ctx);

    // Создаем кольца
    const ringCount = Number(gameSettings.ringCount);
    const baseRadius = 100;
    const radiusStep = 50;
    const baseSpeed = Number(gameSettings.ringSpeed) * 0.001;

    this.rings = Array.from({ length: ringCount }, (_, i) => {
      const radius = baseRadius + i * radiusStep;
      let speed;

      if (gameSettings.synchronizedMovement) {
        // Для синхронного движения скорость уменьшается с каждым кольцом
        speed = baseSpeed * (1 - i / ringCount);
      } else {
        // Для обычного движения чередуем направление
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
    this.gameLoop();
  }

  update() {
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
        this.reset();
      } else {
        this.resetButton.style.display = "block";
        return false;
      }
    }

    return true;
  }

  draw() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.scale, this.scale);

    for (let ring of this.rings) {
      ring.draw(this.ctx);
    }

    this.ball.draw(this.ctx);

    this.ctx.restore();
  }

  gameLoop() {
    if (this.update()) {
      this.draw();
      requestAnimationFrame(() => this.gameLoop());
    }
  }
}

window.onload = () => new Game();
