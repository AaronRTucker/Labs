import type { Metadata } from "next";
import BrewGame from "@/components/BrewGame";

export const metadata: Metadata = {
  title: "Brew — Labs",
  description: "Mix colored ingredients and serve the right dish to each customer.",
};

export default function BrewPage() {
  return <BrewGame />;
}
