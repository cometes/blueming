"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import RadioItem from "@/components/items/RadioItem";
import { useSettingEffect } from "@/hooks/useSettingEffect";
import dynamic from "next/dynamic";

// Dynamically import effects with SSR disabled
const SnowEffect = dynamic(() => import("@/components/effects/SnowEffect"), {
	ssr: false,
});
const RainEffect = dynamic(() => import("@/components/effects/RainEffect"), {
	ssr: false,
});
const MeteorEffect = dynamic(
	() => import("@/components/effects/MeteorEffect"),
	{ ssr: false }
);
const StarryEffect = dynamic(
	() => import("@/components/effects/StarryEffect"),
	{ ssr: false }
);
const PrismEffect = dynamic(() => import("@/components/effects/PrismEffect"), {
	ssr: false,
});
const FireflyEffect = dynamic(
	() => import("@/components/effects/FireflyEffect"),
	{ ssr: false }
);
const UnderwaterEffect = dynamic(
	() => import("@/components/effects/UnderwaterEffect"),
	{ ssr: false }
);
const RainWindowEffect = dynamic(
	() => import("@/components/effects/RainWindowEffect"),
	{ ssr: false }
);
const CinemaEffect = dynamic(
	() => import("@/components/effects/CinemaEffect"),
	{ ssr: false }
);

export default function EffectSettingClient() {
	const {
		effectTypes,
		currentEffectType,
		setCurrentEffectType,
		effectSetting,
		updateEffectSetting,
		handleReset,
		handleSave,
	} = useSettingEffect();

	const [showResetConfirm, setShowResetConfirm] = useState(false);
	const [showPreview, setShowPreview] = useState(true);

	// Render preview effect based on current selection
	const renderPreviewEffect = () => {
		if (!showPreview || currentEffectType === "없음") {
			return null;
		}

		switch (currentEffectType) {
			case "눈":
				return <SnowEffect />;
			case "비":
				return <RainEffect />;
			case "별똥별":
				return <MeteorEffect />;
			case "밤하늘":
				return <StarryEffect />;
			case "프리즘":
				return <PrismEffect />;
			case "반딧불이":
				return <FireflyEffect />;
			case "수중":
				return <UnderwaterEffect />;
			case "빗물창문":
				return <RainWindowEffect />;
			case "영화관":
				return <CinemaEffect />;
			default:
				return null;
		}
	};

	const confirmReset = () => {
		handleReset();
		setShowResetConfirm(false);
	};

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSave();
	};

	return (
		<>
			{/* Preview Effect */}
			{renderPreviewEffect()}

			<form onSubmit={onSubmit} className="space-y-8">
				{/* 배경 이펙트 설정 Section */}
				<section>
					<h2 className="text-[20px] font-semibold">배경 이펙트 설정</h2>
					<div className="section-wrap mt-6">
						{/* 이펙트 활성화 */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px]">
								<h3 className="font-medium text-sub-text">이펙트 활성화</h3>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									배경 이펙트를 켜거나 끌 수 있습니다.
								</p>
							</div>
							<div className="flex items-center gap-3">
								<Switch
									checked={effectSetting.enabled}
									onCheckedChange={(checked) => {
										updateEffectSetting("enabled", checked);
									}}
								/>
								<span className="text-sm text-sub-text">
									{effectSetting.enabled ? "켜짐" : "꺼짐"}
								</span>
							</div>
						</div>

						{/* 미리보기 토글 */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px]">
								<h3 className="font-medium text-sub-text">미리보기</h3>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									선택한 이펙트를 미리 볼 수 있습니다.
								</p>
							</div>
							<div className="flex items-center gap-3">
								<Switch
									checked={showPreview}
									onCheckedChange={setShowPreview}
								/>
								<span className="text-sm text-sub-text">
									{showPreview ? "켜짐" : "꺼짐"}
								</span>
							</div>
						</div>

						{/* 이펙트 타입 */}
						<div className="section-box flex items-start mt-4">
							<div className="text-box w-[220px] pr-5 relative">
								<h3 className="font-medium text-sub-text">이펙트 타입</h3>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									원하는 배경 이펙트를 선택하세요.
								</p>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 flex-1">
								{effectTypes.map((type) => (
									<RadioItem
										key={type}
										onClickRadio={() => setCurrentEffectType(type)}
										checked={currentEffectType === type}
										content={type}
									/>
								))}
							</div>
						</div>

						{/* 이펙트 정보 */}
						{currentEffectType !== "없음" && (
							<div className="section-box flex items-center mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
								<div className="text-sm text-blue-700 dark:text-blue-300">
									{showPreview ? (
										<>
											👁️ <strong>{currentEffectType}</strong> 이펙트를 미리보기
											중입니다. 저장하면 모든 페이지에 적용됩니다.
										</>
									) : (
										<>
											💡 <strong>{currentEffectType}</strong> 이펙트를
											선택했습니다. 미리보기를 켜서 확인해보세요.
										</>
									)}
								</div>
							</div>
						)}
					</div>
				</section>

				{/* Submit Buttons */}
				<div className="flex justify-end gap-3 pt-6">
					{/* Simple Reset Confirmation */}
					{showResetConfirm ? (
						<div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
							<span className="text-sm text-red-700 dark:text-red-300">
								정말 초기화할까요?
							</span>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={confirmReset}
							>
								O
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setShowResetConfirm(false)}
							>
								X
							</Button>
						</div>
					) : (
						<Button
							type="button"
							variant="destructive"
							onClick={() => setShowResetConfirm(true)}
						>
							초기화하기
						</Button>
					)}

					<Button type="submit">저장하기</Button>
				</div>
			</form>
		</>
	);
}
