import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MessageCircle } from "lucide-react";

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
	};
	detailQuery?: string;
}

export default function ItemListWithImage({
	data,
	detailQuery = "",
}: ItemListProps) {
	const { onClickMoveToPage } = useMoveToPage();
	const [imageError, setImageError] = useState(false);
	const hasThumbnail =
		Boolean(data.thumbnail) &&
		!imageError &&
		!data.thumbnail?.includes("example.com");
	const detailPath = `/library/${data.slug || data.id}${detailQuery}`;

	return (
		<article
			className={cn(
				"group relative bg-card border-card rounded-card backdrop-blur-card",
				"flex items-stretch justify-between gap-6 cursor-pointer",
				"overflow-hidden"
			)}
			style={{ transition: "all 0.3s ease-out" }}
			onClick={onClickMoveToPage(detailPath)}
		>
			{/* 왼쪽 컨텐츠 영역 */}
			<div className="flex flex-col min-w-0 p-5 h-full justify-between">
				{/* 제목, 부제목, 태그 */}
				<div className="flex flex-col justify-between h-full">
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
							<h3
								className={cn(
									"text-lg font-semibold text-main-text leading-tight",
									"line-clamp-2 group-hover:text-theme-primary"
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
					<div>
						<div className="mt-2 flex items-center gap-2 text-xs text-sub-text">
							{data.author && (
								<span className="font-medium text-main-text">
									{data.author}
								</span>
							)}
							<span className="text-border">•</span>
							<span className="inline-flex items-center gap-1">
								<MessageCircle className="w-4 h-4" aria-hidden="true" />
							</span>
							<span className="text-border">•</span>
							<time className="text-xs text-sub-text font-medium tracking-wide">
								{dateConvert(data.createdAt)}
							</time>
						</div>
						{/* 태그 */}
						{data.tags?.length > 0 && (
							<div className="flex flex-wrap gap-2 pt-1 mt-1.5">
								{data.tags.slice(0, 3).map((tag, index) => (
									<Badge
										key={index}
										variant="secondary"
										className={cn(
											"px-2.5 text-xs font-medium rounded-full",
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
								{data.tags.length > 3 && (
									<Badge
										variant="outline"
										className="px-2.5 text-xs font-medium rounded-full text-sub-text"
									>
										+{data.tags.length - 3}
									</Badge>
								)}
							</div>
						)}
					</div>
				</div>
				{/* 작성자, 댓글 아이콘, 날짜 */}
			</div>
			<div className="h-full">
				{/* 오른쪽 이미지 영역 */}
				{hasThumbnail ? (
					<Image
						src={data.thumbnail}
						alt={data.title}
						width={240}
						height={100}
						className="h-full w-full object-cover mask-l-from-80%"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="h-full min-w-60 mask-l-from-80%" />
				)}
			</div>
		</article>
	);
}
