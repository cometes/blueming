"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** 비공개 메모 안내 */
export function MemoSecretGate() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
			<div className="w-16 h-16 rounded-full bg-card border border-card flex items-center justify-center">
				<Lock size={24} className="text-sub-text" />
			</div>
			<h2 className="mt-4 text-lg font-semibold text-main-text">
				비공개 메모입니다.
			</h2>
			<p className="text-sm text-sub-text mt-2">
				작성자와 관리자만 열람할 수 있습니다.
			</p>
		</div>
	);
}

interface MemoPasswordGateProps {
	password: string;
	onPasswordChange: (value: string) => void;
	passwordError: string;
	isVerifying: boolean;
	onVerify: () => void;
}

/** 보호 메모 비밀번호 입력 */
export function MemoPasswordGate({
	password,
	onPasswordChange,
	passwordError,
	isVerifying,
	onVerify,
}: MemoPasswordGateProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
			<div className="w-16 h-16 rounded-full bg-card border border-card flex items-center justify-center">
				<Lock size={24} className="text-sub-text" />
			</div>
			<h2 className="mt-4 text-lg font-semibold text-main-text">
				보호된 메모입니다.
			</h2>
			<p className="text-sm text-sub-text mt-2">
				비밀번호를 입력하면 내용을 볼 수 있어요.
			</p>
			<div className="mt-4 flex items-center gap-2">
				<Input
					type="password"
					value={password}
					onChange={(e) => onPasswordChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onVerify();
						}
					}}
					placeholder="비밀번호"
					className="w-48"
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
