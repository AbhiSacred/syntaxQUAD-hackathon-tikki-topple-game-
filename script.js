/* ============================================
   TIKI TOPPLE - BATTLE OF THE TOTEMS
   Game Logic & UI Controller
   ============================================ */

// ─── GAME CONFIG ───
const TIKI_COLORS = [
  { id: 'red',    name: 'Red',    emoji: '🔴', cls: 'tiki-red',    img: 'assets/tiki_red.png',    glow: '#e74c3c' },
  { id: 'blue',   name: 'Blue',   emoji: '🔵', cls: 'tiki-blue',   img: 'assets/tiki_blue.png',   glow: '#3498db' },
  { id: 'green',  name: 'Green',  emoji: '🟢', cls: 'tiki-green',  img: 'assets/tiki_green.png',  glow: '#2ecc71' },
  { id: 'yellow', name: 'Yellow', emoji: '🟡', cls: 'tiki-yellow', img: 'assets/tiki_yellow.png', glow: '#f1c40f' },
  { id: 'orange', name: 'Orange', emoji: '🟠', cls: 'tiki-orange', img: 'assets/tiki_orange.png', glow: '#e67e22' },
  { id: 'purple', name: 'Purple', emoji: '🟣', cls: 'tiki-purple', img: 'assets/tiki_purple.png', glow: '#9b59b6' },
  { id: 'pink',   name: 'Pink',   emoji: '🩷', cls: 'tiki-pink',   img: 'assets/tiki_pink.png',   glow: '#e84393' },
  { id: 'teal',   name: 'Teal',   emoji: '🩵', cls: 'tiki-teal',   img: 'assets/tiki_teal.png',   glow: '#00b894' },
  { id: 'brown',  name: 'Brown',  emoji: '🟤', cls: 'tiki-brown',  img: 'assets/tiki_brown.png',  glow: '#8d6e42' },
];

const PLAYER_BG_COLORS = [
  'rgba(192, 57, 43, 0.35)',
  'rgba(36, 113, 163, 0.35)',
  'rgba(142, 68, 173, 0.35)',
  'rgba(230, 126, 34, 0.35)',
];

const PLAYER_NUM_COLORS = [
  '#e74c3c',
  '#3498db',
  '#9b59b6',
  '#e67e22',
];

const ACTION_CARDS = [
  { type: 'tiki_up_2',    label: 'Tiki Up 2',      icon: '⬆️⬆️', desc: 'Move a tiki up 2 spots' },
  { type: 'tiki_topple',  label: 'Tiki Topple',     icon: '💥',   desc: 'Remove the bottom tiki' },
  { type: 'tiki_toast',   label: 'Tiki Toast',      icon: '🔥',   desc: 'Eliminate any tiki from the stack', fire: true },
  { type: 'tiki_up_1',    label: 'Tiki Up 1',       icon: '⬆️',   desc: 'Move a tiki up 1 spot' },
  { type: 'tiki_down_1',  label: 'Tiki Down 1',     icon: '⬇️',   desc: 'Move a tiki down 1 spot' },
  { type: 'elimination',  label: 'Elimination',     icon: '💀',   desc: 'Remove tiki from top of stack', fire: true },
];

// ─── GAME STATE ───
let state = {
  players: [],
  stack: [],
  currentPlayer: 0,
  round: 1,
  maxRounds: 3,
  gameOver: false,
  selectedTiki: null,
  selectedAction: null,
  soundOn: true,
  hand: [], // current player's action cards
  usedCards: [],
  stats: {
    totalGames: 0,
    wins: {},
  }
};

// ─── WELCOME SCREEN & START ───
function startGame(playerCount) {
  // Hide welcome screen, show game
  const welcome = document.getElementById('welcome-screen');
  const game = document.getElementById('game-wrapper');
  
  welcome.classList.add('hidden');
  game.classList.remove('hidden');
  
  state.playerCount = playerCount;
  initGame(playerCount);
}

function showWelcome() {
  const welcome = document.getElementById('welcome-screen');
  const game = document.getElementById('game-wrapper');
  welcome.classList.remove('hidden');
  game.classList.add('hidden');
}

// ─── INITIALIZATION ───
function initGame(playerCount) {
  const numPlayers = playerCount || state.playerCount || 4;

  // Shuffle tiki colors for the stack
  const shuffled = [...TIKI_COLORS].sort(() => Math.random() - 0.5);
  state.stack = shuffled.map(c => ({ ...c }));

  // Create players with secret goals
  state.players = [];
  for (let i = 0; i < numPlayers; i++) {
    const secretGoal = TIKI_COLORS[Math.floor(Math.random() * TIKI_COLORS.length)];
    state.players.push({
      name: `Player ${i + 1}`,
      score: 0,
      secretGoal: secretGoal,
      showSecret: false,
    });
  }

  state.currentPlayer = 0;
  state.round = 1;
  state.gameOver = false;
  state.selectedTiki = null;
  state.selectedAction = null;
  state.usedCards = [];

  dealCards();
  renderAll();
  showToast('🌴 New game started! Player 1\'s turn');
}

function dealCards() {
  // Deal 3 random action cards to current player
  const available = [...ACTION_CARDS].sort(() => Math.random() - 0.5);
  state.hand = available.slice(0, 3);
  state.usedCards = [];
}

// ─── RENDERING ───
function renderAll() {
  renderScoreboard();
  renderStack();
  renderCards();
  renderTurnIndicator();
  updatePointsArrow();
}

function renderScoreboard() {
  const board = document.getElementById('scoreboard');
  board.innerHTML = '';

  state.players.forEach((player, i) => {
    const row = document.createElement('div');
    row.className = `player-row ${i === state.currentPlayer ? 'active' : ''}`;
    row.style.background = PLAYER_BG_COLORS[i];
    row.id = `player-row-${i}`;

    const isActive = i === state.currentPlayer;
    // Active player always sees their own secret goal
    const showGoal = isActive || player.showSecret;

    row.innerHTML = `
      <div class="player-number" style="background: ${PLAYER_NUM_COLORS[i]}">
        ${i + 1}
      </div>
      <div class="player-name">
        ${player.name}${isActive ? ' (Active)' : ''}
      </div>
      <div class="player-score">${player.score}</div>
      <div class="player-secret">
        <span class="secret-value">
          ${showGoal 
            ? `<img src="${player.secretGoal.img}" alt="${player.secretGoal.name}" class="secret-mini-img">` 
            : '🔒'}
        </span>
        ${isActive
          ? `<span class="secret-hint" title="Your secret tiki">⭐</span>`
          : `<span class="secret-lock" onclick="toggleSecret(${i})" title="Click to peek">
              ${player.showSecret ? '👁️' : '🔒'}
            </span>`
        }
      </div>
    `;

    board.appendChild(row);
  });
}

function renderStack() {
  const container = document.getElementById('stack');
  container.innerHTML = '';

  state.stack.forEach((tiki, i) => {
    const div = document.createElement('div');
    div.className = `tiki ${tiki.cls} tiki-enter`;
    div.style.animationDelay = `${i * 0.05}s`;
    div.id = `tiki-${i}`;
    div.dataset.index = i;
    div.dataset.color = tiki.id;

    // Create image element for the tiki
    const img = document.createElement('img');
    img.src = tiki.img;
    img.alt = `${tiki.name} Tiki`;
    img.className = 'tiki-img';
    img.draggable = false;
    div.appendChild(img);

    // Add name label below
    const label = document.createElement('span');
    label.className = 'tiki-label';
    label.textContent = tiki.name;
    label.style.color = tiki.glow;
    div.appendChild(label);

    if (state.selectedTiki === i) {
      div.classList.add('selected');
    }

    div.addEventListener('click', () => selectTiki(i));

    container.appendChild(div);
  });
}

function renderCards() {
  const hand = document.getElementById('cards-hand');
  hand.innerHTML = '';

  // Render the Secret Goal Card for the active player
  const secretGoalCard = document.getElementById('secret-goal-card');
  if (secretGoalCard) {
    const activePlayer = state.players[state.currentPlayer];
    if (activePlayer && activePlayer.secretGoal) {
      secretGoalCard.innerHTML = `
        <span class="deck-title">Secret Goal</span>
        <img src="${activePlayer.secretGoal.img}" alt="Secret Tiki">
      `;
      secretGoalCard.classList.add('has-content');
    }
  }

  // Pick a random tiki image for card illustration
  const tikiImages = TIKI_COLORS.map(c => c.img);

  state.hand.forEach((card, i) => {
    const div = document.createElement('div');
    div.className = `action-card ${card.fire ? 'card-fire' : ''} ${state.usedCards.includes(i) ? 'used' : ''}`;
    div.id = `action-card-${i}`;
    div.title = card.desc;

    // Use a tiki image as the card icon, different for each card
    const tikiImg = tikiImages[(i * 3 + state.currentPlayer) % tikiImages.length];

    div.innerHTML = `
      <img src="${tikiImg}" alt="${card.label}" class="card-tiki-img">
      <span class="card-label">${card.label}</span>
    `;

    div.addEventListener('click', () => playCard(i));
    hand.appendChild(div);
  });
}

function renderTurnIndicator() {
  const indicator = document.getElementById('turn-indicator');
  indicator.textContent = state.gameOver
    ? 'Game Over!'
    : `Round ${state.round} • ${state.players[state.currentPlayer].name}'s Turn`;

  const playBtn = document.getElementById('play-btn-text');
  playBtn.textContent = state.gameOver ? 'NEW GAME' : 'NEXT TURN';
}

function updatePointsArrow() {
  document.querySelectorAll('.point-label').forEach(label => {
    const pts = parseInt(label.dataset.pts);
    const arrow = label.querySelector('.arrow-indicator');
    if (arrow) arrow.remove();

    if (pts === state.stack.length) {
      const span = document.createElement('span');
      span.className = 'arrow-indicator';
      span.textContent = ' ◄';
      label.appendChild(span);
    }
  });
}

// ─── GAME ACTIONS ───
function selectTiki(index) {
  if (state.gameOver) return;

  if (state.selectedTiki === index) {
    state.selectedTiki = null;
  } else {
    state.selectedTiki = index;
  }

  // Update visual selection
  document.querySelectorAll('.tiki').forEach((el, i) => {
    el.classList.toggle('selected', i === state.selectedTiki);
  });
}

function playCard(cardIndex) {
  if (state.gameOver || state.usedCards.includes(cardIndex)) return;

  const card = state.hand[cardIndex];

  switch (card.type) {
    case 'tiki_up_1':
      if (state.selectedTiki === null) {
        showToast('⚠️ Select a tiki first!');
        return;
      }
      moveTikiUp(state.selectedTiki, 1);
      break;

    case 'tiki_up_2':
      if (state.selectedTiki === null) {
        showToast('⚠️ Select a tiki first!');
        return;
      }
      moveTikiUp(state.selectedTiki, 2);
      break;

    case 'tiki_down_1':
      if (state.selectedTiki === null) {
        showToast('⚠️ Select a tiki first!');
        return;
      }
      moveTikiDown(state.selectedTiki, 1);
      break;

    case 'tiki_topple':
      toppleBottom();
      break;

    case 'tiki_toast':
      if (state.selectedTiki === null) {
        showToast('🔥 Select a tiki to toast!');
        return;
      }
      toastTiki(state.selectedTiki);
      break;

    case 'elimination':
      eliminateTop();
      break;
  }

  state.usedCards.push(cardIndex);
  state.selectedTiki = null;
  renderAll();
}

function moveTikiUp(index, positions) {
  if (index + positions >= state.stack.length) {
    showToast('Cannot move higher!');
    const el = document.getElementById(`tiki-${index}`);
    if (el) el.classList.add('tiki-shake');
    return;
  }

  for (let p = 0; p < positions; p++) {
    const i = index + p;
    if (i < state.stack.length - 1) {
      [state.stack[i], state.stack[i + 1]] = [state.stack[i + 1], state.stack[i]];
    }
  }

  showToast(`⬆️ ${state.stack[index + positions]?.name || 'Tiki'} moved up ${positions}!`);
}

function moveTikiDown(index, positions) {
  if (index - positions < 0) {
    showToast('Cannot move lower!');
    const el = document.getElementById(`tiki-${index}`);
    if (el) el.classList.add('tiki-shake');
    return;
  }

  for (let p = 0; p < positions; p++) {
    const i = index - p;
    if (i > 0) {
      [state.stack[i], state.stack[i - 1]] = [state.stack[i - 1], state.stack[i]];
    }
  }

  showToast(`⬇️ Tiki moved down ${positions}!`);
}

function toppleBottom() {
  if (state.stack.length === 0) return;

  const removed = state.stack.shift();
  showToast(`💥 ${removed.name} tiki toppled from the bottom!`);

  // Animate
  const firstTiki = document.querySelector('.tiki');
  if (firstTiki) {
    firstTiki.classList.add('tiki-topple');
    setTimeout(() => renderAll(), 500);
  }
}

function toastTiki(index) {
  if (index < 0 || index >= state.stack.length) return;

  const removed = state.stack.splice(index, 1)[0];
  showToast(`🔥 ${removed.name} tiki is toasted!`);
}

function eliminateTop() {
  if (state.stack.length === 0) return;

  const removed = state.stack.pop();
  showToast(`💀 ${removed.name} eliminated from the top!`);
}

// ─── TURN & SCORING ───
function handlePlay() {
  if (state.gameOver) {
    showWelcome();
    return;
  }

  nextTurn();
}

function nextTurn() {
  // Calculate interim score
  calculateRoundScore();

  state.currentPlayer = (state.currentPlayer + 1) % state.players.length;

  // If we've gone back to the first player, advance round
  if (state.currentPlayer === 0) {
    state.round++;

    if (state.round > state.maxRounds) {
      endGame();
      return;
    }

    showToast(`🌺 Round ${state.round} begins!`);
  }

  // Deal new cards for the next player
  dealCards();
  state.selectedTiki = null;
  renderAll();

  showToast(`🎯 ${state.players[state.currentPlayer].name}'s turn!`);
}

function calculateRoundScore() {
  state.stack.forEach((tiki, index) => {
    // Higher position = more points
    const points = index + 1;

    state.players.forEach(player => {
      if (player.secretGoal.id === tiki.id) {
        player.score += points;
      }
    });
  });
}

function endGame() {
  state.gameOver = true;

  // Final score
  let winner = state.players[0];
  state.players.forEach(p => {
    if (p.score > winner.score) winner = p;
  });

  state.stats.totalGames++;
  state.stats.wins[winner.name] = (state.stats.wins[winner.name] || 0) + 1;

  renderAll();

  // Show winner modal
  const modal = document.getElementById('modal-body');
  modal.innerHTML = `
    <div class="winner-banner">
      <span class="trophy">🏆</span>
      <h2>WINNER!</h2>
      <p>${winner.name} wins with ${winner.score} points!</p>
      <br>
      <h3 style="color:var(--text-gold); font-family:'Lilita One',cursive; margin-bottom:12px;">Final Scores</h3>
      <table class="stats-table">
        <tr><th>Player</th><th>Score</th><th>Secret Goal</th></tr>
        ${state.players.map(p => `
          <tr>
            <td>${p.name}</td>
            <td style="color:var(--gold); font-weight:bold;">${p.score}</td>
            <td>${p.secretGoal.emoji} ${p.secretGoal.name}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;

  openModal();
}

// ─── UI HELPERS ───
function toggleSecret(playerIndex) {
  state.players[playerIndex].showSecret = !state.players[playerIndex].showSecret;
  renderScoreboard();
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  const btn = document.querySelector('.icon-sound');
  btn.textContent = state.soundOn ? '🔊' : '🔇';
  showToast(state.soundOn ? '🔊 Sound on' : '🔇 Sound off');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

// ─── MODAL ───
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function showRules() {
  const modal = document.getElementById('modal-body');
  modal.innerHTML = `
    <h2>📜 Rules of Tiki Topple</h2>
    <ul>
      <li><span class="rule-icon">🎯</span> Each player has a <strong>Secret Goal</strong> — a tiki color they want at the top of the stack.</li>
      <li><span class="rule-icon">🃏</span> On your turn, you get <strong>3 Action Cards</strong> to play.</li>
      <li><span class="rule-icon">⬆️</span> <strong>Tiki Up</strong> — Move a selected tiki up 1 or 2 positions.</li>
      <li><span class="rule-icon">⬇️</span> <strong>Tiki Down</strong> — Move a selected tiki down 1 position.</li>
      <li><span class="rule-icon">💥</span> <strong>Tiki Topple</strong> — Remove the bottom tiki from the stack.</li>
      <li><span class="rule-icon">🔥</span> <strong>Tiki Toast</strong> — Select & eliminate any tiki from the stack!</li>
      <li><span class="rule-icon">💀</span> <strong>Elimination</strong> — Remove the top tiki from the stack.</li>
    </ul>
    <br>
    <h3 style="color:var(--text-gold); font-family:'Lilita One',cursive;">Scoring</h3>
    <p>At the end of each round, tikis earn points based on their position (top = highest). Your secret goal tiki's position determines your score!</p>
    <p>After <strong>3 rounds</strong>, the player with the most points wins! 🏆</p>
  `;
  openModal();
}

function showStats() {
  const modal = document.getElementById('modal-body');

  let winRows = '';
  for (const [name, wins] of Object.entries(state.stats.wins)) {
    winRows += `<tr><td>${name}</td><td style="color:var(--gold);">${wins}</td></tr>`;
  }

  if (!winRows) {
    winRows = '<tr><td colspan="2" style="text-align:center; opacity:0.6;">No games completed yet</td></tr>';
  }

  modal.innerHTML = `
    <h2>📊 Game Statistics</h2>
    <table class="stats-table">
      <tr><th>Stat</th><th>Value</th></tr>
      <tr><td>Total Games Played</td><td style="color:var(--gold);">${state.stats.totalGames}</td></tr>
      <tr><td>Current Round</td><td style="color:var(--gold);">${state.round} / ${state.maxRounds}</td></tr>
      <tr><td>Tikis Remaining</td><td style="color:var(--gold);">${state.stack.length}</td></tr>
    </table>
    <br>
    <h3 style="color:var(--text-gold); font-family:'Lilita One',cursive; margin-bottom:8px;">Win Record</h3>
    <table class="stats-table">
      <tr><th>Player</th><th>Wins</th></tr>
      ${winRows}
    </table>

    <br>
    <h3 style="color:var(--text-gold); font-family:'Lilita One',cursive; margin-bottom:8px;">Current Scores</h3>
    <table class="stats-table">
      <tr><th>Player</th><th>Score</th><th>Secret</th></tr>
      ${state.players.map(p => `
        <tr>
          <td>${p.name}</td>
          <td style="color:var(--gold);">${p.score}</td>
          <td>${p.showSecret ? p.secretGoal.emoji : '🔒'}</td>
        </tr>
      `).join('')}
    </table>
  `;
  openModal();
}

function showSettings() {
  const modal = document.getElementById('modal-body');
  modal.innerHTML = `
    <h2>⚙️ Settings</h2>
    <div class="setting-row">
      <span class="setting-label">Number of Rounds</span>
      <div class="setting-control">
        <select id="setting-rounds" onchange="updateRounds(this.value)">
          <option value="2" ${state.maxRounds === 2 ? 'selected' : ''}>2 Rounds</option>
          <option value="3" ${state.maxRounds === 3 ? 'selected' : ''}>3 Rounds</option>
          <option value="5" ${state.maxRounds === 5 ? 'selected' : ''}>5 Rounds</option>
        </select>
      </div>
    </div>
    <div class="setting-row">
      <span class="setting-label">Sound Effects</span>
      <div class="setting-control">
        <select id="setting-sound" onchange="toggleSound()">
          <option value="on" ${state.soundOn ? 'selected' : ''}>On</option>
          <option value="off" ${!state.soundOn ? 'selected' : ''}>Off</option>
        </select>
      </div>
    </div>
    <div class="setting-row" style="border:none; margin-top:16px;">
      <span class="setting-label" style="color:#e74c3c;">Reset Game</span>
      <div class="setting-control">
        <button class="bar-btn" onclick="closeModal(); initGame();" style="background:rgba(192,57,43,0.5);">
          🔄 New Game
        </button>
      </div>
    </div>
  `;
  openModal();
}

function updateRounds(val) {
  state.maxRounds = parseInt(val);
  showToast(`🎮 Game set to ${state.maxRounds} rounds`);
}

// ─── TOAST NOTIFICATION ───
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ─── AMBIENT PARTICLES ───
function createParticles() {
  const container = document.getElementById('particles');
  const count = 25;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 10;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${left}%`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;

    // Random color — golden/green
    const colors = [
      'rgba(255, 215, 0, 0.3)',
      'rgba(144, 238, 144, 0.2)',
      'rgba(255, 165, 0, 0.25)',
      'rgba(255, 255, 200, 0.2)',
    ];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];

    container.appendChild(particle);
  }
}

// ─── KEYBOARD SHORTCUTS ───
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'n' || e.key === 'N') handlePlay();
  if (e.key === 'r' || e.key === 'R') showRules();
});

// ─── STARTUP ───
createParticles();
// Game starts when player clicks a count on the welcome screen