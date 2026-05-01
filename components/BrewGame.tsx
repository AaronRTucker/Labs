"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

type Ingredient = "red" | "yellow" | "blue" | "white";
type DishColor =
  | "red" | "yellow" | "blue" | "white"
  | "orange" | "green" | "purple" | "brown"
  | "pink" | "cream" | "lightblue" | "mint" | "lavender" | "peach";

// ── Data ─────────────────────────────────────────────────────────────────────

const HEX: Record<DishColor, string> = {
  red: "#ef4444", yellow: "#fbbf24", blue: "#3b82f6", white: "#e0f2fe",
  orange: "#f97316", green: "#22c55e", purple: "#a855f7", brown: "#92400e",
  pink: "#f472b6", cream: "#fef08a", lightblue: "#7dd3fc",
  mint: "#6ee7b7", lavender: "#c4b5fd", peach: "#fdba74",
};

const LABEL: Record<DishColor, string> = {
  red: "Red", yellow: "Yellow", blue: "Blue", white: "White",
  orange: "Orange", green: "Green", purple: "Purple", brown: "Brown",
  pink: "Pink", cream: "Cream", lightblue: "Sky Blue",
  mint: "Mint", lavender: "Lavender", peach: "Peach",
};

const LID_HEX: Record<Ingredient, string> = {
  red: "#b91c1c", yellow: "#b45309", blue: "#1d4ed8", white: "#64748b",
};

const RECIPES: Record<string, DishColor> = {
  "blue+red": "purple", "red+yellow": "orange", "blue+yellow": "green",
  "blue+red+yellow": "brown", "red+white": "pink", "white+yellow": "cream",
  "blue+white": "lightblue", "blue+white+yellow": "mint",
  "blue+red+white": "lavender", "red+white+yellow": "peach",
};

interface Customer { id: number; name: string; order: DishColor; }
interface LevelDef { name: string; tagline: string; ingredients: Ingredient[]; orders: DishColor[]; goal: number; }

const LEVELS: LevelDef[] = [
  { name: "Opening Day",       tagline: "Simple orders to get you warmed up!",         ingredients: ["red","yellow","blue"],         orders: ["red","yellow","blue"],                                              goal: 5  },
  { name: "Lunch Rush",        tagline: "Customers want mixed dishes now.",             ingredients: ["red","yellow","blue"],         orders: ["red","yellow","blue","orange","green"],                             goal: 6  },
  { name: "Busy Afternoon",    tagline: "Purple joins the menu!",                       ingredients: ["red","yellow","blue"],         orders: ["orange","green","purple","yellow","red","blue"],                    goal: 7  },
  { name: "Cream of the Crop", tagline: "The white jar arrives — things get pastel.",   ingredients: ["red","yellow","blue","white"], orders: ["pink","cream","lightblue","orange","green","blue"],                 goal: 7  },
  { name: "Evening Special",   tagline: "Soft colors are all the rage tonight.",        ingredients: ["red","yellow","blue","white"], orders: ["pink","cream","lightblue","purple","orange","green"],               goal: 8  },
  { name: "Three's Company",   tagline: "Three-ingredient dishes? Challenge accepted.", ingredients: ["red","yellow","blue","white"], orders: ["brown","mint","lavender","peach","orange","purple","pink"],         goal: 8  },
  { name: "Full House",        tagline: "Every color on the menu tonight!",             ingredients: ["red","yellow","blue","white"], orders: ["orange","green","purple","brown","pink","cream","lightblue","mint","lavender","peach"], goal: 9 },
  { name: "Master Chef",       tagline: "The ultimate test of your kitchen mastery.",   ingredients: ["red","yellow","blue","white"], orders: ["brown","mint","lavender","peach","purple","orange","green","pink","cream","lightblue"], goal: 10 },
];

const NAMES = ["Alice","Bob","Carol","Dave","Eve","Frank","Grace","Hank","Iris","Jake","Kelly","Liam","Maya","Noah","Olivia","Pete","Quinn","Rose"];

let _id = 1;
function makeCustomer(orders: DishColor[]): Customer {
  return { id: _id++, name: NAMES[Math.floor(Math.random() * NAMES.length)], order: orders[Math.floor(Math.random() * orders.length)] };
}
function initQueue(orders: DishColor[]): Customer[] {
  return Array.from({ length: 3 }, () => makeCustomer(orders));
}
function mixIngredients(ings: Ingredient[]): DishColor | null {
  if (ings.length === 0) return null;
  if (ings.length === 1) return ings[0];
  return RECIPES[[...ings].sort().join("+")] ?? null;
}

// ── Face generation (deterministic from name) ─────────────────────────────────

function nameHash(name: string) {
  let h = 7;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return h;
}
const HAIR = ["#1c0a00","#7c3a1e","#fbbf24","#ef4444","#3b82f6","#8b5cf6","#10b981","#f97316"];
const SKIN = ["#fcd5b8","#f0c28e","#c98b5e"];

// ── CSS Animations ────────────────────────────────────────────────────────────

function BrewStyles() {
  return (
    <style>{`
      @keyframes brew-wobble {
        0%,100% { transform: rotate(0deg) scale(1); }
        18%      { transform: rotate(-6deg) scale(1.04); }
        36%      { transform: rotate(5deg)  scale(1.03); }
        54%      { transform: rotate(-3deg) scale(1.01); }
        72%      { transform: rotate(2deg)  scale(1.01); }
      }
      @keyframes brew-bubble {
        0%   { transform: translateY(0);     opacity: 0.55; }
        100% { transform: translateY(-30px); opacity: 0;    }
      }
      @keyframes brew-sparkle {
        0%,100% { opacity: 0.15; transform: scale(0.65) rotate(0deg);  }
        50%     { opacity: 1;    transform: scale(1.35) rotate(25deg); }
      }
      @keyframes brew-confetti {
        0%   { transform: translateY(-24px) rotate(0deg);   opacity: 1;   }
        100% { transform: translateY(105vh) rotate(720deg); opacity: 0.2; }
      }
      @keyframes brew-star-radiate {
        0%   { transform: translateX(0)     scale(0);   opacity: 1; }
        55%  { opacity: 1; }
        100% { transform: translateX(-80px) scale(0.4); opacity: 0; }
      }
      @keyframes brew-jar-pop {
        0%,100% { transform: scale(1);    }
        30%     { transform: scale(0.88) translateY(3px); }
        65%     { transform: scale(1.1)  translateY(-3px); }
      }
      @keyframes brew-card-ready {
        0%,100% { transform: scale(1.05);   }
        50%     { transform: scale(1.1);    }
      }
      @keyframes brew-serve-flash {
        0%   { opacity: 0.7; }
        100% { opacity: 0;   }
      }

      .brew-wobble      { animation: brew-wobble 0.58s ease-out; }
      .brew-b1          { animation: brew-bubble 2.4s ease-in infinite; }
      .brew-b2          { animation: brew-bubble 2.4s ease-in infinite; animation-delay: 0.8s; }
      .brew-b3          { animation: brew-bubble 2.4s ease-in infinite; animation-delay: 1.55s; }
      .brew-sp1         { animation: brew-sparkle 2s ease-in-out infinite; }
      .brew-sp2         { animation: brew-sparkle 2s ease-in-out infinite; animation-delay: 1s; }
      .brew-confetti    { animation: brew-confetti linear forwards; }
      .brew-star-rad    { animation: brew-star-radiate 0.65s ease-out forwards; }
      .brew-jar-pop     { animation: brew-jar-pop 0.38s ease-out; }
      .brew-card-ready  { animation: brew-card-ready 0.7s ease-in-out infinite; }
      .brew-flash       { animation: brew-serve-flash 0.5s ease-out forwards; }
    `}</style>
  );
}

// ── SVG: Ingredient Jar ───────────────────────────────────────────────────────

function JarSVG({ ing, inBowl, full, popping }: { ing: Ingredient; inBowl: boolean; full: boolean; popping: boolean }) {
  const hex = HEX[ing as DishColor];
  const lid = LID_HEX[ing];
  const grayed = inBowl || full;
  const fillColor = grayed ? "#cbd5e1" : hex;
  const lidFill   = grayed ? "#94a3b8" : lid;
  const uid = `jc-${ing}`;

  return (
    <svg width="56" height="74" viewBox="0 0 56 74" className={popping ? "brew-jar-pop" : ""} style={{ overflow: "visible" }}>
      {/* Lid grip */}
      <rect x="19" y="1" width="18" height="8" rx="4" fill={lidFill} stroke="#111" strokeWidth="1.5"/>
      {/* Lid body */}
      <rect x="10" y="7" width="36" height="10" rx="5" fill={lidFill} stroke="#111" strokeWidth="1.5"/>
      {/* Lid shine */}
      <rect x="13" y="9" width="13" height="3" rx="1.5" fill="white" opacity="0.28"/>
      {/* Jar glass */}
      <path d="M11,16 L9,59 Q9,70 28,70 Q47,70 47,59 L45,16 Z" fill="#f0f9ff" stroke="#111" strokeWidth="2"/>
      {/* Liquid fill */}
      <clipPath id={uid}>
        <path d="M12,16 L10,59 Q10,69 28,69 Q46,69 46,59 L44,16 Z"/>
      </clipPath>
      <rect x="10" y="35" width="37" height="36" fill={fillColor} opacity="0.88" clipPath={`url(#${uid})`}/>
      {/* Liquid surface ripple */}
      {!grayed && (
        <ellipse cx="28" cy="35.5" rx="17" ry="3.5" fill={fillColor} opacity="0.45" clipPath={`url(#${uid})`}/>
      )}
      {/* Glass highlight */}
      <line x1="15" y1="21" x2="14" y2="60" stroke="white" strokeWidth="3" opacity="0.42" strokeLinecap="round"/>
      {/* Label band */}
      <rect x="12" y="20" width="32" height="14" rx="3" fill="white" opacity="0.88"/>
      <text x="28" y="31" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#374151" fontFamily="system-ui,sans-serif">
        {LABEL[ing]}
      </text>
      {/* Bubbles */}
      {!grayed && (
        <>
          <circle cx="21" cy="52" r="2.3" fill="white" opacity="0.4"/>
          <circle cx="34" cy="48" r="1.6" fill="white" opacity="0.35"/>
          <circle cx="39" cy="55" r="1.3" fill="white" opacity="0.28"/>
        </>
      )}
      {/* Check badge */}
      {inBowl && (
        <>
          <circle cx="43" cy="16" r="9.5" fill="#f59e0b" stroke="white" strokeWidth="2"/>
          <text x="43" y="21" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold" fontFamily="system-ui">✓</text>
        </>
      )}
    </svg>
  );
}

// ── SVG: Mixing Bowl ──────────────────────────────────────────────────────────

function BowlSVG({ mixedColor, bowl, wobble }: { mixedColor: DishColor | null; bowl: Ingredient[]; wobble: boolean }) {
  const hex     = mixedColor ? HEX[mixedColor] : "#fef9ee";
  const empty   = bowl.length === 0;
  const unknown = bowl.length > 0 && !mixedColor;
  const hasColor = !empty && !unknown;

  return (
    <svg width="186" height="140" viewBox="0 0 186 140" style={{ overflow: "visible" }}
      className={wobble ? "brew-wobble" : ""}>
      {/* Drop shadow */}
      <ellipse cx="93" cy="134" rx="68" ry="7" fill="rgba(0,0,0,0.09)"/>

      {/* Bowl body fill */}
      <path d="M25,48 L21,92 Q21,120 93,120 Q165,120 165,92 L161,48 Z"
        fill={hex} style={{ transition: "fill 0.3s ease" }}/>

      {/* Bowl body outline */}
      <path d="M25,48 L21,92 Q21,120 93,120 Q165,120 165,92 L161,48 Z"
        fill="none" stroke="#111" strokeWidth="3" strokeLinejoin="round"/>

      {/* Rim top face */}
      <ellipse cx="93" cy="48" rx="68" ry="19" fill="#f5f5ef" stroke="#111" strokeWidth="3"/>
      {/* Rim inner color */}
      <ellipse cx="93" cy="48" rx="59" ry="13" fill={hex} style={{ transition: "fill 0.3s ease" }}/>
      <ellipse cx="93" cy="48" rx="59" ry="13" fill="none" stroke="#111" strokeWidth="1.5"/>
      {/* Rim highlight */}
      <ellipse cx="77" cy="44" rx="20" ry="6" fill="white" opacity="0.22"/>

      {/* Side highlight */}
      <path d="M36,64 Q32,100 40,113" stroke="white" strokeWidth="5" fill="none" opacity="0.35" strokeLinecap="round"/>

      {/* Bubbles when mixing */}
      {hasColor && (
        <>
          <circle cx="57"  cy="99"  r="5.5" fill="white" opacity="0.24" className="brew-b1"/>
          <circle cx="78"  cy="107" r="3.5" fill="white" opacity="0.19" className="brew-b2"/>
          <circle cx="108" cy="98"  r="7"   fill="white" opacity="0.15" className="brew-b3"/>
          <circle cx="126" cy="104" r="4.5" fill="white" opacity="0.21" className="brew-b1"/>
          <circle cx="91"  cy="106" r="3"   fill="white" opacity="0.17" className="brew-b3"/>
        </>
      )}

      {/* Sparkle decorations */}
      {hasColor && (
        <>
          <text x="176" y="58" fontSize="19" fill="#fbbf24" className="brew-sp1" textAnchor="middle">✦</text>
          <text x="14"  y="63" fontSize="14" fill="#fbbf24" className="brew-sp2" textAnchor="middle">✦</text>
          <text x="169" y="32" fontSize="12" fill="#f9a8d4" className="brew-sp2" textAnchor="middle">★</text>
        </>
      )}

      {/* Empty prompt */}
      {empty && (
        <text x="93" y="92" textAnchor="middle" fontSize="12" fill="#d97706" opacity="0.55" fontWeight="600" fontFamily="system-ui">
          Add ingredients
        </text>
      )}
      {/* Unknown mix */}
      {unknown && (
        <text x="93" y="99" textAnchor="middle" fontSize="38" fill="#9ca3af" fontWeight="bold" fontFamily="system-ui">?</text>
      )}
      {/* Color label */}
      {hasColor && (
        <text x="93" y="101" textAnchor="middle" fontSize="13" fontWeight="bold" fontFamily="system-ui"
          fill="white" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>
          {LABEL[mixedColor!]}
        </text>
      )}
    </svg>
  );
}

// ── SVG: Customer Chibi Face ──────────────────────────────────────────────────

function CustomerFace({ name, orderHex, canServe }: { name: string; orderHex: string; canServe: boolean }) {
  const h         = nameHash(name);
  const hairColor = HAIR[h % 8];
  const skinTone  = SKIN[(h >> 4) % 3];
  const style     = (h >> 8) % 4;

  return (
    <svg width="64" height="78" viewBox="0 0 64 78">
      {/* Hair */}
      {style === 0 && <ellipse cx="32" cy="27" rx="23" ry="22" fill={hairColor}/>}
      {style === 1 && (
        <>
          <ellipse cx="32" cy="25" rx="21" ry="18" fill={hairColor}/>
          <circle cx="7"  cy="33" r="9" fill={hairColor}/>
          <circle cx="57" cy="33" r="9" fill={hairColor}/>
        </>
      )}
      {style === 2 && (
        <>
          <ellipse cx="32" cy="28" rx="22" ry="19" fill={hairColor}/>
          <circle cx="32" cy="8" r="12" fill={hairColor}/>
        </>
      )}
      {style === 3 && (
        <>
          <ellipse cx="32" cy="26" rx="21" ry="17" fill={hairColor}/>
          <polygon points="14,18 10,3 22,16"  fill={hairColor}/>
          <polygon points="28,15 26,0  35,13" fill={hairColor}/>
          <polygon points="41,16 44,2  49,17" fill={hairColor}/>
        </>
      )}

      {/* Face */}
      <ellipse cx="32" cy="39" rx="22" ry="24" fill={skinTone} stroke="#111" strokeWidth="1.5"/>

      {/* Eyes */}
      <circle cx="22" cy="36" r="6"   fill="white" stroke="#111" strokeWidth="1"/>
      <circle cx="42" cy="36" r="6"   fill="white" stroke="#111" strokeWidth="1"/>
      <circle cx="23.5" cy="36" r="3.5" fill="#111"/>
      <circle cx="43.5" cy="36" r="3.5" fill="#111"/>
      <circle cx="25"   cy="34.5" r="1.4" fill="white"/>
      <circle cx="45"   cy="34.5" r="1.4" fill="white"/>

      {/* Eyebrows */}
      <path d="M17,29 Q22,26 27,29" stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M37,29 Q42,26 47,29" stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>

      {/* Mouth */}
      {canServe
        ? <path d="M22,48 Q32,59 42,48" stroke="#111" strokeWidth="2" fill="#fda4af" strokeLinejoin="round"/>
        : <path d="M24,48 Q32,54 40,48" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      }

      {/* Blush when ready */}
      {canServe && (
        <>
          <ellipse cx="15" cy="44" rx="6"   ry="4" fill="#f9a8d4" opacity="0.5"/>
          <ellipse cx="49" cy="44" rx="6"   ry="4" fill="#f9a8d4" opacity="0.5"/>
        </>
      )}

      {/* Order plate */}
      <circle cx="32" cy="67" r="10"  fill="white" stroke="#111" strokeWidth="1.5"/>
      <circle cx="32" cy="67" r="8"   fill={orderHex}/>
    </svg>
  );
}

// ── SVG: Chef Hat (header) ────────────────────────────────────────────────────

function ChefHat() {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28">
      <rect x="5"  y="18" width="22" height="9" rx="2" fill="white" stroke="#111" strokeWidth="1.5"/>
      <rect x="7"  y="20" width="18" height="3"  rx="1" fill="#fbbf24" opacity="0.55"/>
      <ellipse cx="16" cy="18" rx="13" ry="4.5" fill="white" stroke="#111" strokeWidth="1.5"/>
      <ellipse cx="16" cy="14" rx="11" ry="9"   fill="white" stroke="#111" strokeWidth="1.5"/>
      <ellipse cx="7"  cy="12" rx="5.5" ry="8"  fill="white" stroke="#111" strokeWidth="1.5"/>
      <ellipse cx="25" cy="12" rx="5.5" ry="8"  fill="white" stroke="#111" strokeWidth="1.5"/>
    </svg>
  );
}

// ── Confetti (level complete) ─────────────────────────────────────────────────

const CONFETTI_PIECES = [
  {x:7,  c:"#f87171", r:12,  d:"0s",    s:1}, {x:17, c:"#fbbf24", r:45,  d:"0.10s", s:0},
  {x:27, c:"#34d399", r:20,  d:"0.20s", s:1}, {x:37, c:"#60a5fa", r:65,  d:"0.05s", s:0},
  {x:47, c:"#a78bfa", r:15,  d:"0.15s", s:1}, {x:57, c:"#f97316", r:80,  d:"0.25s", s:0},
  {x:67, c:"#f472b6", r:30,  d:"0.30s", s:1}, {x:77, c:"#22d3ee", r:55,  d:"0.08s", s:1},
  {x:87, c:"#fb923c", r:40,  d:"0.18s", s:0}, {x:93, c:"#86efac", r:10,  d:"0.35s", s:1},
  {x:12, c:"#fde047", r:70,  d:"0s",    s:0}, {x:72, c:"#c084fc", r:25,  d:"0.12s", s:1},
  {x:42, c:"#f87171", r:50,  d:"0.22s", s:0}, {x:52, c:"#fbbf24", r:35,  d:"0.28s", s:1},
  {x:32, c:"#10b981", r:15,  d:"0.32s", s:0}, {x:62, c:"#ef4444", r:60,  d:"0.07s", s:1},
  {x:22, c:"#818cf8", r:85,  d:"0.40s", s:0}, {x:82, c:"#fb7185", r:5,   d:"0.14s", s:1},
];

function Confetti() {
  return (
    <div className="fixed inset-x-0 top-0 h-screen pointer-events-none overflow-hidden z-40">
      {CONFETTI_PIECES.map((p, i) => (
        <div key={i} className="absolute brew-confetti" style={{
          left: `${p.x}%`, top: -20,
          animationDelay: p.d,
          animationDuration: `${0.85 + (i % 6) * 0.14}s`,
        }}>
          <div style={{
            width: p.s ? 9 : 11, height: p.s ? 12 : 9,
            background: p.c, borderRadius: i % 4 === 0 ? "50%" : 2,
            transform: `rotate(${p.r}deg)`,
          }}/>
        </div>
      ))}
    </div>
  );
}

// ── Star burst (on serve) ─────────────────────────────────────────────────────

function ServeBurst({ color }: { color: string }) {
  const arms = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <div className="relative" style={{ width: 0, height: 0 }}>
        {arms.map((angle, i) => (
          <div key={i} style={{ position: "absolute", left: 0, top: 0, transform: `rotate(${angle}deg)` }}>
            <div className="brew-star-rad" style={{ animationDelay: `${i * 0.04}s` }}>
              <span style={{ fontSize: i % 2 === 0 ? 22 : 17, color, display: "block",
                filter: "drop-shadow(0 0 4px rgba(0,0,0,0.25))" }}>
                {i % 2 === 0 ? "★" : "✦"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Game ─────────────────────────────────────────────────────────────────

export default function BrewGame() {
  const [levelIdx,       setLevelIdx]       = useState(0);
  const [queue,          setQueue]          = useState<Customer[]>([]);
  const [bowl,           setBowl]           = useState<Ingredient[]>([]);
  const [served,         setServed]         = useState(0);
  const [phase,          setPhase]          = useState<"playing" | "levelComplete" | "gameComplete">("playing");
  const [bowlWobble,     setBowlWobble]     = useState(false);
  const [poppingJar,     setPoppingJar]     = useState<Ingredient | null>(null);
  const [serveBurst,     setServeBurst]     = useState<string | null>(null);

  useEffect(() => { setQueue(initQueue(LEVELS[0].orders)); }, []);

  // Reset wobble class after animation finishes
  useEffect(() => {
    if (!bowlWobble) return;
    const t = setTimeout(() => setBowlWobble(false), 620);
    return () => clearTimeout(t);
  }, [bowlWobble]);

  // Reset jar pop after animation finishes
  useEffect(() => {
    if (!poppingJar) return;
    const t = setTimeout(() => setPoppingJar(null), 420);
    return () => clearTimeout(t);
  }, [poppingJar]);

  // Clear serve burst
  useEffect(() => {
    if (!serveBurst) return;
    const t = setTimeout(() => setServeBurst(null), 720);
    return () => clearTimeout(t);
  }, [serveBurst]);

  const level      = LEVELS[levelIdx];
  const mixedColor = mixIngredients(bowl);

  const addIngredient = useCallback((ing: Ingredient) => {
    setBowl(prev => {
      if (prev.length >= 3 || prev.includes(ing)) return prev;
      setBowlWobble(true);
      setPoppingJar(ing);
      return [...prev, ing];
    });
  }, []);

  const removeIngredient = useCallback((ing: Ingredient) => {
    setBowl(prev => prev.filter(i => i !== ing));
    setBowlWobble(true);
  }, []);

  const resetBowl = useCallback(() => {
    setBowl([]);
    setBowlWobble(true);
  }, []);

  const serveCustomer = useCallback((customer: Customer) => {
    if (!mixedColor || mixedColor !== customer.order) return;
    setServeBurst(HEX[customer.order]);
    setQueue(prev => {
      const next = prev.filter(c => c.id !== customer.id);
      next.push(makeCustomer(level.orders));
      return next;
    });
    setBowl([]);
    setServed(prev => {
      const n = prev + 1;
      if (n >= level.goal) setPhase(levelIdx >= LEVELS.length - 1 ? "gameComplete" : "levelComplete");
      return n;
    });
  }, [mixedColor, level, levelIdx]);

  const nextLevel = useCallback(() => {
    const next = levelIdx + 1;
    setLevelIdx(next);
    setQueue(initQueue(LEVELS[next].orders));
    setBowl([]);
    setServed(0);
    setPhase("playing");
  }, [levelIdx]);

  const startOver = useCallback(() => {
    setLevelIdx(0);
    setQueue(initQueue(LEVELS[0].orders));
    setBowl([]);
    setServed(0);
    setPhase("playing");
  }, []);

  const pct = (served / level.goal) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-amber-50 text-gray-800">
      <BrewStyles/>

      {/* Serve burst */}
      {serveBurst && <ServeBurst color={serveBurst}/>}

      {/* Header */}
      <header className="px-5 py-2.5 border-b-2 border-amber-300 bg-amber-100 flex items-center justify-between shrink-0">
        <Link href="/" className="text-sm text-amber-700 hover:text-amber-900 transition-colors font-semibold">← Labs</Link>
        <div className="flex items-center gap-2">
          <ChefHat/>
          <span className="text-sm text-amber-700 uppercase tracking-widest font-bold">Chef&apos;s Kitchen</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center gap-4 px-4 py-4 max-w-xl mx-auto w-full">

        {/* Level info + progress */}
        <div className="w-full bg-white rounded-2xl border-2 border-amber-200 shadow-sm px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="font-bold text-amber-900 text-sm">Level {levelIdx + 1}: {level.name}</h2>
            <span className="text-xs text-amber-600 tabular-nums font-semibold">{served} / {level.goal}</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden border border-amber-200">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #f59e0b, #ef4444)",
              }}
            />
          </div>
          <p className="text-xs text-amber-500 mt-1">{level.tagline}</p>
        </div>

        {/* Customer queue */}
        <div className="w-full">
          <p className="text-xs text-amber-600 uppercase tracking-wide mb-2 font-bold">Customers Waiting</p>
          <div className="flex gap-2 justify-center">
            {queue.map(customer => {
              const canServe = mixedColor === customer.order;
              return (
                <button
                  key={customer.id}
                  onClick={() => serveCustomer(customer)}
                  disabled={!canServe}
                  className={`flex flex-col items-center gap-0.5 pt-2 pb-2 px-2 rounded-2xl border-2 transition-all flex-1 min-w-0 max-w-[115px] ${
                    canServe
                      ? "border-green-400 bg-green-50 shadow-lg shadow-green-100 cursor-pointer brew-card-ready"
                      : "border-amber-200 bg-white cursor-default"
                  }`}
                >
                  <CustomerFace name={customer.name} orderHex={HEX[customer.order]} canServe={canServe}/>
                  <span className="text-xs font-bold text-gray-700 truncate w-full text-center leading-tight">{customer.name}</span>
                  <span className="text-xs text-gray-400 leading-tight">{LABEL[customer.order]}</span>
                  {canServe && <span className="text-xs font-bold text-green-600 animate-pulse mt-0.5">Serve!</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bowl + Jars */}
        <div className="w-full flex gap-3">

          {/* Mixing bowl */}
          <div className="flex-1 bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-3 flex flex-col items-center gap-1.5">
            <p className="text-xs text-amber-600 uppercase tracking-wide font-bold self-start">Mixing Bowl</p>

            <BowlSVG mixedColor={mixedColor} bowl={bowl} wobble={bowlWobble}/>

            {/* Ingredient dots — click to remove */}
            <div className="flex gap-2 min-h-[22px] items-center">
              {bowl.map(ing => (
                <button
                  key={ing}
                  onClick={() => removeIngredient(ing)}
                  title={`Remove ${LABEL[ing]}`}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md hover:scale-125 transition-transform active:scale-90"
                  style={{ background: HEX[ing] }}
                />
              ))}
            </div>

            {bowl.length > 0 && !mixedColor && (
              <p className="text-xs text-gray-400 italic text-center leading-tight">Doesn&apos;t combine.</p>
            )}

            <button
              onClick={resetBowl}
              disabled={bowl.length === 0}
              className="text-xs text-amber-400 hover:text-amber-600 disabled:text-amber-200 transition-colors font-semibold"
            >
              Clear
            </button>
            <p className="text-xs text-amber-300 text-center leading-tight">Tap a dot to remove</p>
          </div>

          {/* Ingredient jars */}
          <div className="flex-1 bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-3 flex flex-col gap-2">
            <p className="text-xs text-amber-600 uppercase tracking-wide font-bold">Ingredients</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {level.ingredients.map(ing => {
                const inBowl = bowl.includes(ing);
                const full   = bowl.length >= 3 && !inBowl;
                return (
                  <button
                    key={ing}
                    onClick={() => !inBowl && !full && addIngredient(ing)}
                    disabled={inBowl || full}
                    className={`flex flex-col items-center rounded-2xl border-2 px-1 pt-1 pb-0.5 transition-all ${
                      inBowl
                        ? "border-amber-300 bg-amber-50 opacity-50 cursor-default"
                        : full
                        ? "border-gray-100 bg-white opacity-25 cursor-not-allowed"
                        : "border-amber-200 bg-white hover:border-amber-400 hover:shadow-md active:scale-95 cursor-pointer"
                    }`}
                  >
                    <JarSVG ing={ing} inBowl={inBowl} full={full} popping={poppingJar === ing}/>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recipe hints */}
        <RecipeHints levelIdx={levelIdx}/>
      </main>

      {/* Level complete / Game complete overlay */}
      {phase !== "playing" && (
        <>
          <Confetti/>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-amber-300 relative overflow-hidden">
              {/* Decorative top ribbon */}
              <div className="absolute top-0 left-0 right-0 h-2" style={{ background: "linear-gradient(90deg,#ef4444,#f97316,#fbbf24,#22c55e,#3b82f6,#a855f7)" }}/>

              {phase === "levelComplete" && (
                <>
                  <div className="text-6xl mb-3 mt-2 animate-bounce">🍽️</div>
                  <h2 className="text-3xl font-bold text-amber-900 mb-1">Level Complete!</h2>
                  <p className="text-gray-500 mb-6 text-sm">All customers fed. Ready for the next challenge?</p>
                  <button
                    onClick={nextLevel}
                    className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-white font-bold px-10 py-3 rounded-2xl text-lg shadow-lg shadow-amber-200 transition-all hover:scale-105"
                  >
                    Next Level →
                  </button>
                </>
              )}
              {phase === "gameComplete" && (
                <>
                  <div className="text-6xl mb-3 mt-2 animate-bounce">👨‍🍳</div>
                  <h2 className="text-3xl font-bold text-amber-900 mb-1">Master Chef!</h2>
                  <p className="text-gray-500 mb-6 text-sm">You mastered all 8 levels. The kitchen is yours!</p>
                  <button
                    onClick={startOver}
                    className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-white font-bold px-10 py-3 rounded-2xl text-lg shadow-lg shadow-amber-200 transition-all hover:scale-105"
                  >
                    Play Again!
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Recipe Hints ──────────────────────────────────────────────────────────────

function RecipeHints({ levelIdx }: { levelIdx: number }) {
  const [open, setOpen] = useState(false);
  const level = LEVELS[levelIdx];
  const relevantRecipes = Object.entries(RECIPES).filter(([key, result]) => {
    const ings = key.split("+") as Ingredient[];
    return ings.every(i => level.ingredients.includes(i)) && level.orders.includes(result as DishColor);
  });
  if (relevantRecipes.length === 0) return null;
  return (
    <div className="w-full">
      <button onClick={() => setOpen(o => !o)} className="text-xs text-amber-500 hover:text-amber-700 transition-colors font-semibold">
        {open ? "▲ Hide" : "▼ Show"} recipe hints
      </button>
      {open && (
        <div className="mt-2 bg-white border-2 border-amber-100 rounded-2xl p-3 grid grid-cols-2 gap-y-2 gap-x-4">
          {relevantRecipes.map(([key, result]) => {
            const parts = key.split("+");
            return (
              <div key={key} className="flex items-center gap-1 text-xs text-gray-600 flex-wrap">
                {parts.map((p, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <span className="w-3.5 h-3.5 rounded-full inline-block border border-gray-200 shadow-sm" style={{ background: HEX[p as DishColor] }}/>
                    {i < parts.length - 1 && <span className="text-gray-300">+</span>}
                  </span>
                ))}
                <span className="text-gray-300 mx-0.5">→</span>
                <span className="w-3.5 h-3.5 rounded-full inline-block border border-gray-200 shadow-sm" style={{ background: HEX[result] }}/>
                <span className="text-gray-500 font-medium">{LABEL[result]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
