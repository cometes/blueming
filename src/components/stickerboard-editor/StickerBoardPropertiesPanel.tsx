"use client";

import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { isTextSticker } from "@/features/stickerboard-editor/lib/stickerboard-utils";
import { StickerBoardAlignmentSection } from "@/components/stickerboard-editor/properties/StickerBoardAlignmentSection";
import { StickerBoardTextPropertiesSection } from "@/components/stickerboard-editor/properties/StickerBoardTextPropertiesSection";
import { StickerBoardImagePropertiesSection } from "@/components/stickerboard-editor/properties/StickerBoardImagePropertiesSection";
import { useStickerBoardTransformFields } from "@/components/stickerboard-editor/properties/useStickerBoardTransformFields";

export function StickerBoardPropertiesPanel() {
	const {
		computed: { selectedComponent, selectedImageComponent },
		refs: { canvasRef, moveableInteractionRef },
		actions: {
			updateComponent,
			requestAutoSize,
			alignSelectedSticker,
			clampStickerToEditorBounds,
		},
	} = useStickerBoardEditorContext();
	const {
		canvasSize,
		buildTransformValues,
		handleTransformFieldChange,
		handleTransformFieldCommit,
		editingFieldRef,
	} = useStickerBoardTransformFields({
		selectedComponent,
		canvasRef,
		moveableInteractionRef,
		updateComponent,
		clampStickerToEditorBounds,
	});

	return (
		<>
			{selectedComponent ? (
				<StickerBoardAlignmentSection
					selectedComponent={selectedComponent}
					onUpdate={updateComponent}
					onAlign={alignSelectedSticker}
				/>
			) : null}

			{selectedComponent && isTextSticker(selectedComponent) && (
				<StickerBoardTextPropertiesSection
					component={selectedComponent}
					canvasSize={canvasSize}
					values={buildTransformValues(selectedComponent.id)}
					onUpdate={updateComponent}
					onRequestAutoSize={requestAutoSize}
					onFieldChange={(field, value) =>
						handleTransformFieldChange(selectedComponent.id, field, value)
					}
					onFieldFocus={(field) => {
						editingFieldRef.current = field;
					}}
					onFieldCommit={(field) =>
						handleTransformFieldCommit(selectedComponent.id, field)
					}
				/>
			)}

			{selectedImageComponent && (
				<StickerBoardImagePropertiesSection
					component={selectedImageComponent}
					canvasSize={canvasSize}
					values={buildTransformValues(selectedImageComponent.id)}
					onUpdate={updateComponent}
					onFieldChange={(field, value) =>
						handleTransformFieldChange(selectedImageComponent.id, field, value)
					}
					onFieldFocus={(field) => {
						editingFieldRef.current = field;
					}}
					onFieldCommit={(field) =>
						handleTransformFieldCommit(selectedImageComponent.id, field)
					}
				/>
			)}
		</>
	);
}
