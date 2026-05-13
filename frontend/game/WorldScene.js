class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
    this.agents      = {};
    this.timerPanel  = null;
    this.reportPanel = null;
    this.agentModal  = null;
    this.ws          = null;
    this.agentLogs   = {};
    this.currentProjectId = null;
  }

  static get AGENT_INFO() {
    return {
      master:    { label: 'Master',    role: 'Plan Lead',         emoji: '👑', color: '#e6a817', hex: 0xe6a817 },
      planner:   { label: 'Planner',   role: 'Architect',         emoji: '📋', color: '#9b59b6', hex: 0x9b59b6 },
      'red-team': { label: 'Red-Team', role: 'Risk Audit',        emoji: '🛡️', color: '#e74c3c', hex: 0xe74c3c },
      visionary: { label: 'Visionary', role: 'Innovation',        emoji: '💡', color: '#f1c40f', hex: 0xf1c40f },
      developer: { label: 'Developer', role: 'Engineer',          emoji: '💻', color: '#27ae60', hex: 0x27ae60 },
      reviewer:  { label: 'Reviewer',  role: 'Code Review',       emoji: '🔍', color: '#e67e22', hex: 0xe67e22 },
      qa:        { label: 'QA',        role: 'Quality Assurance', emoji: '✅', color: '#16a085', hex: 0x16a085 },
      debugger:  { label: 'Debugger',  role: 'SRE / Debug',       emoji: '🔧', color: '#c0392b', hex: 0xc0392b },
    };
  }

  // ── 에이전트 홈 위치 (상단: 전략팀 / 하단: 실행팀) ───────────
  static get AGENT_POSITIONS() {
    return {
      master:    { x: 100, y: 130 },
      planner:   { x: 300, y: 130 },
      'red-team': { x: 500, y: 130 },
      visionary: { x: 700, y: 130 },
      developer: { x: 300, y: 330 },
      reviewer:  { x: 500, y: 330 },
      qa:        { x: 700, y: 330 },
      debugger:  { x: 860, y: 330 },
    };
  }

  create() {
    Object.keys(WorldScene.AGENT_INFO).forEach(n => { this.agentLogs[n] = []; });
    this._drawBackground();
    this._drawWorkstations();
    this._createAgents();

    this.timerPanel  = new TimerPanel(this);
    this.reportPanel = new ReportPanel(msg => this._sendChat(msg));
    this.agentModal  = new AgentModal();

    this._setupSidebar();
    this._connectWS();

    // 휠 스크롤 방향 교정: 줌/팬 비활성화 및 정방향 처리
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      // 캔버스 내 스크롤이 필요할 경우 여기서 정방향 로직 구현 가능
    });
  }

  _setupSidebar() {
    const btnNew = document.getElementById('btn-new-project');
    if (btnNew) btnNew.onclick = () => this.ws.send(JSON.stringify({ type: 'new_project' }));
  }

  _renderProjectList(projects) {
    const list = document.getElementById('project-list');
    if (!list) return;
    list.innerHTML = '';
    projects.forEach(p => {
      const item = document.createElement('div');
      item.className = 'project-item';
      if (p.id === this.currentProjectId) item.classList.add('active');
      
      const title = document.createElement('span');
      title.className = 'project-title';
      title.textContent = p.title;
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-project';
      delBtn.innerHTML = '✕';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`'${p.title}' 프로젝트를 삭제하시겠습니까?`)) {
          this.ws.send(JSON.stringify({ type: 'delete_project', project_id: p.id }));
        }
      };

      item.append(title, delBtn);
      item.onclick = () => this.ws.send(JSON.stringify({ type: 'load_project', project_id: p.id }));
      list.appendChild(item);
    });
  }

  _drawBackground() {
    const g = this.add.graphics();
    const W = 1000, H = 500;

    // ── 바닥 베이스 (훨씬 밝은 스튜디오 그레이) ──
    g.fillStyle(0x3e4554, 1);
    g.fillRect(0, 0, W, H);
    
    // 격자 라인 (밝은 대비)
    g.lineStyle(1, 0x4d5566, 0.8);
    for (let x = 0; x <= W; x += 50) g.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 50) g.lineBetween(0, y, W, y);

    // 구역 분리 강조 (블루 테크니컬 라인)
    g.lineStyle(2, 0x58a6ff, 0.3);
    g.strokeRoundedRect(20, 40, 960, 420, 15);

    this.add.text(500, 15, 'CHRIS AI CODE-FORGE STUDIO', {
      fontSize: '12px', color: '#ffffff90', fontFamily: 'monospace', letterSpacing: 4, fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 하단 구역 라벨
    this.add.text(500, 465, 'SQUAD FLOW: PLANNING ➔ STRATEGY ➔ EXECUTION ➔ QUALITY', {
      fontSize: '9px', color: '#ffffff20', fontFamily: 'monospace', letterSpacing: 2
    }).setOrigin(0.5, 0);
  }

  _drawWorkstations() {
    Object.entries(WorldScene.AGENT_POSITIONS).forEach(([name, pos]) => {
      this._drawDesk(pos.x, pos.y, WorldScene.AGENT_INFO[name].hex);
    });
  }

  _drawDesk(x, y, color) {
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(color, 0.08); g.fillRoundedRect(x - 55, y - 60, 110, 90, 10);
    g.fillStyle(0x182435, 1); g.fillRoundedRect(x - 40, y - 55, 80, 22, 4);
    g.lineStyle(1, color, 0.3); g.strokeRoundedRect(x - 40, y - 55, 80, 22, 4);
    // 모니터 글로우
    g.fillStyle(color, 0.2); g.fillEllipse(x, y - 75, 40, 15);
  }

  _createAgents() {
    Object.entries(WorldScene.AGENT_POSITIONS).forEach(([name, pos]) => {
      const info = WorldScene.AGENT_INFO[name];
      this.agents[name] = new AgentNode(this, { name, label: info.label, homeX: pos.x, homeY: pos.y, color: info.hex });
      this.agents[name].onClick(n => this._openModal(n));
    });
  }

  _animateFlow(fromName, toName) {
    const fa = this.agents[fromName], ta = this.agents[toName];
    if (!fa || !ta) return;
    const dot = this.add.circle(fa.container.x, fa.container.y, 4, fa.color, 0.8).setDepth(16);
    this.tweens.add({ targets: dot, x: ta.homeX, y: ta.homeY, duration: 700, ease: 'Power2', onComplete: () => dot.destroy() });
  }

  _log(agentName, from, text) {
    if (!this.agentLogs[agentName]) return;
    const entry = { from, text, time: new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }) };
    this.agentLogs[agentName].push(entry);
    if (this.agentModal && this.agentModal.isOpen && this.agentModal.currentAgent === agentName) this.agentModal.addLiveMessage(entry);
  }

  _openModal(name) {
    const agent = this.agents[name];
    this.agentModal.open(name, { ...WorldScene.AGENT_INFO[name], status: agent.status }, this.agentLogs[name] || [], msg => this._sendChat(msg), this.ws);
  }

  _connectWS() {
    this.ws = new WebSocket(`ws://${location.host}/ws`);
    this.ws.onmessage = e => this._handleMessage(JSON.parse(e.data));
    this.ws.onclose = () => setTimeout(() => this._connectWS(), 2000);
  }

  _handleMessage(data) {
    switch (data.type) {
      case 'status': if (data.projects) this._renderProjectList(data.projects); break;
      case 'project_list': this._renderProjectList(data.projects); break;
      case 'project_loaded':
        this.currentProjectId = data.project_id;
        this.reportPanel.clear();
        this.reportPanel.addSystemMsg(`PROJECT RELOADED: ${data.project_id}`);
        if (data.chat_history) data.chat_history.forEach(m => this.reportPanel.addChatEntry(m.role === 'user' ? 'Chris' : 'master', m.content));
        break;
      case 'project_reset': this.currentProjectId = null; this.reportPanel.clear(); this.reportPanel.addSystemMsg('NEW PROJECT INITIATED'); break;
      case 'agent_profile': if (this.agentModal.isOpen && this.agentModal.currentAgent === data.agent) this.agentModal.setProfile(data.profile); break;
      case 'agent_state': this._onAgentState(data); break;
      case 'approval_request': this._showApproval(data.message); break;
      case 'chat': 
        this.reportPanel.addChatEntry('master', data.message); 
        this.reportPanel.setEnabled(true); 
        break;
    }
  }

  _onAgentState(data) {
    const agent = this.agents[data.agent];
    if (!agent) return;
    agent.setStatus(data.status);
    this.timerPanel.setStatus(data.agent, data.status);
    if (data.message && data.status !== 'idle') this._log(data.agent, data.agent, data.message);

    if (data.status === 'communicating' && data.target) {
      const target = this.agents[data.target];
      if (!target) return;
      Object.values(this.agents).forEach(a => a.clearBubble());
      this.reportPanel.addEntry(data.agent, data.target, data.message);
      this._animateFlow(data.agent, data.target);
      // 타겟 40% 지점까지만 이동
      agent.moveTo(agent.homeX + (target.homeX - agent.homeX) * 0.4, agent.homeY + (target.homeY - agent.homeY) * 0.4, () => agent.showBubble(data.message));
      // 4초 후 복귀 (Return Home)
      this.time.delayedCall(4000, () => { agent.clearBubble(); agent.returnHome(); });
    } else if (data.status === 'idle') {
      agent.clearBubble(); agent.returnHome();
    }
  }

  _showApproval(message) {
    const overlay = document.getElementById('approval-overlay');
    document.getElementById('approval-text').textContent = message;
    overlay.classList.add('show');
    this.reportPanel.setEnabled(false);
    const send = approved => {
      overlay.classList.remove('show');
      this.ws.send(JSON.stringify({ type: 'approval', approved, feedback: document.getElementById('input-feedback').value.trim() || null }));
    };
    document.getElementById('btn-approve').onclick = () => send(true);
    document.getElementById('btn-reject').onclick  = () => send(false);
  }

  _sendChat(msg) {
    if (!this.ws) return;
    this.reportPanel.setEnabled(false);
    this.ws.send(JSON.stringify({ type: 'chat', message: msg }));
  }

  update() { this.timerPanel.update(); }
}
