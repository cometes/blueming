/**
 * Convert Slate JSON format to Tiptap HTML format
 * This is a simple converter that handles basic text and paragraphs
 */

interface SlateNode {
	type?: string;
	text?: string;
	children?: SlateNode[];
	[key: string]: any;
}

export const convertSlateToHTML = (slateNodes: SlateNode[]): string => {
	if (!Array.isArray(slateNodes) || slateNodes.length === 0) {
		return "<p></p>";
	}

	try {
		const convertNode = (node: SlateNode): string => {
			// Text node
			if (node.text !== undefined) {
				let text = node.text || "";

				// Apply text formatting
				if (node.bold) text = `<strong>${text}</strong>`;
				if (node.italic) text = `<em>${text}</em>`;
				if (node.underline) text = `<u>${text}</u>`;
				if (node.code) text = `<code>${text}</code>`;

				return text;
			}

			// Element node with children
			if (node.children) {
				const childrenHTML = node.children.map(convertNode).join("");

				switch (node.type) {
					case "paragraph":
						return `<p>${childrenHTML}</p>`;
					case "heading-one":
						return `<h1>${childrenHTML}</h1>`;
					case "heading-two":
						return `<h2>${childrenHTML}</h2>`;
					case "heading-three":
						return `<h3>${childrenHTML}</h3>`;
					case "heading-four":
						return `<h4>${childrenHTML}</h4>`;
					case "heading-five":
						return `<h5>${childrenHTML}</h5>`;
					case "heading-six":
						return `<h6>${childrenHTML}</h6>`;
					case "block-quote":
						return `<blockquote>${childrenHTML}</blockquote>`;
					case "bulleted-list":
						return `<ul>${childrenHTML}</ul>`;
					case "numbered-list":
						return `<ol>${childrenHTML}</ol>`;
					case "list-item":
						return `<li>${childrenHTML}</li>`;
					case "code-block":
						return `<pre><code>${childrenHTML}</code></pre>`;
					case "link":
						return `<a href="${node.url || "#"}">${childrenHTML}</a>`;
					default:
						return childrenHTML || "<p></p>";
				}
			}

			return "";
		};

		const html = slateNodes.map(convertNode).join("");
		return html || "<p></p>";
	} catch (error) {
		console.error("Slate to HTML conversion error:", error);
		return "<p></p>";
	}
};

/**
 * Try to detect if content is Slate JSON format
 */
export const isSlateFormat = (content: string): boolean => {
	try {
		const parsed = JSON.parse(content);
		return (
			Array.isArray(parsed) &&
			parsed.length > 0 &&
			(parsed[0].type !== undefined || parsed[0].children !== undefined)
		);
	} catch {
		return false;
	}
};
