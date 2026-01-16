import { notFound } from "next/navigation";
import MemoDetailClient from "./MemoDetailClient";
import { dummyMemos } from "../dummyData";

interface MemoDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function MemoDetailPage({ params }: MemoDetailPageProps) {
	const { id } = await params;
	const memo = dummyMemos.find((m) => m.id === id);

	if (!memo) {
		notFound();
	}

	return <MemoDetailClient memo={memo} />;
}
