"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type Ingredient = "red" | "yellow" | "blue" | "white";
type DishColor =
  | "red" | "yellow" | "blue" | "white"
  | "orange" | "green" | "purple" | "brown"
  | "pink" | "cream" | "lightblue" | "mint" | "lavender" | "peach";

const HEX: Record<DishColor, string> = {
  red: "#ef4444", yellow: "#fbbf24", blue: "#3b82f6", white: "#f0f9ff",
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

const RECIPES: Record<string, DishColor> = {
  "blue+red": "purple",
  "red+yellow": "orange",
  "blue+yellow": "green",
  "blue+red+yellow": "brown",
  "red+white": "pink",
  "white+yellow": "cream",
  "blue+white": "lightblue",
  "blue+white+yellow": "mint",
  "blue+red+white": "lavender",
  "red+white+yellow": "peach",
};

function mixIngredients(ings: Ingredient[]): DishColor | null {
  if (ings.length === 0) return null;
  if (ings.length === 1) return ings[0];
  const key = [...ings].sort().join("+");
  return RECIPES[key] ?? null;
}

interface Customer { id: number; name: string; order: DishColor; }

interface LevelDef {
  name: string;
  tagline: string;
  ingredients: Ingredient[];
  orders: DishColor[];
  goal: number;
}

const LEVELS: LevelDef[] = [
  {
    name: "Opening Day",
    tagline: "Simple orders to get you warmed up!",
    ingredients: ["red", "yellow", "blue"],
    orders: ["red", "yellow", "blue"],
    goal: 5,
  },
  {
    name: "Lunch Rush",
    tagline: "Customers want mixed dishes now.",
    ingredients: ["red", "yellow", "blue"],
    orders: ["red", "yellow", "blue", "orange", "green"],
    goal: 6,
  },
  {
    name: "Busy Afternoon",
    tagline: "Purple joins the menu!",
    ingredients: ["red", "yellow", "blue"],
    orders: ["orange", "green", "purple", "yellow", "red", "blue"],
    goal: 7,
  },
  {
    name: "Cream of the Crop",
    tagline: "The white jar arrives — things get soft and pastel.",
    ingredients: ["red", "yellow", "blue", "white"],
    orders: ["pink", "cream", "lightblue", "orange", "green", "blue"],
    goal: 7,
  },
  {
    name: "Evening Special",
    tagline: "Pastel colors are all the rage tonight.",
    ingredients: ["red", "yellow", "blue", "white"],
    orders: ["pink", "cream", "lightblue", "purple", "orange", "green"],
    goal: 8,
  },
  {
    name: "Three's Company",
    tagline: "Three-ingredient dishes? Challenge accepted.",
    ingredients: ["red", "yellow", "blue", "white"],
    orders: ["brown", "mint", "lavender", "peach", "orange", "purple", "pink"],
    goal: 8,
  },
  {
    name: "Full House",
    tagline: "Every color on the menu tonight!",
    ingredients: ["red", "yellow", "blue", "white"],
    orders: ["orange", "green", "purple", "brown", "pink", "cream", "lightblue", "mint", "lavender", "peach"],
    goal: 9,
  },
  {
    name: "Master Chef",
    tagline: "The ultimate test of your kitchen mastery.",
    ingredients: ["red", "yellow", "blue", "white"],
    orders: ["brown", "mint", "lavender", "peach", "purple", "orange", "green", "pink", "cream", "lightblue"],
    goal: 10,
  },
];

const NAMES = ["Alice","Bob","Carol","Dave","Eve","Frank","Grace","Hank","Iris","Jake","Kelly","Liam","Maya","Noah","Olivia","Pete","Quinn","Rose"];

let _id = 1;
function makeCustomer(orders: DishColor[]): Customer {
  return {
    id: _id++,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    order: orders[Math.floor(Math.random() * orders.length)],
  };
}
function initQueue(orders: DishColor[]): Customer[] {
  return Array.from({ length: 3 }, () => makeCustomer(orders));
}

export default function BrewGame() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [queue, setQueue] = useState<Customer[]>(() => initQueue(LEVELS[0].orders));
  const [bowl, setBowl] = useState<Ingredient[]>([]);
  const [served, setServed] = useState(0);
  const [phase, setPhase] = useState<"playing" | "levelComplete" | "gameComplete">("playing");

  const level = LEVELS[levelIdx];
  const mixedColor = mixIngredients(bowl);

  const addIngredient = useCallback((ing: Ingredient) => {
    setBowl(prev => {
      if (prev.length >= 3 || prev.includes(ing)) return prev;
      return [...prev, ing];
    });
  }, []);

  const removeIngredient = useCallback((ing: Ingredient) => {
    setBowl(prev => prev.filter(i => i !== ing));
  }, []);

  const resetBowl = useCallback(() => setBowl([]), []);

  const serveCustomer = useCallback((customer: Customer) => {
    if (!mixedColor || mixedColor !== customer.order) return;
    setQueue(prev => {
      const next = prev.filter(c => c.id !== customer.id);
      next.push(makeCustomer(level.orders));
      return next;
    });
    setBowl([]);
    setServed(prev => {
      const n = prev + 1;
      if (n >= level.goal) {
        setPhase(levelIdx >= LEVELS.length - 1 ? "gameComplete" : "levelComplete");
      }
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

  return (
    <div className="flex flex-col min-h-screen bg-amber-50 text-gray-800">
      <header className="px-6 py-4 border-b border-amber-200 bg-amber-100 flex items-center justify-between shrink-0">
        <Link href="/" className="text-sm text-amber-700 hover:text-amber-900 transition-colors">← Labs</Link>
        <span className="text-xs text-amber-500 uppercase tracking-widest font-semibold">Chef's Kitchen</span>
      </header>

      <main className="flex-1 flex flex-col items-center gap-6 px-4 py-6 max-w-xl mx-auto w-full">

        {/* Level header */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-amber-900">
              Level {levelIdx + 1}: {level.name}
            </h2>
            <span className="text-sm text-amber-700 tabular-nums">{served} / {level.goal}</span>
          </div>
          <div className="w-full bg-amber-200 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(served / level.goal) * 100}%` }}
            />
          </div>
          <p className="text-xs text-amber-600 mt-1">{level.tagline}</p>
        </div>

        {/* Customer queue */}
        <div className="w-full">
          <p className="text-xs text-amber-600 uppercase tracking-wide mb-2 font-semibold">Customers waiting</p>
          <div className="flex gap-3 justify-center">
            {queue.map(customer => {
              const canServe = mixedColor === customer.order;
              return (
                <button
                  key={customer.id}
                  onClick={() => serveCustomer(customer)}
                  disabled={!canServe}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all w-28 ${
                    canServe
                      ? "border-green-400 bg-green-50 shadow-lg shadow-green-100 scale-105 cursor-pointer"
                      : "border-amber-200 bg-white cursor-default"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-full border-4 border-white shadow"
                    style={{ background: HEX[customer.order] }}
                  />
                  <span className="text-xs font-semibold text-gray-700">{customer.name}</span>
                  <span className="text-xs text-gray-400">{LABEL[customer.order]}</span>
                  {canServe && (
                    <span className="text-xs font-bold text-green-600 animate-pulse">Serve!</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mixing bowl */}
        <div className="w-full bg-white rounded-2xl border border-amber-200 shadow-sm p-6 flex flex-col items-center gap-3">
          <p className="text-xs text-amber-600 uppercase tracking-wide font-semibold self-start">Mixing Bowl</p>

          <div
            className="w-36 h-36 rounded-full border-4 border-amber-300 shadow-inner flex items-center justify-center transition-colors duration-300"
            style={{ background: mixedColor ? HEX[mixedColor] : "#fefce8" }}
          >
            {bowl.length === 0 && (
              <span className="text-amber-300 text-xs text-center leading-snug">Add<br />ingredients</span>
            )}
            {bowl.length > 0 && !mixedColor && (
              <span className="text-4xl select-none">?</span>
            )}
          </div>

          {/* Ingredient dots — click to remove */}
          {bowl.length > 0 && (
            <div className="flex gap-2 items-center">
              {bowl.map(ing => (
                <button
                  key={ing}
                  onClick={() => removeIngredient(ing)}
                  title={`Remove ${LABEL[ing]}`}
                  className="w-7 h-7 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                  style={{ background: HEX[ing] }}
                />
              ))}
            </div>
          )}

          {mixedColor && (
            <p className="text-sm font-semibold text-gray-700">{LABEL[mixedColor]}</p>
          )}
          {bowl.length > 0 && !mixedColor && (
            <p className="text-xs text-gray-400 italic">That combination doesn't make anything.</p>
          )}

          <button
            onClick={resetBowl}
            disabled={bowl.length === 0}
            className="text-xs text-amber-500 hover:text-amber-700 disabled:text-amber-200 transition-colors"
          >
            Clear bowl
          </button>
        </div>

        {/* Ingredient jars */}
        <div className="w-full">
          <p className="text-xs text-amber-600 uppercase tracking-wide mb-2 font-semibold">Ingredients</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {level.ingredients.map(ing => {
              const inBowl = bowl.includes(ing);
              const full = bowl.length >= 3;
              const disabled = inBowl || full;
              return (
                <button
                  key={ing}
                  onClick={() => !disabled && addIngredient(ing)}
                  disabled={disabled}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 w-20 transition-all ${
                    inBowl
                      ? "border-amber-300 bg-amber-50 opacity-50"
                      : full
                      ? "border-amber-100 bg-white opacity-40 cursor-not-allowed"
                      : "border-amber-200 bg-white hover:border-amber-400 hover:shadow-md active:scale-95 cursor-pointer"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white shadow"
                    style={{ background: HEX[ing] }}
                  />
                  <span className="text-xs font-medium text-gray-600">{LABEL[ing]}</span>
                  {inBowl && <span className="text-xs text-amber-400">added</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-amber-400 text-center mt-2">Click a jar to add · click a dot in the bowl to remove</p>
        </div>

        {/* Recipe hints */}
        <RecipeHints levelIdx={levelIdx} />
      </main>

      {/* Overlay: level complete / game complete */}
      {phase !== "playing" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            {phase === "levelComplete" && (
              <>
                <div className="text-5xl mb-4">🍽️</div>
                <h2 className="text-2xl font-bold text-amber-900 mb-2">Level Complete!</h2>
                <p className="text-gray-500 mb-6">All customers fed. Ready for the next challenge?</p>
                <button
                  onClick={nextLevel}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                >
                  Next Level →
                </button>
              </>
            )}
            {phase === "gameComplete" && (
              <>
                <div className="text-5xl mb-4">👨‍🍳</div>
                <h2 className="text-2xl font-bold text-amber-900 mb-2">Master Chef!</h2>
                <p className="text-gray-500 mb-6">You mastered all 8 levels. The kitchen is yours!</p>
                <button
                  onClick={startOver}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                >
                  Play Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipeHints({ levelIdx }: { levelIdx: number }) {
  const [open, setOpen] = useState(false);
  const level = LEVELS[levelIdx];

  const relevantRecipes = Object.entries(RECIPES).filter(([key, result]) => {
    const ings = key.split("+") as Ingredient[];
    return (
      ings.every(i => level.ingredients.includes(i)) &&
      level.orders.includes(result as DishColor)
    );
  });

  if (relevantRecipes.length === 0) return null;

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-amber-500 hover:text-amber-700 transition-colors"
      >
        {open ? "▲ Hide" : "▼ Show"} recipe hints
      </button>
      {open && (
        <div className="mt-2 bg-white border border-amber-200 rounded-xl p-4 grid grid-cols-2 gap-y-2 gap-x-4">
          {relevantRecipes.map(([key, result]) => {
            const parts = key.split("+");
            return (
              <div key={key} className="flex items-center gap-1 text-xs text-gray-600 flex-wrap">
                {parts.map((p, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block border border-gray-200"
                      style={{ background: HEX[p as DishColor] }}
                    />
                    {i < parts.length - 1 && <span className="text-gray-400">+</span>}
                  </span>
                ))}
                <span className="text-gray-400 mx-0.5">→</span>
                <span
                  className="w-3 h-3 rounded-full inline-block border border-gray-200"
                  style={{ background: HEX[result] }}
                />
                <span className="text-gray-500">{LABEL[result]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
