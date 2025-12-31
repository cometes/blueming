// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // localStorage에서 값을 가져오는 함수
  const getStoredValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // 값을 localStorage에 저장하는 함수
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // localStorage 값 삭제 함수
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  };

  // 컴포넌트 마운트 시 localStorage에서 값 동기화
  useEffect(() => {
    setStoredValue(getStoredValue());
  }, []);

  return [storedValue, setValue, removeValue] as const;
}

// 특정 키들을 위한 전용 훅들
export const useCustomLayout = () => {
  return useLocalStorage('customLayout', []);
};

export const useEditCanvas = () => {
  return useLocalStorage('editCanvas', { width: 0, height: 0 });
};

export const useDynamicComponents = () => {
  return useLocalStorage('dynamicComponents', []);
};

// 새로 추가: 컴포넌트 상태를 위한 전용 훅
export const useComponentsState = () => {
  return useLocalStorage('freeboard_components_state', []);
};