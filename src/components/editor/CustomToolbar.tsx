// import * as S from "./style";
// import H1Button from "../../../common/editor/customToolbar/h1";
// import H2Button from "../../../common/editor/customToolbar/h2";
// import BoldButton from "../../../common/editor/customToolbar/bold";
// import ItalicButton from "../../../common/editor/customToolbar/italic";
// import UnderlineButton from "../../../common/editor/customToolbar/underline";
// import ColorButton from "../../../common/editor/customToolbar/color";
// import BackgroundColorButton from "../../../common/editor/customToolbar/background";
// import BroomButton from "../../../common/editor/customToolbar/broom";
// import QuoteButton from "../../../common/editor/customToolbar/quote";
// import CodeButton from "../../../common/editor/customToolbar/code";
// import ImageButton from "../../../common/editor/customToolbar/image";
// import BulletListButton from "../../../common/editor/customToolbar/bulletList";
// import AlignButton from "../../../common/editor/customToolbar/align";
// import SizeButton from "../../../common/editor/customToolbar/size";
// import LinkButton from "../../../common/editor/customToolbar/link";
// import YoutubeButton from "../../../common/editor/customToolbar/youtube";

import AlignButton from "./Toolbar/align";
import BackgroundColorButton from "./Toolbar/backgroundColor";
import BoldButton from "./Toolbar/bold";
import BroomButton from "./Toolbar/broom";
import BulletListButton from "./Toolbar/bulletList";
import CodeButton from "./Toolbar/code";
import H1Button from "./Toolbar/h1";
import H2Button from "./Toolbar/h2";
import ImageButton from "./Toolbar/image";
import ItalicButton from "./Toolbar/italic";
import QuoteButton from "./Toolbar/quote";
import TextColorButton from "./Toolbar/textColor";
import UnderlineButton from "./Toolbar/underline";
import YoutubeButton from "./Toolbar/video";

interface CustomToolbarProps {
	currentAlign?: string;
	setCurrentAlign?: (align: string) => void;
}

export default function CustomToolbar(props: CustomToolbarProps) {
	return (
		<div className="flex items-center gap-4">
			{/* <SizeButton /> */}
			<H1Button />
			<H2Button />
			<AlignButton
				currentAlign={props.currentAlign}
				setCurrentAlign={props.setCurrentAlign}
			/>
			<BoldButton />
			<ItalicButton />
			<UnderlineButton />
			<TextColorButton />
			<BackgroundColorButton />
			<BulletListButton />
			<BroomButton />
			<QuoteButton />
			<CodeButton />
			<ImageButton />
			<YoutubeButton />
			{/* <LinkButton /> */}
		</div>
	);
}
