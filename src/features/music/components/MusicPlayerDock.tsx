"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ListMusic,
	Pause,
	Play,
	SkipBack,
	SkipForward,
	Volume2,
	VolumeX,
	X,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { useMusicPlayerStore } from "@/features/music/store/useMusicPlayerStore";
import type { MusicPlayerItem } from "@/features/settings/types";
import {
	playlistIdFromUrl,
	videoIdFromUrl,
} from "@/features/music/lib/youtube";

/** YouTube IFrame API 최소 타입 (공식 @types 미설치) */
interface YTPlayer {
	playVideo: () => void;
	pauseVideo: () => void;
	nextVideo: () => void;
	previousVideo: () => void;
	seekTo: (seconds: number, allowSeekAhead: boolean) => void;
	setVolume: (volume: number) => void;
	getCurrentTime: () => number;
	getDuration: () => number;
	getVideoData: () => { title?: string; author?: string } | undefined;
	cueVideoById: (videoId: string) => void;
	loadVideoById: (videoId: string) => void;
	cuePlaylist: (options: { list: string; listType: string }) => void;
	loadPlaylist: (options: { list: string; listType: string }) => void;
	destroy: () => void;
}

interface YTNamespace {
	Player: new (
		element: HTMLElement,
		options: {
			host?: string;
			width?: number;
			height?: number;
			playerVars?: Record<string, string | number>;
			events?: {
				onReady?: () => void;
				onStateChange?: (event: { data: number }) => void;
			};
		},
	) => YTPlayer;
	PlayerState: {
		PLAYING: number;
		PAUSED: number;
		ENDED: number;
	};
}

declare global {
	interface Window {
		YT?: YTNamespace;
		onYouTubeIframeAPIReady?: () => void;
	}
}

// IFrame API 스크립트 1회 로더
let ytApiPromise: Promise<YTNamespace> | null = null;
const loadYouTubeApi = (): Promise<YTNamespace> => {
	if (ytApiPromise) return ytApiPromise;
	ytApiPromise = new Promise((resolve) => {
		if (window.YT?.Player) {
			resolve(window.YT);
			return;
		}
		const prev = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			prev?.();
			if (window.YT) resolve(window.YT);
		};
		const script = document.createElement("script");
		script.src = "https://www.youtube.com/iframe_api";
		document.body.appendChild(script);
	});
	return ytApiPromise;
};

const formatTime = (seconds: number) => {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * 플로팅 음악 플레이어 (moogong 참고).
 * - 숨긴 youtube-nocookie iframe + IFrame API로 제어하는 커스텀 UI
 * - Providers에 마운트되어 라우트 이동에도 언마운트되지 않음 → 재생 유지
 * - 닫아도(isOpen=false) 재생은 유지, 아이콘바 버튼으로 다시 연다
 * - 자동재생 없음: 브라우저 정책상 첫 재생은 반드시 사용자 클릭
 */
export default function MusicPlayerDock() {
	const { main } = useSettings();
	const settings = main?.musicPlayer;
	const {
		isOpen,
		isPlaying,
		currentIndex,
		volume,
		showPlaylist,
		setOpen,
		setPlaying,
		setCurrentIndex,
		setVolume,
		togglePlaylist,
	} = useMusicPlayerStore();

	// 구 형식(url만 저장) 항목은 videoId/playlistId를 파생한다.
	// 파생 우선순위는 videoId — 믹스(RD) 목록이 붙은 watch URL을 단일 곡으로 처리.
	const queue: MusicPlayerItem[] = (settings?.enabled ? settings.items ?? [] : [])
		.map((item) => ({
			...item,
			videoId: item.videoId ?? videoIdFromUrl(item.url),
			playlistId:
				item.playlistId ??
				(item.videoId || videoIdFromUrl(item.url)
					? undefined
					: playlistIdFromUrl(item.url)),
		}))
		.filter((item) => item.videoId || item.playlistId);
	const safeIndex = queue.length > 0 ? currentIndex % queue.length : 0;
	const current = queue[safeIndex];

	const playerRef = useRef<YTPlayer | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [playerReady, setPlayerReady] = useState(false);
	const [progress, setProgress] = useState({ current: 0, duration: 0 });
	/** 재생목록 항목 재생 시 실제 곡 제목 (getVideoData) */
	const [liveTitle, setLiveTitle] = useState<string | null>(null);
	const initializedRef = useRef(false);
	const currentItemIdRef = useRef<string | null>(null);
	const volumeRef = useRef(volume);
	volumeRef.current = volume;

	// 플레이어 생성은 처음 열 때 지연 초기화 (방문자 전원에게 YT 스크립트를 싣지 않음)
	useEffect(() => {
		if (!isOpen || initializedRef.current || queue.length === 0) return;
		initializedRef.current = true;
		let cancelled = false;

		void loadYouTubeApi().then((YT) => {
			if (cancelled || !containerRef.current) return;
			playerRef.current = new YT.Player(containerRef.current, {
				host: "https://www.youtube-nocookie.com",
				width: 1,
				height: 1,
				playerVars: { controls: 0, origin: window.location.origin },
				events: {
					onReady: () => {
						playerRef.current?.setVolume(volumeRef.current);
						setPlayerReady(true);
					},
					onStateChange: (event) => {
						if (event.data === YT.PlayerState.PLAYING) {
							setPlaying(true);
							setLiveTitle(
								playerRef.current?.getVideoData?.()?.title ?? null,
							);
						} else if (event.data === YT.PlayerState.PAUSED) {
							setPlaying(false);
						} else if (event.data === YT.PlayerState.ENDED) {
							setPlaying(false);
							// 단일 영상이 끝나면 큐의 다음 곡으로 (재생목록은 자체 진행)
							if (queue[safeIndex]?.videoId && queue.length > 1) {
								setCurrentIndex((safeIndex + 1) % queue.length);
							}
						}
					},
				},
			});
		});

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, queue.length]);

	// 현재 항목 로드 (isPlaying이면 load*, 아니면 cue*)
	const loadItem = useCallback(
		(item: MusicPlayerItem, autoplay: boolean) => {
			const player = playerRef.current;
			if (!player) return;
			setLiveTitle(null);
			if (item.playlistId) {
				const options = { list: item.playlistId, listType: "playlist" };
				if (autoplay) player.loadPlaylist(options);
				else player.cuePlaylist(options);
			} else if (item.videoId) {
				if (autoplay) player.loadVideoById(item.videoId);
				else player.cueVideoById(item.videoId);
			}
		},
		[],
	);

	useEffect(() => {
		if (!playerReady || !current) return;
		if (currentItemIdRef.current === current.id) return;
		const isFirstLoad = currentItemIdRef.current === null;
		currentItemIdRef.current = current.id;
		// 첫 로드는 자동재생 금지(정책), 이후 곡 전환은 재생 이어감
		loadItem(current, !isFirstLoad);
	}, [playerReady, current, loadItem]);

	// 진행바 폴링 (재생 중 1초)
	useEffect(() => {
		if (!isPlaying) return;
		const timer = setInterval(() => {
			const player = playerRef.current;
			if (!player) return;
			setProgress({
				current: player.getCurrentTime?.() ?? 0,
				duration: player.getDuration?.() ?? 0,
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [isPlaying]);

	// 볼륨 반영
	useEffect(() => {
		playerRef.current?.setVolume(volume);
	}, [volume]);

	if (!settings?.enabled || queue.length === 0) return null;

	const handlePlayPause = () => {
		const player = playerRef.current;
		if (!player) return;
		if (isPlaying) player.pauseVideo();
		else player.playVideo();
	};

	const handlePrev = () => {
		if (current?.playlistId) {
			playerRef.current?.previousVideo();
			return;
		}
		setCurrentIndex((safeIndex - 1 + queue.length) % queue.length);
	};

	const handleNext = () => {
		if (current?.playlistId) {
			playerRef.current?.nextVideo();
			return;
		}
		setCurrentIndex((safeIndex + 1) % queue.length);
	};

	const handleSelect = (index: number) => {
		if (index === safeIndex) {
			handlePlayPause();
			return;
		}
		setCurrentIndex(index);
	};

	const handleSeek = (value: number) => {
		const player = playerRef.current;
		if (!player || progress.duration <= 0) return;
		const target = (value / 100) * progress.duration;
		player.seekTo(target, true);
		setProgress((prev) => ({ ...prev, current: target }));
	};

	const displayTitle = liveTitle ?? current?.title ?? "";
	const progressPercent =
		progress.duration > 0 ? (progress.current / progress.duration) * 100 : 0;

	return (
		<>
			{/* 숨긴 유튜브 플레이어 — 언마운트하지 않아 닫아도 재생 유지 */}
			<div className="fixed -left-[9999px] bottom-0 h-px w-px overflow-hidden">
				<div ref={containerRef} />
			</div>

			<div
				className={cn(
					"fixed bottom-4 left-1/2 z-40 w-[340px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-card border border-card bg-card-bg/95 backdrop-blur-card shadow-xl",
					"transition-all duration-300",
					isOpen
						? "translate-y-0 opacity-100"
						: "pointer-events-none translate-y-6 opacity-0",
				)}
			>
				{/* 재생목록 패널 */}
				{showPlaylist && (
					<div className="max-h-48 overflow-y-auto border-b border-card px-2 py-2">
						{queue.map((item, index) => (
							<button
								key={item.id}
								type="button"
								onClick={() => handleSelect(index)}
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
									index === safeIndex
										? "bg-theme-primary/15 text-theme-primary"
										: "text-main-text hover:bg-theme-primary/10",
								)}
							>
								<span className="h-7 w-7 shrink-0 overflow-hidden rounded bg-card">
									{item.thumbnail ? (
										<img
											src={item.thumbnail}
											alt=""
											className="h-full w-full object-cover"
										/>
									) : (
										<ListMusic size={12} className="m-auto mt-2" />
									)}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate">{item.title}</span>
									{item.artist ? (
										<span className="block truncate text-[10px] text-sub-text">
											{item.artist}
										</span>
									) : null}
								</span>
								{item.playlistId ? (
									<span className="shrink-0 text-[9px] text-sub-text">목록</span>
								) : null}
							</button>
						))}
					</div>
				)}

				<div className="flex items-center gap-3 px-3 py-2.5">
					<button
						type="button"
						onClick={togglePlaylist}
						className="shrink-0 text-sub-text hover:text-theme-primary"
						aria-label="재생목록"
					>
						<ListMusic size={16} />
					</button>

					<span
						className={cn(
							"h-10 w-10 shrink-0 overflow-hidden rounded-full border border-card bg-card",
							isPlaying && "animate-[spin_8s_linear_infinite]",
						)}
					>
						{current?.thumbnail ? (
							<img
								src={current.thumbnail}
								alt=""
								className="h-full w-full object-cover"
							/>
						) : null}
					</span>

					<div className="min-w-0 flex-1">
						<p className="truncate text-xs font-medium text-main-text">
							{displayTitle}
						</p>
						<p className="truncate text-[10px] text-sub-text">
							{current?.artist || (current?.playlistId ? "재생목록" : "")}
						</p>
					</div>

					<button
						type="button"
						onClick={() => setOpen(false)}
						className="shrink-0 text-sub-text hover:text-main-text"
						aria-label="플레이어 닫기"
					>
						<X size={14} />
					</button>
				</div>

				{/* 진행바 */}
				<div className="flex items-center gap-2 px-3 pb-1 text-[9px] text-sub-text">
					<span className="w-7 shrink-0">{formatTime(progress.current)}</span>
					<input
						type="range"
						min={0}
						max={100}
						value={progressPercent}
						onChange={(e) => handleSeek(Number(e.target.value))}
						className="h-1 flex-1 cursor-pointer accent-[var(--color-theme-primary)]"
						aria-label="재생 위치"
					/>
					<span className="w-7 shrink-0 text-right">
						{formatTime(progress.duration)}
					</span>
				</div>

				{/* 컨트롤 */}
				<div className="flex items-center justify-between px-4 pb-3 pt-1">
					<div className="flex w-20 items-center gap-1.5">
						<button
							type="button"
							onClick={() => setVolume(volume > 0 ? 0 : 70)}
							className="text-sub-text hover:text-theme-primary"
							aria-label="음소거"
						>
							{volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
						</button>
						<input
							type="range"
							min={0}
							max={100}
							value={volume}
							onChange={(e) => setVolume(Number(e.target.value))}
							className="h-1 w-full cursor-pointer accent-[var(--color-theme-primary)]"
							aria-label="볼륨"
						/>
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={handlePrev}
							className="text-main-text hover:text-theme-primary"
							aria-label="이전 곡"
						>
							<SkipBack size={18} />
						</button>
						<button
							type="button"
							onClick={handlePlayPause}
							className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-primary/15 text-theme-primary hover:bg-theme-primary/25"
							aria-label={isPlaying ? "일시정지" : "재생"}
						>
							{isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
						</button>
						<button
							type="button"
							onClick={handleNext}
							className="text-main-text hover:text-theme-primary"
							aria-label="다음 곡"
						>
							<SkipForward size={18} />
						</button>
					</div>

					<div className="w-20" />
				</div>
			</div>
		</>
	);
}
