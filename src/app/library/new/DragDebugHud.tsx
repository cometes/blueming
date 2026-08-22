"use client";

import * as React from "react";
import { imageDragSource } from "@/shared/lib/tiptapImage";

interface DragLogEntry {
	seq: number;
	type: string;
	target: string;
	x: number;
	y: number;
	types: string;
	prevented: boolean;
	dropEffect: string;
	effectAllowed: string;
	overPm: boolean;
	srcTracked: boolean;
}

/**
 * [임시 진단 도구 — 원인 파악 후 제거 예정]
 * 실제 드래그의 이벤트 흐름을 기록해 드래그가 끝난 뒤 화면에 표시한다.
 * dev 전용. 드래그 한 번 후 스크린샷으로 상태를 공유받기 위한 용도.
 */
export default function DragDebugHud() {
	const [log, setLog] = React.useState<DragLogEntry[]>([]);
	const seqRef = React.useRef(0);
	const lastOverRef = React.useRef(0);

	React.useEffect(() => {
		const describe = (el: EventTarget | null) => {
			const node = el as HTMLElement | null;
			if (!node || !node.tagName) return String(el);
			const cls = (typeof node.className === "string" ? node.className : "")
				.split(" ")
				.filter(Boolean)
				.slice(0, 2)
				.join(".");
			return `${node.tagName.toLowerCase()}${cls ? "." + cls : ""}`;
		};

		const record = (e: DragEvent, phase: string) => {
			const pm = document.querySelector(".ProseMirror");
			const entry: DragLogEntry = {
				seq: ++seqRef.current,
				type: `${e.type}${phase}`,
				target: describe(e.target),
				x: Math.round(e.clientX),
				y: Math.round(e.clientY),
				types: e.dataTransfer ? Array.from(e.dataTransfer.types).join(",") : "-",
				prevented: e.defaultPrevented,
				dropEffect: e.dataTransfer?.dropEffect ?? "-",
				effectAllowed: e.dataTransfer?.effectAllowed ?? "-",
				overPm: !!(pm && e.target instanceof Node && pm.contains(e.target)),
				srcTracked: imageDragSource.editor !== null,
			};
			setLog((prev) => [...prev.slice(-30), entry]);
		};

		// dragstart 시 로그 리셋 (마지막 드래그 세션만 표시)
		const onStart = (e: DragEvent) => {
			seqRef.current = 0;
			setLog([]);
			record(e, "");
			// 다음 틱에 한 번 더: React onDragStart/PM 처리 후 상태 확인
			setTimeout(() => record(e, "+after"), 0);
		};
		// dragover는 300ms 스로틀 (버블 단계 = 모든 핸들러 처리 후 prevented 상태)
		const onOver = (e: DragEvent) => {
			const now = Date.now();
			if (now - lastOverRef.current < 300) return;
			lastOverRef.current = now;
			record(e, "");
		};
		const onDrop = (e: DragEvent) => record(e, "");
		const onEnd = (e: DragEvent) => record(e, "");
		const onEnter = (e: DragEvent) => {
			const now = Date.now();
			if (now - lastOverRef.current < 300) return;
			record(e, "");
		};

		// 버블 단계 + window: 모든 핸들러가 처리를 마친 뒤의 최종 상태를 관측
		window.addEventListener("dragstart", onStart);
		window.addEventListener("dragover", onOver);
		window.addEventListener("dragenter", onEnter);
		window.addEventListener("drop", onDrop);
		window.addEventListener("dragend", onEnd);
		return () => {
			window.removeEventListener("dragstart", onStart);
			window.removeEventListener("dragover", onOver);
			window.removeEventListener("dragenter", onEnter);
			window.removeEventListener("drop", onDrop);
			window.removeEventListener("dragend", onEnd);
		};
	}, []);

	if (log.length === 0) {
		return (
			<div className="fixed bottom-3 right-3 z-[99] rounded-md border border-yellow-500/60 bg-black/85 px-3 py-2 text-[11px] text-yellow-300 font-mono">
				DRAG DEBUG: 드래그하면 여기에 기록됩니다
			</div>
		);
	}

	return (
		<div className="fixed bottom-3 right-3 z-[99] max-h-[70vh] w-[560px] overflow-auto rounded-md border border-yellow-500/60 bg-black/90 p-2 text-[10px] leading-[1.5] text-green-300 font-mono">
			<div className="mb-1 text-yellow-300">
				DRAG DEBUG — 마지막 드래그 기록 (이 패널을 스크린샷해서 공유)
			</div>
			<table className="w-full">
				<thead>
					<tr className="text-yellow-200 text-left">
						<th>#</th>
						<th>event</th>
						<th>target</th>
						<th>x,y</th>
						<th>pm?</th>
						<th>prev?</th>
						<th>eff/allow</th>
						<th>src?</th>
						<th>types</th>
					</tr>
				</thead>
				<tbody>
					{log.map((l) => (
						<tr key={l.seq} className={l.prevented ? "" : "text-red-400"}>
							<td>{l.seq}</td>
							<td>{l.type}</td>
							<td className="max-w-[120px] truncate">{l.target}</td>
							<td>
								{l.x},{l.y}
							</td>
							<td>{l.overPm ? "Y" : "n"}</td>
							<td>{l.prevented ? "Y" : "N!"}</td>
							<td>
								{l.dropEffect}/{l.effectAllowed}
							</td>
							<td>{l.srcTracked ? "Y" : "n"}</td>
							<td className="max-w-[130px] truncate">{l.types}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
