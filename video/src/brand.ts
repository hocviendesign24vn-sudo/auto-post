import contact from "../../assets/brand.json";

// Nhận diện D24 Design và thông tin liên hệ dùng chung cho mọi video.
export const C = {
  blue1: "#0813DF",
  blue2: "#0B86E8",
  navy: "#0A2A8C",
  deep: "#061450",
  orange: "#FF7F14",
  orange2: "#FFA23F",
  ink: "#0F1B3D",
  muted: "#5A6785",
  green: "#2E8B3E",
};

export const THEME: Record<string, { from: string; to: string; num: string }> = {
  orange: { from: C.orange, to: C.orange2, num: C.orange },
  blue: { from: C.blue1, to: C.blue2, num: C.blue1 },
  green: { from: "#1F7A34", to: "#4CAF50", num: C.green },
};

export const CONTACT = contact;

export const FONT = "Inter, 'Be Vietnam Pro', sans-serif";
