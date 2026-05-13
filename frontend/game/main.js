// Phaser 게임 초기화
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0b0c14',
  scene: [WorldScene],
  pixelArt: true, // 폰트 및 그래픽 흐림 방지 (핵심)
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true, // 픽셀 반올림으로 글자 뭉개짐 방지
    resolution: window.devicePixelRatio || 1,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    width: 900,
    height: 450,
    expandParent: false,
  },
});

// 엔진 전환 버튼
document.querySelectorAll('.engine-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const scene = game.scene.getScene('WorldScene');
    if (!scene) { console.warn('Scene not ready'); return; }
    const ws = scene.ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'switch_engine', engine: btn.dataset.engine }));
    } else {
      console.warn('WS not open, readyState:', ws ? ws.readyState : 'no ws');
    }
  });
});
