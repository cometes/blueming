"use client";

import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { STICKER_ASSET_DND_MIME } from "@/types/stickerBoard";
import { StickerRenderer } from "@/components/stickerboard-editor/StickerRenderer";

const GRID_BASE = 12;

export function StickerBoardCanvas({
    ratio,
}: {
    ratio: { w: number; h: number } | null;
}) {
    const {
        state: { marquee },
        refs: { boundsRef, canvasRef, marqueeRef, presentRef },
        actions: {
            setSelection,
            setMarquee,
            addImageStickerAt,
            cloneDraft,
        },
        computed: { visibleDraft },
    } = useStickerBoardEditorContext();

    return (
        <div className="rounded-card border border-card bg-card-bg/60 p-4 backdrop-blur-card">
            <div className="text-sm font-semibold text-main-text">캔버스</div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                고정 폭 768px 캔버스 영역
            </p>
            <div
                ref={boundsRef}
                className="mt-4 w-full overflow-hidden rounded-card border border-card bg-card-bg p-2"
            >
                <div
                    className="relative grid grid-cols-12 grid-rows-12 aspect-[5/4] w-full overflow-visible"
                    onPointerDown={(e) => {
                        const canvas = canvasRef.current;
                        if (!canvas) {
                            setSelection(new Set(), null);
                            return;
                        }
                        if ((e.target as HTMLElement)?.closest?.('[data-sticker-root="true"]'))
                            return;

                        const rect = canvas.getBoundingClientRect();
                        if (rect.width <= 0 || rect.height <= 0) {
                            setSelection(new Set(), null);
                            return;
                        }

                        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
                        const yPct = ((e.clientY - rect.top) / rect.height) * 100;
                        marqueeRef.current = {
                            startClientX: e.clientX,
                            startClientY: e.clientY,
                            startXPct: xPct,
                            startYPct: yPct,
                        };
                        setMarquee({ xPct, yPct, widthPct: 0, heightPct: 0 });

                        if (!e.shiftKey) {
                            setSelection(new Set(), null);
                        }
                    }}
                >
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
                            backgroundSize: "calc(100% / 12) calc(100% / 12)",
                        }}
                    />

                    {ratio ? (
                        <div
                            className="relative bg-widget-bg backdrop-blur-widget rounded-widget border-widget overflow-visible shadow-[0_10px_25px_rgba(0,0,0,0.08)]"
                            style={{
                                gridColumn: (() => {
                                    const span = Math.max(1, Math.min(GRID_BASE, ratio.w || 1));
                                    const start = Math.floor((GRID_BASE - span) / 2) + 1;
                                    return `${start} / span ${span}`;
                                })(),
                                gridRow: (() => {
                                    const span = Math.max(1, Math.min(GRID_BASE, ratio.h || 1));
                                    const start = Math.floor((GRID_BASE - span) / 2) + 1;
                                    return `${start} / span ${span}`;
                                })(),
                            }}
                            ref={canvasRef}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "copy";
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const raw = e.dataTransfer.getData(STICKER_ASSET_DND_MIME);
                                if (!raw) return;
                                let payload = null;
                                try { payload = JSON.parse(raw); } catch { payload = null; }
                                if (!payload?.url) return;

                                const canvas = canvasRef.current;
                                if (!canvas) return;
                                const rect = canvas.getBoundingClientRect();
                                const centerXPct = ((e.clientX - rect.left) / rect.width) * 100;
                                const centerYPct = ((e.clientY - rect.top) / rect.height) * 100;
                                const base = cloneDraft(presentRef.current);
                                
                                void addImageStickerAt({
                                    url: payload.url,
                                    centerXPct,
                                    centerYPct,
                                    assetId: payload.assetId,
                                    assetWidth: payload.width,
                                    assetHeight: payload.height,
                                    historyBase: base,
                                });
                            }}
                        >
                            {marquee && (
                                <div
                                    className="absolute border border-blue-400/80 bg-blue-400/15"
                                    style={{
                                        left: `${marquee.xPct}%`,
                                        top: `${marquee.yPct}%`,
                                        width: `${marquee.widthPct}%`,
                                        height: `${marquee.heightPct}%`,
                                        pointerEvents: "none",
                                        zIndex: 9999,
                                    }}
                                />
                            )}
                            {visibleDraft.length > 0 ? (
                                visibleDraft.map((component) => (
                                    <StickerRenderer key={component.id} component={component} />
                                ))
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                    저장된 스티커가 없습니다.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center py-10">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-theme-primary border-r-transparent" />
                                <div className="mt-4 text-xs text-gray-500">캔버스를 불러오는 중...</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
