// 에이전트 클릭 시 상세 모달 (채팅 히스토리 + 프로필)
class AgentModal {
  constructor() {
    this._visible  = false;
    this._agent    = null;
    this._onSendCb = null;
    this._ws       = null;
    this._build();
  }

  get isOpen()      { return this._visible; }
  get currentAgent(){ return this._agent; }

  _build() {
    // 딤 오버레이
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      display: 'none', position: 'fixed', inset: '0',
      background: 'rgba(0,0,0,0.72)', zIndex: '2000',
      justifyContent: 'center', alignItems: 'center',
    });

    // 모달 박스
    this.box = document.createElement('div');
    Object.assign(this.box.style, {
      width: '720px', height: '580px',
      background: '#0b1220',
      border: '1px solid #1e3050',
      borderRadius: '14px',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.9)',
    });

    // ── 헤더 ──────────────────────────────────────────────────────
    this.header = document.createElement('div');
    Object.assign(this.header.style, {
      display: 'flex', alignItems: 'center',
      padding: '18px 22px', gap: '16px',
      borderBottom: '1px solid #111e30',
      flexShrink: '0',
    });

    this.avatarEl = document.createElement('div');
    Object.assign(this.avatarEl.style, {
      width: '56px', height: '56px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '26px', flexShrink: '0',
    });

    const info = document.createElement('div');
    info.style.flex = '1';

    this.agentNameEl  = document.createElement('div');
    Object.assign(this.agentNameEl.style, { fontSize: '18px', color: '#e8f0ff', fontWeight: '700', marginBottom: '3px' });

    this.agentRoleEl  = document.createElement('div');
    Object.assign(this.agentRoleEl.style, { fontSize: '12px', color: '#4a6a8a' });

    this.agentStatEl  = document.createElement('div');
    Object.assign(this.agentStatEl.style, { fontSize: '11px', color: '#2ecc71', marginTop: '4px' });

    info.append(this.agentNameEl, this.agentRoleEl, this.agentStatEl);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, {
      background: 'none', border: 'none', color: '#4a6a8a',
      fontSize: '20px', cursor: 'pointer', padding: '4px 8px', lineHeight: '1',
    });
    closeBtn.addEventListener('click', () => this.close());

    this.header.append(this.avatarEl, info, closeBtn);

    // ── 탭 메뉴 ──
    this.tabs = document.createElement('div');
    Object.assign(this.tabs.style, {
      display: 'flex', background: '#0d1626', borderBottom: '1px solid #111e30', flexShrink: '0',
    });
    
    this.tabHistory = this._createTab('활동 기록', true);
    this.tabProfile = this._createTab('전문가 프로필', false);
    this.tabs.append(this.tabHistory, this.tabProfile);

    // ── 콘텐츠 영역 ──
    this.contentWrap = document.createElement('div');
    Object.assign(this.contentWrap.style, { flex: '1', position: 'relative', overflow: 'hidden', background: '#0b1220' });

    this.log = document.createElement('div');
    Object.assign(this.log.style, {
      position: 'absolute', inset: '0', overflowY: 'auto', padding: '16px 22px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    });

    this.profileArea = document.createElement('div');
    Object.assign(this.profileArea.style, {
      position: 'absolute', inset: '0', overflowY: 'auto', padding: '24px 28px',
      display: 'none', color: '#c9d1d9', fontSize: '13.5px', lineHeight: '1.7',
      fontFamily: "'Segoe UI', sans-serif", background: '#0d1117'
    });

    this.contentWrap.append(this.log, this.profileArea);

    // ── 입력 영역 ──
    this.inputArea = document.createElement('div');
    Object.assign(this.inputArea.style, {
      display: 'flex', gap: '8px', padding: '12px 22px',
      borderTop: '1px solid #111e30', flexShrink: '0', background: '#0b1220'
    });

    this.inputEl = document.createElement('input');
    Object.assign(this.inputEl.style, {
      flex: '1', background: '#07101e', border: '1px solid #1e3050',
      borderRadius: '8px', padding: '9px 14px',
      color: '#e0eaff', fontSize: '13px', outline: 'none',
    });
    this.inputEl.placeholder = 'Master에게 메시지 입력...';

    this.sendBtn = document.createElement('button');
    this.sendBtn.textContent = '전송';
    Object.assign(this.sendBtn.style, {
      padding: '9px 20px', background: '#1a3a6a',
      border: '1px solid #2a5090', borderRadius: '8px',
      color: '#7abfff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
    });
    this.inputArea.append(this.inputEl, this.sendBtn);
    this.sendBtn.addEventListener('click', () => this._send());
    this.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') this._send(); });

    this.box.append(this.header, this.tabs, this.contentWrap, this.inputArea);
    this.overlay.appendChild(this.box);
    document.body.appendChild(this.overlay);
    this.overlay.addEventListener('click', e => { if (e.target === this.overlay) this.close(); });
  }

  _createTab(label, active) {
    const btn = document.createElement('div');
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: '12px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
      color: active ? '#58a6ff' : '#8b949e',
      borderBottom: active ? '2px solid #58a6ff' : 'none',
      transition: '0.2s'
    });
    btn.onclick = () => this._switchTab(label.includes('기록'));
    return btn;
  }

  _switchTab(showHistory) {
    this.tabHistory.style.color = showHistory ? '#58a6ff' : '#8b949e';
    this.tabHistory.style.borderBottom = showHistory ? '2px solid #58a6ff' : 'none';
    this.tabProfile.style.color = !showHistory ? '#58a6ff' : '#8b949e';
    this.tabProfile.style.borderBottom = !showHistory ? '2px solid #58a6ff' : 'none';
    
    this.log.style.display = showHistory ? 'flex' : 'none';
    this.profileArea.style.display = !showHistory ? 'block' : 'none';
    this.inputArea.style.display = (showHistory && this._agent === 'master') ? 'flex' : 'none';
  }

  open(agentName, agentInfo, messages, onSend, ws) {
    this._agent    = agentName;
    this._onSendCb = onSend;
    this._ws       = ws;

    this.avatarEl.textContent = agentInfo.emoji;
    this.avatarEl.style.background = agentInfo.color + '28';
    this.avatarEl.style.border     = `2px solid ${agentInfo.color}`;
    this.agentNameEl.textContent   = agentInfo.label;
    this.agentRoleEl.textContent   = agentInfo.role;
    this.agentStatEl.textContent   = `● ${agentInfo.status}  |  메시지 ${messages.length}건`;
    this.agentStatEl.style.color   = agentInfo.status === 'idle' ? '#4a6a8a' : '#2ecc71';

    this.log.innerHTML = '';
    if (messages.length === 0) {
      this.log.innerHTML = '<div style="color:#2a4060;text-align:center;padding:50px 0;fontSize:13px">아직 활동 내역이 없습니다.</div>';
    } else {
      messages.forEach(m => this._appendBubble(m));
    }
    this.log.scrollTop = this.log.scrollHeight;

    // 프로필 데이터 요청
    this.profileArea.innerHTML = '<div style="color:#4a6a8a;text-align:center;padding:60px;">전문가 프로필을 불러오는 중...</div>';
    if (this._ws) {
      this._ws.send(JSON.stringify({ type: 'get_agent_profile', agent: agentName }));
    }

    this._switchTab(true);
    this.overlay.style.display = 'flex';
    this._visible = true;
  }

  setProfile(content) {
    if (!content) {
      this.profileArea.textContent = '프로필 정보가 없습니다.';
      return;
    }
    // 간단한 MD 렌더링
    const html = content
      .replace(/^# (.*$)/gm, '<h1 style="color:#58a6ff;border-bottom:1px solid #30363d;padding-bottom:10px;margin-bottom:20px;font-size:22px;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="color:#58a6ff;margin:25px 0 12px 0;font-size:18px;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="color:#7abfff;margin:18px 0 10px 0;font-size:15px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff;">$1</strong>')
      .replace(/- (.*$)/gm, '<li style="margin-left:15px;margin-bottom:6px;">$1</li>')
      .replace(/\n/g, '<br>');
    
    this.profileArea.innerHTML = `<div style="padding-bottom:50px;">${html}</div>`;
  }

  addLiveMessage(msg) {
    if (!this._visible) return;
    this._appendBubble(msg);
    this.log.scrollTop = this.log.scrollHeight;
  }

  _appendBubble({ from, text, time }) {
    const isUser = from === 'Chris';
    const colors  = {
      master: '#f5c842', planner: '#bd7fe8', visionary: '#f1c40f', 'red-team': '#e74c3c',
      developer: '#4cd97b', reviewer: '#f0a050', qa: '#1fc9a8', debugger: '#e74c3c', Chris: '#58a6ff',
    };
    const c = colors[from] || '#aaa';

    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '10px', alignItems: 'flex-start', margin: '6px 0'
    });

    const av = document.createElement('div');
    Object.assign(av.style, {
      width: '32px', height: '32px', borderRadius: '50%',
      background: c + '22', border: `1px solid ${c}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', color: c, fontWeight: 'bold', flexShrink: '0',
    });
    av.textContent = from[0].toUpperCase();

    const col = document.createElement('div');
    col.style.maxWidth = '80%';

    const label = document.createElement('div');
    Object.assign(label.style, {
      fontSize: '11px', color: c, opacity: '0.8', marginBottom: '5px',
      textAlign: isUser ? 'right' : 'left',
    });
    label.textContent = `${from}  ${time}`;

    const bubble = document.createElement('div');
    Object.assign(bubble.style, {
      background: isUser ? '#1c2d4a' : '#161b22',
      border: `1px solid ${isUser ? '#388bfd' : '#30363d'}`,
      borderRadius: isUser ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
      padding: '10px 15px', fontSize: '13px', color: '#c9d1d9',
      lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    });
    bubble.textContent = text;

    col.append(label, bubble);
    row.append(av, col);
    this.log.appendChild(row);
  }

  _send() {
    const text = this.inputEl.value.trim();
    if (!text || !this._onSendCb) return;
    this._onSendCb(text);
    this.inputEl.value = '';
  }

  close() {
    this.overlay.style.display = 'none';
    this._visible = false;
  }
}
