// 통합 커맨드 센터 패널 (우측) — 채팅 + 에이전트 로그 통합
class ReportPanel {
  constructor(onSend) {
    this.onSend = onSend;
    this._open = true;
    this._build();
  }

  _build() {
    // 패널
    this.panel = document.createElement('div');
    Object.assign(this.panel.style, {
      position: 'fixed', top: '0', right: '0',
      width: '320px', height: '100vh',
      background: '#0d1117',
      borderLeft: '1px solid #30363d',
      zIndex: '1500',
      display: 'flex', flexDirection: 'column',
      transition: 'right .3s ease',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.3)'
    });

    // ── 헤더 ──────────────────────────────────────────────────────
    const header = document.createElement('div');
    Object.assign(header.style, {
      padding: '20px',
      borderBottom: '1px solid #30363d',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexShrink: '0',
      background: '#161b22'
    });
    header.innerHTML = '<span style="font-size:14px;color:#58a6ff;font-weight:bold">🛠️ Command Center</span>';

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '지우기';
    Object.assign(clearBtn.style, {
      background: 'none', border: '1px solid #30363d', color: '#8b949e',
      fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
    });
    clearBtn.addEventListener('click', () => this.clear());
    header.appendChild(clearBtn);

    // ── 로그/채팅 영역 ─────────────────────────────────────────────
    this.log = document.createElement('div');
    Object.assign(this.log.style, {
      flex: '1', overflowY: 'auto', padding: '15px',
      fontSize: '12.5px', lineHeight: '1.6',
      background: '#0d1117',
    });

    // 빈 안내
    this.emptyMsg = document.createElement('div');
    Object.assign(this.emptyMsg.style, {
      color: '#484f58', fontSize: '13px', textAlign: 'center',
      marginTop: '60px', fontStyle: 'italic',
    });
    this.emptyMsg.textContent = '작업 요청을 입력하거나\n프로젝트를 로드하세요.';
    this.log.appendChild(this.emptyMsg);

    // ── 입력 영역 (통합) ──────────────────────────────────────────
    const inputContainer = document.createElement('div');
    Object.assign(inputContainer.style, {
      padding: '16px',
      borderTop: '1px solid #30363d',
      background: '#161b22',
      flexShrink: '0'
    });

    const inputRow = document.createElement('div');
    Object.assign(inputRow.style, {
      display: 'flex', gap: '8px', alignItems: 'flex-end'
    });

    this.input = document.createElement('textarea');
    Object.assign(this.input.style, {
      flex: '1', height: '60px', background: '#0d1117',
      border: '1px solid #30363d', borderRadius: '6px',
      color: '#c9d1d9', padding: '10px', fontSize: '13.5px',
      fontFamily: 'inherit', outline: 'none', resize: 'none'
    });
    this.input.placeholder = 'Master에게 명령 입력...';

    this.sendBtn = document.createElement('button');
    this.sendBtn.textContent = '전송';
    Object.assign(this.sendBtn.style, {
      padding: '10px 16px', background: '#238636',
      border: 'none', borderRadius: '6px',
      color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
    });

    inputRow.append(this.input, this.sendBtn);
    inputContainer.appendChild(inputRow);

    this.panel.appendChild(header);
    this.panel.appendChild(this.log);
    this.panel.appendChild(inputContainer);
    document.body.appendChild(this.panel);

    this.sendBtn.addEventListener('click', () => this._send());
    this.input.addEventListener('keydown', e => { 
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._send();
      }
    });
  }

  _send() {
    const msg = this.input.value.trim();
    if (!msg) return;
    this.addChatEntry('Chris', msg, '#58a6ff');
    if (this.onSend) this.onSend(msg);
    this.input.value = '';
  }

  // 기존 Agent Log 형식 (인수인계 등)
  addEntry(from, to, message) {
    if (this.emptyMsg.parentNode) this.emptyMsg.remove();
    this._appendEntry({
      type: 'agent',
      from, to, text: message
    });
  }

  // 채팅 형식 (Master-Chris 대화)
  addChatEntry(from, text, color) {
    if (this.emptyMsg.parentNode) this.emptyMsg.remove();
    this._appendEntry({
      type: 'chat',
      from, text, color
    });
  }

  addSystemMsg(text) {
    if (this.emptyMsg.parentNode) this.emptyMsg.remove();
    const line = document.createElement('div');
    Object.assign(line.style, {
      color: '#58a6ff', fontSize: '11px', fontStyle: 'italic',
      padding: '8px 0', marginBottom: '8px', textAlign: 'center',
      borderTop: '1px dashed #30363d', borderBottom: '1px dashed #30363d'
    });
    line.textContent = `— ${text} —`;
    this.log.appendChild(line);
    this.log.scrollTop = this.log.scrollHeight;
  }

  _appendEntry(data) {
    const time = new Date().toLocaleTimeString('ko-KR', {
      hour12: false, hour: '2-digit', minute: '2-digit'
    });
    
    const colors = {
      master: '#ffcc00', planner: '#bd7fe8', visionary: '#f1c40f', 'red-team': '#ff4d4d',
      developer: '#4cd97b', reviewer: '#f0a050', qa: '#1fc9a8', debugger: '#e74c3c', Chris: '#58a6ff',
    };
    
    const entry = document.createElement('div');
    entry.style.marginBottom = '14px';

    if (data.type === 'agent') {
      const fromColor = colors[data.from] || '#aaa';
      const toColor   = colors[data.to]   || '#aaa';
      
      entry.innerHTML = `
        <div style="font-size:10px;color:#484f58;margin-bottom:3px">${time} (Agent Relay)</div>
        <div style="font-size:12px;margin-bottom:4px">
          <span style="color:${fromColor};font-weight:bold">${data.from}</span>
          <span style="color:#484f58"> ▶ </span>
          <span style="color:${toColor};font-weight:bold">${data.to}</span>
        </div>
        <div style="background:#0d1117;border-left:3px solid ${fromColor};padding:6px 10px;color:#8b949e;font-size:11.5px;white-space:pre-wrap;">${data.text}</div>
      `;
    } else {
      const fromColor = data.from === 'Chris' ? '#58a6ff' : '#ffcc00';
      const fromLabel = data.from === 'master' ? '👑 Master' : data.from;
      
      entry.innerHTML = `
        <div style="font-size:10px;color:#484f58;margin-bottom:3px">${time}</div>
        <div style="font-size:13px;margin-bottom:4px">
          <span style="color:${fromColor};font-weight:bold">${fromLabel}</span>
        </div>
        <div style="color:#e6edf3;white-space:pre-wrap;word-break:break-word;">${data.text}</div>
      `;
    }

    this.log.appendChild(entry);
    this.log.scrollTop = this.log.scrollHeight;
  }

  clear() {
    this.log.innerHTML = '';
    this.log.appendChild(this.emptyMsg);
  }

  setEnabled(enabled) {
    this.input.disabled = !enabled;
    this.sendBtn.disabled = !enabled;
    this.input.style.opacity = enabled ? '1' : '0.4';
    this.sendBtn.style.opacity = enabled ? '1' : '0.4';
  }
}
