// context/FreeBoardContext.tsx (기본 기능만)
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect
} from "react";
import { createEditor } from "slate";
import { withReact } from "slate-react";
import { withHistory } from "slate-history";
import { withImages } from "../../../../../etc/hooks/useWithImage";
import { withInlines } from "../../../../../etc/hooks/useWithInline";
import withVideo from "../../../../../etc/hooks/useWithVideo";
import { useForm } from "react-hook-form";
import { useSetting } from "../../../../../etc/contexts/settings";
import Leaf from "../../../editor/customToolbar/leaf";
import Viewer from "../../../editor/customToolbar/viewer";
import Element from "../../../editor/customToolbar/element";
import { Editor, Element as SlateElement } from "slate";

// ================== 기본 타입 정의 ==================
export interface CanvasRatio {
  w: number;
  h: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface FreeBoardBaseState {
  ratio: CanvasRatio;
  currentAlign: string;
  imageEditOn: boolean;
  isTextTop: boolean;
  content: string;
  thumbnail: string;
  canvasSize: CanvasSize;
}

export interface FreeBoardBaseContextValue extends FreeBoardBaseState {
  // 에디터
  editor: any;
  renderElement: (props: any) => JSX.Element;
  renderLeaf: (props: any) => JSX.Element;
  viewerElement: (props: any) => JSX.Element;
  canvasRef: React.RefObject<HTMLDivElement>;

  // UI 상태 관리
  toggleSwitch: (checked: boolean) => void;
  toggleZindex: (checked: boolean) => void;
  setCurrentAlign: (align: string) => void;
  setThumbnail: (thumbnail: string) => void;
  getContent: (value: any) => void;
}

// ================== 상수 정의 ==================
const initialValue = [
  {
    type: "paragraph",
    children: [{ text: "" }]
  }
];

// ================== 액션 타입 ==================
type FreeBoardBaseAction =
  | { type: "SET_RATIO"; payload: { w: number; h: number } }
  | { type: "SET_CURRENT_ALIGN"; payload: string }
  | { type: "SET_IMAGE_EDIT_ON"; payload: boolean }
  | { type: "SET_IS_TEXT_TOP"; payload: boolean }
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_THUMBNAIL"; payload: string }
  | { type: "SET_CANVAS_SIZE"; payload: { width: number; height: number } };

// ================== 초기 상태 ==================
const initialState: FreeBoardBaseState = {
  ratio: { w: 0, h: 0 },
  currentAlign: "left",
  imageEditOn: false,
  isTextTop: false,
  content: JSON.stringify(initialValue),
  thumbnail: "",
  canvasSize: { width: 0, height: 0 }
};

// ================== 리듀서 ==================
function freeBoardBaseReducer(
  state: FreeBoardBaseState,
  action: FreeBoardBaseAction
): FreeBoardBaseState {
  switch (action.type) {
    case "SET_RATIO":
      return { ...state, ratio: action.payload };
    case "SET_CURRENT_ALIGN":
      return { ...state, currentAlign: action.payload };
    case "SET_IMAGE_EDIT_ON":
      return { ...state, imageEditOn: action.payload };
    case "SET_IS_TEXT_TOP":
      return { ...state, isTextTop: action.payload };
    case "SET_CONTENT":
      return { ...state, content: action.payload };
    case "SET_THUMBNAIL":
      return { ...state, thumbnail: action.payload };
    case "SET_CANVAS_SIZE":
      return { ...state, canvasSize: action.payload };
    default:
      return state;
  }
}

// ================== Context 생성 ==================
const FreeBoardBaseContext = createContext<FreeBoardBaseContextValue | null>(
  null
);

export const useFreeBoardBaseContext = () => {
  const context = useContext(FreeBoardBaseContext);
  if (!context) {
    throw new Error(
      "useFreeBoardBaseContext must be used within FreeBoardBaseProvider"
    );
  }
  return context;
};

// ================== Provider 컴포넌트 ==================
export const FreeBoardBaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [state, dispatch] = useReducer(freeBoardBaseReducer, initialState);
  const { main } = useSetting();
  const { setValue, getValues } = useForm();
  const canvasRef = useRef<HTMLDivElement>(null);
  const localStorage = globalThis?.localStorage;

  // ================== 에디터 설정 ==================
  const editor = useMemo(() => {
    return withVideo(
      withInlines(withImages(withHistory(withReact(createEditor()))))
    );
  }, []);

  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);
  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const viewerElement = useCallback((props: any) => <Viewer {...props} />, []);

  // ================== UI 상태 관리 액션 ==================
  const toggleSwitch = useCallback(
    (checked: boolean) => {
      dispatch({ type: "SET_IMAGE_EDIT_ON", payload: checked });
      const content = getValues("content");
      dispatch({ type: "SET_CONTENT", payload: content });
    },
    [getValues]
  );

  const toggleZindex = useCallback(
    (checked: boolean) => {
      dispatch({ type: "SET_IS_TEXT_TOP", payload: checked });
      // 텍스트 위치 설정을 localStorage에 저장
      localStorage?.setItem("isTextTop", JSON.stringify(checked));
    },
    [localStorage]
  );

  const setCurrentAlign = useCallback((align: string) => {
    dispatch({ type: "SET_CURRENT_ALIGN", payload: align });
  }, []);

  const setThumbnail = useCallback((thumbnail: string) => {
    dispatch({ type: "SET_THUMBNAIL", payload: thumbnail });
  }, []);

  // ================== 에디터 관리 액션 ==================
  const updateCurrentAlign = useCallback(() => {
    const [match] = Array.from(
      Editor.nodes(editor, {
        match: n => SlateElement.isElement(n),
        mode: "lowest"
      })
    );
    const align = match?.[0]?.align || "left";
    dispatch({ type: "SET_CURRENT_ALIGN", payload: align });
  }, [editor]);

  const getContent = useCallback(
    (value: any) => {
      if (editor.selection) {
        updateCurrentAlign();
      }
      const content = JSON.stringify(value);
      setValue("content", content);
    },
    [editor.selection, updateCurrentAlign, setValue]
  );

  // ================== 이펙트 훅들 ==================
  // 레이아웃 비율 초기화
  useEffect(() => {
    const customLayout = main?.customLayout.layout;
    if (customLayout) {
      // const parsedLayout = JSON.parse(savedLayout);
      const freeboard = customLayout.find((el: any) => el.i === "스티커보드");

      if (freeboard) {
        const aspectRatio = freeboard.w / freeboard.h;
        let ratio;

        if (freeboard.w > freeboard.h) {
          ratio = { w: 12, h: Math.round(12 / aspectRatio) };
        } else if (freeboard.h > freeboard.w) {
          ratio = { w: Math.round(12 * aspectRatio), h: 12 };
        } else {
          ratio = { w: 12, h: 12 };
        }

        dispatch({ type: "SET_RATIO", payload: ratio });
      }
    }
  }, [main?.customLayout.layout]);

  useEffect(() => {
    const channel = new BroadcastChannel("layoutUpdated");
    channel.onmessage = e => {
      const layout = e.data?.layout;
      if (layout) {
        const freeboard = layout.find((el: any) => el.i === "스티커보드");
        if (freeboard) {
          const aspectRatio = freeboard.w / freeboard.h;
          let ratio;
          if (freeboard.w > freeboard.h) {
            ratio = { w: 12, h: Math.round(12 / aspectRatio) };
          } else if (freeboard.h > freeboard.w) {
            ratio = { w: Math.round(12 * aspectRatio), h: 12 };
          } else {
            ratio = { w: 12, h: 12 };
          }
          dispatch({ type: "SET_RATIO", payload: ratio });
        }
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  // 캔버스 크기 계산
  useLayoutEffect(() => {
    if (canvasRef.current) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      dispatch({ type: "SET_CANVAS_SIZE", payload: { width, height } });
    }
  }, [state.ratio]);

  // 설정에서 데이터 초기화
  useEffect(() => {
    const stickerBoard = main?.stickerBoard;
    if (stickerBoard) {
      const savedContents =
        stickerBoard.content || JSON.stringify(initialValue);
      dispatch({ type: "SET_CONTENT", payload: savedContents });
      setValue("content", savedContents);
    }
  }, [main, setValue]);

  // localStorage 저장
  useEffect(() => {
    if (state.canvasSize.width > 0 && state.canvasSize.height > 0) {
      localStorage?.setItem("editCanvas", JSON.stringify(state.canvasSize));
    }
  }, [state.canvasSize, localStorage]);

  // 텍스트 위치 설정 로드
  useEffect(() => {
    const savedIsTextTop = localStorage?.getItem("isTextTop");
    if (savedIsTextTop !== null) {
      try {
        const isTextTop = JSON.parse(savedIsTextTop);
        dispatch({ type: "SET_IS_TEXT_TOP", payload: isTextTop });
      } catch (error) {
        console.warn("Failed to parse saved text position setting:", error);
      }
    }
  }, [localStorage]);

  // ================== Context Value ==================
  const contextValue: FreeBoardBaseContextValue = useMemo(
    () => ({
      // 상태
      ...state,

      // 에디터
      editor,
      renderElement,
      renderLeaf,
      viewerElement,
      canvasRef,

      // UI 상태
      toggleSwitch,
      toggleZindex,
      setCurrentAlign,
      setThumbnail,

      // 콘텐츠 관리
      getContent
    }),
    [
      state,
      editor,
      renderElement,
      renderLeaf,
      viewerElement,
      canvasRef,
      toggleSwitch,
      toggleZindex,
      setCurrentAlign,
      setThumbnail,
      getContent
    ]
  );

  return (
    <FreeBoardBaseContext.Provider value={contextValue}>
      {children}
    </FreeBoardBaseContext.Provider>
  );
};
