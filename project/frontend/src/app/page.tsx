import Link from "next/link";

import { Dashboard } from "@/components/dashboard";
import { SystemFooter } from "@/components/system-footer";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Painel de sensores</h1>
        <Link href="/status" className="text-sm text-muted-foreground underline">
          status do sistema
        </Link>
      </header>
      <Dashboard />
      <SystemFooter />
    </main>
  );
}
