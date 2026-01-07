import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Fallback from "@/components/common/Fallback";
import AdminOnly from "@/components/common/AdminOnly";
import { Pin } from "lucide-react";

interface ItemGalleryProps {
	data: {
		id: string;
		title: string;
		slug?: string;
		createdAt: string;
		tags?: string[];
		thumbnail?: string;
		pinned?: boolean;
	};
	onTogglePin?: (id: string, nextPinned: boolean) => void;
}

export default function ItemGallery({ data, onTogglePin }: ItemGalleryProps) {
	const { onClickMoveToPage } = useMoveToPage();
	const [imageError, setImageError] = useState(false);

	return (
		<div
			className="GalleryWrap group relative w-full backdrop-blur-card bg-card border-card rounded-card cursor-pointer overflow-hidden transition-all duration-200 ease-in-out hover:shadow-card hover:translate-y-card aspect-square"
			onClick={onClickMoveToPage(`/library/${data.id}`)}
		>
			{data.pinned && (
				<span className="absolute top-3 left-3 z-20 px-2 py-0.5 text-[10px] rounded-full bg-theme-primary/80 text-white">
					고정
				</span>
			)}
			<AdminOnly>
				{onTogglePin && (
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							onTogglePin(data.id, !data.pinned);
						}}
						className={cn(
							"absolute top-3 right-3 z-20 w-8 h-8 rounded-full border border-white/30 flex items-center justify-center backdrop-blur",
							data.pinned
								? "bg-theme-primary/70 text-white"
								: "bg-black/40 text-white/70 hover:text-white"
						)}
						aria-label="고정 토글"
					>
						<Pin size={14} />
					</button>
				)}
			</AdminOnly>
			<div
				className={cn(
					"GalleryBox data h-full py-3 px-4 flex flex-col justify-end relative z-10 opacity-0 invisible translate-y-4 transition-all duration-300 ease-in-out",
					"group-hover:opacity-100 group-hover:visible group-hover:translate-y-0",
					"before:absolute before:top-0 before:left-0 before:w-full before:h-full before:opacity-80 before:bg-gradient-to-t before:from-black/90 before:via-black/50 before:to-transparent"
				)}
			>
				<div className="GalleryTitleBox flex justify-between items-center relative z-20">
					<div className="min-w-0">
						<p className="GalleryTitle text-lg font-medium break-keep overflow-hidden text-ellipsis text-white">
							{data.title}
						</p>
						{data.slug && (
							<p className="text-xs text-white/70 font-mono mt-0.5">
								/{data.slug}
							</p>
						)}
					</div>
					<span className="GalleryDate block ml-2 whitespace-nowrap text-gray-500 text-sm">
						{dateConvert(data.createdAt)}
					</span>
				</div>
				<div className="GalleryTagBox mt-2 z-20">
					{/* 태그 */}
					{data.tags?.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-1.5">
							{data.tags.slice(0, 3).map((tag, index) => (
								<Badge
									key={index}
									variant="secondary"
									className={cn(
										" text-xs font-medium rounded-full",
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
			</div>
			<div className="ImageBox absolute top-0 left-0 w-full h-full">
				{data.thumbnail && !imageError ? (
					<Image
						alt="썸네일"
						src={data.thumbnail}
						layout="fill"
						objectFit={"cover"}
						onError={() => setImageError(true)}
					/>
				) : (
					<Fallback />
				)}
			</div>
		</div>
	);
}
