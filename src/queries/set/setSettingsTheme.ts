import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import { API_BASE } from "@/queries/apiClient";

export const setSettingsTheme = async (value: unknown) => {
  const authHeader = await getAuthHeader();
  const result = await axios.post(
    `${API_BASE}/settings/general/theme`,
    value,
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeader
      },
      withCredentials: true
    }
  );

  const data = result.data;

  await revalidateSettingsCache();
  return {
    data
  };
};

export const getSettingsTheme = async () => {
  const result = await axios.get(
    `${API_BASE}/settings/general/theme`,
    {
      headers: {
        "Content-Type": "application/json"
      },
      withCredentials: true
    }
  );

  const data = result.data;

  return {
    data
  };
};

export const deleteSettingsTheme = async (themeId: string) => {
  const authHeader = await getAuthHeader();
  const result = await axios.delete(
    `${API_BASE}/settings/general/theme/${themeId}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeader
      },
      withCredentials: true
    }
  );

  const data = result.data;

  await revalidateSettingsCache();
  return {
    data
  };
};
