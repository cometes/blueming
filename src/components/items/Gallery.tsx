import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Fallback from "@/components/common/Fallback";

export default function ItemGallery(props) {
	const { onClickMoveToPage } = useMoveToPage();
	const [imageError, setImageError] = useState(false);

	return (
		<div
			className="GalleryWrap group relative w-full backdrop-blur-card bg-card border-card rounded-card cursor-pointer overflow-hidden transition-all duration-200 ease-in-out hover:shadow-card hover:translate-y-card aspect-square"
			onClick={onClickMoveToPage(`/library/${props.data.id}`)}
		>
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
							{props.data.title}
						</p>
						{props.data.slug && (
							<p className="text-xs text-white/70 font-mono mt-0.5">
								/{props.data.slug}
							</p>
						)}
					</div>
					<span className="GalleryDate block ml-2 whitespace-nowrap text-gray-500 text-sm">
						{dateConvert(props.data.createdAt)}
					</span>
				</div>
				<div className="GalleryTagBox mt-2 z-20">
					{/* 태그 */}
					{props.data.tags?.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-1.5">
							{props.data.tags.slice(0, 3).map((tag, index) => (
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
							{props.data.tags.length > 3 && (
								<Badge
									variant="outline"
									className="px-3 py-1 text-xs font-medium rounded-full text-sub-text"
								>
									+{props.data.tags.length - 3}
								</Badge>
							)}
						</div>
					)}
				</div>
			</div>
			<div className="ImageBox absolute top-0 left-0 w-full h-full">
				{props.data.thumbnail && !imageError ? (
					<Image
						alt="썸네일"
						src={props.data.thumbnail}
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
