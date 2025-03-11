class Ball {
  constructor(x, y, radius, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.maxSpeed = speed * 1.5;

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
    const dot = this.dx * normal.x + this.dy * normal.y;
    const reflection = {
      x: this.dx - 2 * dot * normal.x,
      y: this.dy - 2 * dot * normal.y,
    };

    // Добавляем случайное отклонение к отражению
    const angle = Math.atan2(reflection.y, reflection.x);
    const deviation = ((Math.random() - 0.5) * Math.PI) / 6;

    // Увеличиваем скорость после отскока
    const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    const newSpeed = Math.min(currentSpeed * 1.1, this.maxSpeed);

    this.dx = Math.cos(angle + deviation) * newSpeed;
    this.dy = Math.sin(angle + deviation) * newSpeed;
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
    this.thickness = 5;
    this.active = true;
    this.color = color;
    this.gradient = null;
    this.useGradient = false;
    this.glowSize = 0;
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

  rotate() {
    this.angle += this.rotationSpeed;
  }

  checkCollision(ball) {
    if (!this.active) return false;

    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);

    if (Math.abs(distance - this.radius) <= this.thickness + ball.radius) {
      const ballAngle = Math.atan2(ball.y, ball.x);
      let relativeAngle = (ballAngle - this.angle) % (Math.PI * 2);
      if (relativeAngle < 0) relativeAngle += Math.PI * 2;

      if (
        relativeAngle > this.gapSize &&
        relativeAngle < Math.PI * 2 - this.gapSize
      ) {
        return {
          x: ball.x / distance,
          y: ball.y / distance,
        };
      }
    }

    if (distance > this.radius + this.thickness + ball.radius) {
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
    ctx.arc(
      0,
      0,
      this.radius,
      this.angle + this.gapSize,
      this.angle + Math.PI * 2 - this.gapSize
    );

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
      ballSize: 10,
      ballSpeed: 8,
      ballGlow: 0,
      ballColor: "#ffffff",
      ballGradient: false,
      ringCount: 5,
      ringSpeed: 10,
      gapSize: 45,
      ringGlow: 0,
      ringColor: "#ffffff",
      ringGradient: false,
      randomRingColors: false,
      synchronizedMovement: false,
      infiniteMode: false,
    };

    this.setupEventListeners();
    this.loadSettings();
  }

  setupEventListeners() {
    this.settingsBtn.addEventListener("click", () => this.openModal());
    this.closeBtn.addEventListener("click", () => this.closeModal());
    this.saveBtn.addEventListener("click", () => this.saveSettings());

    Object.entries(this.inputs).forEach(([key, input]) => {
      if (input.type === "range") {
        input.addEventListener("input", () => {
          if (key === "gapSize") {
            this.valueDisplays[key].textContent = input.value + "°";
          } else {
            this.valueDisplays[key].textContent = input.value;
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
    const saved = localStorage.getItem("gameSettings");
    const settings = saved ? JSON.parse(saved) : this.defaults;

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
      settings[key] = input.type === "checkbox" ? input.checked : input.value;
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
