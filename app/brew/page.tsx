import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Brew — Labs",
  description: "Mix colored ingredients and serve the right dish to each customer.",
};

const BrewGame = dynamic(() => import("@/components/BrewGame"), { ssr: false });

export default function BrewPage() {
  return <BrewGame />;
}
