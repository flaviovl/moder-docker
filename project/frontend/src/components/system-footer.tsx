"use client";

import useSWR from "swr";

type Info = { total_readings: number; last_reading_at: string | null; api_host: string };

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

// O total de leituras mostra se o banco é o mesmo de antes; a última gravação, se o worker está vivo.
export function SystemFooter() {
  const { data, error } = useSWR<Info>("/api/info", fetcher, { refreshInterval: 5000 });
  if (error || !data) return null;
  const last = data.last_reading_at
    ? new Date(data.last_reading_at).toLocaleTimeString("pt-BR")
    : "nenhuma";
  return (
    <footer className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-4 text-sm text-muted-foreground">
      <span>{data.total_readings.toLocaleString("pt-BR")} leituras no banco</span>
      <span>última gravação: {last}</span>
      <span>API respondida pelo contêiner {data.api_host}</span>
    </footer>
  );
}
