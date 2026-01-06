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
  const result = await fetch(
    "https://api-w5buphcleq-du.a.run.app/settings/main/customLayout",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ value }),
      next: {
        revalidateTag: "customLayout"
      }
    } as RequestInit
  );

  const data = await result.json();

  return {
    data
  };
};
