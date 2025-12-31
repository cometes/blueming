// types/freeboard.ts
export interface StickerComponent {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  imageUrl: string;
  // 새로 추가되는 속성들
  isVisible: boolean;  // 숨김/보임 상태
  isLocked: boolean;   // 위치 고정 상태
}

export interface CanvasRatio {
  w: number;
  h: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface FreeBoardState {
  components: StickerComponent[];
  ratio: CanvasRatio;
  currentAlign: string;
  imageEditOn: boolean;
  isTextTop: boolean;
  content: string;
  thumbnail: string;
  canvasSize: CanvasSize;
}

export interface FreeBoardActions {
  // Component actions
  addStickerComponent: (url: string) => void;
  updateComponent: (id: number, updates: Partial<StickerComponent>) => void;
  deleteComponent: (id: number) => void;
  
  // Layer management actions
  reorderComponents: (newOrder: StickerComponent[]) => void;
  moveLayerUp: (componentId: number) => void;
  moveLayerDown: (componentId: number) => void;
  
  // 새로 추가되는 액션들
  toggleComponentVisibility: (componentId: number) => void;
  toggleComponentLock: (componentId: number) => void;
  
  // UI state actions
  toggleSwitch: (checked: boolean) => void;
  toggleZindex: (checked: boolean) => void;
  setCurrentAlign: (align: string) => void;
  setThumbnail: (thumbnail: string) => void;
  
  // Content actions
  getContent: (value: any) => void;
  captureAndSaveComponent: () => Promise<void>;
}

export interface FreeBoardContextValue extends FreeBoardState, FreeBoardActions {
  editor: any;
  renderElement: (props: any) => JSX.Element;
  renderLeaf: (props: any) => JSX.Element;
  viewerElement: (props: any) => JSX.Element;
  canvasRef: React.RefObject<HTMLDivElement>;
}