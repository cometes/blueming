import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * 문서 마지막이 이미지/동영상 같은 블록 노드로 끝나면 빈 문단을 자동으로 붙인다.
 * 없으면 마지막 이미지 뒤에 텍스트 커서를 놓을 곳이 없어 이어서 쓸 수 없다.
 */
export const TrailingNode = Extension.create({
	name: "trailingNode",

	addProseMirrorPlugins() {
		const key = new PluginKey(this.name);
		return [
			new Plugin({
				key,
				appendTransaction: (_transactions, _oldState, newState) => {
					const { doc, tr, schema } = newState;
					const paragraph = schema.nodes.paragraph;
					if (!paragraph) return;
					const lastNode = doc.lastChild;
					if (!lastNode || lastNode.type.name === "paragraph") return;
					return tr.insert(doc.content.size, paragraph.create());
				},
			}),
		];
	},
});

export default TrailingNode;
