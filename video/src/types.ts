export type Job = { pos: string; co: string; sal: string; dl?: string };
export type JobList = { name: string; sub: string; theme: string; jobs: Job[] };
export type Cell = { province: string; color: string; jobs: Job[] };
export type Stat = { icon: string; value: string; label: string };
export type BangTinData = {
  date: string;
  regionsLine: string[];
  stats: Stat[];
  lists: JobList[];
  grid?: { name: string; sub: string; cells: Cell[] };
  notes: string[];
  cta: string;
  // Giọng đọc từng cảnh (render/voice.py tạo), theo thứ tự cảnh trong video
  voice?: { src: string; dur: number; text?: string }[];
};
