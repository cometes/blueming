import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Lock } from "lucide-react";

interface ItemGalleryProps {
	data: {
		id: string;
		title: string;
		slug?: string;
		createdAt: string;
		tags?: string[];
		thumbnail?: string;
		pinned?: boolean;
		allow?: "all" | "password" | "secret";
	};
	detailQuery?: string;
}

export default function ItemGallery({
	data,
	detailQuery = "",
}: ItemGalleryProps) {
	const { onClickMoveToPage } = useMoveToPage();
	const [imageError, setImageError] = useState(false);
	const hasThumbnail =
		Boolean(data.thumbnail) &&
		!imageError &&
		!data.thumbnail?.includes("example.com");
	const detailPath = `/library/${data.slug || data.id}${detailQuery}`;

	return (
		<div
			className="GalleryWrap group relative w-full backdrop-blur-card bg-card border-card rounded-card cursor-pointer overflow-hidden hover:shadow-card hover:translate-y-card aspect-square"
			style={{ transition: "all 0.2s ease-in-out" }}
			onClick={onClickMoveToPage(detailPath)}
		>
			{data.pinned && (
				<span className="absolute top-3 left-3 z-20 px-2 py-0.5 text-[10px] rounded-full bg-theme-primary/80 text-white">
					고정
				</span>
			)}
			<div
				className={cn(
					"GalleryBox data h-full py-3 px-4 flex flex-col justify-end relative z-10 opacity-0 invisible translate-y-4",
					"group-hover:opacity-100 group-hover:visible group-hover:translate-y-0",
					"before:absolute before:top-0 before:left-0 before:w-full before:h-full before:opacity-80 before:bg-gradient-to-t before:from-black/90 before:via-black/50 before:to-transparent"
				)}
				style={{ transition: "all 0.3s ease-in-out" }}
			>
				<div className="GalleryTitleBox flex justify-between items-center relative z-20">
					<div className="min-w-0 flex items-center gap-2">
						{data.allow === "password" && (
							<Lock size={14} className="text-white shrink-0" />
						)}
						<p className="GalleryTitle text-lg font-medium break-keep overflow-hidden text-ellipsis text-white">
							{data.title}
						</p>
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
										"hover:bg-theme-primary/20"
									)}
									style={{
										transition:
											"background-color 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s ease-in-out",
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
			<div className="ImageBox absolute top-0 left-0 w-full h-full">
				{hasThumbnail ? (
					<Image
						alt="썸네일"
						src={data.thumbnail}
						layout="fill"
						objectFit={"cover"}
						onError={() => setImageError(true)}
					/>
				) : null}
			</div>
		</div>
	);
}
