import { Chess } from '/vendor/chess.js';

// ============================================================================
// AUDIO SYSTEM (Web Audio API Synthesizer - Zero External Files)
// ============================================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('blind_chess_sound') !== 'muted';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('blind_chess_sound', this.enabled ? 'enabled' : 'muted');
    return this.enabled;
  }

  playMove() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCapture() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playCheck() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [520, 680].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  playReveal() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  playGameOver(isWinner) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = isWinner
      ? [523.25, 659.25, 783.99, 1046.50]
      : [440, 415.3, 392, 369.99];

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  playError() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

// ============================================================================
// CHESS PIECE HIGH-CONTRAST VECTOR SVGS (Universal Offline Staunton Set)
// White: Crisp solid #ffffff body with dark #121620 outlines
// Black: Deep midnight #181e29 obsidian with brilliant #f8fafc luminous outlines
// ============================================================================
const PIECE_SVGS = {
  // White Pieces
  P: `<svg viewBox="0 0 45 45" class="chess-svg">
  <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5h23c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#ffffff" stroke="#121620" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  R: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="#ffffff" fill-rule="evenodd" stroke="#121620" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm-1-22l2 15h19l2-15H11zm0 0V9h4v2h5V9h5v2h5V9h4v5H11z" stroke-linecap="butt"/>
    <path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17" fill="none" stroke="#121620" stroke-width="1.2" stroke-linejoin="miter"/>
  </g>
</svg>`,
  N: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="none" fill-rule="evenodd" stroke="#121620" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 3-11.5-2-13-5-1.5-9-12-2-15 5-2 8-1 11-1z" fill="#ffffff" stroke="#121620"/>
    <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.99-.5-2-.5-3 1-1 3 2.5 3 2.5z" fill="#ffffff" stroke="#121620"/>
    <circle cx="9.5" cy="25.5" r="1.2" fill="#121620" stroke="#121620"/>
    <path d="M15 15.5a.5 1.5 0 1 1-1 0 .5 1.5 0 1 1 1 0z" transform="matrix(.866 .5 -.5 .866 9.693 -5.173)" fill="#121620" stroke="#121620"/>
  </g>
</svg>`,
  B: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="none" fill-rule="evenodd" stroke="#121620" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <g fill="#ffffff" stroke="#121620">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.49-10.11.96-13.5-1-3.39 1.96-10.11.51-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/>
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
    </g>
    <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke="#121620" stroke-width="1.4" stroke-linejoin="miter"/>
  </g>
</svg>`,
  Q: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="#ffffff" fill-rule="evenodd" stroke="#121620" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-4-14-4.5 14-4.5-14-4 14-7-11 2 12z"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/>
    <path d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 3.5c4-1 17-1 21 0m-20.5 3.5c4-1 16-1 20 0" fill="none" stroke="#121620" stroke-width="1.2" stroke-linejoin="miter"/>
    <circle cx="6" cy="12" r="2" fill="#ffffff" stroke="#121620"/>
    <circle cx="14" cy="9" r="2" fill="#ffffff" stroke="#121620"/>
    <circle cx="22.5" cy="8" r="2" fill="#ffffff" stroke="#121620"/>
    <circle cx="31" cy="9" r="2" fill="#ffffff" stroke="#121620"/>
    <circle cx="39" cy="12" r="2" fill="#ffffff" stroke="#121620"/>
  </g>
</svg>`,
  K: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="none" fill-rule="evenodd" stroke="#121620" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c-1-2-5-2-6 0-1.5 3 3 10.5 3 10.5" fill="#ffffff" stroke="#121620" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#ffffff" stroke="#121620"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#121620" stroke-width="1.2"/>
    <circle cx="20" cy="26.5" r="1.2" fill="#121620" stroke="#121620"/>
    <circle cx="25" cy="26.5" r="1.2" fill="#121620" stroke="#121620"/>
  </g>
</svg>`,

  // Black Pieces
  p: `<svg viewBox="0 0 45 45" class="chess-svg">
  <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5h23c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#181e29" stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  r: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="#181e29" fill-rule="evenodd" stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm-1-22l2 15h19l2-15H11zm0 0V9h4v2h5V9h5v2h5V9h4v5H11z" stroke-linecap="butt"/>
    <path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17" fill="none" stroke="#f8fafc" stroke-width="1.2" stroke-linejoin="miter"/>
  </g>
</svg>`,
  n: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="none" fill-rule="evenodd" stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 3-11.5-2-13-5-1.5-9-12-2-15 5-2 8-1 11-1z" fill="#181e29" stroke="#f8fafc"/>
    <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.99-.5-2-.5-3 1-1 3 2.5 3 2.5z" fill="#181e29" stroke="#f8fafc"/>
    <circle cx="9.5" cy="25.5" r="1.2" fill="#f8fafc" stroke="#f8fafc"/>
    <path d="M15 15.5a.5 1.5 0 1 1-1 0 .5 1.5 0 1 1 1 0z" transform="matrix(.866 .5 -.5 .866 9.693 -5.173)" fill="#f8fafc" stroke="#f8fafc"/>
  </g>
</svg>`,
  b: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="none" fill-rule="evenodd" stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <g fill="#181e29" stroke="#f8fafc">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.49-10.11.96-13.5-1-3.39 1.96-10.11.51-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/>
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
    </g>
    <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke="#f8fafc" stroke-width="1.4" stroke-linejoin="miter"/>
  </g>
</svg>`,
  q: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="#181e29" fill-rule="evenodd" stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-4-14-4.5 14-4.5-14-4 14-7-11 2 12z"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/>
    <path d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 3.5c4-1 17-1 21 0m-20.5 3.5c4-1 16-1 20 0" fill="none" stroke="#f8fafc" stroke-width="1.2" stroke-linejoin="miter"/>
    <circle cx="6" cy="12" r="2" fill="#181e29" stroke="#f8fafc"/>
    <circle cx="14" cy="9" r="2" fill="#181e29" stroke="#f8fafc"/>
    <circle cx="22.5" cy="8" r="2" fill="#181e29" stroke="#f8fafc"/>
    <circle cx="31" cy="9" r="2" fill="#181e29" stroke="#f8fafc"/>
    <circle cx="39" cy="12" r="2" fill="#181e29" stroke="#f8fafc"/>
  </g>
</svg>`,
  k: `<svg viewBox="0 0 45 45" class="chess-svg">
  <g fill="none" fill-rule="evenodd" stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c-1-2-5-2-6 0-1.5 3 3 10.5 3 10.5" fill="#181e29" stroke="#f8fafc" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#181e29" stroke="#f8fafc"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#f8fafc" stroke-width="1.2"/>
    <circle cx="20" cy="26.5" r="1.2" fill="#f8fafc" stroke="#f8fafc"/>
    <circle cx="25" cy="26.5" r="1.2" fill="#f8fafc" stroke="#f8fafc"/>
  </g>
</svg>`
};

// ============================================================================
// MAIN APP STATE
// ============================================================================
const state = {
  socket: null,
  sound: new SoundEffects(),
  myColor: null, // 'white' | 'black'
  myName: '',
  opponentName: 'Opponent',
  roomCode: null,
  currentTurn: 'w',
  currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  whiteRevealsLeft: 7,
  blackRevealsLeft: 7,
  revealCount: 7,
  selectedSquare: null,
  activeReveal: null, // { byColor, byName } when active
  isGameOver: false,
  lastMove: null, // { from, to, san, color }
  clientChess: new Chess(),
  moveHistory: [],
  reconnectTimerId: null,
  reconnectSecondsLeft: 60,
  replayGame: null,
  replayStep: 0,
  replayChess: new Chess()
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================
const dom = {
  connectionPill: document.getElementById('connection-pill'),
  connectionStatusText: document.getElementById('connection-status-text'),
  btnLanInfo: document.getElementById('btn-lan-info'),
  btnOpenHistory: document.getElementById('btn-open-history'),
  btnToggleSound: document.getElementById('btn-toggle-sound'),
  soundIcon: document.getElementById('sound-icon'),

  // Screens
  screenLobby: document.getElementById('screen-lobby'),
  screenGame: document.getElementById('screen-game'),

  // Lobby Form
  playerNameInput: document.getElementById('player-name-input'),
  revealPresets: document.getElementById('reveal-presets'),
  revealCountInput: document.getElementById('reveal-count-input'),
  btnCreateRoom: document.getElementById('btn-create-room'),
  joinRoomCodeInput: document.getElementById('join-room-code-input'),
  btnJoinRoom: document.getElementById('btn-join-room'),
  lobbyWaitingState: document.getElementById('lobby-waiting-state'),
  createdRoomCodeDisplay: document.getElementById('created-room-code-display'),
  btnCopyRoomCode: document.getElementById('btn-copy-room-code'),
  lanUrlsContainer: document.getElementById('lan-urls-container'),
  btnCancelCreate: document.getElementById('btn-cancel-create'),

  // Game Arena & Banners
  chessBoard: document.getElementById('chess-board'),
  chessBoardOuter: document.getElementById('chess-board-outer'),
  activeRevealBanner: document.getElementById('active-reveal-banner'),
  activeRevealText: document.getElementById('active-reveal-text'),
  lastMoveBanner: document.getElementById('last-move-banner'),
  lastMoveDesc: document.getElementById('last-move-desc'),
  moveErrorToast: document.getElementById('move-error-toast'),
  moveErrorText: document.getElementById('move-error-text'),
  checkAlertToast: document.getElementById('check-alert-toast'),
  disconnectAlertBanner: document.getElementById('disconnect-alert-banner'),
  disconnectBannerText: document.getElementById('disconnect-banner-text'),

  // Players info
  opponentAvatar: document.getElementById('opponent-avatar'),
  opponentNameDisplay: document.getElementById('opponent-name-display'),
  opponentColorBadge: document.getElementById('opponent-color-badge'),
  opponentTurnIndicator: document.getElementById('opponent-turn-indicator'),
  opponentRevealsCount: document.getElementById('opponent-reveals-count'),
  myAvatar: document.getElementById('my-avatar'),
  myNameDisplay: document.getElementById('my-name-display'),
  myColorBadge: document.getElementById('my-color-badge'),
  myTurnIndicator: document.getElementById('my-turn-indicator'),
  gameRoomCodeDisplay: document.getElementById('game-room-code-display'),

  // Sidebar
  currentTurnBanner: document.getElementById('current-turn-banner'),
  btnTriggerReveal: document.getElementById('btn-trigger-reveal'),
  revealBtnText: document.getElementById('reveal-btn-text'),
  myRevealsBadge: document.getElementById('my-reveals-badge'),
  algebraicMoveForm: document.getElementById('algebraic-move-form'),
  algebraicMoveInput: document.getElementById('algebraic-move-input'),
  btnSubmitMove: document.getElementById('btn-submit-move'),
  moveCountBadge: document.getElementById('move-count-badge'),
  moveHistoryTbody: document.getElementById('move-history-tbody'),
  moveHistoryContainer: document.getElementById('move-history-container'),
  btnResignGame: document.getElementById('btn-resign-game'),

  // Game Over Modal
  modalGameOver: document.getElementById('modal-game-over'),
  gameOverTitle: document.getElementById('game-over-title'),
  gameOverDetails: document.getElementById('game-over-details'),
  statWhiteReveals: document.getElementById('stat-white-reveals'),
  statBlackReveals: document.getElementById('stat-black-reveals'),
  btnRequestRematch: document.getElementById('btn-request-rematch'),
  btnBackToLobby: document.getElementById('btn-back-to-lobby'),
  rematchWaitingNote: document.getElementById('rematch-waiting-note'),

  // Match History Modal
  modalHistory: document.getElementById('modal-history'),
  btnCloseHistory: document.getElementById('btn-close-history'),
  historyListView: document.getElementById('history-list-view'),
  historyReplayView: document.getElementById('history-replay-view'),
  historyTableTbody: document.getElementById('history-table-tbody'),
  replayBoard: document.getElementById('replay-board'),
  replayMatchTitle: document.getElementById('replay-match-title'),
  replayResultBadge: document.getElementById('replay-result-badge'),
  replayStepInfo: document.getElementById('replay-step-info'),
  btnReplayFirst: document.getElementById('btn-replay-first'),
  btnReplayPrev: document.getElementById('btn-replay-prev'),
  btnReplayNext: document.getElementById('btn-replay-next'),
  btnReplayLast: document.getElementById('btn-replay-last'),
  replayMovesList: document.getElementById('replay-moves-list'),
  btnReplayBackToList: document.getElementById('btn-replay-back-to-list'),

  // LAN Modal
  modalLanInfo: document.getElementById('modal-lan-info'),
  btnCloseLan: document.getElementById('btn-close-lan'),
  lanModalUrlsList: document.getElementById('lan-modal-urls-list')
};

// ============================================================================
// INITIALIZATION
// ============================================================================
function init() {
  localStorage.removeItem('blind_chess_mode');
  setupSavedPreferences();
  setupSocket();
  setupEventListeners();
  setupSoundButton();
  checkAutoReconnection();
}

function setupSavedPreferences() {
  const savedName = localStorage.getItem('blind_chess_player_name');
  if (savedName && dom.playerNameInput) {
    dom.playerNameInput.value = savedName;
  }
}

function setupSoundButton() {
  const isEnabled = state.sound.enabled;
  dom.soundIcon.textContent = isEnabled ? '🔊' : '🔇';
}

// ============================================================================
// SOCKET CONNECTION & EVENT HANDLERS
// ============================================================================
function setupSocket() {
  const socket = io({
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000
  });
  state.socket = socket;

  socket.on('connect', () => {
    updateConnectionStatus(true);
    const activeCode = sessionStorage.getItem('blind_chess_room_code');
    const activeName = sessionStorage.getItem('blind_chess_player_name');
    if (activeCode && activeName && !state.roomCode) {
      socket.emit('join_room', { roomCode: activeCode, playerName: activeName });
    }
  });

  socket.on('disconnect', () => {
    updateConnectionStatus(false);
  });

  socket.on('room_created', (data) => {
    state.roomCode = data.roomCode;
    state.myColor = 'white';
    state.revealCount = data.revealCount;
    state.whiteRevealsLeft = data.revealCount;
    state.blackRevealsLeft = data.revealCount;

    sessionStorage.setItem('blind_chess_room_code', data.roomCode);
    sessionStorage.setItem('blind_chess_player_name', state.myName);

    dom.createdRoomCodeDisplay.textContent = data.roomCode;
    dom.lobbyWaitingState.classList.remove('hidden');
    renderLanUrls(data.lanUrls || [], dom.lanUrlsContainer);
  });

  socket.on('join_error', (data) => {
    showError(data.message || 'Failed to join match');
    sessionStorage.removeItem('blind_chess_room_code');
  });

  socket.on('game_start', (data) => {
    state.roomCode = data.roomCode;
    state.currentTurn = data.turn || 'w';
    state.currentFen = data.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    state.revealCount = data.revealCount;
    state.whiteRevealsLeft = data.revealCount;
    state.blackRevealsLeft = data.revealCount;
    state.clientChess = new Chess();
    state.moveHistory = [];
    state.activeReveal = null;
    state.lastMove = null;

    sessionStorage.setItem('blind_chess_room_code', data.roomCode);
    sessionStorage.setItem('blind_chess_player_name', state.myName);

    if (state.myColor === 'white') {
      state.opponentName = data.blackName || 'Player 2';
    } else {
      state.myColor = 'black';
      state.opponentName = data.whiteName || 'Player 1';
    }

    switchToGameScreen();
    renderBoard();
    updateGameUI();
    state.sound.playReveal();
  });

  socket.on('move_made', (data) => {
    const { from, to, san, turn, isCheck, ply, fen, color } = data;
    state.currentTurn = turn;
    if (fen) state.currentFen = fen;
    state.lastMove = { from, to, san, color };

    // Apply move to internal tracker
    try {
      state.clientChess.move(san);
    } catch {
      try {
        state.clientChess.move({ from, to, promotion: 'q' });
      } catch (e) {
        console.warn('Sync move error:', e);
      }
    }

    state.moveHistory.push({ ply, san, from, to });
    addMoveToHistoryTable(ply, san);

    // Apply persistent and animated opponent move blip
    highlightMoveSquares(from, to, san, color);

    // Re-render pieces on board
    populateBoardWithFen(state.currentFen);

    // Audio effects
    if (isCheck) {
      state.sound.playCheck();
      showCheckAlert();
    } else if (san.includes('x')) {
      state.sound.playCapture();
    } else {
      state.sound.playMove();
    }

    updateGameUI();
  });

  socket.on('move_error', (data) => {
    showError(data.message || 'Illegal move!');
    state.sound.playError();
  });

  // Untimed Tactical Reveal - Active until move is made
  socket.on('reveal_active', (data) => {
    const { byColor, byName, fen } = data;
    state.activeReveal = { byColor, byName };
    if (fen) state.currentFen = fen;

    // Show banner to BOTH players
    dom.activeRevealBanner.classList.remove('hidden');
    dom.activeRevealText.textContent = `Tactical Reveal Active: ${byName} (${byColor.toUpperCase()}) revealed the board until they make a move!`;

    // Populate and reveal pieces
    populateBoardWithFen(state.currentFen);
    dom.chessBoard.querySelectorAll('.piece').forEach(p => {
      if (p.textContent) {
        p.classList.add('revealed');
      }
    });

    state.sound.playReveal();
    updateGameUI();
  });

  // Untimed Tactical Reveal - Ended because move was completed
  socket.on('reveal_ended', () => {
    state.activeReveal = null;
    dom.activeRevealBanner.classList.add('hidden');

    // Fade out pieces back into memory vision
    dom.chessBoard.querySelectorAll('.piece').forEach(p => {
      p.classList.remove('revealed');
      p.classList.add('fade-out');
    });
    setTimeout(() => {
      populateBoardWithFen(state.currentFen);
    }, 280);

    updateGameUI();
  });

  socket.on('reveals_update', (data) => {
    state.whiteRevealsLeft = data.whiteRevealsLeft;
    state.blackRevealsLeft = data.blackRevealsLeft;
    updateGameUI();
  });

  socket.on('game_over', (data) => {
    handleGameOver(data);
  });

  socket.on('opponent_requested_rematch', (data) => {
    dom.rematchWaitingNote.textContent = `${data.requesterName || 'Opponent'} is ready for a rematch! Click Rematch to accept.`;
    dom.rematchWaitingNote.classList.remove('hidden');
  });

  socket.on('rematch_start', (data) => {
    closeGameOverModal();
    state.isGameOver = false;
    state.myColor = state.myColor === 'white' ? 'black' : 'white';
    state.opponentName = state.myColor === 'white' ? data.blackName : data.whiteName;
    state.currentTurn = 'w';
    state.currentFen = data.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    state.revealCount = data.revealCount;
    state.whiteRevealsLeft = data.revealCount;
    state.blackRevealsLeft = data.revealCount;
    state.clientChess = new Chess();
    state.moveHistory = [];
    state.activeReveal = null;
    state.lastMove = null;
    dom.moveHistoryTbody.innerHTML = '';
    dom.activeRevealBanner.classList.add('hidden');
    dom.lastMoveBanner.classList.add('hidden');

    renderBoard();
    updateGameUI();
    state.sound.playReveal();
  });

  socket.on('player_disconnected', (data) => {
    startDisconnectCountdown(data.timeoutSeconds || 60);
  });

  socket.on('player_reconnected', () => {
    stopDisconnectCountdown();
  });

  socket.on('reconnect_success', (data) => {
    state.roomCode = data.roomCode;
    state.myColor = data.color;
    state.revealCount = data.revealCount;
    state.whiteRevealsLeft = data.whiteRevealsLeft;
    state.blackRevealsLeft = data.blackRevealsLeft;
    state.currentTurn = data.turn;
    state.opponentName = data.color === 'white' ? data.blackName : data.whiteName;
    state.moveHistory = data.moveHistory || [];
    if (data.fen) state.currentFen = data.fen;
    state.activeReveal = data.activeReveal || null;

    state.clientChess = new Chess();
    dom.moveHistoryTbody.innerHTML = '';
    state.moveHistory.forEach(m => {
      try { state.clientChess.move(m.san); } catch {}
      addMoveToHistoryTable(m.ply, m.san);
    });

    if (state.activeReveal) {
      dom.activeRevealBanner.classList.remove('hidden');
      dom.activeRevealText.textContent = `Tactical Reveal Active: ${state.activeReveal.byName} revealed the board until they make a move!`;
    }

    switchToGameScreen();
    renderBoard();
    updateGameUI();
    stopDisconnectCountdown();
  });
}

function updateConnectionStatus(isOnline) {
  if (isOnline) {
    dom.connectionPill.className = 'connection-pill online';
    dom.connectionStatusText.textContent = 'Ready';
  } else {
    dom.connectionPill.className = 'connection-pill offline';
    dom.connectionStatusText.textContent = 'Disconnected';
  }
}

function checkAutoReconnection() {
  const activeCode = sessionStorage.getItem('blind_chess_room_code');
  const activeName = sessionStorage.getItem('blind_chess_player_name');
  if (activeCode && activeName && state.socket && state.socket.connected) {
    state.socket.emit('join_room', { roomCode: activeCode, playerName: activeName });
  }
}

// ============================================================================
// EVENT LISTENERS & SCREEN MANAGEMENT
// ============================================================================
function setupEventListeners() {
  // Sound Toggle
  dom.btnToggleSound.addEventListener('click', () => {
    const isEnabled = state.sound.toggle();
    dom.soundIcon.textContent = isEnabled ? '🔊' : '🔇';
  });


  // Reveal Pills Selector in Lobby
  dom.revealPresets.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill-btn');
    if (!pill) return;
    dom.revealPresets.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
    pill.classList.add('active');
    dom.revealCountInput.value = pill.dataset.reveals;
  });

  // Create Room
  dom.btnCreateRoom.addEventListener('click', handleCreateRoom);
  dom.btnCancelCreate.addEventListener('click', handleCancelCreate);

  // Copy Room Code
  dom.btnCopyRoomCode.addEventListener('click', () => {
    if (!state.roomCode) return;
    navigator.clipboard.writeText(state.roomCode).then(() => {
      const origText = dom.btnCopyRoomCode.textContent;
      dom.btnCopyRoomCode.textContent = 'Copied!';
      setTimeout(() => { dom.btnCopyRoomCode.textContent = origText; }, 1500);
    });
  });

  // Join Room
  dom.btnJoinRoom.addEventListener('click', handleJoinRoom);
  dom.joinRoomCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleJoinRoom();
  });
  dom.joinRoomCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  // Tactical Reveal Button
  dom.btnTriggerReveal.addEventListener('click', triggerTacticalReveal);

  // Algebraic SAN Move Form
  dom.algebraicMoveForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitAlgebraicMove();
  });

  // Resign Game
  dom.btnResignGame.addEventListener('click', () => {
    if (confirm('Are you sure you want to resign the game?')) {
      state.socket.emit('resign', { roomCode: state.roomCode });
    }
  });

  // Game Over Actions
  dom.btnRequestRematch.addEventListener('click', () => {
    state.socket.emit('request_rematch', { roomCode: state.roomCode });
    dom.rematchWaitingNote.textContent = 'Waiting for opponent to accept rematch...';
    dom.rematchWaitingNote.classList.remove('hidden');
    dom.btnRequestRematch.disabled = true;
  });

  dom.btnBackToLobby.addEventListener('click', () => {
    closeGameOverModal();
    switchToLobbyScreen();
  });

  // LAN Hotspot Modal
  dom.btnLanInfo.addEventListener('click', openLanModal);
  dom.btnCloseLan.addEventListener('click', () => dom.modalLanInfo.classList.add('hidden'));
  dom.modalLanInfo.addEventListener('click', (e) => {
    if (e.target === dom.modalLanInfo) dom.modalLanInfo.classList.add('hidden');
  });

  // History & Replay Modal
  dom.btnOpenHistory.addEventListener('click', openHistoryModal);
  dom.btnCloseHistory.addEventListener('click', () => dom.modalHistory.classList.add('hidden'));
  dom.modalHistory.addEventListener('click', (e) => {
    if (e.target === dom.modalHistory) dom.modalHistory.classList.add('hidden');
  });

  // Replay Navigation
  dom.btnReplayFirst.addEventListener('click', () => setReplayStep(0));
  dom.btnReplayPrev.addEventListener('click', () => setReplayStep(state.replayStep - 1));
  dom.btnReplayNext.addEventListener('click', () => setReplayStep(state.replayStep + 1));
  dom.btnReplayLast.addEventListener('click', () => {
    if (state.replayGame && state.replayGame.moves) {
      setReplayStep(state.replayGame.moves.length);
    }
  });
  dom.btnReplayBackToList.addEventListener('click', showHistoryListView);

  window.addEventListener('keydown', (e) => {
    if (!dom.modalHistory.classList.contains('hidden') && !dom.historyReplayView.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') setReplayStep(state.replayStep - 1);
      if (e.key === 'ArrowRight') setReplayStep(state.replayStep + 1);
    }
  });
}

// ============================================================================
// LOBBY ACTIONS
// ============================================================================
function handleCreateRoom() {
  const name = dom.playerNameInput.value.trim() || 'Player 1';
  state.myName = name;
  localStorage.setItem('blind_chess_player_name', name);

  const reveals = parseInt(dom.revealCountInput.value, 10) || 7;
  state.revealCount = reveals;

  state.socket.emit('create_room', {
    playerName: name,
    revealCount: reveals
  });
}

function handleCancelCreate() {
  state.roomCode = null;
  sessionStorage.removeItem('blind_chess_room_code');
  dom.lobbyWaitingState.classList.add('hidden');
}

function handleJoinRoom() {
  const name = dom.playerNameInput.value.trim() || 'Player 2';
  const code = dom.joinRoomCodeInput.value.trim().toUpperCase();

  if (!code || code.length !== 4) {
    showError('Please enter a valid 4-letter room code.');
    return;
  }

  state.myName = name;
  state.roomCode = code;
  state.myColor = 'black';
  localStorage.setItem('blind_chess_player_name', name);

  state.socket.emit('join_room', {
    roomCode: code,
    playerName: name
  });
}

function switchToGameScreen() {
  dom.screenLobby.classList.remove('active');
  dom.screenLobby.classList.add('hidden');
  dom.screenGame.classList.remove('hidden');
  dom.screenGame.classList.add('active');
  dom.lobbyWaitingState.classList.add('hidden');
  dom.btnRequestRematch.disabled = false;
  dom.rematchWaitingNote.classList.add('hidden');
}

function switchToLobbyScreen() {
  dom.screenGame.classList.remove('active');
  dom.screenGame.classList.add('hidden');
  dom.screenLobby.classList.remove('hidden');
  dom.screenLobby.classList.add('active');
  dom.lobbyWaitingState.classList.add('hidden');
  state.roomCode = null;
  sessionStorage.removeItem('blind_chess_room_code');
}

// ============================================================================
// CHESS BOARD RENDERING & INTERACTION
// ============================================================================
function renderBoard() {
  dom.chessBoard.innerHTML = '';
  state.selectedSquare = null;

  const isWhite = state.myColor === 'white';
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const orderedRanks = isWhite ? ranks : [...ranks].reverse();
  const orderedFiles = isWhite ? files : [...files].reverse();

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const rank = orderedRanks[r];
      const file = orderedFiles[f];
      const squareName = `${file}${rank}`;
      const isLight = (file.charCodeAt(0) - 'a'.charCodeAt(0) + parseInt(rank, 10)) % 2 !== 0;

      const sq = document.createElement('div');
      sq.className = `square ${isLight ? 'light' : 'dark'}`;
      sq.dataset.square = squareName;

      // Coordinate Labels
      if (r === 7) {
        const fileLabel = document.createElement('span');
        fileLabel.className = 'coord-file';
        fileLabel.textContent = file;
        sq.appendChild(fileLabel);
      }
      if (f === 0) {
        const rankLabel = document.createElement('span');
        rankLabel.className = 'coord-rank';
        rankLabel.textContent = rank;
        sq.appendChild(rankLabel);
      }

      // Piece element
      const pieceElem = document.createElement('span');
      pieceElem.className = 'piece';
      sq.appendChild(pieceElem);

      sq.addEventListener('click', () => handleSquareClick(squareName));
      dom.chessBoard.appendChild(sq);
    }
  }

  // Populate initial or current pieces
  populateBoardWithFen(state.currentFen);

  // Restore last move highlight if exists
  if (state.lastMove) {
    highlightMoveSquares(state.lastMove.from, state.lastMove.to, state.lastMove.san, state.lastMove.color);
  }
}

function handleSquareClick(squareName) {
  const isMyTurn = (state.currentTurn === 'w' && state.myColor === 'white') ||
                   (state.currentTurn === 'b' && state.myColor === 'black');

  if (!isMyTurn) {
    showError("It's not your turn!");
    return;
  }

  if (!state.selectedSquare) {
    state.selectedSquare = squareName;
    highlightSelectedSquare(squareName);
  } else if (state.selectedSquare === squareName) {
    state.selectedSquare = null;
    clearSelectedSquare();
  } else {
    const from = state.selectedSquare;
    const to = squareName;
    state.selectedSquare = null;
    clearSelectedSquare();

    executeMove({ from, to });
  }
}

function highlightSelectedSquare(squareName) {
  clearSelectedSquare();
  const sq = dom.chessBoard.querySelector(`[data-square="${squareName}"]`);
  if (sq) sq.classList.add('selected');
}

function clearSelectedSquare() {
  dom.chessBoard.querySelectorAll('.square.selected').forEach(sq => sq.classList.remove('selected'));
}

/**
 * Highly visible, persistent opponent move blip & square highlight
 */
function highlightMoveSquares(from, to, san, color) {
  // Clear previous highlights and beacons
  dom.chessBoard.querySelectorAll('.square.last-move-from').forEach(sq => sq.classList.remove('last-move-from'));
  dom.chessBoard.querySelectorAll('.square.last-move-to').forEach(sq => sq.classList.remove('last-move-to'));
  dom.chessBoard.querySelectorAll('.move-blip-beacon').forEach(b => b.remove());

  const fromSq = dom.chessBoard.querySelector(`[data-square="${from}"]`);
  const toSq = dom.chessBoard.querySelector(`[data-square="${to}"]`);

  if (fromSq) {
    fromSq.classList.add('last-move-from');
  }

  if (toSq) {
    toSq.classList.add('last-move-to');
    // Inject persistent pulsing beacon ring
    const beacon = document.createElement('span');
    beacon.className = 'move-blip-beacon';
    toSq.appendChild(beacon);
  }

  // Display move notification banner
  if (dom.lastMoveBanner && dom.lastMoveDesc) {
    dom.lastMoveBanner.classList.remove('hidden');
    const playerLabel = (color === 'w') ? 'White' : 'Black';
    const isOpponent = (color === 'w' && state.myColor === 'black') || (color === 'b' && state.myColor === 'white');
    const actor = isOpponent ? `Opponent (${playerLabel})` : 'You';
    dom.lastMoveDesc.innerHTML = `<strong>${actor}:</strong> ${from.toUpperCase()} &rarr; ${to.toUpperCase()} <small>(${san || ''})</small>`;
  }
}

function executeMove({ from, to, san }) {
  state.socket.emit('make_move', {
    roomCode: state.roomCode,
    from,
    to,
    promotion: 'q',
    san
  });
}

function submitAlgebraicMove() {
  const san = dom.algebraicMoveInput.value.trim();
  if (!san) return;

  const isMyTurn = (state.currentTurn === 'w' && state.myColor === 'white') ||
                   (state.currentTurn === 'b' && state.myColor === 'black');

  if (!isMyTurn) {
    showError("It's not your turn!");
    return;
  }

  executeMove({ san });
  dom.algebraicMoveInput.value = '';
}

// ============================================================================
// TACTICAL REVEAL (Untimed & visible to both players until move made)
// ============================================================================
function triggerTacticalReveal() {
  const myReveals = state.myColor === 'white' ? state.whiteRevealsLeft : state.blackRevealsLeft;
  if (myReveals <= 0) {
    showError('No reveals remaining!');
    return;
  }
  if (state.activeReveal && state.activeReveal.byColor === state.myColor) {
    showError('Reveal already active! Make your move to continue.');
    return;
  }

  state.socket.emit('request_reveal', { roomCode: state.roomCode });
}

function populateBoardWithFen(fen) {
  if (!fen) return;
  const placement = fen.split(' ')[0];
  const rows = placement.split('/');

  const pieceMap = {};
  for (let r = 0; r < 8; r++) {
    const rankNum = 8 - r;
    let fileIdx = 0;
    for (const char of rows[r]) {
      if (char >= '1' && char <= '8') {
        fileIdx += parseInt(char, 10);
      } else {
        const fileChar = String.fromCharCode('a'.charCodeAt(0) + fileIdx);
        pieceMap[`${fileChar}${rankNum}`] = char;
        fileIdx++;
      }
    }
  }

  const isRevealActive = !!state.activeReveal || state.isGameOver;

  dom.chessBoard.querySelectorAll('.square').forEach(sq => {
    const squareName = sq.dataset.square;
    const pieceChar = pieceMap[squareName];
    const pieceElem = sq.querySelector('.piece');
    if (!pieceElem) return;

    if (pieceChar) {
      const isWhitePiece = pieceChar === pieceChar.toUpperCase();
      sq.classList.add('has-piece');
      if (isWhitePiece) {
        sq.classList.add('has-white-piece');
        sq.classList.remove('has-black-piece');
      } else {
        sq.classList.add('has-black-piece');
        sq.classList.remove('has-white-piece');
      }

      pieceElem.innerHTML = PIECE_SVGS[pieceChar] || '';
      const baseClass = `piece ${isWhitePiece ? 'white-piece' : 'black-piece'}`;

      if (isRevealActive) {
        pieceElem.className = `${baseClass} revealed`;
        sq.classList.add('is-revealed');
      } else {
        pieceElem.className = baseClass;
        sq.classList.remove('is-revealed');
      }
    } else {
      sq.classList.remove('has-piece', 'has-white-piece', 'has-black-piece', 'is-revealed');
      pieceElem.innerHTML = '';
      pieceElem.className = 'piece';
    }
  });
}

// ============================================================================
// GAME OVER
// ============================================================================
function handleGameOver(data) {
  const { result, winner, fen, whiteRevealsUsed, blackRevealsUsed } = data;
  const isMeWinner = (winner === 'white' && state.myColor === 'white') ||
                     (winner === 'black' && state.myColor === 'black');

  state.sound.playGameOver(isMeWinner);
  state.isGameOver = true;
  if (fen) state.currentFen = fen;

  // Fully reveal all pieces permanently for match review
  populateBoardWithFen(state.currentFen);
  dom.chessBoard.querySelectorAll('.piece').forEach(p => {
    if (p.querySelector('svg')) p.classList.add('revealed');
  });

  dom.gameOverTitle.textContent = result || 'Game Over';
  dom.gameOverDetails.textContent = isMeWinner
    ? 'Outstanding mental mastery! You visualized the board to victory.'
    : 'A hard-fought match. Better luck next time!';

  dom.statWhiteReveals.textContent = whiteRevealsUsed ?? (state.revealCount - state.whiteRevealsLeft);
  dom.statBlackReveals.textContent = blackRevealsUsed ?? (state.revealCount - state.blackRevealsLeft);

  dom.modalGameOver.classList.remove('hidden');
}

function closeGameOverModal() {
  dom.modalGameOver.classList.add('hidden');
}

// ============================================================================
// UI UPDATES & MOVE HISTORY TABLE
// ============================================================================
function updateGameUI() {
  const isWhite = state.myColor === 'white';
  const isMyTurn = (state.currentTurn === 'w' && isWhite) || (state.currentTurn === 'b' && !isWhite);

  // Turn Indicators & Banners
  dom.currentTurnBanner.textContent = state.currentTurn === 'w' ? "White's Turn" : "Black's Turn";
  dom.currentTurnBanner.className = `turn-banner ${isMyTurn ? 'my-turn' : 'opp-turn'}`;

  dom.myTurnIndicator.textContent = isMyTurn ? 'Your Turn' : 'Waiting...';
  dom.myTurnIndicator.classList.toggle('active', isMyTurn);

  dom.opponentTurnIndicator.textContent = isMyTurn ? 'Waiting...' : 'Thinking...';
  dom.opponentTurnIndicator.classList.toggle('active', !isMyTurn);

  // Names & Badges
  dom.myNameDisplay.textContent = state.myName || 'You';
  dom.myColorBadge.textContent = isWhite ? 'White' : 'Black';
  dom.myColorBadge.className = `badge ${isWhite ? 'badge-white' : 'badge-black'}`;
  dom.myAvatar.textContent = isWhite ? '♔' : '♚';

  dom.opponentNameDisplay.textContent = state.opponentName || 'Opponent';
  dom.opponentColorBadge.textContent = isWhite ? 'Black' : 'White';
  dom.opponentColorBadge.className = `badge ${isWhite ? 'badge-black' : 'badge-white'}`;
  dom.opponentAvatar.textContent = isWhite ? '♚' : '♔';

  dom.gameRoomCodeDisplay.textContent = state.roomCode || '----';

  // Reveals Badges
  const myReveals = isWhite ? state.whiteRevealsLeft : state.blackRevealsLeft;
  const oppReveals = isWhite ? state.blackRevealsLeft : state.whiteRevealsLeft;

  dom.myRevealsBadge.textContent = `${myReveals} left`;
  dom.opponentRevealsCount.textContent = oppReveals;

  const isMyRevealActive = state.activeReveal && state.activeReveal.byColor === state.myColor;
  if (isMyRevealActive) {
    dom.revealBtnText.textContent = 'REVEAL ACTIVE...';
    dom.btnTriggerReveal.disabled = true;
  } else {
    dom.revealBtnText.textContent = 'REVEAL POSITION';
    dom.btnTriggerReveal.disabled = myReveals <= 0;
  }
}

function addMoveToHistoryTable(ply, san) {
  const moveNumber = Math.ceil(ply / 2);
  const isWhiteMove = ply % 2 !== 0;

  if (isWhiteMove) {
    const row = document.createElement('tr');
    row.id = `move-row-${moveNumber}`;
    row.innerHTML = `
      <td class="col-num">${moveNumber}.</td>
      <td class="col-white">${san}</td>
      <td class="col-black">-</td>
    `;
    dom.moveHistoryTbody.appendChild(row);
  } else {
    const row = document.getElementById(`move-row-${moveNumber}`);
    if (row) {
      const blackCell = row.querySelector('.col-black');
      if (blackCell) blackCell.textContent = san;
    }
  }

  if (dom.moveCountBadge) {
    dom.moveCountBadge.textContent = `${state.moveHistory.length} moves`;
  }

  dom.moveHistoryContainer.scrollTop = dom.moveHistoryContainer.scrollHeight;
}

function showError(msg) {
  dom.moveErrorText.textContent = msg;
  dom.moveErrorToast.classList.remove('hidden');
  dom.chessBoardOuter.classList.add('shake-animation');

  setTimeout(() => {
    dom.moveErrorToast.classList.add('hidden');
    dom.chessBoardOuter.classList.remove('shake-animation');
  }, 2200);
}

function showCheckAlert() {
  dom.checkAlertToast.classList.remove('hidden');
  setTimeout(() => { dom.checkAlertToast.classList.add('hidden'); }, 1800);
}

// ============================================================================
// DISCONNECTION BANNER & COUNTDOWN
// ============================================================================
function startDisconnectCountdown(timeoutSec) {
  state.reconnectSecondsLeft = timeoutSec;
  dom.disconnectAlertBanner.classList.remove('hidden');
  dom.disconnectBannerText.innerHTML = `Opponent disconnected! Reconnection window: <strong>${state.reconnectSecondsLeft}s</strong>`;

  if (state.reconnectTimerId) clearInterval(state.reconnectTimerId);
  state.reconnectTimerId = setInterval(() => {
    state.reconnectSecondsLeft--;
    if (state.reconnectSecondsLeft <= 0) {
      clearInterval(state.reconnectTimerId);
    } else {
      dom.disconnectBannerText.innerHTML = `Opponent disconnected! Reconnection window: <strong>${state.reconnectSecondsLeft}s</strong>`;
    }
  }, 1000);
}

function stopDisconnectCountdown() {
  if (state.reconnectTimerId) clearInterval(state.reconnectTimerId);
  dom.disconnectAlertBanner.classList.add('hidden');
}

// ============================================================================
// LAN HOTSPOT MODAL & URLS
// ============================================================================
async function openLanModal() {
  dom.modalLanInfo.classList.remove('hidden');
  dom.lanModalUrlsList.innerHTML = '<div style="color: var(--text-muted);">Scanning network interfaces...</div>';

  try {
    const res = await fetch('/api/lan-urls');
    const data = await res.json();
    renderLanUrls(data.addresses || [], dom.lanModalUrlsList);
  } catch (err) {
    dom.lanModalUrlsList.innerHTML = `<div style="color: var(--danger);">Failed to load URLs: ${err.message}</div>`;
  }
}

function renderLanUrls(urls, container) {
  container.innerHTML = '';
  if (!urls || urls.length === 0) {
    container.innerHTML = `
      <div class="share-tip">
        No active LAN network detected. Please connect to Wi-Fi or turn on Windows Mobile Hotspot.
      </div>
    `;
    return;
  }

  urls.forEach(addr => {
    const item = document.createElement('div');
    item.className = 'lan-url-item';
    item.innerHTML = `
      <span>${addr.url}</span>
      <span class="lan-url-tag">${addr.isHotspot ? '🔥 HOTSPOT' : addr.interfaceName}</span>
    `;
    item.title = 'Click to copy';
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      navigator.clipboard.writeText(addr.url);
      const tag = item.querySelector('.lan-url-tag');
      const orig = tag.textContent;
      tag.textContent = 'COPIED!';
      setTimeout(() => { tag.textContent = orig; }, 1500);
    });
    container.appendChild(item);
  });
}

// ============================================================================
// MATCH HISTORY & INTERACTIVE REPLAY
// ============================================================================
async function openHistoryModal() {
  dom.modalHistory.classList.remove('hidden');
  showHistoryListView();

  dom.historyTableTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading match records...</td></tr>';

  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    renderHistoryTable(data.games || []);
  } catch (err) {
    dom.historyTableTbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger);">Error: ${err.message}</td></tr>`;
  }
}

function showHistoryListView() {
  dom.historyListView.classList.remove('hidden');
  dom.historyReplayView.classList.add('hidden');
}

function renderHistoryTable(games) {
  dom.historyTableTbody.innerHTML = '';
  if (games.length === 0) {
    dom.historyTableTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No completed matches found.</td></tr>';
    return;
  }

  games.forEach(g => {
    const dateStr = g.started_at ? new Date(g.started_at).toLocaleDateString() + ' ' + new Date(g.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dateStr}</td>
      <td><strong>${g.room_code || '----'}</strong></td>
      <td>${g.white_name}</td>
      <td>${g.black_name}</td>
      <td><span class="badge ${g.result.includes('White') ? 'badge-white' : (g.result.includes('Black') ? 'badge-black' : 'badge-you')}">${g.result.split(' won')[0]}</span></td>
      <td>${g.white_reveals_used} / ${g.black_reveals_used}</td>
      <td><button class="btn-replay-pill">Replay 👁</button></td>
    `;

    tr.querySelector('.btn-replay-pill').addEventListener('click', () => {
      loadGameReplay(g);
    });

    dom.historyTableTbody.appendChild(tr);
  });
}

function loadGameReplay(game) {
  state.replayGame = game;
  state.replayChess = new Chess();

  try {
    state.replayChess.loadPgn(game.pgn || '');
    const history = state.replayChess.history({ verbose: true });
    state.replayGame.moves = history;
  } catch {
    state.replayGame.moves = [];
  }

  dom.replayMatchTitle.textContent = `${game.white_name} (W) vs ${game.black_name} (B)`;
  dom.replayResultBadge.textContent = game.result;

  dom.replayMovesList.innerHTML = '';
  state.replayGame.moves.forEach((m, idx) => {
    const moveItem = document.createElement('span');
    moveItem.className = 'replay-move-item';
    const num = Math.floor(idx / 2) + 1;
    const prefix = idx % 2 === 0 ? `${num}. ` : '';
    moveItem.textContent = `${prefix}${m.san}`;
    moveItem.addEventListener('click', () => setReplayStep(idx + 1));
    dom.replayMovesList.appendChild(moveItem);
  });

  dom.historyListView.classList.add('hidden');
  dom.historyReplayView.classList.remove('hidden');

  buildReplayBoardGrid();
  setReplayStep(0);
}

function buildReplayBoardGrid() {
  dom.replayBoard.innerHTML = '';
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const rank = ranks[r];
      const file = files[f];
      const squareName = `${file}${rank}`;
      const isLight = (file.charCodeAt(0) - 'a'.charCodeAt(0) + parseInt(rank, 10)) % 2 !== 0;

      const sq = document.createElement('div');
      sq.className = `square ${isLight ? 'light' : 'dark'}`;
      sq.dataset.square = squareName;

      const pieceElem = document.createElement('span');
      pieceElem.className = 'piece revealed';
      sq.appendChild(pieceElem);

      dom.replayBoard.appendChild(sq);
    }
  }
}

function setReplayStep(step) {
  if (!state.replayGame || !state.replayGame.moves) return;
  const maxSteps = state.replayGame.moves.length;
  const clampedStep = Math.max(0, Math.min(maxSteps, step));
  state.replayStep = clampedStep;

  const tempChess = new Chess();
  for (let i = 0; i < clampedStep; i++) {
    tempChess.move(state.replayGame.moves[i].san);
  }

  const board = tempChess.board();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const rankNum = 8 - r;
      const fileChar = files[f];
      const sqName = `${fileChar}${rankNum}`;
      const pieceData = board[r][f];
      const sqElem = dom.replayBoard.querySelector(`[data-square="${sqName}"]`);
      if (sqElem) {
        const pieceElem = sqElem.querySelector('.piece');
        if (pieceData) {
          const char = pieceData.color === 'w' ? pieceData.type.toUpperCase() : pieceData.type.toLowerCase();
          pieceElem.innerHTML = PIECE_SVGS[char] || '';
          pieceElem.className = `piece revealed ${pieceData.color === 'w' ? 'white-piece' : 'black-piece'}`;
        } else {
          pieceElem.innerHTML = '';
          pieceElem.className = 'piece';
        }
      }
    }
  }

  dom.replayStepInfo.textContent = `Move ${clampedStep} / ${maxSteps}`;

  const moveElems = dom.replayMovesList.querySelectorAll('.replay-move-item');
  moveElems.forEach((elem, idx) => {
    elem.classList.toggle('active', idx === clampedStep - 1);
  });
}

// Start app once DOM is ready
window.addEventListener('DOMContentLoaded', init);
