import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Renderizada no servidor a cada requisição: é a parte que não existe no export estático.
async function ApiStatus() {
  await connection();
  let status = "fora do ar";
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:8000"}/health`, {
      cache: "no-store",
    });
    if (response.ok) status = "no ar";
  } catch {}
  return (
    <p className="flex items-center gap-2">
      API <Badge variant={status === "no ar" ? "default" : "destructive"}>{status}</Badge>
      <span className="text-muted-foreground">consultado pelo servidor</span>
    </p>
  );
}

export default function StatusPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Status do sistema</h1>
      <Card>
        <CardHeader>
          <CardTitle>Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-muted-foreground">Consultando…</p>}>
            <ApiStatus />
          </Suspense>
        </CardContent>
      </Card>
      <Link href="/" className="text-sm text-muted-foreground underline">
        voltar ao painel
      </Link>
    </main>
  );
}
