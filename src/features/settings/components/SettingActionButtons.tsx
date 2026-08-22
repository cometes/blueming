"use client";

import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

/** 설정 헤더에 들어가는 저장 버튼 (useSettingHeaderAction과 함께 사용) */
export function SettingSaveButton({
	formId,
	disabled,
}: {
	formId: string;
	disabled: boolean;
}) {
	return (
		<Button
			type="submit"
			form={formId}
			variant="ghost"
			size="icon"
			disabled={disabled}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{ transition: "all 0.3s ease-in-out" }}
		>
			<Save size={16} />
		</Button>
	);
}

/** 설정 화면 하단의 초기화 버튼 블록 */
export function SettingResetButton({ onClick }: { onClick: () => void }) {
	return (
		<div className="flex justify-end gap-3 pt-6">
			<Button
				type="button"
				onClick={onClick}
				className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
				style={{ transition: "all 0.3s ease-in-out" }}
			>
				초기화하기
			</Button>
			{/* 저장 버튼은 헤더로 이동 */}
		</div>
	);
}
