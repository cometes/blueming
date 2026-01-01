import axios from "axios";

export const setSettingsTheme = async value => {
  const result = await axios.post(
    "https://api-w5buphcleq-du.a.run.app/settings/general/theme",
    { value },
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
  const result = await axios.delete(
    `https://api-w5buphcleq-du.a.run.app/settings/general/theme/${themeId}`,
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
