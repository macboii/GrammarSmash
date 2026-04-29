const SUPABASE_URL = 'https://azgplnfczforimmtpznx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Z3BsbmZjemZvcmltbXRwem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MDY1NTEsImV4cCI6MjA3MTA4MjU1MX0.M9MF6xmAUjSE1VKTF_Q027luPrMjwRa8_m1iSVyF5TM';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 368;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const BASE_FALL = 80;
const MAX_FALL = 240;

// 각 레벨에 필요한 누적 점수
const LEVEL_THRESHOLDS = [0, 5, 12, 21, 32, 45, 60, 77, 96, 117, 140];

const GAME_STATE = Object.freeze({
  INIT:    'INIT',
  RUNNING: 'RUNNING',
  FAIL:    'FAIL',
  RESULT:  'RESULT',
});

const TIPS = [
  'Tip: TextBoi fixes this with Ctrl+C+C',
  'Tip: TextBoi works in any text field',
  'Tip: TextBoi supports 30+ languages',
];

const FAIL_LABELS = {
  'shot-correct':   '❌ You shot a correct sentence!',
  'hit-wrong':      '💥 You ran into a wrong sentence!',
  'missed-wrong':   '💨 You missed a wrong sentence!',
  'missed-correct': '💨 You missed a correct sentence!',
};

class Player {
  constructor() {
    this.width = 44;
    this.height = 28;
    this.x = CANVAS_WIDTH / 2 - 22;
    this.y = GROUND_Y - this.height;
    this.dir = 0;
  }

  update(dt) {
    this.x = Math.max(0, Math.min(
      CANVAS_WIDTH - this.width,
      this.x + this.dir * PLAYER_SPEED * dt * 60
    ));
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(cx - 4, this.y - 10, 8, 10);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(this.x + 6, this.y + this.height, 8, 5);
    ctx.fillRect(this.x + this.width - 14, this.y + this.height, 8, 5);
  }

  get centerX() { return this.x + this.width / 2; }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
  }

  update(dt) {
    this.y -= BULLET_SPEED * dt * 60;
    if (this.y < -12) this.active = false;
  }

  draw(ctx) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(this.x - 2, this.y, 4, 12);
  }
}

class FallingSentence {
  constructor(item, x, fallSpeed) {
    this.item = item;
    this.isCorrect = item.isCorrect;
    this.width = Math.min(item.sentence.length * 7.2 + 24, CANVAS_WIDTH - 40);
    this.height = 34;
    this.x = Math.max(10, Math.min(x, CANVAS_WIDTH - this.width - 10));
    this.y = -this.height;
    this.fallSpeed = fallSpeed;
    this.passed = false;
    this.hit = false;
  }

  update(dt) { this.y += this.fallSpeed * dt; }

  _truncate(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    while (ctx.measureText(text + '…').width > maxW && text.length > 0) text = text.slice(0, -1);
    return text + '…';
  }

  draw(ctx) {
    ctx.fillStyle = this.isCorrect ? '#15803d' : '#b91c1c';
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(this.isCorrect ? 'CORRECT' : 'WRONG', this.x + this.width - 6, this.y + 11);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(this._truncate(ctx, this.item.sentence, this.width - 16), this.x + 8, this.y + 26);
  }

  isOffScreen() { return this.y > CANVAS_HEIGHT; }

  collidesBullet(b) {
    return b.x >= this.x && b.x <= this.x + this.width &&
           b.y >= this.y && b.y <= this.y + this.height;
  }
}

class StarField {
  constructor() {
    this.stars = [
      ...StarField._gen(70, 0.7, 22,  0.22, '#c7d2fe'),
      ...StarField._gen(40, 1.3, 55,  0.50, '#e0e7ff'),
      ...StarField._gen(18, 2.1, 115, 0.85, '#ffffff'),
    ];
  }

  static _gen(n, size, speed, alpha, color) {
    return Array.from({ length: n }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size, speed, alpha, color,
    }));
  }

  update(dt) {
    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > CANVAS_HEIGHT + s.size) {
        s.y = -s.size;
        s.x = Math.random() * CANVAS_WIDTH;
      }
    }
  }

  draw(ctx) {
    for (const s of this.stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      if (s.speed > 80) {
        ctx.globalAlpha = s.alpha * 0.25;
        ctx.fillRect(s.x - s.size * 0.3, s.y - s.speed * 0.06, s.size * 0.6, s.speed * 0.06);
      }
    }
    ctx.globalAlpha = 1;
  }
}

class SoundManager {
  constructor() { this.ctx = null; }

  _ensure() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _tone(freq, dur, type = 'square', vol = 0.2) {
    this._ensure();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.start(); osc.stop(this.ctx.currentTime + dur);
  }

  _sweep(f1, f2, dur, type = 'square', vol = 0.2) {
    this._ensure();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(f1, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f2, this.ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.start(); osc.stop(this.ctx.currentTime + dur);
  }

  resume() { this._ensure(); }

  shoot()       { this._sweep(900, 200, 0.09, 'square', 0.14); }

  hitWrong()    {
    this._sweep(300, 180, 0.1, 'sawtooth', 0.28);
    setTimeout(() => this._tone(440, 0.08, 'sine', 0.18), 65);
  }

  eatCorrect()  { this._sweep(440, 880, 0.14, 'sine', 0.2); }

  fail()        {
    this._sweep(440, 110, 0.4, 'sawtooth', 0.32);
    setTimeout(() => this._tone(80, 0.5, 'sawtooth', 0.28), 260);
  }

  combo()       {
    [392, 494, 587, 740].forEach((f, i) =>
      setTimeout(() => this._tone(f, 0.09, 'sine', 0.18), i * 55)
    );
  }

  levelUp()     {
    [262, 330, 392, 523, 659].forEach((f, i) =>
      setTimeout(() => this._tone(f, 0.13, 'sine', 0.22), i * 65)
    );
  }
}

class FloatingScore {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0;
  }

  update(dt) { this.y -= 60 * dt; this.life -= dt * 1.8; }
  isDead() { return this.life <= 0; }

  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

class GrammarSmash {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = data;
    this.state = null;
    this.score = 0;
    this.fallSpeed = BASE_FALL;
    this.player = new Player();
    this.bullets = [];
    this.sentences = [];
    this.floatingScores = [];
    this.history = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.level = 0;
    this.animFrameId = null;
    this.spawnCooldown = 2;
    this.shuffled = this._shuffle([...data]);
    this.dataIndex = 0;
    this.failSentence = null;
    this.failReason = null;

    this.starField = new StarField();
    this.sound = new SoundManager();

    this._bindInput();
    this.setState(GAME_STATE.INIT);
  }

  setState(newState) {
    this.state = newState;
    if (newState === GAME_STATE.INIT)    this._drawIntro();
    if (newState === GAME_STATE.RUNNING) this._startLoop();
    if (newState === GAME_STATE.FAIL)    this._onFail();
    if (newState === GAME_STATE.RESULT)  this._showResult();
  }

  _drawIntro() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.starField.draw(ctx);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('GrammarSmash', CANVAS_WIDTH / 2, 60);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.fillText('Shoot wrong sentences. Dodge the correct ones.', CANVAS_WIDTH / 2, 90);

    this._drawIntroTable(ctx);
    this._drawIntroControls(ctx);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('Press Space or Click to Start', CANVAS_WIDTH / 2, 370);
  }

  _drawIntroTable(ctx) {
    const rows = [
      ['',              '❌ WRONG (red)',  '✅ CORRECT (green)'],
      ['Shoot',         '+2 pts',          'FAIL'],
      ['Touch',         'FAIL',            '+3 pts'],
      ['Miss (floor)',  'FAIL',            'FAIL'],
    ];
    const colX = [110, 280, 460];
    const startY = 140;
    const rowH = 32;

    ctx.font = 'bold 11px monospace';
    rows.forEach((row, ri) => {
      const y = startY + ri * rowH;
      row.forEach((cell, ci) => {
        const isHeader = ri === 0 || ci === 0;
        ctx.fillStyle = isHeader ? '#d1d5db' : (cell === 'FAIL' ? '#f87171' : cell.includes('+') ? '#4ade80' : '#9ca3af');
        ctx.font = isHeader ? 'bold 11px monospace' : '11px monospace';
        ctx.textAlign = ci === 0 ? 'right' : 'center';
        ctx.fillText(cell, colX[ci], y);
      });
    });
  }

  _drawIntroControls(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px monospace';
    ctx.fillText('← → keys or mouse click to move   ·   Space or click to shoot', CANVAS_WIDTH / 2, 310);
  }

  _startLoop() {
    this.sound.resume();
    let last = performance.now();
    const loop = (now) => {
      if (this.state !== GAME_STATE.RUNNING) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      this.update(dt);
      this.draw(this.ctx);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  _onFail() {
    cancelAnimationFrame(this.animFrameId);
    this.draw(this.ctx);
    setTimeout(() => this.setState(GAME_STATE.RESULT), 300);
  }

  async _showResult() {
    const prev = parseInt(localStorage.getItem('grammarSmashBest') || '0');
    const isNewRecord = this.score > prev;
    const best = Math.max(this.score, prev);
    localStorage.setItem('grammarSmashBest', best);

    document.querySelector('.fail-label').textContent = FAIL_LABELS[this.failReason];
    document.querySelector('.fail-sentence').textContent = `"${this.failSentence.sentence}"`;
    document.querySelector('.fail-explanation').textContent = `→ ${this.failSentence.explanation}`;
    document.querySelector('.score-msg').textContent = `Score: ${this.score}`;
    document.querySelector('.best-msg').textContent = isNewRecord ? '🔥 New Record!' : `Best: ${best}`;
    document.querySelector('.best-msg').className = isNewRecord ? 'best-msg new-record' : 'best-msg';
    document.querySelector('.combo-msg').textContent = this.maxCombo >= 2 ? `Max combo: x${this.maxCombo}` : '';
    document.querySelector('.level-msg').textContent = this.level > 0 ? `Level reached: Lv${this.level}` : '';
    document.querySelector('.tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
    document.getElementById('hud-best').textContent = `Best: ${best}`;
    this._renderReview();
    document.getElementById('result').classList.add('visible');

    const nickname = localStorage.getItem('grammarSmashNickname');
    if (!nickname) {
      const sec = document.getElementById('nickname-section');
      sec.style.display = 'flex';
      const input = document.getElementById('nickname-input');
      input.value = '';
      input.focus();
      document.getElementById('btn-submit-nick').onclick = () => this._onNicknameSubmit();
      input.onkeydown = (e) => { if (e.key === 'Enter') this._onNicknameSubmit(); };
    } else {
      await this._submitAndShow(nickname);
    }
  }

  _onNicknameSubmit() {
    const input = document.getElementById('nickname-input');
    const name = input.value.trim().slice(0, 20);
    if (!name) { input.focus(); return; }
    localStorage.setItem('grammarSmashNickname', name);
    document.getElementById('nickname-section').style.display = 'none';
    this._submitAndShow(name);
  }

  async _submitAndShow(nickname) {
    if (this.score > 0) await this._submitScore(nickname);
    await this._loadLeaderboard(nickname);
  }

  async _submitScore(nickname) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/grammarsmash_leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ nickname, score: this.score }),
      });
    } catch (_) { /* network fail — silent */ }
  }

  async _loadLeaderboard(nickname) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/grammarsmash_leaderboard?select=nickname,score&order=score.desc&limit=50`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      const rows = await res.json();
      this._renderLeaderboard(rows, nickname);
      document.getElementById('leaderboard-section').style.display = 'flex';
    } catch (_) { /* network fail — silent */ }
  }

  _renderLeaderboard(rows, nickname) {
    const list = document.getElementById('lb-list');
    list.innerHTML = '';
    let myRank = -1;
    rows.forEach((row, i) => {
      const isMe = row.nickname === nickname && myRank === -1 && row.score === this.score;
      if (isMe) myRank = i + 1;
      const div = document.createElement('div');
      div.className = 'lb-row' + (isMe ? ' lb-me' : '');
      div.innerHTML =
        `<span class="lb-rank-num">#${i + 1}</span>` +
        `<span>${row.nickname}</span>` +
        `<span class="lb-score-val">${row.score}</span>`;
      list.appendChild(div);
    });
    document.getElementById('lb-rank-msg').textContent =
      myRank > 0 ? `You are #${myRank} on the leaderboard` : '';
    if (myRank > 0) {
      setTimeout(() => list.children[myRank - 1]?.scrollIntoView({ block: 'nearest' }), 50);
    }
  }

  _renderReview() {
    const el = document.getElementById('review-list');
    el.innerHTML = '';
    const seen = this.history.slice(-5);
    seen.forEach(item => {
      const row = document.createElement('div');
      row.className = 'review-row';
      row.innerHTML = `
        <span class="review-icon">${item.isCorrect ? '✅' : '❌'}</span>
        <div class="review-body">
          <p class="review-sentence">${item.sentence}</p>
          <p class="review-exp">${item.explanation}</p>
        </div>`;
      el.appendChild(row);
    });
  }

  _restart() {
    document.getElementById('result').classList.remove('visible');
    document.getElementById('nickname-section').style.display = 'none';
    document.getElementById('leaderboard-section').style.display = 'none';
    document.getElementById('lb-list').innerHTML = '';
    document.getElementById('lb-rank-msg').textContent = '';
    this.score = 0;
    this.fallSpeed = BASE_FALL;
    this.player = new Player();
    this.bullets = [];
    this.sentences = [];
    this.floatingScores = [];
    this.history = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.level = 0;
    this.spawnCooldown = 2;
    this.shuffled = this._shuffle([...this.data]);
    this.dataIndex = 0;
    this.failSentence = null;
    this.failReason = null;
    document.getElementById('hud-score').textContent = 'Score: 0';
    document.getElementById('hud-level').textContent = 'Lv0';
    document.getElementById('hud-combo').textContent = '';
    this.setState(GAME_STATE.RUNNING);
  }

  _bindInput() {
    this._onKey = (e) => this._handleKey(e);
    this._onKeyUp = (e) => this._handleKeyUp(e);
    this._onClick = (e) => this._handleClick(e);
    document.addEventListener('keydown', this._onKey);
    document.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('click', this._onClick);
    document.getElementById('btn-replay').addEventListener('click', () => this._restart());
  }

  _handleKey(e) {
    if (e.code === 'ArrowLeft')  this.player.dir = -1;
    if (e.code === 'ArrowRight') this.player.dir = 1;
    if (e.code !== 'Space') return;
    if (document.activeElement?.id === 'nickname-input') return;
    e.preventDefault();
    if (this.state === GAME_STATE.INIT)    this.setState(GAME_STATE.RUNNING);
    if (this.state === GAME_STATE.RUNNING) this._shoot();
    if (this.state === GAME_STATE.RESULT)  this._restart();
  }

  _handleKeyUp(e) {
    if (e.code === 'ArrowLeft'  && this.player.dir === -1) this.player.dir = 0;
    if (e.code === 'ArrowRight' && this.player.dir ===  1) this.player.dir = 0;
  }

  _handleClick(e) {
    if (this.state === GAME_STATE.INIT) { this.setState(GAME_STATE.RUNNING); return; }
    if (this.state !== GAME_STATE.RUNNING) return;
    const rect = this.canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    this.player.x = Math.max(0, Math.min(CANVAS_WIDTH - this.player.width, clickX - this.player.width / 2));
    this._shoot();
  }

  _shoot() {
    this.bullets.push(new Bullet(this.player.centerX, this.player.y - 10));
    this.sound.shoot();
  }

  _nextItem() {
    const item = this.shuffled[this.dataIndex % this.shuffled.length];
    this.dataIndex++;
    if (this.dataIndex % this.shuffled.length === 0) this.shuffled = this._shuffle([...this.data]);
    return item;
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _spawnIfReady(dt) {
    this.spawnCooldown -= dt;
    if (this.spawnCooldown > 0) return;
    const item = this._nextItem();
    const x = Math.random() * (CANVAS_WIDTH - 200) + 10;
    this.sentences.push(new FallingSentence(item, x, this.fallSpeed));
    if (this.history.length < 8) this.history.push(item);
    this.spawnCooldown = Math.max(2.5 - this.level * 0.15 - this.score * 0.02, 0.8);
  }

  _addScore(points, x, y) {
    this.score += points;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this._checkLevelUp();
    this.fallSpeed = Math.min(BASE_FALL + this.level * 15 + this.score * 2, MAX_FALL);
    document.getElementById('hud-score').textContent = `Score: ${this.score}`;
    document.getElementById('hud-combo').textContent = this.combo >= 2 ? `x${this.combo}` : '';
    this.floatingScores.push(new FloatingScore(x, y, `+${points}`, '#4ade80'));
    if (this.combo % 5 === 0) {
      this.fallSpeed = Math.min(this.fallSpeed + 20, MAX_FALL);
      this.floatingScores.push(new FloatingScore(x, y - 28, `🔥 x${this.combo} COMBO`, '#facc15'));
      this.sound.combo();
    }
  }

  _checkLevelUp() {
    let newLevel = 0;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (this.score >= LEVEL_THRESHOLDS[i]) newLevel = i;
    }
    if (newLevel <= this.level) return;
    this.level = newLevel;
    document.getElementById('hud-level').textContent = `Lv${this.level}`;
    this.floatingScores.push(new FloatingScore(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20,
      `⬆ Lv${this.level}`, '#22d3ee'
    ));
    this.sound.levelUp();
  }

  _processBulletHits() {
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const s of this.sentences) {
        if (s.hit || !s.collidesBullet(b)) continue;
        b.active = false;
        s.hit = true;
        if (s.isCorrect) {
          this.failSentence = s.item;
          this.failReason = 'shot-correct';
          this.sound.fail();
          this.setState(GAME_STATE.FAIL);
          return true;
        }
        this._addScore(2, s.x + s.width / 2, s.y);
        this.sound.hitWrong();
      }
    }
    return false;
  }

  _playerOverlaps(s) {
    return (
      this.player.x < s.x + s.width  &&
      this.player.x + this.player.width > s.x &&
      this.player.y < s.y + s.height &&
      this.player.y + this.player.height > s.y
    );
  }

  _checkPlayerCollisions() {
    for (const s of this.sentences) {
      if (s.hit || s.passed || !this._playerOverlaps(s)) continue;
      s.hit = true;
      if (s.isCorrect) {
        this._addScore(3, s.x + s.width / 2, s.y);
        this.sound.eatCorrect();
      } else {
        this.failSentence = s.item;
        this.failReason = 'hit-wrong';
        this.sound.fail();
        this.setState(GAME_STATE.FAIL);
        return true;
      }
    }
    return false;
  }

  _processMissed() {
    for (const s of this.sentences) {
      if (s.hit || s.passed || !s.isOffScreen()) continue;
      s.passed = true;
      this.failSentence = s.item;
      this.failReason = s.isCorrect ? 'missed-correct' : 'missed-wrong';
      this.sound.fail();
      this.setState(GAME_STATE.FAIL);
      return true;
    }
    return false;
  }

  update(dt) {
    this.starField.update(dt);
    this.player.update(dt);
    this._spawnIfReady(dt);
    this.sentences.forEach(s => s.update(dt));
    this.bullets.forEach(b => b.update(dt));
    if (this._processBulletHits()) return;
    if (this._checkPlayerCollisions()) return;
    if (this._processMissed()) return;
    this.bullets = this.bullets.filter(b => b.active);
    this.sentences = this.sentences.filter(s => !s.hit && !s.isOffScreen());
    this.floatingScores.forEach(f => f.update(dt));
    this.floatingScores = this.floatingScores.filter(f => !f.isDead());
  }

  draw(ctx) {
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.starField.draw(ctx);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();
    this.sentences.forEach(s => s.draw(ctx));
    this.bullets.forEach(b => b.draw(ctx));
    this.player.draw(ctx);
    this.floatingScores.forEach(f => f.draw(ctx));
  }

  destroy() {
    cancelAnimationFrame(this.animFrameId);
    document.removeEventListener('keydown', this._onKey);
    document.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('click', this._onClick);
  }
}
