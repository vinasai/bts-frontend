// src/theme/antdTheme.ts
import type { ThemeConfig } from "antd";

export const antdTheme: ThemeConfig = {
  token: {
    // map to your Tailwind palette + fonts
    colorPrimary: "#FF5734",
    colorInfo: "#173F68",
    colorText: "#111111",  
    colorTextHeading: "#111111",
    fontFamily: "DM Sans, sans-serif",
    borderRadius: 10,
  },
  components: {
    Typography: {
      titleMarginBottom: 12,
      titleMarginTop: 0,
      fontFamily: "Poppins, sans-serif",
    },
    Form: {
      marginLG: 8,
      marginSM: 6,
    },
  },
};
