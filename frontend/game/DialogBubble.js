// 말풍선 컴포넌트
class DialogBubble {
  constructor(scene, x, y, text, duration = 4000) {
    this.scene = scene;
    this._objects = [];

    const MAX_W = 180;
    const PAD = 10;

    const txt = scene.add.text(x, y, text, {
      fontSize: '11px',
      color: '#ffffff',
      wordWrap: { width: MAX_W },
      lineSpacing: 3,
    }).setOrigin(0.5, 1).setDepth(30);

    const b = txt.getBounds();
    const rw = b.width + PAD * 2;
    const rh = b.height + PAD * 2;

    const bg = scene.add.graphics().setDepth(29);
    bg.fillStyle(0x1a1a2e, 0.92);
    bg.fillRoundedRect(b.left - PAD, b.top - PAD, rw, rh, 6);
    bg.lineStyle(1, 0x4a90d9, 0.8);
    bg.strokeRoundedRect(b.left - PAD, b.top - PAD, rw, rh, 6);

    // 꼬리 삼각형
    const cx = b.centerX;
    const by = b.bottom + PAD;
    bg.fillStyle(0x1a1a2e, 0.92);
    bg.fillTriangle(cx - 6, by, cx + 6, by, cx, by + 8);

    this._objects = [bg, txt];

    // auto-dismiss
    scene.time.delayedCall(duration, () => this.destroy());
  }

  destroy() {
    this._objects.forEach(o => { if (o && o.active) o.destroy(); });
    this._objects = [];
  }
}
