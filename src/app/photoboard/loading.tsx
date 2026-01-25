import { Skeleton } from "@/components/ui/skeleton";

export default function PhotoboardLoading() {
	return (
		<div className="shrink-0 w-full max-w-2xl mt-[90px] mb-[40px] mx-auto">
			<header className="mb-10 flex items-center justify-center">
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<div className="w-[150px]" />
					<div className="w-full sm:w-[200px]">
						<Skeleton className="h-10 w-full rounded-card" />
					</div>
					<Skeleton className="h-10 w-10 rounded-full" />
					<Skeleton className="h-10 w-24 rounded-full" />
				</div>
			</header>
			<div className="columns-1 sm:columns-2 lg:columns-3 gap-2">
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={`photoboard-loading-${index}`}
						className="mb-6 break-inside-avoid rounded-card border-card bg-card-bg overflow-hidden"
					>
						<div className="px-4 py-3 flex items-center gap-3">
							<Skeleton className="w-9 h-9 rounded-full" />
							<div className="space-y-2">
								<Skeleton className="h-3 w-24 rounded-full" />
								<Skeleton className="h-2 w-16 rounded-full" />
							</div>
						</div>
						<Skeleton className="w-full aspect-[4/3] rounded-none" />
						<div className="px-4 py-4 space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-4 rounded-full" />
									<Skeleton className="h-4 w-4 rounded-full" />
									<Skeleton className="h-4 w-4 rounded-full" />
									<Skeleton className="h-4 w-4 rounded-full" />
								</div>
								<Skeleton className="h-4 w-4 rounded-full" />
							</div>
							<Skeleton className="h-3 w-24 rounded-full" />
							<div className="space-y-2">
								<Skeleton className="h-3 w-full rounded-full" />
								<Skeleton className="h-3 w-4/5 rounded-full" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
