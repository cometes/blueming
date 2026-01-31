import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { CircleSlash, MessageCircle, Lock } from "lucide-react";

interface ItemListProps {
	data: {
		id: string;
		title: string;
		subtitle?: string;
		author?: string;
		slug?: string;
		createdAt: string;
		tags?: string[];
		thumbnail?: string;
		pinned?: boolean;
		commentCount?: number;
		allow?: "all" | "password" | "secret";
	};
	detailQuery?: string;
}

export default function ItemList({ data, detailQuery = "" }: ItemListProps) {
	const { onClickMoveToPage } = useMoveToPage();
	const detailPath = `/library/${data.slug || data.id}${detailQuery}`;
	const hasComments = (data.commentCount ?? 0) > 0;
	const metaItems: ReactNode[] = [];
	if (data.author) {
		metaItems.push(
			<span key="author" className="font-medium text-main-text">
				{data.author}
			</span>
		);
	}
	if (hasComments) {
		metaItems.push(
			<span key="comments" className="inline-flex items-center gap-1">
				<MessageCircle className="w-4 h-4" aria-hidden="true" />
				<span>{data.commentCount}</span>
			</span>
		);
	}
	metaItems.push(
		<time
			key="date"
			className="text-xs text-sub-text font-medium tracking-wide"
		>
			{dateConvert(data.createdAt)}
		</time>
	);

	return (
		<article
			className={cn(
				"group relative p-5 bg-card border-card rounded-card backdrop-blur-card",
				"flex items-center gap-6 cursor-pointer"
			)}
			style={{ transition: "all 0.3s ease-out" }}
			onClick={onClickMoveToPage(detailPath)}
		>
			{/* 왼쪽 컨텐츠 영역 */}
			<div className="w-full">
				<div>
					{/* 제목과 날짜 */}
					<div>
						<div className="flex items-center gap-2">
							{data.pinned && (
								<Badge
									variant="secondary"
									className="px-2 text-[10px] rounded-full bg-theme-primary/10 text-theme-primary border-theme-primary/20"
								>
									고정
								</Badge>
							)}
							{data.allow === "password" && (
								<Lock size={14} className="text-sub-text shrink-0" />
							)}
							{data.allow === "secret" && (
								<CircleSlash size={14} className="text-sub-text shrink-0" />
							)}
							<h3
								className={cn(
									"text-lg font-semibold text-main-text leading-tight",
									"line-clamp-1 md:line-clamp-2 group-hover:text-theme-primary font-title"
								)}
								style={{ transition: "color 0.2s ease-out" }}
							>
								{data.title}
							</h3>
						</div>
						{/* 부제목 */}
						{data.subtitle && (
							<p className="text-sub-text leading-relaxed line-clamp-2 text-sm">
								{data.subtitle}
							</p>
						)}
					</div>
					<div className="mt-2 flex items-center gap-2 text-xs text-sub-text">
						{metaItems.map((item, index) => (
							<Fragment key={index}>
								{index > 0 ? <span className="text-border">•</span> : null}
								{item}
							</Fragment>
						))}
					</div>

					{/* 태그 */}
					{data.tags?.length > 0 && (
						<div className="flex flex-wrap gap-2 pt-1 mt-1.5">
							{data.tags.slice(0, 2).map((tag, index) => (
								<Badge
									key={index}
									variant="secondary"
									className={cn(
										"px-2.5 text-xs font-medium rounded-full md:hidden",
										"bg-theme-primary/10 text-theme-primary border-theme-primary/20",
										"hover:bg-theme-primary/20"
									)}
									style={{
										transition:
											"background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out",
									}}
								>
									{tag}
								</Badge>
							))}
							{data.tags.slice(0, 3).map((tag, index) => (
								<Badge
									key={`md-${index}`}
									variant="secondary"
									className={cn(
										"px-2.5 text-xs font-medium rounded-full hidden md:inline-flex",
										"bg-theme-primary/10 text-theme-primary border-theme-primary/20",
										"hover:bg-theme-primary/20"
									)}
									style={{
										transition:
											"background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out",
									}}
								>
									{tag}
								</Badge>
							))}
							{data.tags.length > 2 && (
								<Badge
									variant="outline"
									className="px-2.5 text-xs font-medium rounded-full text-sub-text md:hidden"
								>
									+{data.tags.length - 2}
								</Badge>
							)}
							{data.tags.length > 3 && (
								<Badge
									variant="outline"
									className="px-2.5 text-xs font-medium rounded-full text-sub-text hidden md:inline-flex"
								>
									+{data.tags.length - 3}
								</Badge>
							)}
						</div>
					)}
				</div>
			</div>
		</article>
	);
}
