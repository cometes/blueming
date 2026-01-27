"use client";

import dynamic from "next/dynamic";

function GallerySkeleton() {
	return (
		<div className="w-full min-h-screen bg-background">
			<div className="mx-auto w-full max-w-[1400px] p-6 mt-10">
				<header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<div className="h-3 w-24 bg-card-bg animate-pulse rounded" />
						<div className="h-8 w-40 bg-card-bg animate-pulse rounded mt-3" />
						<div className="h-4 w-60 bg-card-bg animate-pulse rounded mt-2" />
					</div>
					<div className="h-10 w-10 bg-card-bg animate-pulse rounded-card" />
				</header>

				<section className="mt-8 rounded-card border-card bg-card p-4 sm:p-6">
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
						{Array.from({ length: 12 }).map((_, index) => (
							<div
								key={index}
								className="aspect-square bg-card-bg animate-pulse rounded-card"
							/>
						))}
					</div>
				</section>
			</div>
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
