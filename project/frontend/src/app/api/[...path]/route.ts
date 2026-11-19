// Repassa /api/* para a API. API_URL é lido a cada requisição, então a mesma imagem serve qualquer ambiente.
export async function GET(request: Request, { params }: RouteContext<"/api/[...path]">) {
  const { path } = await params;
  const { search } = new URL(request.url);
  const target = `${process.env.API_URL ?? "http://localhost:8000"}/${path.join("/")}${search}`;
  try {
    const response = await fetch(target, { cache: "no-store" });
    return new Response(response.body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ error: "API indisponível" }, { status: 502 });
  }
}
