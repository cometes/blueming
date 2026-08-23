import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MusicPlayerState {
	/** 플로팅 플레이어 표시 여부 (아이콘바 버튼으로 토글) */
	isOpen: boolean;
	/** 실제 재생 중 여부 (아이콘 이퀄라이저 애니메이션에 사용) */
	isPlaying: boolean;
	/** 현재 곡 인덱스 (persist — 새로고침 후 마지막 곡 유지) */
	currentIndex: number;
	/** 0~100 (persist) */
	volume: number;
	/** 방문자가 볼륨을 직접 조절한 적 있는지 (persist) — true면 관리자 기본 볼륨을 덮어쓰지 않음 */
	userAdjustedVolume: boolean;
	showPlaylist: boolean;
	toggleOpen: () => void;
	setOpen: (open: boolean) => void;
	setPlaying: (playing: boolean) => void;
	setCurrentIndex: (index: number) => void;
	/** 방문자가 직접 조절 — 이후 관리자 기본값보다 우선 */
	setVolume: (volume: number) => void;
	/** 관리자 기본 볼륨 적용 — 방문자가 조절한 적 없을 때만 반영 */
	applyDefaultVolume: (volume: number) => void;
	togglePlaylist: () => void;
}

export const useMusicPlayerStore = create<MusicPlayerState>()(
	persist(
		(set) => ({
			isOpen: false,
			isPlaying: false,
			currentIndex: 0,
			volume: 70,
			userAdjustedVolume: false,
			showPlaylist: false,
			toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
			setOpen: (open) => set({ isOpen: open }),
			setPlaying: (playing) => set({ isPlaying: playing }),
			setCurrentIndex: (index) => set({ currentIndex: index }),
			setVolume: (volume) =>
				set({
					volume: Math.min(100, Math.max(0, volume)),
					userAdjustedVolume: true,
				}),
			applyDefaultVolume: (volume) =>
				set((state) =>
					state.userAdjustedVolume
						? state
						: { volume: Math.min(100, Math.max(0, volume)) },
				),
			togglePlaylist: () =>
				set((state) => ({ showPlaylist: !state.showPlaylist })),
		}),
		{
			name: "music-player-storage",
			// 열림/재생 상태는 세션적 — 볼륨·조절 여부·마지막 곡만 저장
			partialize: (state) => ({
				volume: state.volume,
				userAdjustedVolume: state.userAdjustedVolume,
				currentIndex: state.currentIndex,
			}),
		},
	),
);
