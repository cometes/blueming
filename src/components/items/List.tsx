import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ItemListProps {
	data: {
		id: string;
		title: string;
		subtitle?: string;
		createdAt: string;
		tags: string[];
		thumbnail?: string;
	};
}

export default function ItemList({ data }: ItemListProps) {
	const { onClickMoveToPage } = useMoveToPage();

	return (
		<article
			className={cn(
				"group relative px-6 py-5 bg-card border-card rounded-card backdrop-blur-card",
				"flex items-center gap-6 cursor-pointer",
				"transition-all duration-300 ease-out"
			)}
			onClick={onClickMoveToPage(`/library/${data.id}`)}
		>
			{/* 왼쪽 컨텐츠 영역 */}
			<div className="flex min-w-0 items-center justify-between w-full">
				<div>
					{/* 제목과 날짜 */}
					<div>
						<h3
							className={cn(
								"text-lg font-semibold text-main-text leading-tight",
								"line-clamp-2 group-hover:text-theme-primary transition-colors duration-200"
							)}
						>
							{data.title}
						</h3>
						{/* 부제목 */}
						{data.subtitle && (
							<p className="text-sub-text leading-relaxed line-clamp-2 text-base">
								{data.subtitle}
							</p>
						)}
					</div>
					{/* 태그 */}
					{data.tags?.length > 0 && (
						<div className="flex flex-wrap gap-2 pt-1 mt-1.5">
							{data.tags.slice(0, 3).map((tag, index) => (
								<Badge
									key={index}
									variant="secondary"
									className={cn(
										"px-3 text-xs font-medium rounded-full",
										"bg-theme-primary/10 text-theme-primary border-theme-primary/20",
										"hover:bg-theme-primary/20 transition-colors duration-200"
									)}
								>
									{tag}
								</Badge>
							))}
							{data.tags.length > 3 && (
								<Badge
									variant="outline"
									className="px-3 py-1 text-xs font-medium rounded-full text-sub-text"
								>
									+{data.tags.length - 3}
								</Badge>
							)}
						</div>
					)}
				</div>

				<time className="text-sm text-sub-text font-medium tracking-wide">
					{dateConvert(data.createdAt)}
				</time>
			</div>
		</article>
	);
}
