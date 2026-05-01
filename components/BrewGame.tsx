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

// ── Face generation ───────────────────────────────────────────────────────────

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
        100% { transform: translateX(-88px) scale(0.4); opacity: 0; }
      }
      @keyframes brew-jar-pop {
        0%,100% { transform: scale(1);    }
        30%     { transform: scale(0.88) translateY(3px); }
        65%     { transform: scale(1.1)  translateY(-4px); }
      }
      @keyframes brew-customer-ready {
        0%,100% { transform: translateY(0) scale(1.0); }
        50%     { transform: translateY(-5px) scale(1.04); }
      }
      @keyframes brew-lamp-swing {
        0%,100% { transform-origin: top center; transform: rotate(-4deg); }
        50%     { transform-origin: top center; transform: rotate(4deg); }
      }
      @keyframes brew-steam {
        0%   { transform: translateY(0) scaleX(1);   opacity: 0.6; }
        100% { transform: translateY(-22px) scaleX(1.4); opacity: 0; }
      }

      .brew-wobble        { animation: brew-wobble 0.58s ease-out; }
      .brew-b1            { animation: brew-bubble 2.4s ease-in infinite; }
      .brew-b2            { animation: brew-bubble 2.4s ease-in infinite; animation-delay: 0.8s; }
      .brew-b3            { animation: brew-bubble 2.4s ease-in infinite; animation-delay: 1.55s; }
      .brew-sp1           { animation: brew-sparkle 2s ease-in-out infinite; }
      .brew-sp2           { animation: brew-sparkle 2s ease-in-out infinite; animation-delay: 1s; }
      .brew-confetti      { animation: brew-confetti linear forwards; }
      .brew-star-rad      { animation: brew-star-radiate 0.65s ease-out forwards; }
      .brew-jar-pop       { animation: brew-jar-pop 0.38s ease-out; }
      .brew-cust-ready    { animation: brew-customer-ready 0.75s ease-in-out infinite; }
      .brew-lamp          { animation: brew-lamp-swing 3s ease-in-out infinite; }
      .brew-steam1        { animation: brew-steam 2.2s ease-out infinite; }
      .brew-steam2        { animation: brew-steam 2.2s ease-out infinite; animation-delay: 1.1s; }
    `}</style>
  );
}

// ── Store Scene Background (customer side) ────────────────────────────────────

function StoreScene() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0 }}>
      <defs>
        {/* Wall tile pattern */}
        <pattern id="wall-tiles" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
          <rect width="44" height="44" fill="#fde8c2"/>
          <rect x="1" y="1" width="42" height="42" fill="none" stroke="#f5d5a0" strokeWidth="0.6"/>
        </pattern>
        {/* Subtle floor checkerboard */}
        <pattern id="store-floor" x="0" y="0" width="38" height="38" patternUnits="userSpaceOnUse">
          <rect width="38" height="38" fill="#e8c870"/>
          <rect x="0" y="0" width="19" height="19" fill="#dfc060"/>
          <rect x="19" y="19" width="19" height="19" fill="#dfc060"/>
        </pattern>
      </defs>

      {/* Back wall */}
      <rect width="400" height="155" fill="url(#wall-tiles)"/>
      {/* Wall base shadow */}
      <rect x="0" y="140" width="400" height="15" fill="#d4a850" opacity="0.25"/>

      {/* Floor */}
      <rect x="0" y="155" width="400" height="75" fill="url(#store-floor)"/>

      {/* Perspective floor lines converging to VP (200, 155) */}
      {[0, 57, 114, 171, 229, 286, 343, 400].map((x, i) => (
        <line key={i} x1={x} y1="230" x2="200" y2="155"
          stroke="#c4a040" strokeWidth="0.7" opacity="0.45"/>
      ))}
      {/* Horizontal floor lines */}
      <line x1="0" y1="175" x2="400" y2="175" stroke="#c4a040" strokeWidth="0.6" opacity="0.4"/>
      <line x1="0" y1="198" x2="400" y2="198" stroke="#c4a040" strokeWidth="0.6" opacity="0.4"/>
      <line x1="0" y1="218" x2="400" y2="218" stroke="#c4a040" strokeWidth="0.6" opacity="0.4"/>

      {/* Hanging sign (center) */}
      <line x1="158" y1="0" x2="158" y2="22" stroke="#8B4513" strokeWidth="2.5"/>
      <line x1="242" y1="0" x2="242" y2="22" stroke="#8B4513" strokeWidth="2.5"/>
      <rect x="140" y="20" width="120" height="48" rx="7" fill="#7c3210" stroke="#5a2008" strokeWidth="2"/>
      <rect x="143" y="23" width="114" height="42" rx="5" fill="#8B3c14"/>
      <text x="200" y="42" textAnchor="middle" fontSize="15" fill="#fde68a" fontWeight="bold" fontFamily="system-ui" letterSpacing="3">BREW</text>
      <text x="200" y="57" textAnchor="middle" fontSize="7.5" fill="#f59e0b" fontFamily="system-ui" letterSpacing="1">Color Kitchen</text>

      {/* Left wall lamp */}
      <g className="brew-lamp" style={{ transformOrigin: "38px 0px" }}>
        <line x1="38" y1="0" x2="38" y2="28" stroke="#7c5820" strokeWidth="2.5"/>
        <ellipse cx="38" cy="40" rx="18" ry="12" fill="#5c3c10" stroke="#3c2008" strokeWidth="1.5"/>
        <ellipse cx="38" cy="33" rx="10" ry="6" fill="#fef08a" opacity="0.5"/>
        <ellipse cx="38" cy="52" rx="14" ry="5" fill="#fef08a" opacity="0.25"/>
      </g>

      {/* Right wall lamp */}
      <g className="brew-lamp" style={{ transformOrigin: "362px 0px", animationDelay: "1.5s" }}>
        <line x1="362" y1="0" x2="362" y2="28" stroke="#7c5820" strokeWidth="2.5"/>
        <ellipse cx="362" cy="40" rx="18" ry="12" fill="#5c3c10" stroke="#3c2008" strokeWidth="1.5"/>
        <ellipse cx="362" cy="33" rx="10" ry="6" fill="#fef08a" opacity="0.5"/>
        <ellipse cx="362" cy="52" rx="14" ry="5" fill="#fef08a" opacity="0.25"/>
      </g>

      {/* Left window */}
      <rect x="12" y="60" width="60" height="70" rx="4" fill="#a8d4f0" stroke="#7c5820" strokeWidth="2"/>
      <line x1="42" y1="60" x2="42" y2="130" stroke="#7c5820" strokeWidth="1.5"/>
      <line x1="12" y1="95" x2="72" y2="95" stroke="#7c5820" strokeWidth="1.5"/>
      {/* Window reflection */}
      <rect x="16" y="64" width="20" height="27" rx="2" fill="white" opacity="0.2"/>
      {/* Flower pot on windowsill */}
      <rect x="26" y="128" width="30" height="4" rx="1" fill="#7c5820" stroke="#5a3808" strokeWidth="1"/>
      <ellipse cx="41" cy="130" rx="10" ry="6" fill="#8B4513"/>
      <circle cx="41" cy="124" r="6" fill="#22c55e"/>
      <circle cx="36" cy="126" r="4" fill="#16a34a"/>
      <circle cx="46" cy="126" r="4" fill="#15803d"/>

      {/* Right window */}
      <rect x="328" y="60" width="60" height="70" rx="4" fill="#a8d4f0" stroke="#7c5820" strokeWidth="2"/>
      <line x1="358" y1="60" x2="358" y2="130" stroke="#7c5820" strokeWidth="1.5"/>
      <line x1="328" y1="95" x2="388" y2="95" stroke="#7c5820" strokeWidth="1.5"/>
      <rect x="332" y="64" width="20" height="27" rx="2" fill="white" opacity="0.2"/>
      <rect x="342" y="128" width="30" height="4" rx="1" fill="#7c5820" stroke="#5a3808" strokeWidth="1"/>
      <ellipse cx="357" cy="130" rx="10" ry="6" fill="#8B4513"/>
      <circle cx="357" cy="124" r="6" fill="#22c55e"/>
      <circle cx="352" cy="126" r="4" fill="#16a34a"/>
      <circle cx="362" cy="126" r="4" fill="#15803d"/>

      {/* Customer floor shadow strip at bottom */}
      <rect x="0" y="210" width="400" height="20" fill="rgba(0,0,0,0.08)"/>
    </svg>
  );
}

// ── Counter Bar (3D divider) ──────────────────────────────────────────────────

function CounterBar() {
  return (
    <svg width="100%" height="68" viewBox="0 0 400 68" preserveAspectRatio="none"
      style={{ display: "block", flexShrink: 0 }}>
      {/* Counter top face — slightly tilted (wider at bottom = perspective) */}
      <path d="M0,0 L400,0 L400,28 L0,28 Z" fill="#c4832e"/>
      {/* Top surface highlight strip */}
      <path d="M0,0 L400,0 L400,8 L0,8 Z" fill="#d49a40" opacity="0.7"/>
      {/* Wood grain lines */}
      <line x1="0" y1="12" x2="400" y2="12" stroke="white" strokeWidth="0.4" opacity="0.18"/>
      <line x1="0" y1="18" x2="400" y2="18" stroke="white" strokeWidth="0.4" opacity="0.12"/>
      <line x1="0" y1="24" x2="400" y2="24" stroke="white" strokeWidth="0.4" opacity="0.08"/>
      {/* Rim line at top */}
      <line x1="0" y1="0" x2="400" y2="0" stroke="#e8a840" strokeWidth="2.5"/>
      {/* Counter front face */}
      <path d="M0,28 L400,28 L400,68 L0,68 Z" fill="#8B4513"/>
      {/* Front face panel seam */}
      <line x1="0" y1="28" x2="400" y2="28" stroke="#5a2d0c" strokeWidth="1.5"/>
      {/* Panel dividers on front face */}
      <line x1="133" y1="33" x2="133" y2="63" stroke="#6b3210" strokeWidth="1" opacity="0.5"/>
      <line x1="267" y1="33" x2="267" y2="63" stroke="#6b3210" strokeWidth="1" opacity="0.5"/>
      {/* Panel insets */}
      <rect x="8"   y="34" width="118" height="28" rx="3" fill="#7a3a0f" stroke="#5a2808" strokeWidth="0.5"/>
      <rect x="141" y="34" width="118" height="28" rx="3" fill="#7a3a0f" stroke="#5a2808" strokeWidth="0.5"/>
      <rect x="274" y="34" width="118" height="28" rx="3" fill="#7a3a0f" stroke="#5a2808" strokeWidth="0.5"/>
      {/* Panel inset highlights */}
      <rect x="9"   y="35" width="40" height="2" rx="1" fill="white" opacity="0.1"/>
      <rect x="142" y="35" width="40" height="2" rx="1" fill="white" opacity="0.1"/>
      <rect x="275" y="35" width="40" height="2" rx="1" fill="white" opacity="0.1"/>
    </svg>
  );
}

// ── Kitchen Scene Background ──────────────────────────────────────────────────

function KitchenScene() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="kitchen-wall" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="#3d2515"/>
          <rect x="1" y="1" width="48" height="48" fill="none" stroke="#2a1508" strokeWidth="0.7"/>
        </pattern>
        <pattern id="kitchen-floor" x="0" y="0" width="52" height="52" patternUnits="userSpaceOnUse">
          <rect width="52" height="52" fill="#5c3a22"/>
          <rect x="0" y="0" width="26" height="26" fill="#523218"/>
          <rect x="26" y="26" width="26" height="26" fill="#523218"/>
          <rect x="1" y="1" width="50" height="50" fill="none" stroke="#3c2010" strokeWidth="0.5"/>
        </pattern>
      </defs>

      {/* Back wall */}
      <rect width="400" height="175" fill="url(#kitchen-wall)"/>
      {/* Floor */}
      <rect x="0" y="175" width="400" height="245" fill="url(#kitchen-floor)"/>

      {/* Perspective floor lines — VP at (200, 175) */}
      {[0, 57, 114, 171, 229, 286, 343, 400].map((x, i) => (
        <line key={i} x1={x} y1="420" x2="200" y2="175"
          stroke="#3a2010" strokeWidth="0.9" opacity="0.55"/>
      ))}
      <line x1="0" y1="220" x2="400" y2="220" stroke="#3a2010" strokeWidth="0.7" opacity="0.5"/>
      <line x1="0" y1="275" x2="400" y2="275" stroke="#3a2010" strokeWidth="0.7" opacity="0.5"/>
      <line x1="0" y1="340" x2="400" y2="340" stroke="#3a2010" strokeWidth="0.7" opacity="0.5"/>
      <line x1="0" y1="400" x2="400" y2="400" stroke="#3a2010" strokeWidth="0.7" opacity="0.5"/>

      {/* Overhead shelf */}
      <rect x="0" y="35" width="400" height="20" fill="#5c3018" stroke="#3c1808" strokeWidth="1"/>
      <rect x="0" y="50" width="400" height="5" fill="#3c1808" opacity="0.6"/>
      {/* Shelf shadow */}
      <rect x="0" y="54" width="400" height="8" fill="rgba(0,0,0,0.2)"/>

      {/* Shelf items — spice jars & books */}
      {[22, 52, 80, 108].map((x, i) => {
        const colors = ["#ef4444","#fbbf24","#22c55e","#3b82f6"];
        return (
          <g key={i}>
            <rect x={x} y="10" width="18" height="26" rx="3" fill={colors[i]} stroke="#1a1a1a" strokeWidth="1"/>
            <rect x={x+2} y="12" width="14" height="5" rx="1" fill="white" opacity="0.4"/>
          </g>
        );
      })}
      <rect x="142" y="8" width="8" height="28" rx="1" fill="#7c5c3c" stroke="#3c2010" strokeWidth="1"/>
      <rect x="152" y="10" width="8" height="26" rx="1" fill="#5c4030" stroke="#3c2010" strokeWidth="1"/>

      {/* Right side: pot on shelf */}
      <ellipse cx="350" cy="36" rx="22" ry="8" fill="#4a4a4a" stroke="#222" strokeWidth="1.5"/>
      <path d="M328,36 L330,24 Q350,18 370,24 L372,36" fill="#555" stroke="#222" strokeWidth="1.5"/>
      <ellipse cx="350" cy="24" rx="18" ry="5" fill="#444"/>
      {/* Steam */}
      <ellipse cx="344" cy="18" rx="3" ry="6" fill="white" opacity="0.25" className="brew-steam1"/>
      <ellipse cx="356" cy="16" rx="3" ry="6" fill="white" opacity="0.2" className="brew-steam2"/>

      {/* Overhead lamp above bowl area */}
      <line x1="200" y1="0" x2="200" y2="30" stroke="#4a3018" strokeWidth="3"/>
      <ellipse cx="200" cy="40" rx="28" ry="12" fill="#3c2810" stroke="#1a1208" strokeWidth="2"/>
      <ellipse cx="200" cy="33" rx="16" ry="6" fill="#fef08a" opacity="0.45"/>
      {/* Lamp light cone */}
      <path d="M172,52 L100,180 L300,180 L228,52 Z" fill="#fef08a" opacity="0.04"/>

      {/* Wall baseboard */}
      <rect x="0" y="163" width="400" height="12" fill="#2a1508"/>
      <rect x="0" y="163" width="400" height="3" fill="#3c2010"/>
    </svg>
  );
}

// ── SVG: Ingredient Jar ───────────────────────────────────────────────────────

function JarSVG({ ing, inBowl, full, popping }: { ing: Ingredient; inBowl: boolean; full: boolean; popping: boolean }) {
  const hex      = HEX[ing as DishColor];
  const lid      = LID_HEX[ing];
  const grayed   = inBowl || full;
  const fillColor = grayed ? "#cbd5e1" : hex;
  const lidFill   = grayed ? "#94a3b8" : lid;
  const uid = `jc-${ing}`;

  return (
    <svg width="54" height="72" viewBox="0 0 54 72" className={popping ? "brew-jar-pop" : ""}
      style={{ overflow: "visible" }}>
      <rect x="18" y="1" width="18" height="8" rx="4" fill={lidFill} stroke="#111" strokeWidth="1.5"/>
      <rect x="9" y="7" width="36" height="10" rx="5" fill={lidFill} stroke="#111" strokeWidth="1.5"/>
      <rect x="12" y="9" width="14" height="3" rx="1.5" fill="white" opacity="0.28"/>
      <path d="M11,16 L9,59 Q9,70 27,70 Q45,70 45,59 L43,16 Z" fill="#f0f9ff" stroke="#111" strokeWidth="2"/>
      <clipPath id={uid}>
        <path d="M12,16 L10,59 Q10,69 27,69 Q44,69 44,59 L42,16 Z"/>
      </clipPath>
      <rect x="10" y="35" width="35" height="36" fill={fillColor} opacity="0.88" clipPath={`url(#${uid})`}/>
      {!grayed && (
        <ellipse cx="27" cy="35.5" rx="17" ry="3.5" fill={fillColor} opacity="0.45" clipPath={`url(#${uid})`}/>
      )}
      <line x1="15" y1="21" x2="14" y2="60" stroke="white" strokeWidth="3" opacity="0.42" strokeLinecap="round"/>
      <rect x="12" y="20" width="30" height="13" rx="3" fill="white" opacity="0.88"/>
      <text x="27" y="30" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#374151" fontFamily="system-ui,sans-serif">
        {LABEL[ing]}
      </text>
      {!grayed && (
        <>
          <circle cx="20" cy="51" r="2.3" fill="white" opacity="0.4"/>
          <circle cx="33" cy="47" r="1.6" fill="white" opacity="0.35"/>
          <circle cx="38" cy="54" r="1.3" fill="white" opacity="0.28"/>
        </>
      )}
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
  const hex      = mixedColor ? HEX[mixedColor] : "#fef9ee";
  const empty    = bowl.length === 0;
  const unknown  = bowl.length > 0 && !mixedColor;
  const hasColor = !empty && !unknown;

  return (
    <svg width="186" height="140" viewBox="0 0 186 140" style={{ overflow: "visible" }}
      className={wobble ? "brew-wobble" : ""}>
      <ellipse cx="93" cy="134" rx="68" ry="7" fill="rgba(0,0,0,0.18)"/>
      <path d="M25,48 L21,92 Q21,120 93,120 Q165,120 165,92 L161,48 Z"
        fill={hex} style={{ transition: "fill 0.3s ease" }}/>
      <path d="M25,48 L21,92 Q21,120 93,120 Q165,120 165,92 L161,48 Z"
        fill="none" stroke="#111" strokeWidth="3" strokeLinejoin="round"/>
      <ellipse cx="93" cy="48" rx="68" ry="19" fill="#f5f5ef" stroke="#111" strokeWidth="3"/>
      <ellipse cx="93" cy="48" rx="59" ry="13" fill={hex} style={{ transition: "fill 0.3s ease" }}/>
      <ellipse cx="93" cy="48" rx="59" ry="13" fill="none" stroke="#111" strokeWidth="1.5"/>
      <ellipse cx="77" cy="44" rx="20" ry="6" fill="white" opacity="0.22"/>
      <path d="M36,64 Q32,100 40,113" stroke="white" strokeWidth="5" fill="none" opacity="0.35" strokeLinecap="round"/>
      {hasColor && (
        <>
          <circle cx="57"  cy="99"  r="5.5" fill="white" opacity="0.24" className="brew-b1"/>
          <circle cx="78"  cy="107" r="3.5" fill="white" opacity="0.19" className="brew-b2"/>
          <circle cx="108" cy="98"  r="7"   fill="white" opacity="0.15" className="brew-b3"/>
          <circle cx="126" cy="104" r="4.5" fill="white" opacity="0.21" className="brew-b1"/>
          <circle cx="91"  cy="106" r="3"   fill="white" opacity="0.17" className="brew-b3"/>
          <text x="176" y="58" fontSize="19" fill="#fbbf24" className="brew-sp1" textAnchor="middle">✦</text>
          <text x="14"  y="63" fontSize="14" fill="#fbbf24" className="brew-sp2" textAnchor="middle">✦</text>
          <text x="169" y="32" fontSize="12" fill="#f9a8d4" className="brew-sp2" textAnchor="middle">★</text>
        </>
      )}
      {empty && (
        <text x="93" y="92" textAnchor="middle" fontSize="12" fill="#d97706" opacity="0.55" fontWeight="600" fontFamily="system-ui">
          Add ingredients
        </text>
      )}
      {unknown && (
        <text x="93" y="99" textAnchor="middle" fontSize="38" fill="#9ca3af" fontWeight="bold" fontFamily="system-ui">?</text>
      )}
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

function CustomerFace({ name, orderHex, canServe, small }: { name: string; orderHex: string; canServe: boolean; small?: boolean }) {
  const h         = nameHash(name);
  const hairColor = HAIR[h % 8];
  const skinTone  = SKIN[(h >> 4) % 3];
  const style     = (h >> 8) % 4;
  const s         = small ? 0.78 : 1;

  return (
    <svg width={64 * s} height={78 * s} viewBox="0 0 64 78">
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
      <ellipse cx="32" cy="39" rx="22" ry="24" fill={skinTone} stroke="#111" strokeWidth="1.5"/>
      <circle cx="22" cy="36" r="6"   fill="white" stroke="#111" strokeWidth="1"/>
      <circle cx="42" cy="36" r="6"   fill="white" stroke="#111" strokeWidth="1"/>
      <circle cx="23.5" cy="36" r="3.5" fill="#111"/>
      <circle cx="43.5" cy="36" r="3.5" fill="#111"/>
      <circle cx="25"   cy="34.5" r="1.4" fill="white"/>
      <circle cx="45"   cy="34.5" r="1.4" fill="white"/>
      <path d="M17,29 Q22,26 27,29" stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M37,29 Q42,26 47,29" stroke="#333" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {canServe
        ? <path d="M22,48 Q32,59 42,48" stroke="#111" strokeWidth="2" fill="#fda4af" strokeLinejoin="round"/>
        : <path d="M24,48 Q32,54 40,48" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      }
      {canServe && (
        <>
          <ellipse cx="15" cy="44" rx="6" ry="4" fill="#f9a8d4" opacity="0.5"/>
          <ellipse cx="49" cy="44" rx="6" ry="4" fill="#f9a8d4" opacity="0.5"/>
        </>
      )}
      <circle cx="32" cy="67" r="10"  fill="white" stroke="#111" strokeWidth="1.5"/>
      <circle cx="32" cy="67" r="8"   fill={orderHex}/>
    </svg>
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_PIECES = [
  {x:7,c:"#f87171",r:12,d:"0s",s:1},{x:17,c:"#fbbf24",r:45,d:"0.10s",s:0},
  {x:27,c:"#34d399",r:20,d:"0.20s",s:1},{x:37,c:"#60a5fa",r:65,d:"0.05s",s:0},
  {x:47,c:"#a78bfa",r:15,d:"0.15s",s:1},{x:57,c:"#f97316",r:80,d:"0.25s",s:0},
  {x:67,c:"#f472b6",r:30,d:"0.30s",s:1},{x:77,c:"#22d3ee",r:55,d:"0.08s",s:1},
  {x:87,c:"#fb923c",r:40,d:"0.18s",s:0},{x:93,c:"#86efac",r:10,d:"0.35s",s:1},
  {x:12,c:"#fde047",r:70,d:"0s",s:0},{x:72,c:"#c084fc",r:25,d:"0.12s",s:1},
  {x:42,c:"#f87171",r:50,d:"0.22s",s:0},{x:52,c:"#fbbf24",r:35,d:"0.28s",s:1},
  {x:32,c:"#10b981",r:15,d:"0.32s",s:0},{x:62,c:"#ef4444",r:60,d:"0.07s",s:1},
  {x:22,c:"#818cf8",r:85,d:"0.40s",s:0},{x:82,c:"#fb7185",r:5,d:"0.14s",s:1},
];

function Confetti() {
  return (
    <div className="fixed inset-x-0 top-0 h-screen pointer-events-none overflow-hidden z-40">
      {CONFETTI_PIECES.map((p, i) => (
        <div key={i} className="absolute brew-confetti" style={{
          left: `${p.x}%`, top: -20, animationDelay: p.d,
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

// ── Star burst ────────────────────────────────────────────────────────────────

function ServeBurst({ color }: { color: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <div className="relative" style={{ width: 0, height: 0 }}>
        {[0,45,90,135,180,225,270,315].map((angle, i) => (
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
  const [levelIdx,   setLevelIdx]   = useState(0);
  const [queue,      setQueue]      = useState<Customer[]>([]);
  const [bowl,       setBowl]       = useState<Ingredient[]>([]);
  const [served,     setServed]     = useState(0);
  const [phase,      setPhase]      = useState<"playing" | "levelComplete" | "gameComplete">("playing");
  const [bowlWobble, setBowlWobble] = useState(false);
  const [poppingJar, setPoppingJar] = useState<Ingredient | null>(null);
  const [serveBurst, setServeBurst] = useState<string | null>(null);

  useEffect(() => { setQueue(initQueue(LEVELS[0].orders)); }, []);

  useEffect(() => {
    if (!bowlWobble) return;
    const t = setTimeout(() => setBowlWobble(false), 620);
    return () => clearTimeout(t);
  }, [bowlWobble]);

  useEffect(() => {
    if (!poppingJar) return;
    const t = setTimeout(() => setPoppingJar(null), 420);
    return () => clearTimeout(t);
  }, [poppingJar]);

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

  const resetBowl = useCallback(() => { setBowl([]); setBowlWobble(true); }, []);

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
    setLevelIdx(next); setQueue(initQueue(LEVELS[next].orders));
    setBowl([]); setServed(0); setPhase("playing");
  }, [levelIdx]);

  const startOver = useCallback(() => {
    setLevelIdx(0); setQueue(initQueue(LEVELS[0].orders));
    setBowl([]); setServed(0); setPhase("playing");
  }, []);

  const pct = (served / level.goal) * 100;

  return (
    <div className="flex flex-col min-h-screen overflow-hidden" style={{ background: "#1a0e08" }}>
      <BrewStyles/>
      {serveBurst && <ServeBurst color={serveBurst}/>}

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-5 py-2.5 z-30"
        style={{ background: "rgba(44,20,8,0.95)", borderBottom: "2px solid #5c3018" }}>
        <Link href="/" className="text-sm font-semibold text-amber-400 hover:text-amber-200 transition-colors">← Labs</Link>
        <div className="flex items-center gap-2">
          {/* Chef hat inline SVG */}
          <svg width="26" height="22" viewBox="0 0 32 28">
            <rect x="5" y="18" width="22" height="9" rx="2" fill="white" stroke="#111" strokeWidth="1.5"/>
            <rect x="7" y="20" width="18" height="3" rx="1" fill="#fbbf24" opacity="0.55"/>
            <ellipse cx="16" cy="18" rx="13" ry="4.5" fill="white" stroke="#111" strokeWidth="1.5"/>
            <ellipse cx="16" cy="14" rx="11" ry="9" fill="white" stroke="#111" strokeWidth="1.5"/>
            <ellipse cx="7"  cy="12" rx="5.5" ry="8" fill="white" stroke="#111" strokeWidth="1.5"/>
            <ellipse cx="25" cy="12" rx="5.5" ry="8" fill="white" stroke="#111" strokeWidth="1.5"/>
          </svg>
          <span className="text-sm font-bold text-amber-300 uppercase tracking-widest">Chef&apos;s Kitchen</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full relative">

        {/* ══ CUSTOMER ZONE ══ */}
        <div className="relative shrink-0" style={{ height: 232 }}>
          <StoreScene/>

          {/* Level info — floating card over store */}
          <div className="absolute top-3 left-3 right-3 z-20"
            style={{ background: "rgba(255,255,255,0.88)", borderRadius: 14, padding: "6px 10px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)", border: "1.5px solid #f5d080" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-900">Lv {levelIdx + 1}: {level.name}</span>
              <span className="text-xs text-amber-700 tabular-nums font-semibold">{served}/{level.goal}</span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: "#fde68a" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg,#f59e0b,#ef4444)" }}/>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>{level.tagline}</p>
          </div>

          {/* Customers standing in line — bottom of customer zone, right at the counter */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center items-end"
            style={{ paddingBottom: 2 }}>
            {queue.map((customer, idx) => {
              const canServe = mixedColor === customer.order;
              // Slight perspective: middle customer is "closest" (fullsize),
              // side customers are a touch smaller and higher
              const isMiddle = idx === 1;
              const scale    = isMiddle ? 1 : 0.84;
              const yOffset  = isMiddle ? 0 : 10;
              return (
                <button
                  key={customer.id}
                  onClick={() => serveCustomer(customer)}
                  disabled={!canServe}
                  className={`relative flex flex-col items-center flex-1 max-w-[120px] transition-all ${canServe ? "brew-cust-ready" : ""}`}
                  style={{ transform: `scale(${scale}) translateY(${yOffset}px)`, transformOrigin: "bottom center",
                    cursor: canServe ? "pointer" : "default" }}
                >
                  {/* Speech bubble with order */}
                  <div className="flex items-center gap-1 rounded-full px-2 py-0.5 mb-1 shadow"
                    style={{ background: "rgba(255,255,255,0.93)", border: "1.5px solid #e5e7eb",
                      fontSize: 10, whiteSpace: "nowrap", fontWeight: 600, color: "#374151" }}>
                    <span className="inline-block rounded-full"
                      style={{ width: 10, height: 10, background: HEX[customer.order], border: "1px solid rgba(0,0,0,0.15)" }}/>
                    {LABEL[customer.order]}
                  </div>

                  {/* Green glow when ready */}
                  {canServe && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: 16,
                      background: "rgba(74,222,128,0.22)", filter: "blur(8px)", zIndex: -1 }}/>
                  )}

                  <CustomerFace name={customer.name} orderHex={HEX[customer.order]} canServe={canServe}/>

                  {/* Name on store floor */}
                  <span style={{ fontSize: 11, fontWeight: 700, color: canServe ? "#fbbf24" : "#fff",
                    textShadow: "0 1px 3px rgba(0,0,0,0.7)", marginTop: 1 }}>
                    {customer.name}
                  </span>
                  {canServe && (
                    <span className="animate-pulse" style={{ fontSize: 11, fontWeight: 800, color: "#4ade80",
                      textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                      Serve!
                    </span>
                  )}

                  {/* Floor shadow */}
                  <div style={{ width: 44, height: 6, background: "rgba(0,0,0,0.22)",
                    borderRadius: "50%", filter: "blur(3px)", marginTop: 1 }}/>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ COUNTER ══ */}
        <CounterBar/>

        {/* ══ KITCHEN ZONE ══ */}
        <div className="relative flex-1" style={{ minHeight: 340 }}>
          <KitchenScene/>

          <div className="relative z-10 flex flex-col items-center gap-3 px-4 pt-5 pb-4">

            {/* Bowl on kitchen counter — sits in a "lit" spotlight area */}
            <div className="relative flex flex-col items-center">
              {/* Counter mat under bowl */}
              <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
                width: 200, height: 18, background: "#8B4513", borderRadius: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)", border: "1.5px solid #5a2d0c" }}/>

              <BowlSVG mixedColor={mixedColor} bowl={bowl} wobble={bowlWobble}/>

              {/* Ingredient dots below bowl — click to remove */}
              <div className="flex gap-2 mt-1 min-h-[22px] items-center">
                {bowl.map(ing => (
                  <button key={ing} onClick={() => removeIngredient(ing)} title={`Remove ${LABEL[ing]}`}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg hover:scale-125 transition-transform active:scale-90"
                    style={{ background: HEX[ing] }}/>
                ))}
              </div>

              {bowl.length > 0 && !mixedColor && (
                <p className="text-xs italic mt-0.5" style={{ color: "#fca5a5" }}>Doesn&apos;t combine.</p>
              )}

              <button onClick={resetBowl} disabled={bowl.length === 0}
                className="mt-1 text-xs font-semibold transition-colors"
                style={{ color: bowl.length === 0 ? "#7c5c3c" : "#fbbf24" }}>
                Clear bowl
              </button>
            </div>

            {/* Ingredient jars — on kitchen counter */}
            <div className="w-full">
              <div style={{ background: "rgba(92,48,24,0.6)", borderRadius: 16,
                border: "2px solid #7c4818", padding: "10px 12px", backdropFilter: "blur(2px)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#fbbf24", textTransform: "uppercase", letterSpacing: 2 }}>
                  Ingredients
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {level.ingredients.map(ing => {
                    const inBowl = bowl.includes(ing);
                    const full   = bowl.length >= 3 && !inBowl;
                    return (
                      <button key={ing}
                        onClick={() => !inBowl && !full && addIngredient(ing)}
                        disabled={inBowl || full}
                        className={`flex flex-col items-center rounded-2xl px-1 pt-1 pb-0.5 transition-all border-2 ${
                          inBowl ? "opacity-50 cursor-default"
                          : full  ? "opacity-25 cursor-not-allowed"
                          : "hover:scale-105 active:scale-95 cursor-pointer"
                        }`}
                        style={{
                          background: inBowl ? "rgba(255,255,255,0.08)"
                            : full ? "rgba(255,255,255,0.04)"
                            : "rgba(255,255,255,0.14)",
                          borderColor: inBowl ? "#fbbf24" : full ? "#3c2010" : "#d4832e",
                        }}>
                        <JarSVG ing={ing} inBowl={inBowl} full={full} popping={poppingJar === ing}/>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-2 text-center" style={{ color: "#a0784a" }}>
                  Tap a dot in the bowl to remove
                </p>
              </div>
            </div>

            {/* Recipe hints */}
            <RecipeHints levelIdx={levelIdx}/>

          </div>
        </div>
      </div>

      {/* ══ OVERLAY: Level/Game complete ══ */}
      {phase !== "playing" && (
        <>
          <Confetti/>
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
              style={{ border: "4px solid #f59e0b" }}>
              <div className="absolute top-0 left-0 right-0 h-2"
                style={{ background: "linear-gradient(90deg,#ef4444,#f97316,#fbbf24,#22c55e,#3b82f6,#a855f7)" }}/>
              {phase === "levelComplete" && (
                <>
                  <div className="text-6xl mb-3 mt-2 animate-bounce">🍽️</div>
                  <h2 className="text-3xl font-bold text-amber-900 mb-1">Level Complete!</h2>
                  <p className="text-gray-500 mb-6 text-sm">All customers fed. Ready for the next challenge?</p>
                  <button onClick={nextLevel}
                    className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-white font-bold px-10 py-3 rounded-2xl text-lg shadow-lg transition-all hover:scale-105">
                    Next Level →
                  </button>
                </>
              )}
              {phase === "gameComplete" && (
                <>
                  <div className="text-6xl mb-3 mt-2 animate-bounce">👨‍🍳</div>
                  <h2 className="text-3xl font-bold text-amber-900 mb-1">Master Chef!</h2>
                  <p className="text-gray-500 mb-6 text-sm">You mastered all 8 levels. The kitchen is yours!</p>
                  <button onClick={startOver}
                    className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-white font-bold px-10 py-3 rounded-2xl text-lg shadow-lg transition-all hover:scale-105">
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
      <button onClick={() => setOpen(o => !o)}
        className="text-xs font-semibold transition-colors"
        style={{ color: open ? "#fbbf24" : "#a07848" }}>
        {open ? "▲ Hide" : "▼ Show"} recipe hints
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-y-2 gap-x-4 p-3 rounded-2xl"
          style={{ background: "rgba(92,48,24,0.55)", border: "1.5px solid #7c4818" }}>
          {relevantRecipes.map(([key, result]) => {
            const parts = key.split("+");
            return (
              <div key={key} className="flex items-center gap-1 flex-wrap">
                {parts.map((p, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <span className="w-3.5 h-3.5 rounded-full inline-block border border-white/20 shadow"
                      style={{ background: HEX[p as DishColor] }}/>
                    {i < parts.length - 1 && <span style={{ color: "#a07848", fontSize: 11 }}>+</span>}
                  </span>
                ))}
                <span style={{ color: "#a07848", fontSize: 11 }} className="mx-0.5">→</span>
                <span className="w-3.5 h-3.5 rounded-full inline-block border border-white/20 shadow"
                  style={{ background: HEX[result] }}/>
                <span style={{ fontSize: 11, color: "#e8c890", fontWeight: 600 }}>{LABEL[result]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
