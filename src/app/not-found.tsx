import Link from "next/link";

/** 존재하지 않는 경로 — 루트 레이아웃(테마·메뉴) 안에서 렌더링된다 */
export default function NotFound() {
	return (
		<div className="flex min-h-[calc(100dvh-180px)] w-full max-w-xl mx-auto mt-[90px] mb-[40px] items-center justify-center px-4">
			<section className="bg-card rounded-card border-card backdrop-blur-card flex flex-col items-center gap-3 px-6 py-16 text-center">
				<p className="text-5xl font-semibold font-title text-theme-primary">
					404
				</p>
				<h1 className="text-lg font-semibold font-title text-main-text">
					페이지를 찾을 수 없어요
				</h1>
				<p className="text-sm text-sub-text">
					주소가 잘못되었거나, 삭제된 페이지일 수 있어요.
				</p>
				<Link
					href="/"
					className="mt-3 rounded-full bg-theme-primary px-5 py-2 text-sm text-white transition-opacity hover:opacity-90"
				>
					홈으로 돌아가기
				</Link>
			</section>
		</div>
	);
}
