import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import { convertToUnderscore } from "@/lib/replace";
import Image from "next/image";
import { useState } from "react";
import Fallback from "@/components/common/Fallback";

export default function ItemCard(props) {
	const { onClickMoveToPage } = useMoveToPage();
	const [imageError, setImageError] = useState(false);

	return (
		<div>
			<div
				className="SeriesImageBox aspect-[4/3] bg-card relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out cursor-pointer"
				onClick={onClickMoveToPage(
					`/library/series/${convertToUnderscore(props.data.series)}/`
				)}
			>
				{props.data.thumbnail && !imageError ? (
					<Image
						alt="시리즈 썸네일"
						src={props.data.lastUpdatedThumbnail}
						layout="fill"
						objectFit={"cover"}
						onError={() => setImageError(true)}
					/>
				) : (
					<Fallback />
				)}
			</div>
			<div
				className="SeriesBox p-3 cursor-pointer"
				onClick={onClickMoveToPage(
					`/library/series/${convertToUnderscore(props.data.series)}/`
				)}
			>
				<div className="flex items-center justify-between">
					<p className="SeriesTitle font-semibold text-lg">
						{props.data.series}
					</p>

					<span className="text-sm">{props.data.postLength}개의 포스트</span>
				</div>

				<span className="text-sm text-sub-text before:content-'·' mt-1">
					마지막 업데이트 {dateConvert(props.data.lastUpdatedDate)}
				</span>
			</div>
		</div>
	);
}
