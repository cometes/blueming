/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
	ArrowDown,
	ArrowUp,
	KeyRound,
	ListMusic,
	Plus,
	Save,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { setSettingsMainMusicPlayer } from "@/features/settings/api/main";
import {
	fetchYouTubeKeyStatus,
	resolveMusicUrl,
	saveYouTubeKey,
} from "@/features/music/api/client";
import type { MusicPlayerItem } from "@/features/settings/types";

const createItemId = () =>
	`music_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function MusicSettingClient() {
	const settings = useSettings();
	const refreshSettings = settings.refreshSettings;
	const updateMain = settings.updateMain;

	const [enabled, setEnabled] = useState(false);
	const [items, setItems] = useState<MusicPlayerItem[]>([]);
	const [isSyncing, setIsSyncing] = useState(true);
	const [importUrl, setImportUrl] = useState("");
	const [isImporting, setIsImporting] = useState(false);
	// 재생목록 임포트 방식 선택 대기 상태
	const [pendingPlaylist, setPendingPlaylist] = useState<{
		playlistId: string;
		tracks: Array<{ videoId: string; title: string; thumbnail: string; artist: string }>;
	} | null>(null);
	const [apiKeyInput, setApiKeyInput] = useState("");
	const [keyHint, setKeyHint] = useState<string | null>(null);
	const [isSavingKey, setIsSavingKey] = useState(false);

	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		const baseline = settings.main?.musicPlayer || { enabled: false, items: [] };
		return (
			enabled !== baseline.enabled ||
			JSON.stringify(items) !== JSON.stringify(baseline.items || [])
		);
	}, [enabled, items, settings.main?.musicPlayer, isSyncing]);

	useSettingStatus("music", isDirty ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-music"
			variant="ghost"
			size="icon"
			disabled={!isDirty}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{ transition: "all 0.3s ease-in-out" }}
		>
			<Save size={16} />
		</Button>,
		[isDirty],
	);

	useEffect(() => {
		setIsSyncing(true);
		const musicPlayer = settings.main?.musicPlayer;
		if (musicPlayer) {
			setEnabled(musicPlayer.enabled);
			setItems(musicPlayer.items || []);
		}
		setIsSyncing(false);
	}, [settings.main?.musicPlayer]);

	useEffect(() => {
		void fetchYouTubeKeyStatus()
			.then((status) => setKeyHint(status.hasKey ? status.keyHint ?? "등록됨" : null))
			.catch(() => setKeyHint(null));
	}, []);

	const handleImport = useCallback(async () => {
		const url = importUrl.trim();
		if (!url) return;
		setIsImporting(true);
		try {
			const result = await resolveMusicUrl(url);
			if (result.kind === "video") {
				setItems((prev) => [
					...prev,
					{ id: createItemId(), ...result.track },
				]);
				toast.success(`"${result.track.title}" 곡을 추가했습니다.`);
			} else {
				// 재생목록: 전개 방식 선택 대기
				setPendingPlaylist(result);
			}
			setImportUrl("");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "가져오기에 실패했습니다.",
			);
		} finally {
			setIsImporting(false);
		}
	}, [importUrl]);

	const handleExpandPlaylist = useCallback(() => {
		if (!pendingPlaylist) return;
		setItems((prev) => [
			...prev,
			...pendingPlaylist.tracks.map((track) => ({
				id: createItemId(),
				...track,
			})),
		]);
		toast.success(`${pendingPlaylist.tracks.length}곡을 추가했습니다.`);
		setPendingPlaylist(null);
	}, [pendingPlaylist]);

	const handleAddPlaylistAsOne = useCallback(() => {
		if (!pendingPlaylist) return;
		const first = pendingPlaylist.tracks[0];
		setItems((prev) => [
			...prev,
			{
				id: createItemId(),
				title: `재생목록 (${pendingPlaylist.tracks.length}곡)`,
				playlistId: pendingPlaylist.playlistId,
				thumbnail: first?.thumbnail,
				artist: first?.artist,
			},
		]);
		toast.success("재생목록을 1개 항목으로 추가했습니다.");
		setPendingPlaylist(null);
	}, [pendingPlaylist]);

	const moveItem = (index: number, direction: -1 | 1) => {
		setItems((prev) => {
			const next = [...prev];
			const target = index + direction;
			if (target < 0 || target >= next.length) return prev;
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});
	};

	const handleSave = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			try {
				const payload = { enabled, items };
				await setSettingsMainMusicPlayer(payload);
				updateMain?.({ musicPlayer: payload });
				await refreshSettings?.({ broadcast: true });
				toast.success("저장되었습니다.");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "저장에 실패했습니다.",
				);
			}
		},
		[enabled, items, refreshSettings, updateMain],
	);

	const handleSaveKey = useCallback(async () => {
		const key = apiKeyInput.trim();
		if (!key) return;
		setIsSavingKey(true);
		try {
			const result = await saveYouTubeKey(key);
			setKeyHint(result.keyHint);
			setApiKeyInput("");
			toast.success("API 키가 저장되었습니다.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "키 저장에 실패했습니다.",
			);
		} finally {
			setIsSavingKey(false);
		}
	}, [apiKeyInput]);

	return (
		<form id="setting-form-music" onSubmit={handleSave} className="space-y-8">
			<section>
				<h2 className="text-[20px] font-semibold font-title">음악 플레이어 설정</h2>
				<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
					유튜브 링크·재생목록을 가져와 플로팅 음악 플레이어를 구성합니다.
					메뉴의 음악 버튼으로 플레이어를 열고 닫을 수 있습니다.
				</p>

				<div className="section-wrap mt-6 space-y-6">
					{/* 활성화 */}
					<div className="section-box flex items-center">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">플레이어 사용</h3>
						</div>
						<Switch checked={enabled} onCheckedChange={setEnabled} />
					</div>

					{/* URL 임포트 */}
					<div className="section-box flex items-start">
						<div className="text-box w-[220px] pr-5 pt-2">
							<h3 className="font-medium text-sub-text">곡 추가</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								영상 URL 또는 재생목록 URL
							</p>
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex gap-2">
								<Input
									placeholder="https://www.youtube.com/watch?v=..."
									value={importUrl}
									onChange={(e) => setImportUrl(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											void handleImport();
										}
									}}
									className="rounded-card border-card bg-card-bg"
								/>
								<Button
									type="button"
									onClick={() => void handleImport()}
									disabled={isImporting || !importUrl.trim()}
								>
									<Plus size={14} className="mr-1" />
									{isImporting ? "가져오는 중..." : "가져오기"}
								</Button>
							</div>

							{pendingPlaylist && (
								<div className="mt-3 rounded-card border border-card bg-card-bg/60 p-3 text-sm">
									<p className="text-main-text">
										재생목록에서 {pendingPlaylist.tracks.length}곡을 찾았습니다.
										어떻게 추가할까요?
									</p>
									<div className="mt-2 flex flex-wrap gap-2">
										<Button type="button" size="sm" onClick={handleExpandPlaylist}>
											{pendingPlaylist.tracks.length}곡 전부 추가
										</Button>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											onClick={handleAddPlaylistAsOne}
											className="border border-card"
										>
											재생목록 1개 항목으로 추가
										</Button>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											onClick={() => setPendingPlaylist(null)}
										>
											취소
										</Button>
									</div>
									<p className="mt-1.5 text-xs text-sub-text">
										곡 전부 추가: 목록에 개별 곡이 표시되고 순서 편집 가능 /
										1개 항목: 유튜브 재생목록 순서 그대로 재생
									</p>
								</div>
							)}
						</div>
					</div>

					{/* 곡 목록 */}
					<div className="section-box flex items-start">
						<div className="text-box w-[220px] pr-5 pt-2">
							<h3 className="font-medium text-sub-text">곡 목록</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								{items.length}곡
							</p>
						</div>
						<div className="flex-1 min-w-0 space-y-2">
							{items.length === 0 ? (
								<p className="py-6 text-center text-sm text-sub-text">
									위에서 유튜브 URL을 가져와 곡을 추가해주세요.
								</p>
							) : (
								items.map((item, index) => (
									<div
										key={item.id}
										className="flex items-center gap-3 rounded-card border border-card bg-card-bg p-2"
									>
										<span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-card">
											{item.thumbnail ? (
												<img
													src={item.thumbnail}
													alt=""
													className="h-full w-full object-cover"
												/>
											) : (
												<ListMusic size={14} className="m-auto mt-3 text-sub-text" />
											)}
										</span>
										<div className="min-w-0 flex-1">
											<Input
												value={item.title}
												onChange={(e) =>
													setItems((prev) =>
														prev.map((it, i) =>
															i === index
																? { ...it, title: e.target.value }
																: it,
														),
													)
												}
												className="h-7 rounded border-transparent bg-transparent px-1 text-sm"
											/>
											<p className="truncate px-1 text-xs text-sub-text">
												{item.artist || (item.playlistId ? "재생목록" : "")}
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-1">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => moveItem(index, -1)}
												disabled={index === 0}
												className="h-7 w-7 text-sub-text"
												aria-label="위로"
											>
												<ArrowUp size={13} />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => moveItem(index, 1)}
												disabled={index === items.length - 1}
												className="h-7 w-7 text-sub-text"
												aria-label="아래로"
											>
												<ArrowDown size={13} />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() =>
													setItems((prev) => prev.filter((_, i) => i !== index))
												}
												className="h-7 w-7 text-sub-text hover:text-red-400"
												aria-label="삭제"
											>
												<Trash2 size={13} />
											</Button>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</section>

			<Separator className="my-12" />

			{/* YouTube Data API 키 */}
			<section>
				<h2 className="text-[18px] font-semibold font-title flex items-center gap-2">
					<KeyRound size={16} />
					YouTube Data API 키
				</h2>
				<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
					재생목록 임포트에만 필요합니다 (개별 영상은 키 없이 동작).
					Google Cloud 콘솔에서 YouTube Data API v3를 활성화하고 발급받은 키를
					등록해주세요.
				</p>
				<div className="section-wrap mt-4">
					<div className="section-box flex items-center">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">API 키</h3>
							{keyHint && (
								<p className="text-xs text-theme-primary mt-1">
									등록됨: {keyHint}
								</p>
							)}
						</div>
						<div className="flex flex-1 gap-2">
							<Input
								type="password"
								placeholder={keyHint ? "새 키로 교체하려면 입력" : "AIza..."}
								value={apiKeyInput}
								onChange={(e) => setApiKeyInput(e.target.value)}
								className="rounded-card border-card bg-card-bg"
							/>
							<Button
								type="button"
								onClick={() => void handleSaveKey()}
								disabled={isSavingKey || !apiKeyInput.trim()}
							>
								{isSavingKey ? "저장 중..." : "키 저장"}
							</Button>
						</div>
					</div>
				</div>
			</section>
		</form>
	);
}
