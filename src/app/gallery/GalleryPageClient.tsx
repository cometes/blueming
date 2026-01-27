"use client";

import dynamic from "next/dynamic";

function GallerySkeleton() {
	return (
		<div className="shrink-0 w-full max-w-2xl mt-[90px] mb-[40px] mx-auto">
			<header className="mb-10 flex items-center justify-center">
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<div className="w-[150px]" />
					<div className="w-full sm:w-[200px]">
						<div className="h-10 bg-card animate-pulse rounded-card" />
					</div>
					<div className="h-10 w-10 bg-card animate-pulse rounded-full" />
					<div className="h-10 w-24 bg-card animate-pulse rounded-card" />
				</div>
			</header>

			<section>
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{Array.from({ length: 12 }).map((_, index) => (
						<div
							key={index}
							className="aspect-square bg-card animate-pulse rounded-card"
						/>
					))}
				</div>
			</section>
		</div>
	);
}

const GalleryClient = dynamic(() => import("./GalleryClient"), {
	ssr: false,
	loading: () => <GallerySkeleton />,
});

export default function GalleryPageClient() {
	return <GalleryClient />;
}
