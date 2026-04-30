import Link from "next/link";

const experiments: { title: string; desc: string; href: string }[] = [
  { title: "Pong", desc: "Multiplayer pong — play a human opponent or an AI.", href: "/pong" },
];

export default function LabsHome() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <a
          href="https://southwestcinemaservices.com"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Southwest Cinema Services
        </a>
        <span className="text-xs text-gray-600 uppercase tracking-widest">Labs</span>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold mb-3">Labs</h1>
        <p className="text-gray-400 mb-16 text-lg">Experiments, games, and other odds and ends.</p>

        {experiments.length === 0 ? (
          <p className="text-gray-600 text-sm">Nothing here yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {experiments.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors flex flex-col gap-2"
              >
                <span className="font-semibold text-white">{e.title}</span>
                <p className="text-sm text-gray-400">{e.desc}</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="px-6 py-4 border-t border-gray-800 text-center text-xs text-gray-700">
        Southwest Cinema Services Labs
      </footer>
    </div>
  );
}
