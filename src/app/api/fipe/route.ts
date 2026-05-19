import { NextRequest, NextResponse } from "next/server";

// Proxy server-side para a API FIPE — evita CORS e instabilidade de fetch no browser.
// Suporta ambos os formatos da API (v1 PascalCase e v2 camelCase).
const FIPE = "https://parallelum.com.br/fipe/api/v2/cars";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const brand = searchParams.get("brand");
  const model = searchParams.get("model");

  let url: string;
  if (type === "brands") {
    url = `${FIPE}/brands`;
  } else if (type === "models" && brand) {
    url = `${FIPE}/brands/${brand}/models`;
  } else if (type === "years" && brand && model) {
    url = `${FIPE}/brands/${brand}/models/${model}/years`;
  } else {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // cache de 24h no servidor
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `FIPE retornou ${res.status}` }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await res.json();

    // Normaliza qualquer formato → { items: [{id, name}] }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function norm(arr: any[]): { id: string; name: string }[] {
      return arr.map((x) => ({
        id: String(x.code ?? x.Value ?? x.id ?? ""),
        name: String(x.name ?? x.Label ?? x.label ?? ""),
      }));
    }

    let items: { id: string; name: string }[];
    if (type === "brands") {
      items = norm(Array.isArray(raw) ? raw : []);
    } else if (type === "models") {
      // v2 devolve {models:[...]} ou às vezes array direto; v1 devolve {Modelos:[...]}
      const list = Array.isArray(raw) ? raw : (raw.models ?? raw.Modelos ?? []);
      items = norm(Array.isArray(list) ? list : []);
    } else {
      items = norm(Array.isArray(raw) ? raw : []);
    }

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
