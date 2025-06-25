import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function ItemList(props) {
	const { onClickMoveToPage } = useMoveToPage();

	return (
		<div
			className="ListWrap p-5 pl-7 bg-card border-card rounded-card backdrop-blur-card flex justify-between items-center cursor-pointer transition-all duration-200 ease-in-out hover:shadow-card hover:border-card-active hover:traslate-y-card"
			onClick={onClickMoveToPage(`/library/${props.data.id}`)}
		>
			<div className="ListDataWrap">
				<div className="ListDataBox h-[90px] flex flex-col justify-between">
					<div>
						<p className="ListTitle text-3xl font-medium break-keep overflow-hidden text-ellipsis">
							{props.data.title}
						</p>
						<span className="ListDate block whitespace-nowrap text-sub-text text-sm mt-1.5">
							{dateConvert(props.data.createdAt)}
						</span>
						<p>{props.data.subtitle}</p>
					</div>
					<div className="ListTagBox flex">
						{props.data.tags.map((tag, index) => (
							<Badge
								key={index}
								style={{
									height: 26,
									fontSize: 14,
									display: "flex",
									alignItems: "center",
								}}
							>
								{tag}
							</Badge>
						))}
					</div>
				</div>
			</div>
			<div className="ListImageBox aspect-[4.5 / 3] h-[120px] border-card rounded-card relative overflow-hidden cursor-pointer">
				{props.data.thumbnail ? (
					<Image
						alt="이미지"
						src={props.data.thumbnail}
						layout="fill"
						objectFit={"cover"}
						className="transition-all duration-200 ease-in-out hover:scale-[1.1]"
					/>
				) : (
					// <Fallback />
					<></>
				)}
			</div>
		</div>
	);
}
