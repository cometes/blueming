import { Dialog, DialogContent } from "@/components/ui/dialog";
import { type PhotoBoardPost } from "@/data/photoboard";
import {
	ChevronLeft,
	ChevronRight,
	MoreHorizontal,
	Heart,
	MessageCircle,
	Repeat2,
	Share2,
	Bookmark,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PhotoboardDetailModalProps {
	post: PhotoBoardPost | null;
	isOpen: boolean;
	onClose: () => void;
	onNext?: () => void;
	onPrev?: () => void;
	hasNext?: boolean;
	hasPrev?: boolean;
}

const getInitial = (value: string) => value.trim().charAt(0).toUpperCase();

export default function PhotoboardDetailModal({
	post,
	isOpen,
	onClose,
	onNext,
	onPrev,
	hasNext,
	hasPrev,
}: PhotoboardDetailModalProps) {
	if (!post) return null;

	const formatAbsoluteDate = (iso: string) => {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return "";
		return date.toLocaleString("ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			{/* Close Button on top right of the screen if needed, but Dialog usually has one or backdrop click */}

			{/* Arrow Navigation */}
			<DialogContent
				showCloseButton={false}
				className="max-w-3xl md:max-w-3xl w-full bg-card border-card rounded-r-none rounded-l-none md:rounded-card backdrop-blur-card p-0 overflow-visible"
			>
				{hasPrev && (
					<button
						data-photoboard-nav="prev"
						onClick={(e) => {
							e.stopPropagation();
							onPrev?.();
						}}
						className="absolute left-2 md:-left-16 top-1/2 -translate-y-1/2 z-[51] text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full p-2"
						aria-label="이전 게시글"
					>
						<ChevronLeft size={32} />
					</button>
				)}

				{hasNext && (
					<button
						data-photoboard-nav="next"
						onClick={(e) => {
							e.stopPropagation();
							onNext?.();
						}}
						className="absolute right-2 md:-right-16 top-1/2 -translate-y-1/2 z-[51] text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full p-2"
						aria-label="다음 게시글"
					>
						<ChevronRight size={32} />
					</button>
				)}

				<div className="flex flex-col md:flex-row gap-0 w-full h-full overflow-hidden">
					{/* Left: Image Area (55%) */}
					<div className="w-full md:w-[60%] h-[40vh] md:h-full  flex items-center justify-center relative">
						{post.imageUrl && (
							<div className="relative w-full h-full">
								<Image
									src={post.imageUrl}
									alt={post.caption}
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, 60vw"
									priority
								/>
							</div>
						)}
					</div>

					{/* Right: Content Area (45%) */}
					<div className="w-full md:w-[40%] h-full flex flex-col bg-card">
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b border-card-border">
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 rounded-full overflow-hidden border border-card-border bg-card-bg flex items-center justify-center">
									{post.author?.avatarUrl ? (
										<Image
											src={post.author.avatarUrl}
											alt={post.author.name}
											width={32}
											height={32}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-xs font-semibold text-sub-text">
											{getInitial(post.author?.name || "G")}
										</span>
									)}
								</div>
								<div className="flex flex-col">
									<span className="text-sm font-semibold text-main-text hover:underline cursor-pointer">
										{post.author?.name || "게스트"}
									</span>
								</div>
							</div>
							<Button variant="ghost" size="icon" className="text-main-text">
								<MoreHorizontal size={20} />
							</Button>
						</div>

						{/* Body: Scrollable Content */}
						<ScrollArea className="flex-1">
							<div className="p-4">
								{/* Caption Section */}
								<div className="mb-6">
									<div className="text-sm text-main-text whitespace-pre-wrap">
										{post.caption}
									</div>
									<div className="flex flex-wrap gap-2 mt-3">
										{post.tags?.map((tag) => (
											<span
												key={`${post.id}-tag-${tag}`}
												className="text-blue-500 text-sm hover:underline cursor-pointer"
											>
												#{tag}
											</span>
										))}
									</div>
									<div className="mt-2 text-xs text-sub-text">
										{formatAbsoluteDate(post.createdAt)}
									</div>
								</div>

								{/* Comments Placeholder */}
								<div className="border-t border-card-border pt-4">
									<p className="text-sm text-sub-text text-center py-8">
										댓글 기능이 곧 추가될 예정입니다.
									</p>
								</div>
							</div>
						</ScrollArea>

						{/* Footer: Actions */}
						<div className="p-4 border-t border-card-border bg-card">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-4">
									<button className="text-main-text hover:text-gray-500 transition-colors">
										<Heart size={24} />
									</button>
									<button className="text-main-text hover:text-gray-500 transition-colors">
										<MessageCircle size={24} />
									</button>
									<button className="text-main-text hover:text-gray-500 transition-colors">
										<Repeat2 size={24} />
									</button>
									<button className="text-main-text hover:text-gray-500 transition-colors">
										<Share2 size={24} />
									</button>
								</div>
								<button className="text-main-text hover:text-gray-500 transition-colors">
									<Bookmark size={24} />
								</button>
							</div>
							<div className="text-sm font-semibold text-main-text">
								좋아요 {post.likeCount.toLocaleString()}개
							</div>
							<div className="text-[10px] text-sub-text uppercase mt-1">
								{formatAbsoluteDate(post.createdAt)}
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
