import { NextRequest, NextResponse } from "next/server";
import { getEffectiveApiKeys, saveApiSettings } from "@/lib/settings";

function maskKey(k?: string): string | null {
  if (!k || k.length < 8) return k ? "••••" : null;
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

export async function GET() {
  const { geminiKey, falKey } = getEffectiveApiKeys();
  return NextResponse.json({
    hasGeminiKey: Boolean(geminiKey),
    hasFalKey: Boolean(falKey),
    geminiPreview: maskKey(geminiKey),
    falPreview: maskKey(falKey),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      geminiApiKey?: string;
      falApiKey?: string;
    };
    saveApiSettings({
      geminiApiKey: body.geminiApiKey,
      falApiKey: body.falApiKey,
    });
    const { geminiKey, falKey } = getEffectiveApiKeys();
    return NextResponse.json({
      ok: true,
      hasGeminiKey: Boolean(geminiKey),
      hasFalKey: Boolean(falKey),
      geminiPreview: maskKey(geminiKey),
      falPreview: maskKey(falKey),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron guardar las claves." },
      { status: 400 }
    );
  }
}
