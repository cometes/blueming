"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import RadioItem from "@/components/items/RadioItem";
import { useSettingEffect } from "@/hooks/useSettingEffect";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export default function EffectSettingClient() {
	const {
		effectTypes,
		currentEffectType,
		setCurrentEffectType,
		effectSetting,
		updateEffectSetting,
		handleReset,
		handleSave,
		isDirty,
	} = useSettingEffect();

	const [showResetDialog, setShowResetDialog] = useState(false);
	useSettingStatus("effect", isDirty ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-effect"
			variant="ghost"
			size="icon"
			disabled={!isDirty}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{
				transition: "all 0.3s ease-in-out",
			}}
		>
			<Save size={16} />
		</Button>,
		[isDirty]
	);

	const handleResetConfirm = () => {
		handleReset();
		setShowResetDialog(false);
	};

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSave();
	};

	return (
		<>
			<form id="setting-form-effect" onSubmit={onSubmit} className="space-y-8">
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

						{/* 이펙트 타입 */}
						<div className="section-box flex items-start mt-4">
							<div className="text-box w-[220px] pr-5 relative">
								<h3 className="font-medium text-sub-text">이펙트 타입</h3>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									원하는 배경 이펙트를 선택하세요.
								</p>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 flex-1">
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
						{currentEffectType !== "없음" && effectSetting.enabled && (
							<div className="section-box flex items-center mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
								<div className="text-sm text-blue-700 dark:text-blue-300">
									👁️ <strong>{currentEffectType}</strong> 이펙트를 실시간으로 확인할 수 있습니다. 저장하면 모든 페이지에 적용됩니다.
								</div>
							</div>
						)}
					</div>
				</section>

				{/* Submit Buttons */}
				<div className="flex justify-end gap-3 pt-6">
					<Button
						type="button"
						onClick={() => setShowResetDialog(true)}
						className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
						style={{
							transition: "all 0.3s ease-in-out",
						}}
					>
						초기화하기
					</Button>

					{/* 저장 버튼은 헤더로 이동 */}
				</div>

				<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
					<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
						<DialogHeader>
							<DialogTitle>이펙트 초기화</DialogTitle>
							<DialogDescription>
								정말 이펙트 설정을 초기화할까요? 모든 설정이 기본값으로 돌아갑니다.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowResetDialog(false)}
								className="rounded-card border-card bg-card-bg"
							>
								취소
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={handleResetConfirm}
								className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
								style={{
									transition: "all 0.3s ease-in-out",
								}}
							>
								초기화
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</form>
		</>
	);
}
