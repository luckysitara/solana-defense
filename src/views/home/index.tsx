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
  interface PowerUp { id: number; x: number; y: number; type: 'shield'; }

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
    shieldTimeRemaining: number;
    powerUps: PowerUp[];
  }

  const audioCtx = useRef<AudioContext | null>(null);

  const playSound = (type: 'shoot' | 'explosion' | 'hit' | 'levelup' | 'bounce' | 'powerup') => {
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
      } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(); osc.stop(now + 0.2);
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
    ball: { x: 50, y: 70, dx: 0, dy: 0, active: false, missedCount: 0 },
    shieldTimeRemaining: 0,
    powerUps: []
  };

  const levelConfigs = [
    { enemies: ['bot'], count: 25, shootChance: 0.002, bg: 0, title: 'MEV Bot Swarm', fact: "MEV Bots often front-run users.", learn: "Using RPC providers like Helius helps you stay ahead." },
    { enemies: ['scam'], count: 30, shootChance: 0.003, bg: 1, title: 'The Rug-Pull Flood', fact: "Scam tokens use mint-extensions.", learn: "Jupiter Shield flags high-risk tokens." },
    { enemies: ['firedancer'], count: 35, shootChance: 0.004, bg: 2, title: 'Firedancer Stress Test', fact: "Solana is moving towards 1M TPS.", learn: "Firedancer maximizes hardware efficiency." },
    { enemies: ['whale'], count: 40, shootChance: 0.005, bg: 3, title: 'Liquidity Whales', fact: "Whales impact price with single trades.", learn: "Use Jupiter's DCA to reduce price impact." },
    { enemies: ['tensor', 'raydium'], count: 45, shootChance: 0.006, bg: 0, title: 'Congestion Crisis', fact: "DEX volume spikes during runs.", learn: "Priority fees land transactions faster." },
    { enemies: ['bot', 'scam', 'jupiter'], count: 40, shootChance: 0, bg: 1, title: 'ARKANOID PROTOCOL', fact: "UI fails, protocol remains.", learn: "Your keys, your crypto." },
    { enemies: ['firedancer', 'validator'], count: 30, shootChance: 0, bg: 2, title: 'BLOCK PROPAGATION', fact: "Solana is a global state machine.", learn: "Proof of History is the network clock." },
    { enemies: ['raydium', 'whale'], count: 35, shootChance: 0, bg: 3, title: 'LIQUIDITY BOUNCE', fact: "Pools require balancing.", learn: "Meteora DLMMs are next gen." },
    { enemies: ['tensor', 'jupiter'], count: 40, shootChance: 0, bg: 0, title: 'AGGREGATOR STRESS', fact: "Aggregators find best routes.", learn: "Jupiter finds routes across 100+ DEXs." },
    { enemies: ['boss'], count: 1, shootChance: 0.06, bg: 0, title: 'TOTAL OUTAGE', fact: "The Void is here.", learn: "Solana waits for consensus." },
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
      action.playSfx('shoot');
      return { ...state, bullets: [...state.bullets, { id: Date.now() + Math.random(), x: state.playerX, y: 82, damage: 2 }] };
    }

    if (action.type === 'nextLevel') {
      const newLevel = state.level + 1;
      const cfg = levelConfigs[Math.min(newLevel - 1, levelConfigs.length - 1)];
      return {
        ...state,
        level: newLevel,
        lives: Math.min(state.lives + 1, 5),
        solPoints: state.solPoints + 50 * newLevel,
        levelBg: cfg.bg,
        levelIntroStart: action.now,
        enemies: [], enemyBullets: [], bullets: [], explosions: [], powerUps: [],
        ball: newLevel >= 6 ? { x: 50, y: 70, dx: 0.45, dy: -0.45, active: true, missedCount: 0 } : state.ball,
        shieldTimeRemaining: 0
      };
    }

    if (action.type !== 'tick') return state;
    if (state.showPauseMenu) return state;

    const now = action.now;
    let { bullets, enemies, enemyBullets, explosions, ball, shieldTimeRemaining, lives, powerUps } = state;
    let addedScore = 0;
    
    const playerX = Math.max(12, Math.min(88, state.playerX * 0.8 + state.playerTargetX * 0.2));

    if (shieldTimeRemaining > 0) shieldTimeRemaining = Math.max(0, shieldTimeRemaining - 16);

    if (state.levelIntroStart > 0) {
      if (now - state.levelIntroStart >= 5000) {
        const cfg = levelConfigs[Math.min(state.level - 1, levelConfigs.length - 1)];
        const newEnemies: Enemy[] = [];
        if (state.level === 10) {
          newEnemies.push({ id: now, x: 50, y: 15, type: 'boss', hp: configs.boss.hp, maxHp: configs.boss.hp, size: configs.boss.size, lastShoot: now, shootChance: cfg.shootChance });
        } else {
          for (let i = 0; i < cfg.count; i++) {
            const type = cfg.enemies[Math.floor(Math.random() * cfg.enemies.length)] as EnemyType;
            newEnemies.push({ id: now + i, x: 10 + (i % 10) * 9, y: 10 + Math.floor(i / 10) * 7.5, type, hp: configs[type].hp, maxHp: configs[type].hp, size: configs[type].size, lastShoot: now - 3000, shootChance: isArkanoidLevel ? 0 : cfg.shootChance });
          }
        }
        return { ...state, levelIntroStart: 0, enemies: newEnemies, playerX, shieldTimeRemaining };
      }
      return { ...state, playerX, shieldTimeRemaining };
    }

    if (ball.active) {
      ball.x += ball.dx; ball.y += ball.dy;
      if (ball.x < 2 || ball.x > 98) { ball.dx *= -1; }
      if (ball.y < 2) { ball.dy = Math.abs(ball.dy); }
      if (ball.y > 80 && ball.y < 85 && Math.abs(ball.x - playerX) < 10) { ball.dy = -Math.abs(ball.dy); ball.dx = (ball.x - playerX) * 0.08; }
      if (ball.y > 105) { lives--; ball.x = playerX; ball.y = 70; ball.dy = -0.45; }
    }

    bullets = state.bullets.map(b => ({ ...b, y: b.y - 2.5 })).filter(b => b.y > -8);
    enemyBullets = state.enemyBullets.map(b => ({ ...b, y: b.y + 1.1 })).filter(b => b.y < 110);
    powerUps = powerUps.map(p => ({ ...p, y: p.y + 0.6 })).filter(p => p.y < 110);

    // Collect PowerUps
    const activePowerUps: PowerUp[] = [];
    for (const p of powerUps) {
        if (Math.abs(p.x - playerX) < 10 && p.y > 78 && p.y < 88) {
            shieldTimeRemaining = 8000;
            action.playSfx('powerup');
        } else {
            activePowerUps.push(p);
        }
    }
    powerUps = activePowerUps;

    const survivingEnemyBullets: EnemyBullet[] = [];
    for (const eb of enemyBullets) {
      const isColliding = Math.abs(eb.x - playerX) < 8 && eb.y > 78 && eb.y < 94;
      if (isColliding) {
        if (shieldTimeRemaining > 0) {
          explosions.push({ id: now + Math.random(), x: eb.x, y: eb.y, life: 10 });
        } else {
          lives--; action.playSfx('hit');
        }
      } else survivingEnemyBullets.push(eb);
    }
    enemyBullets = survivingEnemyBullets;

    const workEnemies = [...enemies];
    for (let i = 0; i < workEnemies.length; i++) {
        const e = workEnemies[i];
        if (ball.active && Math.abs(ball.x - e.x) < e.size/2 && Math.abs(ball.y - e.y) < e.size/2) {
            e.hp -= 10; ball.dy *= -1;
            if (e.hp <= 0) { 
                addedScore += scoreMap[e.type]; 
                explosions.push({ id: now + Math.random(), x: e.x, y: e.y, life: 30 }); 
                workEnemies.splice(i, 1); i--; continue; 
            }
        }
        if (Math.random() < e.shootChance && now - e.lastShoot > 3000) {
            enemyBullets.push({ id: now + Math.random(), x: e.x, y: e.y });
            e.lastShoot = now;
        }
    }

    if (!isArkanoidLevel) {
        const remainingBullets: Bullet[] = [];
        for (const b of bullets) {
            let hit = false;
            for (let i = 0; i < workEnemies.length; i++) {
                const e = workEnemies[i];
                if (Math.abs(b.x - e.x) < e.size/2 && Math.abs(b.y - e.y) < e.size/2) {
                    hit = true; e.hp -= b.damage;
                    if (e.hp <= 0) { 
                        addedScore += scoreMap[e.type]; 
                        explosions.push({ id: now + Math.random(), x: e.x, y: e.y, life: 30 }); 
                        action.playSfx('explosion');
                        if (Math.random() < 0.15) powerUps.push({ id: now, x: e.x, y: e.y, type: 'shield' });
                        workEnemies.splice(i, 1); i--; 
                    }
                    break;
                }
            }
            if (!hit) remainingBullets.push(b);
        }
        bullets = remainingBullets;
    }

    return { ...state, playerX, bullets, enemyBullets, enemies: workEnemies, explosions: state.explosions.map(e => ({ ...e, life: e.life - 2 })).filter(e => e.life > 0), ball, score: state.score + addedScore, lives: Math.max(0, lives), shieldTimeRemaining, powerUps };
  };

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over' | 'levelComplete'>('ready');
  const [game, dispatch] = useReducer(gameReducer, initialGame);
  const containerRef = useRef<HTMLDivElement>(null);

  const startGame = useCallback(() => { dispatch({ type: 'reset' }); dispatch({ type: 'tick', now: performance.now() }); setGameState('playing'); playSound('levelup'); }, []);
  const startNextLevel = useCallback(() => { dispatch({ type: 'nextLevel', now: performance.now() }); setGameState('playing'); playSound('levelup'); }, []);

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

  return (
    <div className="w-full h-full bg-black overflow-hidden flex flex-col relative select-none touch-none" onPointerDown={() => gameState === 'playing' && dispatch({ type: 'fire', playSfx: playSound })}>
      <div className="bg-slate-900/90 p-3 text-white border-b border-cyan-500/30 z-50">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
          <div className="flex flex-col">
            <span className="text-cyan-400">Score</span>
            <span className="text-sm">{game.score.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-purple-400">Level</span>
            <span className="text-sm">{game.level}</span>
          </div>
          <div className="flex gap-1 text-xs">{'❤️'.repeat(game.lives)}</div>
        </div>
        {game.shieldTimeRemaining > 0 && (
            <div className="mt-2 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 shadow-[0_0_10px_cyan]" style={{ width: `${(game.shieldTimeRemaining / 8000) * 100}%` }}></div>
            </div>
        )}
      </div>

      <div ref={containerRef} className="flex-1 relative bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#000000_100%)]" onPointerMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && gameState === 'playing') dispatch({ type: 'move', x: ((e.clientX - rect.left) / rect.width) * 100 });
      }}>
        {game.powerUps.map(p => (
            <div key={p.id} className="absolute w-10 h-10 flex items-center justify-center animate-bounce z-40" style={{ left: `${p.x - 5}%`, top: `${p.y - 5}%` }}>
                <div className="w-8 h-8 bg-cyan-500 rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_20px_#22d3ee] border-2 border-white">
                    <span className="-rotate-45 text-xs font-black text-white">JUP</span>
                </div>
            </div>
        ))}

        <div className="absolute w-16 h-12 z-30 transition-transform duration-75" style={{ left: `${game.playerX - 8}%`, top: '82%' }}>
            {game.shieldTimeRemaining > 0 && (
                <div className="absolute inset-[-15px] border-2 border-cyan-400 rounded-full animate-ping opacity-50 shadow-[0_0_30px_cyan]"></div>
            )}
            <div className={`text-4xl flex items-center justify-center ${game.shieldTimeRemaining > 0 ? 'drop-shadow-[0_0_15px_rgba(34,211,238,1)]' : ''}`}>🚀</div>
        </div>

        {game.bullets.map(b => <div key={b.id} className="absolute w-1 h-4 bg-yellow-400 rounded-full shadow-[0_0_8px_yellow]" style={{ left: `${b.x - 0.5}%`, top: `${b.y}%` }} />)}
        {game.enemyBullets.map(eb => <div key={eb.id} className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red]" style={{ left: `${eb.x - 1}%`, top: `${eb.y}%` }} />)}
        {game.enemies.map(e => <div key={e.id} className="absolute text-2xl" style={{ left: `${e.x - 4}%`, top: `${e.y - 4}%` }}>{configs[e.type].emoji}</div>)}
        {game.explosions.map(exp => <div key={exp.id} className="absolute w-8 h-8 bg-white rounded-full blur-md opacity-50 scale-150" style={{ left: `${exp.x - 4}%`, top: `${exp.y - 4}%`, transform: `scale(${1 + (30 - exp.life) / 10})` }} />)}
      </div>

      {gameState !== 'playing' && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-4xl font-black text-white italic mb-4">
                {gameState === 'ready' ? 'START MISSION' : gameState === 'over' ? 'NODE DOWN' : 'BLOCK SECURED'}
            </h2>
            <p className="text-cyan-400 mb-8 font-bold tracking-widest uppercase">
                {gameState === 'ready' ? 'Catch JUP crystals for shields' : `Score: ${game.score}`}
            </p>
            <button 
                onClick={gameState === 'levelComplete' ? startNextLevel : startGame}
                className="w-full py-4 bg-cyan-500 text-black font-black rounded-xl uppercase tracking-widest shadow-[0_5px_0_#0891b2] active:translate-y-1 active:shadow-none transition-all"
            >
                {gameState === 'levelComplete' ? 'NEXT BLOCK' : 'INITIALIZE'}
            </button>
        </div>
      )}
    </div>
  );
};
