import dynamic from "next/dynamic";

const StarrySky = dynamic(() => import("../components/StarrySky"), {
  ssr: false // ✅ 서버사이드 렌더링 비활성화
});

export default function Home() {
  return <StarrySky />;
}
