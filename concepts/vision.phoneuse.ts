import fetch from "node-fetch";

type BBox = { x: number; y: number; w: number; h: number };
type Detection = { class: "downward_face"; confidence: number; bbox: BBox; orientation: string; method: string };
type Output = { isLookingDown: boolean; detections: Detection[]; ts: number; meetsThreshold?: boolean };

class VisionDownwardFace {
    state = { streak: 0, last: null as Output | null };

    async action_detect(input: { imageBase64: string; minConfidence?: number; framesThreshold?: number; }): Promise<Output | { error: string }> {
        try {
            const minConfidence = input.minConfidence ?? 0.6;
            const framesThreshold = input.framesThreshold ?? 6;

            const r = await fetch(process.env.VISION_URL!, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: input.imageBase64, minConfidence })
            });

            const data: any = await r.json();
            const detections: Detection[] = (data?.detections ?? []);
            const isLookingDown = detections.length > 0;

            this.state.streak = isLookingDown ? this.state.streak + 1 : 0;

            const out: Output = {
                isLookingDown,
                detections,
                ts: Date.now(),
                meetsThreshold: this.state.streak >= framesThreshold
            };

            this.state.last = out;
            return out;
        } catch (e: any) {
            return { error: e?.message ?? "vision error" };
        }
    }

    _last(): Output[] {
        return this.state.last ? [this.state.last] : [];
    }
}

export default new VisionDownwardFace();
