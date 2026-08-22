"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProtectedContentGateProps {
	passwordInput: string;
	onPasswordInputChange: (value: string) => void;
	passwordError: string;
	isVerifying: boolean;
	onVerify: () => void;
}

/** 보호글 수정 시 내용 로드를 위한 비밀번호 입력 박스 */
export default function ProtectedContentGate({
	passwordInput,
	onPasswordInputChange,
	passwordError,
	isVerifying,
	onVerify,
}: ProtectedContentGateProps) {
	return (
		<div className="mb-6 p-4 rounded-card border-card bg-card-bg">
			<p className="text-main-text text-sm">
				보호글입니다. 비밀번호를 입력하면 내용을 불러옵니다.
			</p>
			<div className="mt-3 flex items-center gap-2">
				<Input
					type="password"
					value={passwordInput}
					onChange={(e) => onPasswordInputChange(e.target.value)}
					placeholder="비밀번호를 입력해주세요."
					className="flex-1"
				/>
				<Button type="button" onClick={onVerify} disabled={isVerifying}>
					확인
				</Button>
			</div>
			{passwordError && (
				<p className="mt-2 text-xs text-red-500">{passwordError}</p>
			)}
		</div>
	);
}
