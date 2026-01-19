import axios from "axios";
import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";

export const setSettingsTheme = async (value: unknown) => {
  const authHeader = await getAuthHeader();
  const result = await axios.post(
    "https://api-w5buphcleq-du.a.run.app/settings/general/theme",
    value,
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeader
      }
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
    "https://api-w5buphcleq-du.a.run.app/settings/general/theme",
    {
      headers: {
        "Content-Type": "application/json"
      }
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
    `https://api-w5buphcleq-du.a.run.app/settings/general/theme/${themeId}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...authHeader
      }
    }
  );

  const data = result.data;

  await revalidateSettingsCache();
  return {
    data
  };
};
