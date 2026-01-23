import { generateHTML } from "@tiptap/html";
import { extensions as tiptapExtensions } from "@/components/editor/TiptapEditor";

type RichTextNode = {
	type?: string;
	text?: string;
	children?: RichTextNode[];
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	code?: boolean;
	backgroundColor?: string;
	color?: string;
	fontSize?: number | string;
	url?: string;
	align?: string;
	width?: number;
	height?: number;
};

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const escapeUrl = (value?: string) => {
	if (!value) return "";
	const trimmed = value.trim();
	if (/^(https?:)?\/\//i.test(trimmed)) {
		return escapeHtml(trimmed);
	}
	return "";
};

const renderTextNode = (node: RichTextNode) => {
	const content = escapeHtml(node.text ?? "");
	const styles: string[] = [];

	if (node.color) styles.push(`color:${node.color}`);
	if (node.backgroundColor)
		styles.push(`background-color:${node.backgroundColor}`);
	if (node.fontSize) {
		const sizeValue =
			typeof node.fontSize === "number" ? `${node.fontSize}px` : node.fontSize;
		styles.push(`font-size:${sizeValue}`);
	}

	let wrapped = styles.length
		? `<span style="${styles.join(";")}">${content}</span>`
		: content;

	if (node.code) wrapped = `<code>${wrapped}</code>`;
	if (node.underline) wrapped = `<u>${wrapped}</u>`;
	if (node.italic) wrapped = `<em>${wrapped}</em>`;
	if (node.bold) wrapped = `<strong>${wrapped}</strong>`;

	return wrapped;
};

const renderChildren = (children: RichTextNode[] = []) =>
	children.map(renderNode).join("");

const normalizeAlign = (align?: string) => {
	if (!align) return "left";
	const allowed = ["left", "center", "right", "justify"];
	return allowed.includes(align) ? align : "left";
};

const renderNode = (node: RichTextNode | null | undefined): string => {
	if (!node) return "";
	if (typeof node.text === "string") return renderTextNode(node);

	const children = renderChildren(node.children);

	switch (node.type) {
		case "heading-one":
			return `<h1>${children}</h1>`;
		case "heading-two":
			return `<h2>${children}</h2>`;
		case "bulleted-list":
			return `<ul>${children}</ul>`;
		case "list-item":
			return `<li>${children}</li>`;
		case "quote":
			return `<blockquote>${children}</blockquote>`;
		case "code":
			return `<pre><code>${children}</code></pre>`;
		case "image": {
			const src = escapeUrl(node.url);
			if (!src) return children;

			const styleParts: string[] = ["max-width:100%"];
			if (node.width) styleParts.push(`width:${node.width}px`);
			if (node.height) styleParts.push(`height:${node.height}px`);

			return `<figure style="text-align:${normalizeAlign(
				node.align
			)};"><img src="${src}" alt="" style="${styleParts.join(
				";"
			)}" />${children}</figure>`;
		}
		case "video": {
			const src = escapeUrl(node.url);
			if (!src) return children;

			return `<div class="rich-video" style="text-align:${normalizeAlign(
				node.align
			)};"><iframe src="${src}" allowfullscreen loading="lazy"></iframe>${children}</div>`;
		}
		case "button": {
			const href = escapeUrl(node.url);
			if (!href) return children;
			const label = children || href;
			return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
		}
		case "paragraph":
		default:
			return `<p>${children}</p>`;
	}
};

const isTiptapDoc = (content: unknown) => {
	if (!content || typeof content !== "object") return false;
	const doc = content as { type?: unknown; content?: unknown };
	return doc.type === "doc" && Array.isArray(doc.content);
};


export const renderRichText = (content: unknown): string => {
	if (!content) return "";

	// 이미 HTML 문자열인 경우 그대로 반환
	if (typeof content === "string") {
		const trimmed = content.trim();
		if (!trimmed) return "";

		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				return renderChildren(parsed as RichTextNode[]);
			}
			if (isTiptapDoc(parsed)) {
				return generateHTML(
					parsed as Record<string, unknown>,
					tiptapExtensions
				);
			}
		} catch {
			return trimmed;
		}
	}

	if (Array.isArray(content)) {
		return renderChildren(content as RichTextNode[]);
	}

	if (isTiptapDoc(content)) {
		return generateHTML(
			content as Record<string, unknown>,
			tiptapExtensions
		);
	}

	return "";
};

export const isRichTextEmpty = (html: string) =>
	html.replace(/<[^>]+>/g, "").trim().length === 0;
