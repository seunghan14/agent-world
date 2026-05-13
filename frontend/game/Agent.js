// 에이전트 아바타 2.0 - 고유 개성 및 기능 강화
class AgentNode {
  constructor(scene, { name, label, homeX, homeY, color }) {
    this.scene      = scene;
    this.name       = name;
    this.label      = label;
    this.homeX      = homeX;
    this.homeY      = homeY;
    this.color      = color;
    this.status     = 'idle';
    this._onClickCb = null;
    this._pulseTimer = null;
    this._bubbleEl  = null;
    this._build();
  }

  _build() {
    const s = this.scene;
    this.shadowGfx = s.add.graphics();
    this._drawShadow();

    this.bodyGfx = s.add.graphics();
    this._drawBody();

    this.headGfx = s.add.graphics();
    this._drawHead();

    this.ledBar = s.add.graphics();
    this._drawLED(0x334455);

    this.nameText = s.add.text(0, 34, this.label, {
      fontSize: '10px', color: '#ffffff',
      fontFamily: '"Segoe UI", sans-serif', fontStyle: 'bold',
      backgroundColor: '#1a1a2edd', padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 0);

    this.container = s.add.container(this.homeX, this.homeY, [
      this.shadowGfx, this.bodyGfx, this.headGfx, this.ledBar, this.nameText,
    ]).setDepth(10);

    this.hitZone = s.add.rectangle(this.homeX, this.homeY, 60, 90, 0, 0)
      .setInteractive({ cursor: 'pointer' }).setDepth(11);

    this.hitZone.on('pointerover', () => s.tweens.add({ targets: this.container, scaleX: 1.15, scaleY: 1.15, duration: 150, ease: 'Back.easeOut' }));
    this.hitZone.on('pointerout',  () => s.tweens.add({ targets: this.container, scaleX: 1, scaleY: 1, duration: 150 }));
    this.hitZone.on('pointerdown', () => { if (this._onClickCb) this._onClickCb(this.name); });
  }

  _drawShadow() {
    const g = this.shadowGfx; g.clear(); g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 30, 36, 12);
  }

  _drawBody() {
    const g = this.bodyGfx; g.clear(); const c = this.color;
    
    // ── 아바타별 복장 차별화 ─────────────────────────────────────
    switch(this.name) {
      case 'master': // 리더의 코트
        g.fillStyle(c, 1); g.fillRoundedRect(-12, 0, 24, 22, 4);
        g.lineStyle(2, 0xffd700, 0.7); g.strokeRoundedRect(-12, 0, 24, 22, 4);
        break;
      case 'developer': // 후드티
        g.fillStyle(c, 0.9); g.fillRoundedRect(-11, 0, 22, 20, 6);
        g.fillStyle(0x000000, 0.2); g.fillCircle(0, 6, 6); // 후드 주머니 느낌
        break;
      case 'reviewer': // 셔츠와 넥타이
        g.fillStyle(0xffffff, 0.9); g.fillRoundedRect(-10, 0, 20, 18, 2);
        g.fillStyle(c, 1); g.fillRect(-1.5, 4, 3, 10); // 넥타이
        break;
      default: // 일반 작업복
        g.fillStyle(c, 0.85); g.fillRoundedRect(-10, 0, 20, 18, 3);
    }

    // 하의 및 신발
    g.fillStyle(0x1e2d44, 1); g.fillRoundedRect(-9, 17, 8, 12, 2); g.fillRoundedRect(1, 17, 8, 12, 2);
    g.fillStyle(0x0a0e14, 1); g.fillEllipse(-5, 30, 12, 6); g.fillEllipse(5, 30, 12, 6);
  }

  _drawHead() {
    const g = this.headGfx; g.clear(); const c = this.color;
    g.fillStyle(0xf5e0c0, 1); g.fillRoundedRect(-3, -5, 6, 7, 1); // 목
    g.fillCircle(0, -15, 12); // 얼굴

    // ── 헤어스타일 및 특징 디자인 ───────────────────────────────
    g.fillStyle(c, 1);
    if (this.name === 'master') {
      g.fillEllipse(0, -25, 28, 16); // 풍성한 머리
    } else if (this.name === 'developer') {
      g.fillEllipse(0, -24, 22, 13);
      g.fillStyle(0x222222, 1); // 대형 헤드셋
      g.fillRect(-14, -22, 28, 4); g.fillCircle(-14, -15, 6); g.fillCircle(14, -15, 6);
    } else if (this.name === 'reviewer') {
      g.fillEllipse(0, -24, 22, 12);
      g.lineStyle(1.5, 0xffffff, 0.9); // 지적인 안경
      g.strokeCircle(-5, -15, 4.5); g.strokeCircle(5, -15, 4.5); g.lineBetween(-1, -15, 1, -15);
    } else if (this.name === 'planner') {
      g.fillRect(-12, -26, 24, 8); // 정갈한 머리
    } else {
      g.fillEllipse(0, -24, 22, 13);
    }

    // 눈
    g.fillStyle(0x1a1a2e, 1); g.fillCircle(-4, -15, 2.2); g.fillCircle(4, -15, 2.2);
    g.fillStyle(0xffffff, 1); g.fillCircle(-3.5, -15.5, 0.8); g.fillCircle(4.5, -15.5, 0.8);

    this._drawRoleBadge(g, c);
  }

  _drawRoleBadge(g, c) {
    g.setDepth(15);
    switch (this.name) {
      case 'master': g.fillStyle(0xffd700, 1); g.fillTriangle(-6,-32, 0,-38, 6,-32); break;
      case 'planner': g.fillStyle(0xffffff, 0.8); g.fillRect(-4, -36, 8, 2); break;
      case 'red-team': g.fillStyle(0xe74c3c, 1); g.fillTriangle(-7,-38, 7,-38, 0,-28); break;
      case 'visionary': g.fillStyle(0xf1c40f, 1); g.fillCircle(0, -34, 5); break;
    }
  }

  onClick(cb) { this._onClickCb = cb; }

  _drawLED(color) {
    const g = this.ledBar; g.clear();
    g.fillStyle(0x000000, 0.9); g.fillRoundedRect(-14, -45, 28, 5, 1);
    g.fillStyle(color, 1); g.fillRoundedRect(-13, -44, 26, 3, 1);
    if (color !== 0x334455) {
      g.lineStyle(1, color, 0.5); g.strokeRoundedRect(-15, -46, 30, 7, 2);
    }
  }

  setStatus(status) {
    this.status = status;
    const palette = { idle: 0x334455, working: 0xffcc00, waiting: 0x58a6ff, communicating: 0x3498db, done: 0x2ecc71, error: 0xe74c3c };
    const c = palette[status] || palette.idle;
    this._drawLED(c);

    if (this._pulseTimer) { this._pulseTimer.remove(); this._pulseTimer = null; }
    if (status === 'working' || status === 'communicating') {
      let up = false;
      this._pulseTimer = this.scene.time.addEvent({
        delay: 400, repeat: -1,
        callback: () => {
          up = !up;
          this.scene.tweens.add({ targets: this.headGfx, y: up ? -2 : 0, duration: 350 });
          this.ledBar.alpha = up ? 0.4 : 1;
        },
      });
    } else {
      this.ledBar.alpha = 1; this.scene.tweens.add({ targets: this.headGfx, y: 0, duration: 200 });
    }
  }

  showBubble(text) {
    this.clearBubble();
    const short = text.length > 70 ? text.slice(0, 70) + '…' : text;
    this._bubbleEl = this.scene.add.text(0, -85, short, {
      fontSize: '11px', color: '#ffffff', backgroundColor: '#0d1117f2',
      padding: { x: 12, y: 8 }, wordWrap: { width: 200 },
      fontFamily: '"Segoe UI", sans-serif', lineSpacing: 4,
    }).setOrigin(0.5, 1).setDepth(100);
    this.container.add(this._bubbleEl);
    // 버블 테두리 효과
    this.scene.add.graphics().lineStyle(1, 0x30363d, 1).strokeRoundedRect(this._bubbleEl.x - this._bubbleEl.width/2, this._bubbleEl.y - this._bubbleEl.height, this._bubbleEl.width, this._bubbleEl.height, 6).setDepth(101);
  }

  clearBubble() { if (this._bubbleEl) { this._bubbleEl.destroy(); this._bubbleEl = null; } }

  moveTo(x, y, onArrival) {
    this.scene.tweens.add({
      targets: this.container, x: x || this.homeX, y: y || this.homeY,
      duration: 900, ease: 'Cubic.easeInOut',
      onUpdate: () => this.hitZone.setPosition(this.container.x, this.container.y),
      onComplete: () => { if (onArrival) onArrival(); }
    });
  }

  returnHome() { this.moveTo(this.homeX, this.homeY, null); }
}
const AgentSprite = AgentNode;
