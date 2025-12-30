import React, { useState, useCallback, useRef } from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor, Transforms, Element } from "slate";
import { Images, Upload, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useFileUpload } from "../../../hooks/useFileUpload";
import type {
	CustomElement,
	CustomText,
	AlignType,
} from "../../../types/slate";

interface ImageButtonProps {}

const ImageButton: React.FC<ImageButtonProps> = () => {
	const editor = useSlate();
	const [isOpen, setIsOpen] = useState(false);
	const [imageUrl, setImageUrl] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropZoneRef = useRef<HTMLDivElement>(null);

	// 파일 업로드 훅 사용
	const {
		uploadFile,
		uploadFromUrl,
		validateFile,
		state: uploadState,
		reset,
	} = useFileUpload({
		maxSize: 10 * 1024 * 1024, // 10MB
		allowedTypes: ["image/*"],
	});

	// 현재 커서 위치의 정렬 속성 가져오기
	const getCurrentAlign = useCallback((): AlignType => {
		const { selection } = editor;
		if (!selection) return "left";

		const [match] = Editor.nodes(editor, {
			match: (n) => !Editor.isEditor(n) && Element.isElement(n),
			mode: "lowest",
		});

		if (match && match[0]) {
			const element = match[0] as CustomElement;
			return element.align || "left";
		}

		return "left";
	}, [editor]);

	// 캔버스 가로 길이 가져오기
	const getCanvasWidth = useCallback(() => {
		try {
			// 에디터의 루트 노드 찾기
			const [root] = Editor.nodes(editor, {
				match: (n) => Editor.isEditor(n),
				mode: "lowest"
			});
			
			if (root) {
				const editorElement = ReactEditor.toDOMNode(editor, root[0]);
				if (editorElement) {
					// 패딩을 제외한 실제 컨텐츠 영역 너비
					const computedStyle = window.getComputedStyle(editorElement);
					const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
					const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
					return editorElement.clientWidth - paddingLeft - paddingRight;
				}
			}
		} catch (error) {
			console.warn("Could not get canvas width:", error);
		}
		// 기본값: 대부분의 에디터 기본 너비
		return 800;
	}, [editor]);

	// 이미지 크기 계산 (캔버스 너비 제한, 비율 유지)
	const calculateImageSize = useCallback((naturalWidth: number, naturalHeight: number) => {
		const maxWidth = getCanvasWidth();
		
		// 이미지가 캔버스 너비보다 작으면 원본 크기 사용
		if (naturalWidth <= maxWidth) {
			return { width: naturalWidth, height: naturalHeight };
		}
		
		// 비율 계산하여 캔버스 너비에 맞춤
		const aspectRatio = naturalWidth / naturalHeight;
		return {
			width: maxWidth,
			height: Math.round(maxWidth / aspectRatio)
		};
	}, [getCanvasWidth]);

	// 이미지 원본 크기 가져오기
	const getImageDimensions = useCallback((url: string): Promise<{ width: number; height: number }> => {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				const calculatedSize = calculateImageSize(img.naturalWidth, img.naturalHeight);
				resolve(calculatedSize);
			};
			img.onerror = () => {
				// 이미지 로드 실패 시 기본 크기 반환
				resolve({ width: 400, height: 300 });
			};
			img.src = url;
		});
	}, [calculateImageSize]);

	// 이미지 노드 삽입 (Slate 권장 방식)
	const insertImage = useCallback(
		async (url: string) => {
			const currentAlign = getCurrentAlign();

			try {
				// 이미지 크기 계산
				const { width, height } = await getImageDimensions(url);

				// Editor.withoutNormalizing으로 모든 변환을 한 번에 처리
				Editor.withoutNormalizing(editor, () => {
					// 현재 선택 영역 확인
					const { selection } = editor;
					if (!selection) {
						// 선택 영역이 없으면 에디터 끝에 커서 설정
						Transforms.select(editor, Editor.end(editor, []));
					}

					// 이미지 노드 생성 (계산된 크기 사용)
					const imageNode: CustomElement = {
						type: "image",
						url,
						align: currentAlign,
						width,
						height,
						children: [{ text: "" } as CustomText],
					};

					// 빈 문단 노드 생성
					const paragraphNode: CustomElement = {
						type: "paragraph",
						align: currentAlign,
						children: [{ text: "" } as CustomText],
					};

					// 현재 노드가 빈 문단인지 확인
					const [currentNode, currentPath] = Editor.node(
						editor,
						editor.selection!
					);
					const currentText = Editor.string(editor, currentPath);

					if (
						currentNode &&
						"type" in currentNode &&
						currentNode.type === "paragraph" &&
						currentText.trim() === ""
					) {
						// 빈 문단이면 이미지로 교체하고 새 문단 추가
						Transforms.setNodes(editor, imageNode, { at: currentPath });
						Transforms.insertNodes(editor, paragraphNode);
					} else {
						// 내용이 있거나 다른 타입이면 이미지와 문단을 연속 삽입
						Transforms.insertNodes(editor, [imageNode, paragraphNode]);
					}

					// 새 문단으로 커서 이동
					const nextPath = Editor.after(editor, editor.selection!);
					if (nextPath) {
						Transforms.select(editor, nextPath);
					}
				});

				// 에디터에 포커스
				ReactEditor.focus(editor);
			} catch (error) {
				console.error("Error calculating image dimensions:", error);
				// 에러 발생 시 기본 크기로 삽입
				Editor.withoutNormalizing(editor, () => {
					const { selection } = editor;
					if (!selection) {
						Transforms.select(editor, Editor.end(editor, []));
					}

					const imageNode: CustomElement = {
						type: "image",
						url,
						align: currentAlign,
						width: 400,
						height: 300,
						children: [{ text: "" } as CustomText],
					};

					const paragraphNode: CustomElement = {
						type: "paragraph",
						align: currentAlign,
						children: [{ text: "" } as CustomText],
					};

					const [currentNode, currentPath] = Editor.node(editor, editor.selection!);
					const currentText = Editor.string(editor, currentPath);

					if (
						currentNode &&
						"type" in currentNode &&
						currentNode.type === "paragraph" &&
						currentText.trim() === ""
					) {
						Transforms.setNodes(editor, imageNode, { at: currentPath });
						Transforms.insertNodes(editor, paragraphNode);
					} else {
						Transforms.insertNodes(editor, [imageNode, paragraphNode]);
					}

					const nextPath = Editor.after(editor, editor.selection!);
					if (nextPath) {
						Transforms.select(editor, nextPath);
					}
				});

				ReactEditor.focus(editor);
			}
		},
		[editor, getCurrentAlign, getImageDimensions]
	);

	// 파일 선택 처리
	const handleFileSelect = useCallback(
		(file: File) => {
			if (validateFile(file)) {
				setSelectedFile(file);
				reset(); // 이전 에러 상태 초기화
			} else {
				// validateFile에서 에러가 설정됨
				setSelectedFile(null);
			}
		},
		[validateFile, reset]
	);

	// 파일 업로드 실행
	const handleFileUpload = useCallback(async () => {
		if (!selectedFile) {
			alert("파일을 선택해주세요.");
			return;
		}

		try {
			const url = await uploadFile(selectedFile);
			insertImage(url);
			setSelectedFile(null);
			setIsOpen(false);
		} catch (error) {
			alert(error instanceof Error ? error.message : "업로드 실패");
		}
	}, [selectedFile, uploadFile, insertImage]);

	// URL 업로드 실행
	const handleUrlUpload = useCallback(async () => {
		if (!imageUrl.trim()) {
			alert("URL을 입력해주세요.");
			return;
		}

		try {
			const url = await uploadFromUrl(imageUrl);
			insertImage(url);
			setImageUrl("");
			setIsOpen(false);
		} catch (error) {
			alert(error instanceof Error ? error.message : "업로드 실패");
		}
	}, [imageUrl, uploadFromUrl, insertImage]);

	// 드래그 앤 드롭 이벤트 처리
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);

			const files = Array.from(e.dataTransfer.files);
			const imageFile = files.find((file) => file.type.startsWith("image/"));

			if (imageFile) {
				handleFileSelect(imageFile);
			} else {
				alert("이미지 파일을 드롭해주세요.");
			}
		},
		[handleFileSelect]
	);

	// 파일 입력 클릭
	const handleFileClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	// 파일 입력 변경
	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				handleFileSelect(file);
			}
		},
		[handleFileSelect]
	);

	// 팝오버 닫기
	const closePopover = useCallback(() => {
		setIsOpen(false);
		setSelectedFile(null);
		setImageUrl("");
		setIsDragOver(false);
		reset(); // 업로드 상태 초기화
	}, [reset]);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="w-8 h-8 p-0 hover:bg-muted"
					onMouseDown={(event) => {
						event.preventDefault();
						ReactEditor.focus(editor);
					}}
				>
					<Images size={16} className="text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="max-w-[280px]" align="center">
				<div className="">
					{/* 에러 메시지 표시 */}
					{uploadState.error && (
						<div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
							{uploadState.error}
						</div>
					)}

					<Tabs defaultValue="file" className="w-full gap-2">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="file">파일</TabsTrigger>
							<TabsTrigger value="url">URL</TabsTrigger>
							<TabsTrigger value="drag">드래그</TabsTrigger>
						</TabsList>

						<TabsContent value="file" className="flex flex-col gap-2">
							<div className="">
								<div className="">
									<Button
										variant="outline"
										onClick={handleFileClick}
										className="w-full h-8 rounded-[4px]"
										disabled={uploadState.loading}
									>
										<Upload size={16} className="mr-2" />
										파일 선택
									</Button>
									{selectedFile && (
										<div className="text-sm text-muted-foreground">
											선택된 파일: {selectedFile.name}
										</div>
									)}
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										onChange={handleFileChange}
										className="hidden"
									/>
								</div>
							</div>
							<div className="flex justify-end">
								<Button
									onClick={handleFileUpload}
									disabled={!selectedFile || uploadState.loading}
									className="h-8"
								>
									{uploadState.loading ? "업로드 중..." : "업로드"}
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="url" className="flex flex-col gap-2">
							<div className="">
								<Label htmlFor="image-url">이미지 URL</Label>
								<Input
									id="image-url"
									placeholder="https://example.com/image.jpg"
									value={imageUrl}
									onChange={(e) => setImageUrl(e.target.value)}
									disabled={uploadState.loading}
									className="h-8 rounded-[4px] mt-1"
								/>
							</div>
							<div className="flex justify-end">
								<Button
									onClick={handleUrlUpload}
									disabled={!imageUrl.trim() || uploadState.loading}
									className="h-8"
								>
									{uploadState.loading ? "업로드 중..." : "업로드"}
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="drag" className="space-y-4">
							<div
								ref={dropZoneRef}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								className={cn(
									"border-2 border-dashed rounded-lg p-8 text-center transition-colors",
									isDragOver
										? "border-primary bg-primary/5"
										: "border-muted-foreground/25"
								)}
							>
								<FileImage
									size={40}
									className="mx-auto mb-4 text-muted-foreground"
								/>
								<p className="text-sm text-muted-foreground mb-2 break-keep">
									이미지 파일을 여기에 드래그하세요
								</p>
								<p className="text-xs text-muted-foreground">
									PNG, JPG, GIF, WebP (최대 10MB)
								</p>
								{selectedFile && (
									<div className="mt-4 text-sm text-foreground">
										선택된 파일: {selectedFile.name}
									</div>
								)}
							</div>
							{selectedFile && (
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={closePopover}
										className="flex-1"
									>
										취소
									</Button>
									<Button
										onClick={handleFileUpload}
										disabled={uploadState.loading}
										className="flex-1"
									>
										{uploadState.loading ? "업로드 중..." : "업로드"}
									</Button>
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default ImageButton;
