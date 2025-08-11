import { NextRequest, NextResponse } from "next/server";
import Vision from "../../../../concepts/vision.phoneuse";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await Vision.action_detect({
      imageBase64: body.imageBase64,
      minConfidence: body.minConfidence,
      framesThreshold: body.framesThreshold
    });
    return NextResponse.json(res);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message ?? "api error" }, { status: 500 });
  }
}
