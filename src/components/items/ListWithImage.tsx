import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Fallback from "@/components/common/Fallback";
import { useState } from "react";
import AdminOnly from "@/components/common/AdminOnly";
import { Pin } from "lucide-react";

interface ItemListProps {
	data: {
		id: string;
		title: string;
		subtitle?: string;
		slug?: string;
		createdAt: string;
		tags?: string[];
		thumbnail?: string;
		pinned?: boolean;
	};
	onTogglePin?: (id: string, nextPinned: boolean) => void;
}

export default function ItemListWithImage({
	data,
	onTogglePin,
}: ItemListProps) {
	const { onClickMoveToPage } = useMoveToPage();
	const [imageError, setImageError] = useState(false);

	return (
		<article
			className={cn(
				"group relative bg-card border-card rounded-card backdrop-blur-card",
				"flex items-stretch justify-between gap-6 cursor-pointer",
				"transition-all duration-300 ease-out overflow-hidden"
			)}
			onClick={onClickMoveToPage(`/library/${data.id}`)}
		>
			{/* 왼쪽 컨텐츠 영역 */}
			<div className="flex flex-col min-w-0 px-6 py-5 h-full justify-between">
				{/* 제목과 부제목과 태그 */}
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
								"line-clamp-2 group-hover:text-theme-primary transition-colors duration-200"
							)}
						>
							{data.title}
						</h3>
					</div>
					{/* 부제목 */}
					{data.subtitle && (
						<p className="text-sub-text leading-relaxed line-clamp-2 text-base">
							{data.subtitle}
						</p>
					)}
					{data.slug && (
						<p className="text-xs text-sub-text/70 font-mono mt-1">
							/{data.slug}
						</p>
					)}
					{/* 태그 */}
					{data.tags?.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-1.5">
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
				<time className="text-sm text-sub-text font-medium tracking-wide mt-3">
					{dateConvert(data.createdAt)}
				</time>
			</div>
			<AdminOnly>
				{onTogglePin && (
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							onTogglePin(data.id, !data.pinned);
						}}
						className={cn(
							"absolute top-3 right-3 w-8 h-8 rounded-full border border-card flex items-center justify-center",
							data.pinned
								? "bg-theme-primary/15 text-theme-primary"
								: "bg-card text-sub-text hover:text-theme-primary"
						)}
						aria-label="고정 토글"
					>
						<Pin size={14} />
					</button>
				)}
			</AdminOnly>
			<div className="h-full">
				{/* 오른쪽 이미지 영역 */}
				{data.thumbnail && !imageError ? (
					<Image
						src={data.thumbnail}
						alt={data.title}
						width={240}
						height={100}
						className="h-full w-full object-cover mask-l-from-80%"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="h-full min-w-60 mask-l-from-80%">
						<Fallback />
					</div>
				)}
			</div>
		</article>
	);
}
