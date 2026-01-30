import MemoDetailClient from "./MemoDetailClient";

interface MemoDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function MemoDetailPage({ params }: MemoDetailPageProps) {
	const { id } = await params;
	return <MemoDetailClient memoId={id} />;
}
