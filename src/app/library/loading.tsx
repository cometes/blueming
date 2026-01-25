import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
	return (
		<div className="shrink-0 w-full max-w-3xl mt-[90px] mb-[40px]">
			<div className="flex justify-center items-center gap-2.5">
				<Skeleton className="h-10 w-24 rounded-card" />
				<Skeleton className="h-10 w-60 rounded-card" />
				<Skeleton className="h-10 w-10 rounded-full" />
				<Skeleton className="h-10 w-28 rounded-full" />
			</div>
			<div className="w-fit mx-auto mt-7">
				<div className="flex justify-center">
					<Skeleton className="h-10 w-44 rounded-card" />
				</div>
				<Skeleton className="h-0.5 w-44 mt-2 rounded-full" />
			</div>
			<div className="mt-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-16" />
				</div>
				<div className="mt-3 flex flex-col min-h-[520px] gap-4">
					{Array.from({ length: 6 }).map((_, index) => (
						<Skeleton
							key={`library-loading-${index}`}
							className="h-16 w-full rounded-card"
						/>
					))}
				</div>
			</div>
		</div>
	);
}
