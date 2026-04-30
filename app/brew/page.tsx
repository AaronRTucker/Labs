import type { Metadata } from "next";
import BrewClient from "@/components/BrewClient";

export const metadata: Metadata = {
  title: "Brew — Labs",
  description: "Mix colored ingredients and serve the right dish to each customer.",
};

export default function BrewPage() {
  return <BrewClient />;
}
