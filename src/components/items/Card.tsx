import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import { convertToUnderscore } from "@/lib/replace";
import Image from "next/image";
import { useState } from "react";

export default function ItemCard(props) {
	const { onClickMoveToPage } = useMoveToPage();
	const [imageError, setImageError] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const thumbnailUrl = props.data.lastUpdatedThumbnail;
	const hasThumbnail =
		Boolean(thumbnailUrl) &&
		!imageError &&
		!thumbnailUrl.includes("example.com");

	return (
		<div>
			<div
				className="SeriesImageBox group aspect-[4/3] bg-card relative rounded-card overflow-hidden shadow-sm hover:shadow-md cursor-pointer"
				style={{ transition: "box-shadow 200ms ease-in-out" }}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={onClickMoveToPage(
					`/library/series/${convertToUnderscore(props.data.series)}/`
				)}
			>
				{hasThumbnail ? (
					<Image
						alt="시리즈 썸네일"
						src={thumbnailUrl}
						layout="fill"
						objectFit={"cover"}
						style={{
							transition: "transform 200ms ease-in-out",
							transform: isHovered ? "scale(1.05)" : "scale(1)",
						}}
						onError={() => setImageError(true)}
					/>
				) : null}
			</div>
			<div
				className="SeriesBox p-3 cursor-pointer"
				onClick={onClickMoveToPage(
					`/library/series/${convertToUnderscore(props.data.series)}/`
				)}
			>
				<div className="flex items-center justify-between">
					<p className="SeriesTitle font-semibold text-lg font-title">
						{props.data.series}
					</p>

					<span className="text-sm font-title">
						{props.data.postLength}개의 포스트
					</span>
				</div>

				<span className="text-xs md:text-sm text-sub-text before:content-'·' mt-1">
					마지막 업데이트 {dateConvert(props.data.lastUpdatedDate)}
				</span>
			</div>
		</div>
	);
}
