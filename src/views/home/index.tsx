// Next, React
import { FC, useState, useReducer, useEffect, useRef, useCallback } from 'react';
import pkg from '../../../package.json';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN – central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake “feed card” top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};

// ✅ THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// Replace this entire GameSandbox component with the one AI generates.
// Keep the name `GameSandbox` and the `FC` type.



const GameSandbox: FC = () => {
  type EnemyType = 'bot' | 'scam' | 'jupiter' | 'firedancer' | 'whale' | 'validator' | 'tensor' | 'raydium' | 'boss';
  
  interface Bullet { id: number; x: number; y: number; damage: number; }
  interface EnemyBullet { id: number; x: number; y: number; }
  interface Enemy {
    id: number; x: number; y: number; type: EnemyType;
    hp: number; maxHp: number; size: number; lastShoot: number; shootChance: number;
  }
  interface Explosion { id: number; x: number; y: number; life: number; }
  interface Ball { x: number; y: number; dx: number; dy: number; active: boolean; missedCount: number; }

  interface Game {
    score: number; solPoints: number; level: number; lives: number;
    playerX: number; playerTargetX: number;
    bullets: Bullet[]; enemyBullets: EnemyBullet[]; enemies: Enemy[];
    explosions: Explosion[];
    showPauseMenu: boolean;
    fireRateLevel: number; damageLevel: number;
    levelBg: number;
    levelIntroStart: number;
    ball: Ball;
  }

  const audioCtx = useRef<AudioContext | null>(null);

  const playSound = (type: 'shoot' | 'explosion' | 'hit' | 'levelup' | 'bounce') => {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtx.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        osc.start(); osc.stop(now + 0.1);
      } else if (type === 'bounce') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(); osc.stop(now + 0.05);
      } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(); osc.stop(now + 0.2);
      } else if (type === 'levelup') {
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(783, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(); osc.stop(now + 0.4);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        osc.start(); osc.stop(now + 0.2);
      }
    } catch (e) {}
  };

  const initialGame: Game = {
    score: 0, solPoints: 0, level: 1, lives: 3,
    playerX: 50, playerTargetX: 50,
    bullets: [], enemyBullets: [], enemies: [], explosions: [],
    showPauseMenu: false,
    fireRateLevel: 1, damageLevel: 1,
    levelBg: 0, levelIntroStart: 0,
    ball: { x: 50, y: 70, dx: 0, dy: 0, active: false, missedCount: 0 }
  };

  const levelConfigs = [
    { enemies: ['bot'], count: 25, shootChance: 0.002, bg: 0, title: 'MEV Bot Swarm', fact: "MEV Bots often front-run users. Pro-Tip: Use Jito-Solana to get tips back as a staker!", learn: "Using RPC providers like Helius helps you stay ahead of public bot congestion." },
    { enemies: ['scam'], count: 30, shootChance: 0.003, bg: 1, title: 'The Rug-Pull Flood', fact: "Scam tokens use 'mint-extensions' to steal funds. Pro-Tip: Always use Jupiter Shield or RugCheck.xyz before swapping!", learn: "Jupiter Shield automatically flags high-risk tokens to keep your wallet safe." },
    { enemies: ['firedancer'], count: 35, shootChance: 0.004, bg: 2, title: 'Firedancer Stress Test', fact: "Solana is moving towards 1M TPS. Pro-Tip: Diversifying clients makes the chain unshakeable!", learn: "Firedancer is a new validator client written in C to maximize hardware efficiency." },
    { enemies: ['whale'], count: 40, shootChance: 0.005, bg: 3, title: 'Liquidity Whales', fact: "Whales can impact the price with a single trade. Pro-Tip: Use Jupiter's Limit Orders or DCA to reduce price impact!", learn: "DCA (Dollar Cost Averaging) helps you enter positions without getting 'squeezed' by whales." },
    { enemies: ['tensor', 'raydium'], count: 45, shootChance: 0.006, bg: 0, title: 'Congestion Crisis', fact: "DEX volume can spike during a bull run. Pro-Tip: Increase your Priority Fees slightly to land transactions faster!", learn: "Priority fees are tiny amounts of SOL paid to validators to prioritize your block space." },
    { enemies: ['bot', 'scam', 'jupiter', 'firedancer', 'whale', 'validator', 'tensor', 'raydium'], count: 40, shootChance: 0, bg: 1, title: 'ARKANOID PROTOCOL', fact: "When the UI fails, the protocol remains. Pro-Tip: Keep your Seed Phrase offline!", learn: "Your keys, your crypto. Hardware wallets are the gold standard for security." },
    { enemies: ['firedancer', 'validator'], count: 30, shootChance: 0, bg: 2, title: 'BLOCK PROPAGATION', fact: "Solana is a global state machine. Pro-Tip: Check status.solana.com for real-time health!", learn: "Solana's Proof of History (PoH) acts like a clock for the blockchain." },
    { enemies: ['raydium', 'whale'], count: 35, shootChance: 0, bg: 3, title: 'LIQUIDITY BOUNCE', fact: "Pools require balancing. Pro-Tip: Meteora DLMMs are the next gen of liquidity!", learn: "Concentrated liquidity lets you earn more fees with less capital." },
    { enemies: ['tensor', 'jupiter'], count: 40, shootChance: 0, bg: 0, title: 'AGGREGATOR STRESS', fact: "Aggregators find the best routes. Pro-Tip: Jupiter finds routes across 100+ DEXs!", learn: "Routing saves you money by finding paths you wouldn't see manually." },
    { enemies: ['boss'], count: 1, shootChance: 0.06, bg: 0, title: 'TOTAL OUTAGE', fact: "The Void is here. Pro-Tip: Solana never truly stops, it just waits for consensus!", learn: "Restoring the network requires 80%+ of validator stake to agree on a snapshot." },
  ];

  const configs: Record<EnemyType, { hp: number; size: number; emoji: string }> = {
    bot: { hp: 1, size: 7, emoji: '🤖' }, 
    scam: { hp: 1, size: 7, emoji: '💩' }, 
    jupiter: { hp: 2, size: 7, emoji: '🪐' },
    firedancer: { hp: 2, size: 7, emoji: '🔥' }, 
    whale: { hp: 3, size: 9, emoji: '🐳' }, 
    validator: { hp: 4, size: 9, emoji: '🔗' },
    tensor: { hp: 3, size: 8, emoji: '📦' }, 
    raydium: { hp: 5, size: 10, emoji: '💧' }, 
    boss: { hp: 400, size: 28, emoji: '👹' },
  };

  const scoreMap: Record<EnemyType, number> = {
    bot: 25, scam: 30, jupiter: 50, firedancer: 45, whale: 80, validator: 100, tensor: 70, raydium: 130, boss: 25000,
  };

  const gameReducer = (state: Game, action: any): Game => {
    if (action.type === 'reset') return { ...initialGame };
    if (action.type === 'move') return { ...state, playerTargetX: action.x };
    if (action.type === 'togglePause') return { ...state, showPauseMenu: !state.showPauseMenu };

    const isArkanoidLevel = state.level >= 6 && state.level < 10;

    if (action.type === 'fire') {
      if (state.showPauseMenu || state.levelIntroStart > 0 || isArkanoidLevel) return state;
      const bulletDamage = 1.2 + state.damageLevel * 0.8;
      action.playSfx('shoot');
      return { ...state, bullets: [...state.bullets, { id: Date.now() + Math.random(), x: state.playerX, y: 82, damage: bulletDamage }] };
    }

    if (action.type === 'nextLevel') {
      const newLevel = state.level + 1;
      const cfg = levelConfigs[Math.min(newLevel - 1, levelConfigs.length - 1)];
      return {
        ...state,
        level: newLevel,
        lives: Math.min(state.lives + 2, 7),
        solPoints: state.solPoints + 50 * newLevel,
        levelBg: cfg.bg,
        levelIntroStart: action.now,
        enemies: [], enemyBullets: [], bullets: [], explosions: [],
        ball: newLevel >= 6 ? { x: 50, y: 70, dx: 0.45, dy: -0.45, active: true, missedCount: 0 } : state.ball,
      };
    }

    if (action.type === 'startLevel') {
      return {
        ...state,
        levelIntroStart: action.now,
        enemies: [], enemyBullets: [], bullets: [], explosions: [],
        ball: state.level >= 6 ? { x: 50, y: 70, dx: 0.45, dy: -0.45, active: true, missedCount: 0 } : { ...state.ball, active: false }
      };
    }

    if (action.type !== 'tick') return state;
    if (state.showPauseMenu) return state;

    const now = action.now;
    let { bullets, enemies, enemyBullets, explosions, ball } = state;
    let addedScore = 0;
    let playerHitCount = 0;
    const playerX = Math.max(12, Math.min(88, state.playerX * 0.8 + state.playerTargetX * 0.2));

    if (state.levelIntroStart > 0) {
      if (now - state.levelIntroStart >= 5000) {
        const cfg = levelConfigs[Math.min(state.level - 1, levelConfigs.length - 1)];
        const newEnemies: Enemy[] = [];
        if (state.level === 10) {
          newEnemies.push({ id: now, x: 50, y: 15, type: 'boss', hp: configs.boss.hp, maxHp: configs.boss.hp, size: configs.boss.size, lastShoot: now, shootChance: cfg.shootChance });
        } else {
          for (let i = 0; i < cfg.count; i++) {
            const type = cfg.enemies[Math.floor(Math.random() * cfg.enemies.length)] as EnemyType;
            newEnemies.push({ id: now + i, x: 10 + (i % 10) * 9, y: 10 + Math.floor(i / 10) * 7.5, type, hp: configs[type].hp + Math.floor((state.level - 1) / 2), maxHp: configs[type].hp + Math.floor((state.level - 1) / 2), size: configs[type].size, lastShoot: now - 3000, shootChance: isArkanoidLevel ? 0 : cfg.shootChance });
          }
        }
        return { ...state, levelIntroStart: 0, enemies: newEnemies, playerX };
      }
      return { ...state, playerX };
    }

    if (ball.active) {
      ball.x += ball.dx; ball.y += ball.dy;
      if (Math.abs(ball.dy) < 0.1) ball.dy = ball.dy < 0 ? -0.2 : 0.2;
      if (ball.x < 2 || ball.x > 98) { ball.dx *= -1; action.playSfx('bounce'); }
      if (ball.y < 2) { ball.dy = Math.abs(ball.dy); ball.dx += (Math.random() - 0.5) * 0.1; action.playSfx('bounce'); }
      if (ball.y > 80 && ball.y < 85 && Math.abs(ball.x - playerX) < 10) { ball.dy = -Math.abs(ball.dy); ball.dx = (ball.x - playerX) * 0.08; action.playSfx('bounce'); }
      if (ball.y > 105) { 
        ball.missedCount += 1;
        if (ball.missedCount >= 2) { playerHitCount++; ball.missedCount = 0; action.playSfx('hit'); }
        ball.x = playerX; ball.y = 70; ball.dy = -0.45; 
      }
    }

    bullets = state.bullets.map(b => ({ ...b, y: b.y - 2.5 })).filter(b => b.y > -8);
    enemyBullets = state.enemyBullets.map(b => ({ ...b, y: b.y + 1.1 })).filter(b => b.y < 110);

    const survivingEnemyBullets: EnemyBullet[] = [];
    for (const eb of enemyBullets) {
      if (Math.abs(eb.x - playerX) < 8 && eb.y > 78 && eb.y < 94) {
        explosions.push({ id: now + Math.random(), x: playerX, y: 86, life: 35 });
        playerHitCount++; action.playSfx('hit');
      } else survivingEnemyBullets.push(eb);
    }
    enemyBullets = survivingEnemyBullets;

    const workEnemies = [...enemies];
    for (let i = 0; i < workEnemies.length; i++) {
        const e = workEnemies[i];
        if (ball.active && Math.abs(ball.x - e.x) < e.size/2 && Math.abs(ball.y - e.y) < e.size/2) {
            e.hp -= 20; ball.dy *= -1; action.playSfx('bounce');
            if (e.hp <= 0) { addedScore += scoreMap[e.type]; explosions.push({ id: now + Math.random(), x: e.x, y: e.y, life: 40 }); workEnemies.splice(i, 1); i--; continue; }
        }
        if (Math.random() < (state.level === 10 ? 0.06 : e.shootChance) && now - e.lastShoot > (state.level === 10 ? 500 : 3500)) {
            enemyBullets.push({ id: now + Math.random(), x: e.x + (state.level === 10 ? (Math.random()*20-10) : 0), y: e.y + e.size / 2 });
            e.lastShoot = now;
        }
        if (e.type === 'boss') e.x = 50 + Math.sin(now / 800) * 35;
    }

    if (!isArkanoidLevel) {
        const remainingBullets: Bullet[] = [];
        for (const b of bullets) {
            let hit = false;
            for (let i = 0; i < workEnemies.length; i++) {
                const e = workEnemies[i];
                if (Math.abs(b.x - e.x) < e.size/2 && Math.abs(b.y - e.y) < e.size/2) {
                    hit = true; e.hp -= b.damage;
                    if (e.hp <= 0) { addedScore += scoreMap[e.type]; explosions.push({ id: now + Math.random(), x: e.x, y: e.y, life: 42 }); action.playSfx('explosion'); workEnemies.splice(i, 1); i--; }
                    break;
                }
            }
            if (!hit) remainingBullets.push(b);
        }
        bullets = remainingBullets;
    }

    return { ...state, playerX, bullets, enemyBullets, enemies: workEnemies, explosions: state.explosions.map(e => ({ ...e, life: e.life - 1.8 })).filter(e => e.life > 0), ball, score: state.score + addedScore, lives: Math.max(0, state.lives - playerHitCount) };
  };

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over' | 'levelComplete'>('ready');
  const [game, dispatch] = useReducer(gameReducer, initialGame);
  const containerRef = useRef<HTMLDivElement>(null);

  const startGame = useCallback(() => { dispatch({ type: 'reset' }); dispatch({ type: 'startLevel', now: performance.now() }); setGameState('playing'); playSound('levelup'); }, []);
  const startNextLevel = useCallback(() => { dispatch({ type: 'nextLevel', now: performance.now() }); setGameState('playing'); playSound('levelup'); }, []);

  const handleGlobalClick = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (gameState === 'over') startGame();
    else if (gameState === 'levelComplete') startNextLevel();
    else if (gameState === 'playing') dispatch({ type: 'fire', playSfx: playSound });
  }, [gameState, startGame, startNextLevel]);

  useEffect(() => {
    if (gameState === 'playing' && !game.showPauseMenu) {
      const tick = (now: number) => { dispatch({ type: 'tick', now, playSfx: playSound }); raf = requestAnimationFrame(tick); };
      let raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
  }, [gameState, game.showPauseMenu]);

  useEffect(() => {
    if (game.lives <= 0 && gameState === 'playing') { setGameState('over'); playSound('hit'); }
    if (game.enemies.length === 0 && gameState === 'playing' && game.levelIntroStart === 0) { setGameState('levelComplete'); playSound('levelup'); }
  }, [game.lives, game.enemies.length, game.levelIntroStart, gameState]);

  const levelConfig = levelConfigs[Math.min(game.level - 1, levelConfigs.length - 1)];
  const countdown = Math.max(0, 5 - Math.floor((performance.now() - game.levelIntroStart) / 1000));

  return (
    <div className="w-full h-full bg-black overflow-hidden flex flex-col relative select-none touch-none font-sans" onPointerDown={handleGlobalClick}>
      {/* HUD */}
      <div className="bg-black/90 p-3 text-white border-b border-emerald-500/50 z-[100] relative shrink-0">
        <div className="flex justify-between items-start mb-1">
          <div className="text-xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent uppercase italic">
            SOLANA DEFENSE ₿🔒
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'togglePause' }); }} 
            className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center border border-emerald-500/40 text-emerald-400 active:bg-emerald-500/40"
          >
            {game.showPauseMenu ? '▶' : '||'}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-emerald-300">
          <span className="truncate">SCORE: <span className="text-green-400 text-sm">{game.score.toLocaleString()}</span></span>
          <span>LVL: {game.level}</span>
          <span className="truncate">SOL: <span className="text-yellow-400">{game.solPoints}</span></span>
          <span className="flex justify-end overflow-hidden">{'❤️'.repeat(game.lives)}</span>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative cursor-none" onPointerMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && gameState === 'playing' && !game.showPauseMenu) dispatch({ type: 'move', x: Math.max(12, Math.min(88, ((e.clientX - rect.left) / rect.width) * 100)) });
      }}>
        {game.ball.active && (
          <div className="absolute w-6 h-6 z-50 flex items-center justify-center" style={{ left: `${game.ball.x - 3}%`, top: `${game.ball.y - 3}%` }}>
            <div className="w-full h-full bg-white rounded-full shadow-[0_0_15px_white] animate-pulse text-[10px] font-bold text-purple-600 flex items-center justify-center">◎</div>
          </div>
        )}
        {game.explosions.map(exp => <div key={exp.id} className="absolute w-12 h-12 pointer-events-none z-20 bg-gradient-to-tr from-orange-600 to-yellow-400 rounded-full blur-sm" style={{ left: `${exp.x - 6}%`, top: `${exp.y - 6}%`, opacity: exp.life / 50, transform: `scale(${0.8 + (42 - exp.life) / 20})` }} />)}
        <div className="absolute w-14 h-10 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-3xl z-30 shadow-lg shadow-emerald-900/50" style={{ left: `${game.playerX - 7}%`, top: '82%' }}>🚀</div>
        {game.bullets.map(b => <div key={b.id} className="absolute w-1.5 h-6 bg-cyan-400 rounded-full z-40 shadow-[0_0_8px_cyan]" style={{ left: `${b.x - 0.75}%`, top: `${b.y}%` }} />)}
        {game.enemyBullets.map(eb => <div key={eb.id} className="absolute w-2 h-5 bg-red-500 rounded z-25 shadow-[0_0_8px_red]" style={{ left: `${eb.x - 1}%`, top: `${eb.y}%` }} />)}
        {game.enemies.map(e => (
          <div key={e.id} className="absolute flex flex-col items-center justify-center font-black z-10" style={{ left: `${e.x - e.size / 2}%`, top: `${e.y - e.size / 2}%`, width: `${e.size}%`, height: `${e.size}%` }}>
            <span className={e.type === 'boss' ? 'text-7xl animate-pulse' : 'text-3xl'}>{configs[e.type].emoji}</span>
            {e.type === 'boss' && <div className="w-full h-2 bg-gray-800 rounded mt-2 border border-white/20 overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${(e.hp / e.maxHp) * 100}%` }} /></div>}
          </div>
        ))}
      </div>

      {/* MISSION BRIEF: READY SCREEN */}
      {gameState === 'ready' && (
        <div className="absolute inset-x-0 bottom-0 top-[68px] bg-black/60 flex flex-col items-center justify-center z-[90] p-6 text-center text-white backdrop-blur-sm">
          <div className="bg-black/95 p-6 rounded-[28px] w-full max-w-[290px] border border-emerald-500/30 shadow-2xl space-y-5">
            <div className="text-xl font-black text-emerald-400 uppercase tracking-tighter border-b border-emerald-500/20 pb-2">SOLANA DEFENDER</div>
            <div className="space-y-3 text-left text-[12px] text-gray-300">
              <p>🛡️ <span className="text-white font-bold">TASK:</span> Purge the bots and secure the chain.</p>
              <p>🕹️ <span className="text-white font-bold">MOVE:</span> Slide finger to control the pod.</p>
              <p>💎 <span className="text-white font-bold">REWARD:</span> Earn SOL for every block secured.</p>
            </div>
            <button onClick={startGame} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm rounded-xl shadow-[0_3px_0_rgb(5,150,105)] active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-widest">INITIALIZE</button>
          </div>
        </div>
      )}

      {/* OVERLAY: LEVEL COMPLETE (Enhanced Fun & Learning) */}
      {gameState === 'levelComplete' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[110] p-6 text-center text-white backdrop-blur-md">
          <div className="bg-gradient-to-b from-emerald-950/80 to-black p-1 rounded-[32px] border border-emerald-400/30 shadow-[0_0_50px_rgba(16,185,129,0.3)] w-full max-w-[340px]">
            <div className="bg-black/40 px-6 py-8 rounded-[28px] flex flex-col items-center gap-5">
              
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 animate-pulse"></div>
                <div className="text-5xl mb-2">🎉</div>
                <div className="text-3xl font-black text-white uppercase tracking-tighter italic">
                  BLOCK <span className="text-emerald-400">#{(1000 + game.level).toString()}</span>
                </div>
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Validated Successfully</div>
              </div>

              <div className="w-full space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                  <div className="text-[9px] text-yellow-500 font-bold uppercase mb-1 tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Pro-Tip
                  </div>
                  <p className="text-[11px] text-gray-300 leading-snug italic">"{levelConfig.fact}"</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-left">
                  <div className="text-[9px] text-emerald-400 font-bold uppercase mb-1 tracking-widest">Did You Know?</div>
                  <p className="text-[11px] text-emerald-200/80 leading-snug">{levelConfig.learn}</p>
                </div>
              </div>

              <button 
                onClick={startNextLevel} 
                className="w-full group relative flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl uppercase text-sm transition-all shadow-[0_5px_0_rgb(5,150,105)] active:translate-y-1 active:shadow-none"
              >
                <span>MINT NEXT BLOCK</span>
                <span className="group-hover:translate-x-1 transition-transform">➡</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: GAME OVER (Halted Theme) */}
      {gameState === 'over' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[120] text-white p-6 text-center backdrop-blur-md">
          <div className="bg-gradient-to-b from-red-900/40 to-black p-1 rounded-[32px] border border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.2)] w-full max-w-[320px]">
            <div className="bg-black/60 px-6 py-10 rounded-[28px] flex flex-col items-center gap-6">
              
              <div className="relative">
                <div className="absolute inset-0 bg-red-600 blur-3xl opacity-30 animate-pulse"></div>
                <div className="text-6xl mb-2">🔌</div>
                <div className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">
                  NETWORK <span className="text-red-500">HALTED</span>
                </div>
                <div className="text-[10px] font-bold text-red-500/80 uppercase mt-2 tracking-widest">Consensus Lost</div>
              </div>

              <div className="w-full space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-[9px] text-gray-400 font-bold uppercase mb-1 tracking-widest">FINAL SCORE</div>
                    <div className="text-xl font-black text-white">{game.score.toLocaleString()}</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                    <div className="text-[9px] text-yellow-500 font-bold uppercase mb-1 tracking-widest">SOL EARNED</div>
                    <div className="text-xl font-black text-white">{game.solPoints}</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={startGame} 
                className="w-full relative flex items-center justify-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl uppercase text-sm transition-all shadow-[0_5px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none"
              >
                <span>REBOOT CLUSTER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL INTRO */}
      {game.levelIntroStart > 0 && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-[130] text-white p-8 text-center">
          <div className="text-2xl font-black text-emerald-400 mb-2 uppercase tracking-widest">LEVEL {game.level}</div>
          <div className="text-lg font-bold mb-4 uppercase text-gray-500 tracking-tighter">{levelConfig.title}</div>
          <div className="text-6xl font-black text-yellow-400 animate-bounce">{countdown || 'GO!'}</div>
        </div>
      )}

      {/* PAUSE MENU */}
      {game.showPauseMenu && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[200] backdrop-blur-sm">
          <div className="text-4xl font-black text-emerald-400 italic mb-8 uppercase tracking-tighter">NODE PAUSED</div>
          <button 
            onClick={() => dispatch({ type: 'togglePause' })}
            className="px-12 py-4 bg-emerald-500 text-black font-black rounded-2xl uppercase tracking-widest shadow-[0_4px_0_rgb(5,150,105)]"
          >
            RESUME
          </button>
        </div>
      )}
    </div>
  );
};
