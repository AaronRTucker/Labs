"use client";
import dynamic from "next/dynamic";

const BrewGame = dynamic(() => import("@/components/BrewGame"), { ssr: false });

export default function BrewClient() {
  return <BrewGame />;
}
