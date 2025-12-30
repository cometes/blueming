import { useState, useCallback, useMemo } from "react";
import { createEditor, Transforms } from "slate";
import { Editor, Element as SlateElement } from "slate";
import { withReact, ReactEditor } from "slate-react";
import withVideo from "./editor/UseWithVideo";
import { withInlines } from "./editor/UseWithInline";
import { withImages } from "./editor/UseWithImage";
import { withHistory } from "slate-history";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Leaf from "@/components/editor/Leaf";
import Element from "@/components/editor/Element";
import axios from "axios";
import { schemaCreate } from "@/lib/schema";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useCreatePost = (seriesData, tagsData, isModalOpen) => {
	const initialValue = [
		{
			type: "paragraph",
			children: [{ text: "" }],
		},
	];

	const seriesArr = seriesData?.map((el) => {
		return {
			value: el.series,
			label: el.series,
		};
	});

	const tagsArr = tagsData?.map((el) => {
		return {
			value: el,
			label: el,
		};
	});

	const editor = useMemo(() => {
		return withVideo(
			withInlines(withImages(withHistory(withReact(createEditor()))))
		);
	}, []);

	const [currentAlign, setCurrentAlign] = useState("left");
	const [popupOpen, setPopupOpen] = useState(false);
	const [subOpen, setSubOpen] = useState(false);

	const router = useRouter();

	const renderLeaf = useCallback((props) => {
		return <Leaf {...props} />;
	}, []);

	const renderElement = useCallback((props) => {
		return <Element {...props} />;
	}, []);

	// 선택된 블록의 정렬 상태를 가져오는 함수
	const updateCurrentAlign = () => {
		const [match] = Array.from(
			Editor.nodes(editor, {
				match: (n) => SlateElement.isElement(n),
				mode: "lowest",
			})
		);

		setCurrentAlign(match?.[0]?.align || "left");
	};

	const handlePopoverOpenChange = (visible: boolean) => {
		// Popover는 Modal이 열려있지 않을 때만 외부 클릭에 반응
		if (!isModalOpen) {
			setPopupOpen(visible);
		}
	};

	// 드롭 이벤트 핸들러
	const handleDrop = async (event) => {
		event.preventDefault();
		const files = event.dataTransfer.files; // 드래그앤드랍된 파일 가져오기

		if (files && files[0] && files[0].type.startsWith("image/")) {
			const dropFile = files[0];

			try {
				// 파일을 FormData로 준비
				const formData = new FormData();

				// 파일명 인코딩 처리
				const sanitizedFileName = encodeURIComponent(dropFile.name);

				// Blob 객체 생성 시 filename 옵션 사용
				const file = new File([dropFile], sanitizedFileName, {
					type: dropFile.type,
				});
				formData.append("file", file);

				// API 요청 (post 메서드)
				const response = await axios.post(
					"https://api-w5buphcleq-du.a.run.app/images/uploadImage",
					formData,
					{
						headers: {
							"Content-Type": "multipart/form-data",
						},
					}
				);

				const url = response.data.file.url; // API가 반환한 이미지 URL
				if (url) {
					insertImage(url); // 반환된 URL로 이미지 삽입
				}
			} catch (error) {}
		}
	};

	// 이미지 삽입 함수
	const insertImage = (url) => {
		const imageNode = {
			type: "image",
			url,
			align: currentAlign,
			children: [{ text: "" }], // 이미지 노드의 자식은 비어 있는 텍스트
		};

		// 이미지 노드 삽입
		Transforms.insertNodes(editor, imageNode);

		// 이미지 아래 빈 줄 추가 여부 검사
		const { selection } = editor;
		if (selection) {
			const currentPath = selection.anchor.path;

			// 현재 노드가 이미지가 아니라면 빈 줄 추가
			const [currentNode] = Editor.node(editor, currentPath);
			if (currentNode.type !== "paragraph") {
				const paragraphNode = {
					type: "paragraph",
					align: currentAlign,
					children: [{ text: "" }], // 빈 줄로 사용할 노드
				};
				Transforms.insertNodes(editor, paragraphNode);
			}

			// 커서를 새로 삽입한 빈 줄로 이동
			const lastPath = Editor.path(editor, []);
			Transforms.select(editor, Editor.end(editor, lastPath));
		}

		ReactEditor.focus(editor);
	};

	const getContent = (value) => {
		if (editor.selection) {
			updateCurrentAlign(); // 커서 이동 시 정렬 상태 업데이트
		}

		const content = JSON.stringify(value);
		setValue(
			"content",
			content === '[{"type":"paragraph","children":[{"text":""}]}]'
				? ""
				: content
		);
	};

	const { register, setValue, trigger, handleSubmit, formState } = useForm({
		mode: "onSubmit",
		resolver: yupResolver(schemaCreate),
	});

	const onClickSubmit = async (data) => {
		try {
			const response = await axios.post(
				"https://api-w5buphcleq-du.a.run.app/library/create",
				{
					title: data.title,
					subtitle: data.subtitle,
					tags: data.tags,
					series: data.series,
					allow: data.allow,
					password: data.password,
					thumbnail: data.thumbnail,
					content: data.content,
				}, // 데이터 객체
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
			toast("성공적으로 제출되었습니다!");
			router.push(`/library/${response.data.postId}`);
		} catch (error) {
			toast("Error submitting data:", error.response?.data || error.message);
		}
	};

	return {
		handleSubmit,
		onClickSubmit,
		editor,
		initialValue,
		getContent,
		currentAlign,
		setCurrentAlign,
		setPopupOpen,
		handlePopoverOpenChange,
		setValue,
		register,
		seriesArr,
		tagsArr,
		popupOpen,
		subOpen,
		setSubOpen,
		renderElement,
		renderLeaf,
		handleDrop,
	};
};
