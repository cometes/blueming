"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";

interface CreateSeriesSectionProps {
	normalizedSeries: string[];
	selectedSeries: string;
	onSelectSeries: (series: string) => void;
	seriesInputOpen: boolean;
	setSeriesInputOpen: (open: boolean) => void;
	seriesInput: string;
	setSeriesInput: (value: string) => void;
	handleAddSeries: () => void;
	closeSeriesPanel: () => void;
}

/** 라이브러리 출간 모달 우측의 시리즈 선택·생성 화면 */
export default function CreateSeriesSection({
	normalizedSeries,
	selectedSeries,
	onSelectSeries,
	seriesInputOpen,
	setSeriesInputOpen,
	seriesInput,
	setSeriesInput,
	handleAddSeries,
	closeSeriesPanel,
}: CreateSeriesSectionProps) {
	return (
		<section className="space-y-6">
			<h3 className="text-xl font-semibold text-main-text font-title">
				시리즈 설정
			</h3>
			{seriesInputOpen ? (
				<div className="space-y-3">
					<Input
						type="text"
						placeholder="새로운 시리즈 이름을 입력하세요"
						value={seriesInput}
						onChange={(event) => setSeriesInput(event.target.value)}
						className="bg-card border-card rounded-card"
					/>
					<div className="text-sm text-sub-text">
						/series/{seriesInput || "slug"}
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setSeriesInputOpen(false);
								setSeriesInput("");
							}}
						>
							취소
						</Button>
						<Button
							type="button"
							onClick={() => {
								handleAddSeries();
								setSeriesInputOpen(false);
								closeSeriesPanel();
							}}
							className="bg-theme-primary hover:bg-theme-primary/90"
						>
							시리즈 추가
						</Button>
					</div>
				</div>
			) : (
				<div className="space-y-3">
					{normalizedSeries.length > 0 ? (
						<ScrollArea className="h-64 pr-4">
							<ul className="space-y-2">
								{normalizedSeries.map((series) => (
									<li key={series}>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												onSelectSeries(series);
												closeSeriesPanel();
											}}
											className={cn(
												"w-full text-left px-3 py-2 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
												selectedSeries === series
													? "bg-theme-primary/10 border-theme-primary text-theme-primary"
													: "border border-card"
											)}
											style={{ transition: "all 0.3s ease-in-out" }}
										>
											{series}
										</Button>
									</li>
								))}
							</ul>
						</ScrollArea>
					) : (
						<p className="text-sm text-sub-text">등록된 시리즈가 없습니다.</p>
					)}
					<Button
						type="button"
						variant="default"
						className="w-full"
						onClick={() => setSeriesInputOpen(true)}
					>
						새 시리즈 만들기
					</Button>
				</div>
			)}
		</section>
	);
}
