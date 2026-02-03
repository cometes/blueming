import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import { API_BASE } from "@/queries/apiClient";

interface CustomLayoutData {
  layout: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    maxW: number;
    maxH: number;
  }>;
  mobileLayout?: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    maxW: number;
    maxH: number;
  }>;
  desktopWidgets: Array<{
    id: string;
    type: string;
    color: string;
  }>;
  mobileWidgets: Array<{
    id: string;
    type: string;
    color: string;
  }>;
  desktopUsedColors: string[];
  mobileUsedColors: string[];
}

export const setCustomLayout = async (value: CustomLayoutData) => {
  const authHeader = await getAuthHeader();
  const result = await fetch(
    `${API_BASE}/settings/main/customLayout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader
      },
      credentials: "include",
      body: JSON.stringify({ value }),
      next: {
        revalidateTag: "customLayout"
      }
    } as RequestInit
  );

  if (!result.ok) {
    const errorData = await result.json().catch(() => ({}));
    const message = errorData.error || errorData.message || "레이아웃 저장에 실패했습니다.";
    throw new Error(message);
  }

  const data = await result.json();

  await revalidateSettingsCache();
  return {
    data
  };
};
