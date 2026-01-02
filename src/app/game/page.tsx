'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useEffect, useReducer, useState, useRef } from 'react';
import { initialState, phaseLabel, type Card, HAND_LIMIT, AI_THINK_MS, checkInvariants } from '@/game/gameState';
import { reducer } from '@/game/stateMachine';
import { DEFAULT_SETTINGS, getSettings, type Settings } from '@/app/settings/model';
import { CardView } from '@/components/CardView/CardView';
import { CardView as DemoCardView } from '@/components/game/CardView';
import { CombatLogDisplay } from '@/components/CombatLogDisplay';
import { resolveDef } from '@/lib/cards/resolve';
import type { CardId } from '@/lib/cards/catalog';

function cardToDefinition(card: Card) {
  try {
    return resolveDef(card.cardId);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Missing CardDefinition for", card.cardId, e);
    }
    return null;
  }
}

function HPBadge({ label, hp, colorClass }: { label: string, hp: number, colorClass: string }) {
  const prevHpRef = useRef(hp);
  const [delta, setDelta] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (hp < prevHpRef.current) {
      const diff = prevHpRef.current - hp;
      setDelta(diff);
      setIsFlashing(true);
      
      const t1 = setTimeout(() => setDelta(null), 1000);
      const t2 = setTimeout(() => setIsFlashing(false), 600);
      
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    prevHpRef.current = hp;
  }, [hp]);

  return (
    <div className="relative flex flex-col">
      <span className="text-[10px] uppercase opacity-40 font-bold">{label}</span>
      <span className={`text-xl font-black transition-colors duration-300 ${isFlashing ? 'text-white scale-110' : colorClass}`}>
        {hp}
      </span>
      {delta !== null && (
        <span className="absolute -right-4 top-4 text-sm font-bold text-red-500 animate-bounce-up">
          -{delta}
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [aiThinking, setAiThinking] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);
  type FastTestResult = {
    totalTurns: number;
    totalDrawsYou: number;
    totalDrawsAi: number;
    totalReshufflesYou: number;
    totalReshufflesAi: number;
    invariantChecksPassed: boolean;
  } | null;

  const [testResult, setTestResult] = useState<FastTestResult>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const aiSpeedFactor = settings.aiSpeed === "fast" ? 0.5 : 1;
  const animSpeedFactor = settings.animationSpeed === "slow" ? 1.5 : settings.animationSpeed === "fast" ? 0.75 : 1;
  const aiDelayMs = Math.max(200, Math.round(AI_THINK_MS * aiSpeedFactor));
  const animDelayMs = Math.max(200, Math.round(AI_THINK_MS * animSpeedFactor));
  const showLogs = settings.showCombatLog;

  // 1. Initial Mount & Game Setup
  useEffect(() => {
    setIsMounted(true);
    dispatch({ type: 'RESET_GAME' });

    const dismissed = localStorage.getItem("warlords_install_hint_dismissed") === "1";
    if (dismissed) return;

    const isMobile = window.matchMedia("(max-width: 480px)").matches;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari legacy
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isMobile && !isStandalone) setShowInstallHint(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const loaded = getSettings();
    setSettings(loaded);
  }, [isMounted]);

  // AI Main Turn Loop (Choosing Action, Declaring Attack/Scout)
  useEffect(() => {
    if (!isMounted || state.turn === 0 || state.gameStatus === "GAME_OVER") return;
    if (state.activePlayer !== 'AI') {
      setAiThinking(false);
      return;
    }

    if (state.phase === "END_TURN" || state.reveal) {
      setAiThinking(false);
      return;
    }

    if (state.phase === "SELECT_ACTION") {
      setAiThinking(true);
      const t1 = setTimeout(() => {
        const aiHasAnyPower = state.handAi.some((c) => resolveDef(c.cardId).power > 0);
        if (aiHasAnyPower) {
          dispatch({ type: "SELECT_ATTACK" });
          
          const scouts = state.handAi.filter(c => resolveDef(c.cardId).unit === "SCOUT");
          const useScout = scouts.length > 0 && Math.random() < 0.3; // 30% to use scout if available

          const toToggle = useScout
            ? scouts[0]
            : [...state.handAi].sort((a, b) => resolveDef(b.cardId).power - resolveDef(a.cardId).power)[0];
          
          if (toToggle) {
            setTimeout(() => {
              dispatch({ type: "TOGGLE_ATTACK_CARD", cardId: toToggle.id });
              setTimeout(() => {
                dispatch({ type: "CONFIRM_ATTACK" });
                setAiThinking(false);
              }, aiDelayMs);
            }, aiDelayMs);
          } else {
             dispatch({ type: "SELECT_PASS" });
          }
        } else {
          dispatch({ type: "SELECT_PASS" });
        }
      }, animDelayMs * 2);
      return () => clearTimeout(t1);
    }
  }, [state.activePlayer, state.phase, state.handAi, state.gameStatus, state.reveal, state.turn, isMounted, aiDelayMs, animDelayMs]);

  // AI Defense Loop (When player attacks AI)
  useEffect(() => {
    if (!isMounted || state.turn === 0 || state.gameStatus === "GAME_OVER" || state.reveal) return;
    const isAiDefending = state.phase === "DEFENSE_DECLARE" && state.activePlayer === "YOU";
    if (!isAiDefending) return;

    setAiThinking(true);
    const t = setTimeout(() => {
      const best = [...state.handAi].sort((a, b) => resolveDef(b.cardId).power - resolveDef(a.cardId).power)[0];
      if (best && state.committedAttackCards.length > 0) {
        dispatch({ type: "TOGGLE_DEFENSE_CARD", cardId: best.id });
      }

      setTimeout(() => {
        dispatch({ type: "CONFIRM_DEFENSE" });
        setAiThinking(false);
      }, aiDelayMs);
    }, animDelayMs * 2);

    return () => clearTimeout(t);
  }, [state.phase, state.activePlayer, state.handAi, state.committedAttackCards.length, state.gameStatus, state.reveal, isMounted, state.turn, aiDelayMs, animDelayMs]);

  // Turn Auto-advance Loop
  useEffect(() => {
    if (!isMounted || state.turn === 0 || state.gameStatus === "GAME_OVER" || state.reveal) return;
    if (state.phase !== "END_TURN") return;

    const t = setTimeout(() => {
      dispatch({ type: "NEXT_TURN" });
    }, Math.round(animDelayMs * 1.5));

    return () => clearTimeout(t);
  }, [state.phase, state.activePlayer, state.gameStatus, state.reveal, isMounted, state.turn, animDelayMs]);

  // Combat Resolution Loop
  useEffect(() => {
    if (!isMounted || state.turn === 0 || state.gameStatus === "GAME_OVER" || state.reveal) return;
    if (state.phase !== "COMBAT_RESOLUTION") return;

    const t = setTimeout(() => {
      dispatch({ type: "RESOLVE_COMBAT" });
    }, animDelayMs * 2);

    return () => clearTimeout(t);
  }, [state.phase, state.gameStatus, state.reveal, isMounted, state.turn, animDelayMs]);

  // Invariant Check after each NEXT_TURN
  useEffect(() => {
    if (isMounted && state.turn > 0 && state.phase === "SELECT_ACTION") {
      const inv = checkInvariants(state);
      if (!inv.passed) {
        console.error("Invariant check failed:", inv.errors);
      }
    }
  }, [state, isMounted]);

  if (!isMounted) {
    return <main className="min-h-screen w-full bg-neutral-950" />;
  }

  const runFastTest = () => {
    console.log("FAST TEST CLICK", {phase: state.phase, activePlayer: state.activePlayer});
    let s = { ...state, hpYou: 999, hpAi: 999 };
    let turns = 0;
    let invFailed = false;

    // Helper to simulate a full round
    const step = (curr: typeof state, action: Parameters<typeof reducer>[1]) => {
      const next = reducer(curr, action);
      const inv = checkInvariants(next);
      if (!inv.passed) invFailed = true;
      return next;
    };

    while (turns < 50) {
      if (s.phase === "SELECT_ACTION") {
        // Simple AI logic for both
        const hand = s.activePlayer === "YOU" ? s.handYou : s.handAi;
        if (hand.length > 0) {
          s = step(s, { type: "SELECT_ATTACK" });
          
          // Must play exactly one card
          const cardToPlay = hand[0];
          s = step(s, { type: "TOGGLE_ATTACK_CARD", cardId: cardToPlay.id });
          s = step(s, { type: "CONFIRM_ATTACK" });
        } else {
          s = step(s, { type: "SELECT_PASS" });
        }
      } else if (s.phase === "ATTACK_DECLARE") {
          // If we somehow get stuck here (e.g. from previous state), try to recover
          const hand = s.activePlayer === "YOU" ? s.handYou : s.handAi;
          if (hand.length > 0) {
            s = step(s, { type: "TOGGLE_ATTACK_CARD", cardId: hand[0].id });
            s = step(s, { type: "CONFIRM_ATTACK" });
          } else {
            // Cannot attack with no cards? This state is weird if empty hand, but let's just abort
            break;
          }
      } else if (s.phase === "DEFENSE_DECLARE") {
        const hand = s.activePlayer === "YOU" ? s.handAi : s.handYou;
        if (hand.length > 0) {
          s = step(s, { type: "TOGGLE_DEFENSE_CARD", cardId: hand[0].id });
        }
        s = step(s, { type: "CONFIRM_DEFENSE" });
      } else if (s.phase === "COMBAT_RESOLUTION") {
        s = step(s, { type: "RESOLVE_COMBAT" });
      } else if (s.phase === "END_TURN") {
        s = step(s, { type: "NEXT_TURN" });
        turns++;
      } else if (s.reveal) {
        s = step(s, { type: "CLOSE_REVEAL" });
      } else {
          // fallback
          console.warn("Fast test stuck at phase:", s.phase);
          break;
      }
    }

    setTestResult({
      totalTurns: turns,
      totalDrawsYou: s.metrics.totalDrawsYou,
      totalDrawsAi: s.metrics.totalDrawsAi,
      totalReshufflesYou: s.metrics.totalReshufflesYou,
      totalReshufflesAi: s.metrics.totalReshufflesAi,
      invariantChecksPassed: !invFailed,
    });
  };

  // UI locks
  const isPlayerTurn = state.activePlayer === 'YOU' && state.gameStatus !== "GAME_OVER" && !state.reveal;
  const youCanSelectAttackCards = state.phase === 'ATTACK_DECLARE' && isPlayerTurn;
  
  const youCanSelectDefenseCards = state.phase === 'DEFENSE_DECLARE' && state.activePlayer === "AI" && state.gameStatus !== "GAME_OVER" && !state.reveal;

  const youAreAttacker = state.phase === "ATTACK_DECLARE" && state.activePlayer === "YOU";
  const youAreDefender = state.phase === "DEFENSE_DECLARE" && state.activePlayer === "AI";

  const demoHand: Array<{ cardId: CardId; state: "idle" | "selected" | "attacking" }> = [
    { cardId: "cossacks.INFANTRY.basic", state: "idle" },
    { cardId: "cossacks.ARCHER.basic", state: "selected" },
    { cardId: "cossacks.CAVALRY.basic", state: "attacking" },
    { cardId: "cossacks.SCOUT.basic", state: "idle" },
  ];

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overscroll-none overflow-hidden flex flex-col">
      <div className="mx-auto w-full max-w-[480px] flex-1 flex flex-col h-full">
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm font-bold">Warlords</div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="text-xs opacity-60 min-w-[120px] text-right">
                {state.gameStatus === "GAME_OVER" ? (
                    "Game Over"
                ) : (
                    `Turn ${state.turn} • ${state.activePlayer === 'YOU' ? 'You' : 'AI'}`
                )}
              </div>

              <div className="w-full min-w-[180px]">
                <CombatLogDisplay lines={state.combatLog} maxLines={3} variant="compact" />
              </div>

              {aiThinking && state.gameStatus !== "GAME_OVER" && (
                <span className="rounded-full bg-blue-500/20 text-blue-300 px-2 py-0.5 text-[10px] animate-pulse">
                  AI THINKING
                </span>
              )}

              <Link
                href="/"
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-widest"
              >
                Home
              </Link>
              <Link
                href="/settings"
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-widest"
              >
                Settings
              </Link>
              {process.env.NODE_ENV !== "production" && (
                <Link
                  href="/gallery"
                  className="rounded-lg border border-purple-400/40 bg-purple-500/10 px-2 py-1 text-[10px] uppercase tracking-widest text-purple-100"
                >
                  Gallery
                </Link>
              )}
              <button
                onClick={() => dispatch({ type: 'RESET_GAME' })}
                className="rounded-lg border border-white/10 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-black"
              >
                Reset
              </button>
            </div>
          </div>
        </header>

        {showInstallHint && (
          <div className="px-4 z-20">
            <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-blue-500/10 p-3">
              <div className="text-xs leading-5 opacity-90">
                <div className="font-medium">Install Warlords</div>
                <div className="opacity-80">Add to Home Screen for a full-screen experience.</div>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem("warlords_install_hint_dismissed", "1");
                  setShowInstallHint(false);
                }}
                className="shrink-0 rounded-xl bg-white/5 px-3 py-2 text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {aiThinking && state.gameStatus !== "GAME_OVER" && (
          <div className="pointer-events-none fixed inset-0 z-10 bg-black/5" />
        )}

        {/* CENTER SCROLLABLE AREA */}
        <section className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          
          {/* Reveal Modal */}
          {state.reveal && (
              <div className="relative z-50 rounded-2xl border-2 border-blue-500/40 bg-blue-500/10 p-5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                  <div className="text-sm font-black uppercase tracking-widest text-blue-300 mb-4">{state.reveal.title}</div>
                  <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                      {state.reveal.cards.map((c, i) => {
                        const def = resolveDef(c.cardId);
                        return (
                          <div key={i} className="h-28 w-20 shrink-0 rounded-xl border border-blue-400/30 bg-black/40 p-2 flex flex-col">
                              <div className="text-[8px] uppercase font-black opacity-40">{def.unit}</div>
                              <div className="text-[10px] font-bold mt-1 leading-tight">{def.name}</div>
                              <div className="mt-auto text-xs font-black text-blue-300 text-right">P:{def.power}</div>
                          </div>
                        );
                      })}
                  </div>
                  <button 
                    onClick={() => dispatch({ type: 'CLOSE_REVEAL' })}
                    className="w-full rounded-xl bg-blue-500 text-white py-3 font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                  >
                      Continue
                  </button>
              </div>
          )}

          {/* Status / Results */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl overflow-hidden">
                
                {/* COMBAT RESOLUTION OVERLAY */}
                {state.phase === "COMBAT_RESOLUTION" && (
                  <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300 pointer-events-none">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <div className="text-sm font-black uppercase tracking-[0.2em] text-white animate-pulse">Resolving combat...</div>
                      <CombatLogDisplay lines={state.combatLog} maxLines={3} variant="overlay" className="w-full max-w-xs" />
                    </div>
                  </div>
                )}

                {state.gameStatus === "GAME_OVER" ? (
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="text-2xl font-black uppercase tracking-widest text-white/90">Game Over</div>
                    <div className="text-lg opacity-80 font-medium">
                    {state.winner === "YOU" ? "🎉 Victory is yours!" : "💀 AI has triumphed!"}
                    </div>
                    <button
                    onClick={() => dispatch({ type: "RESET_GAME" })}
                    className="mt-2 rounded-xl bg-white text-black px-10 py-3 font-bold shadow-2xl transition-transform active:scale-95"
                    >
                    New Campaign
                    </button>
                </div>
                ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-4">
                            <HPBadge label="AI HP" hp={state.hpAi} colorClass="text-red-400" />
                            <div className="w-px bg-white/10 h-8 self-end" />
                            <HPBadge label="Your HP" hp={state.hpYou} colorClass="text-green-400" />
                        </div>
                        <div className="text-[10px] bg-white/5 border border-white/10 rounded-full px-3 py-1 font-bold uppercase tracking-wider">
                            {phaseLabel(state.phase)}
                        </div>
                    </div>

                    {/* DECK DEBUG BLOCK */}
                    <div className="relative z-50 mb-4 flex flex-col gap-1 border-y border-white/5 py-2">
                        <div className="flex justify-between text-[9px] font-mono opacity-80">
                            <span>YOU: Deck {state.deckYou.length} / Disc {state.discardYou.length} / Hand {state.handYou.length}</span>
                            <span>Draws: {state.metrics.totalDrawsYou} / Resh: {state.metrics.totalReshufflesYou}</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-mono opacity-80">
                            <span>AI: Deck {state.deckAi.length} / Disc {state.discardAi.length} / Hand {state.handAi.length}</span>
                            <span>Draws: {state.metrics.totalDrawsAi} / Resh: {state.metrics.totalReshufflesAi}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <button 
                                onClick={runFastTest}
                                disabled={false}
                                className="pointer-events-auto rounded bg-white/10 px-2 py-1 text-[9px] font-bold uppercase hover:bg-white/20 active:scale-95 cursor-pointer z-50 relative"
                            >
                                Run 50 turns (FAST TEST)
                            </button>
                            {testResult && (
                                <div className={`text-[9px] font-bold uppercase ${testResult.invariantChecksPassed ? 'text-green-500' : 'text-red-500'}`}>
                                    {testResult.invariantChecksPassed ? 'Pass' : 'Inv Fail'} • {testResult.totalTurns} Turns
                                </div>
                            )}
                        </div>
                        {testResult && (
                            <div className="mt-1 grid grid-cols-2 gap-x-4 text-[8px] opacity-60 font-mono">
                                <span>Total Draws (Y/A): {testResult.totalDrawsYou}/{testResult.totalDrawsAi}</span>
                                <span>Total Resh (Y/A): {testResult.totalReshufflesYou}/{testResult.totalReshufflesAi}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                    {/* Opponent Row */}
                    <div className="rounded-xl border border-white/5 bg-black/40 p-3 flex items-center justify-between">
                        <div className="text-[10px] uppercase opacity-40 font-bold">Enemy Army</div>
                        <div className="text-xs opacity-60">{state.handAi.length} Cards in hand • {state.deckAi.length} in deck</div>
                    </div>

                    {/* Battle Area */}
                    <div className="min-h-[140px] rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 flex flex-col items-center justify-center gap-3">
                        {state.committedAttackCards.length === 0 && state.committedDefenseCards.length === 0 ? (
                            <span className="text-[10px] uppercase opacity-20 font-bold tracking-widest">Battlefield Idle</span>
                        ) : (
                            <div className="w-full space-y-4">
                                {/* Attacking Group */}
                                {state.committedAttackCards.length > 0 && (
                                    <div className="flex flex-col items-center animate-in slide-in-from-top-4 duration-500">
                                        <div className="text-[8px] uppercase opacity-30 font-bold mb-1">Attacking</div>
                                        <div className="flex gap-2 flex-wrap justify-center">
                                            {state.committedAttackCards.map(c => {
                                              const def = cardToDefinition(c);
                                              return <CardView key={c.id} card={def} size="medium" />;
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                {/* VS separator */}
                                {state.committedDefenseCards.length > 0 && (
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="h-px flex-1 bg-white/5"></div>
                                        <span className="text-[8px] font-black opacity-20 italic">VS</span>
                                        <div className="h-px flex-1 bg-white/5"></div>
                                    </div>
                                )}

                                {/* Defending Group */}
                                {state.committedDefenseCards.length > 0 && (
                                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex gap-2 flex-wrap justify-center">
                                            {state.committedDefenseCards.map(c => {
                                              const def = cardToDefinition(c);
                                              return <CardView key={c.id} card={def} size="medium" />;
                                            })}
                                        </div>
                                        <div className="text-[8px] uppercase opacity-30 font-bold mt-1">Defending</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* COMBAT TICKER (Center Zone) */}
                    {showLogs && (
                      <div className={`mt-2 rounded-xl border p-2 transition-all duration-300 ${state.phase === 'COMBAT_RESOLUTION' ? 'border-white/40 bg-white/10' : 'border-white/5 bg-black/20'}`}>
                        <div className="text-[9px] uppercase font-black opacity-30 mb-1">Recent Activity</div>
                        <div className="space-y-1">
                          {state.combatLog.slice(0, 3).map((line, i) => (
                            <div key={i} className={`text-[10px] leading-tight ${i === 0 ? 'opacity-100 font-medium text-white' : 'opacity-40'}`}>
                              • {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contextual Guidance */}
                    <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-center">
                        <div className="text-[11px] font-medium opacity-80">
                        {state.phase === "ATTACK_DECLARE" ? (
                            youAreAttacker ? (
                                <div className="flex flex-col gap-1">
                                    <span>Select units for the offensive.</span>
                                    <span className="text-[9px] opacity-50 uppercase tracking-tighter">Tip: play exactly 1 Scout to reveal enemy hand.</span>
                                </div>
                            ) : "Brace yourself, AI is choosing attackers."
                        ) : state.phase === "DEFENSE_DECLARE" ? (
                            youAreDefender ? "Choose units to mitigate damage." : "AI is rallying a defense."
                        ) : state.phase === "COMBAT_RESOLUTION" ? (
                            "Combat in progress..."
                        ) : state.phase === "END_TURN" ? (
                            "Resetting for next turn."
                        ) : (
                            "Choose your next strategic move."
                        )}
                        </div>
                    </div>
                    </div>
                </>
                )}
            </div>
          

          {showLogs && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-sm">
              <div className="text-[10px] uppercase tracking-wider opacity-40 font-black mb-3">Military Log</div>
              <ul className="space-y-2">
                {state.combatLog.map((line, idx) => (
                  <li key={idx} className="text-[11px] leading-relaxed opacity-70 border-l border-white/10 pl-2">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Demo static hand (UI-only) */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] uppercase tracking-wider font-black opacity-40 mb-2">Demo Hand (Static)</div>
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {demoHand.map((c) => (
                <DemoCardView
                  key={c.cardId}
                  cardId={c.cardId}
                  state={c.state}
                />
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM FIXED ACTIONS */}
        <footer className="sticky bottom-0 z-20 border-t border-white/10 bg-neutral-950/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          {state.gameStatus !== "GAME_OVER" && (
            <div className="px-4 py-4 space-y-4">
                
                {/* Hand View */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="text-[10px] uppercase tracking-wider font-black opacity-30">Strategic Hand</div>
                        <div className="text-[10px] font-bold opacity-30">{state.handYou.length}/{HAND_LIMIT}</div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                        {state.handYou.map(c => {
                          const def = cardToDefinition(c);
                          return (
                            <CardView 
                                key={c.id} 
                                card={def}
                                size="compact"
                                selected={state.selectedAttackIds.includes(c.id) || state.selectedDefenseIds.includes(c.id)} 
                                onClick={() => {
                                    if (youCanSelectAttackCards) dispatch({ type: 'TOGGLE_ATTACK_CARD', cardId: c.id });
                                    else if (youCanSelectDefenseCards) dispatch({ type: 'TOGGLE_DEFENSE_CARD', cardId: c.id });
                                }}
                                disabled={!(youCanSelectAttackCards || youCanSelectDefenseCards)}
                            />
                          );
                        })}
                    </div>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-3">
                    {state.phase === "SELECT_ACTION" && state.activePlayer === "YOU" ? (
                        <>
                            <button onClick={() => dispatch({ type: "SELECT_ATTACK" })} className="rounded-xl bg-white text-black px-4 py-4 text-sm font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">Attack</button>
                            <button onClick={() => dispatch({ type: "SELECT_PASS" })} className="rounded-xl border border-white/20 bg-white/5 px-4 py-4 text-sm font-bold uppercase tracking-widest active:scale-95 transition-transform">Pass</button>
                        </>
                    ) : (
                        <div className="col-span-2 h-14 flex items-center justify-center">
                            {state.phase === "ATTACK_DECLARE" && youAreAttacker && (
                                <button 
                                    disabled={state.selectedAttackIds.length === 0} 
                                    onClick={() => dispatch({ type: "CONFIRM_ATTACK" })} 
                                    className="w-full rounded-xl bg-red-600 text-white px-4 py-4 text-sm font-black uppercase tracking-widest disabled:opacity-30 shadow-2xl active:scale-[0.98] transition-transform"
                                >
                                    {(() => {
                                      const selected = state.selectedAttackIds.length === 1
                                        ? state.handYou.find(c => c.id === state.selectedAttackIds[0])
                                        : null;
                                      const isScout = selected ? resolveDef(selected.cardId).unit === "SCOUT" : false;
                                      if (isScout) return "Send Scout";
                                      return `Launch Attack (${state.selectedAttackIds.length})`;
                                    })()}
                                </button>
                            )}
                            {state.phase === "DEFENSE_DECLARE" && youAreDefender && (
                                <button 
                                    onClick={() => dispatch({ type: "CONFIRM_DEFENSE" })} 
                                    className="w-full rounded-xl bg-blue-600 text-white px-4 py-4 text-sm font-black uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-transform"
                                >
                                    Confirm Defense ({state.selectedDefenseIds.length})
                                </button>
                            )}
                            {state.phase === "COMBAT_RESOLUTION" && (
                                <div className="text-xs uppercase font-bold opacity-30 animate-pulse tracking-tighter">Calculating Casualties...</div>
                            )}
                            {state.phase === "END_TURN" && (
                                <div className="text-xs uppercase font-bold opacity-30 animate-pulse tracking-tighter">Preparing Next Strategy...</div>
                            )}
                            {(state.activePlayer === "AI" && (state.phase === "SELECT_ACTION" || state.phase === "ATTACK_DECLARE")) && (
                                <div className="text-xs uppercase font-bold opacity-30 animate-pulse tracking-tighter italic">Intelligence Analysis in Progress</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
          )}
        </footer>
      </div>
    </main>
  );
}
