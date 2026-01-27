import { Suspense } from "react";
import GalleryClient from "./GalleryClient";

function GallerySkeleton() {
	return (
		<div className="w-full min-h-screen bg-background">
			<header className="text-center py-10">
				<div className="h-10 w-32 bg-card-bg animate-pulse mx-auto rounded" />
				<div className="h-5 w-48 bg-card-bg animate-pulse mx-auto mt-2 rounded" />
			</header>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
				{Array.from({ length: 12 }).map((_, index) => (
					<div
						key={index}
						className="aspect-square bg-card-bg animate-pulse rounded-lg"
					/>
				))}
			</div>
		</div>
	);
}

export default function GalleryPage() {
	return (
		<Suspense fallback={<GallerySkeleton />}>
			<GalleryClient />
		</Suspense>
	);
}
