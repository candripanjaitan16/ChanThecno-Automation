import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Route ini generik: memanggil endpoint & model apa pun yang diisi admin
// di tabel ai_models (format request mengikuti gaya OpenAI-compatible chat completion).
export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const db = supabaseAdmin();
  const { data: model, error } = await db
    .from("ai_models")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (error || !model) {
    return NextResponse.json(
      { reply: "Belum ada model AI aktif. Set di Panel Admin → Model AI." },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(model.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.api_key}`,
      },
      body: JSON.stringify({
        model: model.model_id,
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.content?.[0]?.text ??
      JSON.stringify(data).slice(0, 500);

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json(
      { reply: "Gagal memanggil endpoint model. Cek endpoint/API key di Panel Admin." },
      { status: 200 }
    );
  }
}
