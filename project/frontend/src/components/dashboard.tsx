"use client";

import useSWR from "swr";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SensorSummary = {
  sensor: string;
  name: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
};
type Point = { sensor: string; measured_at: string; value: number };
type Stats = { sensors: SensorSummary[]; series: Point[] };
type Reading = { sensor: string; value: number; measured_at: string };

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2"];

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
};

// Uma linha por instante, uma coluna por sensor (pelo nome): o formato que o LineChart espera.
function toChartRows(series: Point[], names: Map<string, string>) {
  const rows = new Map<string, Record<string, number | string>>();
  for (const { sensor, measured_at, value } of series) {
    const row = rows.get(measured_at) ?? { time: new Date(measured_at).toLocaleTimeString("pt-BR") };
    row[names.get(sensor) ?? sensor] = value;
    rows.set(measured_at, row);
  }
  return [...rows.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
}

export function Dashboard() {
  const stats = useSWR<Stats>("/api/stats?minutes=10", fetcher, { refreshInterval: 5000 });
  const latest = useSWR<Reading[]>("/api/readings?limit=10", fetcher, { refreshInterval: 5000 });

  if (stats.error || latest.error) {
    return <p className="text-destructive">Não foi possível falar com a API.</p>;
  }
  if (!stats.data || !latest.data) {
    return <p className="text-muted-foreground">Carregando…</p>;
  }

  const names = new Map(stats.data.sensors.map((s) => [s.sensor, s.name]));
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Média por janela de 30 s (últimos 10 min)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={toChartRows(stats.data.series, names)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Legend />
              {[...names.values()].map((name, i) => (
                <Line
                  key={name}
                  dataKey={name}
                  stroke={COLORS[i % COLORS.length]}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas por sensor</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sensor</TableHead>
                  <TableHead className="text-right">n</TableHead>
                  <TableHead className="text-right">média</TableHead>
                  <TableHead className="text-right">desvio</TableHead>
                  <TableHead className="text-right">p95</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.data.sensors.map((s) => (
                  <TableRow key={s.sensor}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-right">{s.count}</TableCell>
                    <TableCell className="text-right">{s.mean}</TableCell>
                    <TableCell className="text-right">{s.std}</TableCell>
                    <TableCell className="text-right">{s.p95}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas leituras</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {latest.data.map((r) => (
                  <TableRow key={`${r.sensor}-${r.measured_at}`}>
                    <TableCell>
                      <Badge variant="secondary">{names.get(r.sensor) ?? r.sensor}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{r.value}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(r.measured_at).toLocaleTimeString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
