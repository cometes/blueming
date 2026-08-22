"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 접근 확인 중 스피너 */
export function DetailLoadingState() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh]">
			<div
				className="w-10 h-10 rounded-full border-2 border-card-border border-t-theme-primary animate-spin"
				aria-label="로딩 중"
			/>
		</div>
	);
}

/** 비공개 게시글 안내 화면 */
export function DetailSecretGate({ onBackToList }: { onBackToList: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh]">
			<div className="flex flex-col items-center gap-6 w-full max-w-md">
				<div className="w-20 h-20 rounded-full bg-card-bg border-2 border-card flex items-center justify-center">
					<Lock size={30} className="text-sub-text" />
				</div>
				<div className="text-center">
					<h2 className="text-2xl font-semibold text-main-text mb-2">
						비공개 게시글입니다.
					</h2>
					<p className="text-sub-text">작성자와 관리자만 열람할 수 있습니다.</p>
				</div>
				<Button variant="default" onClick={onBackToList} className="mt-10">
					목록으로
				</Button>
			</div>
		</div>
	);
}

interface DetailPasswordGateProps {
	password: string;
	onPasswordChange: (value: string) => void;
	passwordError: string;
	onVerify: () => void;
	onBackToList: () => void;
}

/** 보호 게시글 비밀번호 입력 화면 */
export function DetailPasswordGate({
	password,
	onPasswordChange,
	passwordError,
	onVerify,
	onBackToList,
}: DetailPasswordGateProps) {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh]">
			<div className="flex flex-col items-center gap-6 w-full max-w-md">
				<div className="w-20 h-20 rounded-full bg-card-bg border-2 border-card flex items-center justify-center">
					<Lock size={30} className="text-sub-text" />
				</div>
				<div className="text-center">
					<h2 className="text-2xl font-semibold text-main-text mb-2">
						보호된 게시글입니다.
					</h2>
					<p className="text-sub-text">
						게시글 열람을 위해서 비밀번호를 입력해 주세요.
					</p>
				</div>
				<div className="w-full flex flex-col gap-3">
					<div className="flex items-center gap-2 justify-center">
						<div className="relative">
							<input
								type="text"
								value={password}
								onChange={(e) => onPasswordChange(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.nativeEvent.isComposing) {
										onVerify();
									}
								}}
								placeholder="비밀번호를 입력해주세요."
								style={
									showPassword
										? undefined
										: ({ WebkitTextSecurity: "disc" } as React.CSSProperties)
								}
								className="w-46 pr-9 rounded-card border-card bg-card-bg px-3 py-2 text-sm text-main-text focus:outline-none focus:ring-0 focus:border-theme-primary"
							/>
							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-sub-text hover:text-main-text"
								tabIndex={-1}
							>
								{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
							</button>
						</div>
						<Button variant="default" onClick={onVerify}>
							확인
						</Button>
					</div>
					{passwordError && (
						<p className="text-sm text-red-500 text-center">{passwordError}</p>
					)}
				</div>
				<Button variant="default" onClick={onBackToList} className="mt-10">
					목록으로
				</Button>
			</div>
		</div>
	);
}
