"use client";

import type React from "react";
import { useState } from "react";
import type { CreateMetaValue } from "@/features/library/components/CreateModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeSlug } from "@/shared/lib/slug";
import { cn } from "@/shared/lib/utils";
import { Ban, Eye, EyeOff, Globe, Lock, Plus, X } from "lucide-react";

interface CreateMetaSummarySectionProps {
	value: CreateMetaValue;
	onChange: (next: CreateMetaValue) => void;
	maxTags: number;
	shouldShowPasswordError: boolean;
	slugManuallyEdited: boolean;
	setSlugManuallyEdited: (value: boolean) => void;
	setPasswordTouched: (value: boolean) => void;
	toggleTag: (tag: string) => void;
	openTagPanel: () => void;
	openSeriesPanel: () => void;
}

/** 라이브러리 출간 모달 우측의 기본 화면: 공개 설정 / URL / 태그·시리즈 요약 */
export default function CreateMetaSummarySection({
	value,
	onChange,
	maxTags,
	shouldShowPasswordError,
	slugManuallyEdited,
	setSlugManuallyEdited,
	setPasswordTouched,
	toggleTag,
	openTagPanel,
	openSeriesPanel,
}: CreateMetaSummarySectionProps) {
	const [showPassword, setShowPassword] = useState(false);

	const visibilityButton = (
		visibility: CreateMetaValue["visibility"],
		icon: React.ReactNode,
		label: string,
		clearPassword: boolean,
	) => (
		<Button
			type="button"
			variant="outline"
			onClick={() =>
				onChange({
					...value,
					visibility,
					...(clearPassword ? { password: "" } : {}),
				})
			}
			className={cn(
				"flex-1 h-9 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
				value.visibility === visibility
					? "bg-theme-primary text-white border-2 border-theme-primary"
					: "border-2 border-card"
			)}
			style={{ transition: "all 0.3s ease-in-out" }}
		>
			{icon}
			{label}
		</Button>
	);

	return (
		<section className="space-y-6">
			<div>
				<h3 className="text-xl font-semibold text-main-text mb-4 font-title">
					공개 설정
				</h3>
				<div className="flex gap-2">
					{visibilityButton("all", <Globe size={16} />, "전체 공개", true)}
					{visibilityButton("password", <Lock size={16} />, "보호글", false)}
					{visibilityButton("secret", <Ban size={16} />, "비공개", true)}
				</div>
				{value.visibility === "password" && (
					<div className="relative mt-3">
						<Input
							type="text"
							placeholder="비밀번호를 입력하세요"
							style={
								showPassword
									? undefined
									: ({ WebkitTextSecurity: "disc" } as React.CSSProperties)
							}
							value={value.password ?? ""}
							onChange={(event) =>
								onChange({
									...value,
									password: event.target.value,
								})
							}
							onBlur={() => setPasswordTouched(true)}
							className={cn(
								"pr-10 bg-card border-card rounded-card",
								shouldShowPasswordError &&
									"border-red-400 focus-visible:ring-red-400"
							)}
						/>
						<button
							type="button"
							onClick={() => setShowPassword((prev) => !prev)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-sub-text hover:text-main-text"
							tabIndex={-1}
						>
							{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
						</button>
					</div>
				)}
				{shouldShowPasswordError && (
					<p className="text-xs text-red-400 mt-1">비밀번호를 입력해주세요</p>
				)}
			</div>

			<div>
				<h3 className="text-xl font-semibold text-main-text mb-4 font-title">
					URL 설정
				</h3>
				<Input
					type="text"
					placeholder="제목 기반으로 자동 생성됩니다"
					value={value.slug ?? ""}
					onChange={(event) => {
						setSlugManuallyEdited(true);
						onChange({
							...value,
							slug: event.target.value,
						});
					}}
					onBlur={(event) => {
						onChange({
							...value,
							slug: normalizeSlug(event.target.value),
						});
					}}
					className="bg-card border-card rounded-card"
				/>
				<p className="text-xs text-sub-text mt-2">
					/@cometes/
					{normalizeSlug(value.slug || "") || "auto-generated-slug"}
				</p>
				<p className="text-xs text-theme-primary/70 mt-1">
					{!slugManuallyEdited && value.slug
						? "💡 제목을 변경하면 URL도 자동으로 변경됩니다"
						: "✏️ 직접 수정한 URL은 제목 변경 시에도 유지됩니다"}
				</p>
			</div>

			<div>
				<h3 className="text-xl font-semibold text-main-text mb-4 font-title">
					태그 설정
				</h3>
				<div className="space-y-3">
					{value.tags.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{value.tags.map((tag) => (
								<div
									key={tag}
									className="px-3 py-1.5 rounded-full text-xs font-medium bg-theme-primary/10 text-theme-primary border border-theme-primary/20 flex items-center gap-1.5"
								>
									{tag}
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => toggleTag(tag)}
										className="h-5 w-5 rounded-full hover:bg-theme-primary/20"
									>
										<X size={12} />
									</Button>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-sub-text">태그를 추가해주세요 (최대 6개)</p>
					)}

					<Button
						type="button"
						variant="outline"
						onClick={openTagPanel}
						disabled={value.tags.length >= maxTags}
						className="w-full h-9 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
						style={{ transition: "all 0.3s ease-in-out" }}
					>
						<Plus size={16} className="mr-2" />
						태그 추가 ({value.tags.length}/{maxTags})
					</Button>
				</div>
			</div>

			<div>
				<h3 className="text-xl font-semibold text-main-text mb-4 font-title">
					시리즈 설정
				</h3>
				{value.series ? (
					<div className="space-y-2">
						<div className="px-3 py-2 rounded-card bg-theme-primary/10 border border-theme-primary text-theme-primary flex justify-between items-center">
							<strong>{value.series}</strong>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() =>
									onChange({
										...value,
										series: "",
									})
								}
								className="text-theme-primary hover:bg-theme-primary/20 h-8 w-8"
							>
								<X size={16} />
							</Button>
						</div>
					</div>
				) : (
					<Button
						type="button"
						variant="outline"
						onClick={openSeriesPanel}
						className="w-full h-9 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
						style={{ transition: "all 0.3s ease-in-out" }}
					>
						시리즈에 추가하기
					</Button>
				)}
			</div>
		</section>
	);
}
