import { useState, useCallback } from "react";

export interface FileUploadOptions {
  maxSize?: number; // 바이트 단위, 기본값: 10MB
  allowedTypes?: string[]; // MIME 타입, 기본값: 모든 이미지 타입
  endpoint?: string; // 업로드 엔드포인트
}

export interface FileUploadState {
  loading: boolean;
  error: string | null;
  progress?: number;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<string>;
  uploadFromUrl: (url: string) => Promise<string>;
  validateFile: (file: File) => boolean;
  state: FileUploadState;
  reset: () => void;
}

const DEFAULT_OPTIONS: Required<FileUploadOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/*"],
  endpoint: "https://api-w5buphcleq-du.a.run.app/images/uploadImage",
};

export const useFileUpload = (options?: FileUploadOptions): UseFileUploadReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<FileUploadState>({
    loading: false,
    error: null,
  });

  // 파일 유효성 검사
  const validateFile = useCallback((file: File): boolean => {
    // 파일 크기 검사
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
      setState(prev => ({ 
        ...prev, 
        error: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.` 
      }));
      return false;
    }

    // 파일 타입 검사
    const isValidType = config.allowedTypes.some(type => {
      if (type.endsWith("/*")) {
        const category = type.slice(0, -2);
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isValidType) {
      setState(prev => ({ 
        ...prev, 
        error: "지원하지 않는 파일 형식입니다." 
      }));
      return false;
    }

    return true;
  }, [config.maxSize, config.allowedTypes]);

  // 파일 업로드
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!validateFile(file)) {
      throw new Error(state.error || "파일 유효성 검사 실패");
    }

    setState({ loading: true, error: null });

    try {
      const formData = new FormData();
      const sanitizedFileName = encodeURIComponent(file.name);
      const processedFile = new File([file], sanitizedFileName, {
        type: file.type,
      });
      formData.append("file", processedFile);

      const response = await fetch(config.endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.file?.url) {
        throw new Error("서버에서 올바른 응답을 받지 못했습니다.");
      }

      setState({ loading: false, error: null });
      return data.file.url;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "파일 업로드 중 오류가 발생했습니다.";
      
      setState({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [validateFile, state.error, config.endpoint]);

  // URL에서 파일 다운로드 후 업로드
  const uploadFromUrl = useCallback(async (url: string): Promise<string> => {
    setState({ loading: true, error: null });

    try {
      // URL 유효성 검사
      try {
        new URL(url);
      } catch {
        throw new Error("올바른 URL 형식이 아닙니다.");
      }

      // 파일 다운로드
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("이미지를 다운로드할 수 없습니다.");
      }

      const blob = await response.blob();
      
      // Content-Type 검사
      const contentType = response.headers.get("content-type") || blob.type;
      if (!contentType.startsWith("image/")) {
        throw new Error("이미지 파일이 아닙니다.");
      }

      // File 객체 생성
      const filename = `uploaded-image-${Date.now()}.${contentType.split("/")[1]}`;
      const file = new File([blob], filename, { type: contentType });

      // 업로드 실행
      return await uploadFile(file);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "URL에서 이미지를 가져올 수 없습니다.";
      
      setState({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [uploadFile]);

  // 상태 초기화
  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return {
    uploadFile,
    uploadFromUrl,
    validateFile,
    state,
    reset,
  };
};

export default useFileUpload;