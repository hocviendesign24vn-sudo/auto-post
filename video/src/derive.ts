// Số liệu suy ra từ bảng tin để vẽ bản đồ, biểu đồ: lương cao nhất, ngành nghề, toạ độ khu vực.
import { geoMercator } from "d3-geo";
import south from "./map/south.json";
import type { BangTinData, Job } from "./types";

export const proj = geoMercator().scale(south.scale).translate(south.translate as [number, number]);

// Toạ độ (kinh độ, vĩ độ) các tỉnh thành thường gặp
const PLACES: Record<string, [number, number]> = {
  "hồ chí minh": [106.66, 10.78],
  "cần thơ": [105.77, 10.03],
  "an giang": [105.43, 10.38],
  "long xuyên": [105.43, 10.38],
  "phú quốc": [103.96, 10.22],
  "kiên giang": [105.08, 10.01],
  "rạch giá": [105.08, 10.01],
  "sóc trăng": [105.97, 9.6],
  "đồng tháp": [105.63, 10.46],
  "cao lãnh": [105.63, 10.46],
  "vĩnh long": [105.97, 10.25],
  "cà mau": [105.15, 9.18],
  "bạc liêu": [105.72, 9.29],
  "hậu giang": [105.47, 9.78],
  "tiền giang": [106.36, 10.36],
  "mỹ tho": [106.36, 10.36],
  "bến tre": [106.38, 10.24],
  "trà vinh": [106.34, 9.93],
  "long an": [106.41, 10.54],
  "tây ninh": [106.1, 11.31],
  "đồng nai": [106.82, 10.95],
  "bình dương": [106.65, 11.0],
};

export const placeOf = (name: string): [number, number] | null => {
  const n = name.toLowerCase().replace(/^tp\.?\s*/, "").trim();
  const key = Object.keys(PLACES).find((k) => n.includes(k));
  return key ? (proj(PLACES[key]) as [number, number]) : null;
};

// Lương cao nhất (triệu); null nếu thỏa thuận
export const salaryMax = (sal: string): number | null => {
  const nums = (sal.match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => Number(x.replace(",", ".")));
  return nums.length ? Math.max(...nums) : null;
};

export type Industry = { key: string; label: string; icon: string; color: string };
export const INDUSTRIES: (Industry & { re: RegExp })[] = [
  { key: "ketoan", label: "Kế toán, tài chính", icon: "calculator", color: "#0B86E8", re: /kế toán|tài chính|kiểm soát|thu hồi nợ|accountant/i },
  { key: "xaydung", label: "Xây dựng, kỹ thuật", icon: "hardhat", color: "#FF7F14", re: /xây dựng|thi công|chỉ huy|kỹ sư|giám sát|hiện trường|qs|mep|cơ điện|kỹ thuật|bảo trì|điện lạnh/i },
  { key: "kinhdoanh", label: "Kinh doanh, bán hàng", icon: "trending", color: "#2E8B3E", re: /kinh doanh|sales|bán hàng|thị trường|khách hàng|merchandiser|qhkh/i },
  { key: "sanxuat", label: "Sản xuất, chất lượng", icon: "factory", color: "#8E24AA", re: /sản xuất|đúc|luyện|quality|chất lượng|xưởng|r&d/i },
  { key: "nganhang", label: "Ngân hàng, bảo hiểm", icon: "landmark", color: "#0813DF", re: /giao dịch viên|ngân hàng|bảo hiểm|giám định/i },
  { key: "khac", label: "Vận tải, dịch vụ khác", icon: "truck", color: "#E53935", re: /lái xe|tài xế|driver|giao hàng|.*/i },
];

export const industryOf = (j: Job): Industry => {
  const text = `${j.pos}`;
  return INDUSTRIES.find((i) => i.re.test(text)) ?? INDUSTRIES[INDUSTRIES.length - 1];
};

export type FlatJob = Job & { region: string };

export const allJobs = (d: BangTinData): FlatJob[] => [
  ...d.lists.flatMap((l) => l.jobs.map((j) => ({ ...j, region: l.name }))),
  ...(d.grid?.cells.flatMap((c) => c.jobs.map((j) => ({ ...j, region: c.province }))) ?? []),
];

export const regionCounts = (d: BangTinData) => [
  ...d.lists.map((l) => ({ name: l.name, count: l.jobs.length })),
  ...(d.grid?.cells.map((c) => ({ name: c.province, count: c.jobs.length })) ?? []),
];

export const industryCounts = (d: BangTinData) => {
  const m = new Map<string, { ind: Industry; count: number }>();
  for (const j of allJobs(d)) {
    const ind = industryOf(j);
    m.set(ind.key, { ind, count: (m.get(ind.key)?.count ?? 0) + 1 });
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
};

export const topSalaries = (d: BangTinData, n = 5) =>
  allJobs(d)
    .map((j) => ({ ...j, max: salaryMax(j.sal) }))
    .filter((j): j is FlatJob & { max: number } => j.max !== null)
    .sort((a, b) => b.max - a.max)
    .slice(0, n);

export const shortRegion = (name: string) =>
  /hồ chí minh/i.test(name)
    ? "TP.HCM"
    : name.toLowerCase().replace(/(^|\s)(\S)/g, (_m, a: string, b: string) => a + b.toUpperCase());
