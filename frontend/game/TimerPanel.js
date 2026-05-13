class TimerPanel {
  constructor(scene) {
    this.scene = scene;
    this.stats = {};
    this._build();
  }

  _build() {
    this.panel = document.createElement('div');
    Object.assign(this.panel.style, {
      position: 'fixed', bottom: '20px', left: '252px', // 하단 좌측으로 이동
      background: 'rgba(28, 33, 40, 0.9)',
      border: '1px solid #444c56', borderRadius: '8px',
      padding: '12px', zIndex: '100',
      display: 'flex', flexDirection: 'column', gap: '5px',
      backdropFilter: 'blur(8px)', minWidth: '160px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
    });

    const title = document.createElement('div');
    title.innerHTML = '<span style="color:#58a6ff;font-size:11px;font-weight:bold;">SQUAD STATUS</span>';
    this.panel.appendChild(title);

    // 8인 에이전트 모두 추적
    const agents = ['master', 'planner', 'visionary', 'red-team', 'developer', 'reviewer', 'qa', 'debugger'];
    agents.forEach(name => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.fontSize = '10.5px';
      row.style.gap = '12px';
      row.style.marginBottom = '2px';

      const label = document.createElement('span');
      label.textContent = name.charAt(0).toUpperCase() + name.slice(1);
      label.style.color = '#8b949e';

      const statusWrap = document.createElement('div');
      statusWrap.style.textAlign = 'right';

      const statusText = document.createElement('div');
      statusText.textContent = 'IDLE';
      statusText.style.color = '#484f58';
      statusText.style.fontWeight = 'bold';
      statusText.style.fontSize = '9px';

      const timeText = document.createElement('div');
      timeText.textContent = '0.0s';
      timeText.style.color = '#484f58';
      timeText.style.fontSize = '9px';

      statusWrap.append(statusText, timeText);
      row.append(label, statusWrap);
      this.panel.appendChild(row);

      this.stats[name] = {
        statusText, timeText, 
        startTime: 0, elapsed: 0, active: false
      };
    });

    document.body.appendChild(this.panel);
  }

  setStatus(name, status) {
    const s = this.stats[name];
    if (!s) return;

    const labels = {
      idle: 'IDLE',
      working: 'WORKING',
      waiting: 'WAITING',
      communicating: 'RELAY',
      done: 'DONE',
      error: 'ERROR'
    };
    const colors = {
      idle: '#484f58', working: '#ffcc00', waiting: '#58a6ff', 
      communicating: '#3498db', done: '#2ecc71', error: '#f85149'
    };

    s.statusText.textContent = labels[status] || status.toUpperCase();
    s.statusText.style.color = colors[status] || '#8b949e';

    if (status === 'working') {
      s.active = true;
      s.startTime = Date.now() - (s.elapsed * 1000);
      s.timeText.style.color = '#c9d1d9';
    } else if (status === 'idle') {
      s.active = false;
      s.timeText.style.color = '#484f58';
    } else {
      s.active = false;
      s.timeText.style.color = '#8b949e';
    }
  }

  update() {
    const now = Date.now();
    Object.values(this.stats).forEach(s => {
      if (s.active) {
        s.elapsed = (now - s.startTime) / 1000;
        s.timeText.textContent = s.elapsed.toFixed(1) + 's';
      }
    });
  }
}
