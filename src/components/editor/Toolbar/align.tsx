import React from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Transforms, Element as SlateElement, Editor } from "slate";
import { AlignCenter, AlignLeft, AlignRight, AlignJustify } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AlignButtonProps, AlignOption, IconComponent } from "./types";
import { CustomEditor, CustomElement, AlignType } from "../../../types/slate";

const AlignButton: React.FC<AlignButtonProps> = () => {
	const editor = useSlate();

	const alignToIcon: Record<AlignType, IconComponent> = {
		left: AlignLeft,
		center: AlignCenter,
		right: AlignRight,
		justify: AlignJustify,
	};

	const getCurrentAlign = (): AlignType => {
		const { selection } = editor;
		if (!selection) return "left";

		const [match] = Editor.nodes(editor, {
			match: (n) =>
				SlateElement.isElement(n) &&
				(n.type === "list-item" ||
					n.type === "paragraph" ||
					n.type === "image" ||
					n.type === "heading-one" ||
					n.type === "heading-two" ||
					n.type === "button" ||
					n.type === "video"),
			mode: "lowest",
		});

		if (match && match[0] && SlateElement.isElement(match[0])) {
			const element = match[0] as CustomElement;
			return element.align || "left";
		}

		return "left";
	};

	const currentAlign = getCurrentAlign();

	const toggleAlign = (align: AlignType) => {
		const { selection } = editor;
		if (!selection) return;

		const [match] = Editor.nodes(editor, {
			match: (n) =>
				SlateElement.isElement(n) &&
				(n.type === "list-item" ||
					n.type === "paragraph" ||
					n.type === "image" ||
					n.type === "heading-one" ||
					n.type === "heading-two" ||
					n.type === "button" ||
					n.type === "video"),
			mode: "lowest",
		});

		if (match) {
			Transforms.setNodes(
				editor,
				{ align },
				{
					at: match[1],
				}
			);
		}
	};

	const alignOptions: AlignOption[] = [
		{ key: "left", icon: AlignLeft, label: "왼쪽 정렬" },
		{ key: "center", icon: AlignCenter, label: "가운데 정렬" },
		{ key: "right", icon: AlignRight, label: "오른쪽 정렬" },
		{ key: "justify", icon: AlignJustify, label: "양쪽 정렬" },
	];

	const CurrentIcon = alignToIcon[currentAlign] || AlignLeft;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"w-8 h-8 p-0 hover:bg-muted",
						currentAlign !== "left" && "bg-muted"
					)}
					onMouseDown={(event) => {
						event.preventDefault(); // 기본 동작 방지
						ReactEditor.focus(editor);
					}}
				>
					<CurrentIcon
						size={16}
						className={cn(
							"text-muted-foreground",
							currentAlign !== "left" && "text-foreground"
						)}
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-36">
				{alignOptions.map(({ key, icon: Icon, label }) => (
					<DropdownMenuItem
						key={key}
						className={cn(
							"flex items-center gap-2 cursor-pointer",
							currentAlign === key && "bg-muted"
						)}
						onSelect={(event) => {
							event.preventDefault();
							ReactEditor.focus(editor);
							toggleAlign(key);
						}}
					>
						<Icon size={16} className="text-muted-foreground" />
						<span>{label}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default AlignButton;
