// Dựng ảnh Facebook (post1) và các khung video dọc (post2) từ file JSON tin tuyển dụng.
// Cách dùng: node render/render.js examples/sample-data.json out/
const { chromium } = require('playwright');
const fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || '.';
fs.mkdirSync(out, { recursive: true });
const css = `*{margin:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#0B4F3C;color:#fff}
.wrap{width:100%;height:100%;padding:60px 64px;display:flex;flex-direction:column}
.brand{font-weight:700;font-size:30px;letter-spacing:2px;color:#FFC845}
h1{font-size:76px;font-weight:800;line-height:1.05;margin-top:24px}
.sub{font-size:32px;opacity:.85;margin-top:14px}
.card{background:#fff;color:#12221C;border-radius:24px;padding:28px 34px;margin-top:18px}
.pos{font-size:38px;font-weight:800}.co{font-size:26px;color:#3C5A50;margin-top:6px}
.row{display:flex;gap:14px;margin-top:14px;flex-wrap:wrap}
.tag{font-size:24px;font-weight:700;padding:8px 16px;border-radius:999px;background:#E6F2EC;color:#0B4F3C}
.tag.sal{background:#FFC845;color:#3A2A00}
.foot{margin-top:auto;padding-top:16px;font-size:24px;line-height:1.45;opacity:.9}
.warn{color:#FFC845;font-weight:700}`;
const tags = j => `<div class="row"><span class="tag sal">${j.sal}</span><span class="tag">📍 ${j.loc}</span><span class="tag">Hạn ${j.dl}</span></div>`;
const page1 = p => `<div class="wrap"><div class="brand">TÌM VIỆC SỐ</div><h1>${p.title}</h1><div class="sub">${p.sub}</div>
${p.jobs.map(j=>`<div class="card"><div class="pos">${j.pos}</div><div class="co">${j.co}</div>${tags(j)}</div>`).join('')}
<div class="foot">Link ứng tuyển trong phần bình luận và mô tả bài.<br><span class="warn">Không nộp bất kỳ khoản phí nào khi ứng tuyển.</span></div></div>`;
const vIntro = p => `<div class="wrap" style="justify-content:center"><div class="brand" style="font-size:40px">TÌM VIỆC SỐ</div><h1 style="font-size:130px">${p.title.replace(' ','<br>')}</h1><div class="sub" style="font-size:48px;margin-top:30px">${p.sub}</div><div class="sub" style="font-size:40px;margin-top:60px;color:#FFC845">Hạn nộp đến cuối tháng 11/2026</div></div>`;
const vJob = (j,i,n) => `<div class="wrap" style="justify-content:center"><div class="brand" style="font-size:36px">VỊ TRÍ ${i+1}/${n}</div><div class="card" style="padding:56px 52px;margin-top:36px"><div class="pos" style="font-size:72px;line-height:1.1">${j.pos}</div><div class="co" style="font-size:40px;margin-top:20px">${j.co}</div>
<div style="font-size:84px;font-weight:800;color:#0B4F3C;margin-top:44px">${j.sal}</div><div style="font-size:38px;margin-top:28px">📍 ${j.loc}</div><div style="font-size:38px;margin-top:16px">⏰ Hạn nộp ${j.dl}</div><div style="font-size:34px;margin-top:28px;color:#3C5A50">Yêu cầu: ${j.req}</div></div></div>`;
const vOutro = () => `<div class="wrap" style="justify-content:center"><div class="brand" style="font-size:40px">TÌM VIỆC SỐ</div><h1 style="font-size:96px">Ứng tuyển ở đâu?</h1><div class="sub" style="font-size:48px;margin-top:30px;line-height:1.4">Link từng vị trí ở phần mô tả.<br>Theo dõi để nhận việc mới mỗi ngày lúc 8:00 và 14:00.</div><div class="sub warn" style="font-size:46px;margin-top:70px;line-height:1.4">Nhà tuyển dụng thật không bao giờ thu phí ứng viên.</div></div>`;
(async () => {
  const b = await chromium.launch();
  const shot = async (html, w, h, out) => { const pg = await b.newPage({ viewport: { width: w, height: h } }); await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}html,body{width:${w}px;height:${h}px}</style></head><body>${html}</body></html>`); await pg.screenshot({ path: out }); await pg.close(); };
  await shot(page1(d.post1), 1080, 1350, `${out}/post1_facebook.png`);
  const p = d.post2; const n = p.jobs.length;
  await shot(vIntro(p), 1080, 1920, `${out}/v0.png`);
  for (let i = 0; i < n; i++) await shot(vJob(p.jobs[i], i, n), 1080, 1920, `${out}/v${i+1}.png`);
  await shot(vOutro(), 1080, 1920, `${out}/v${n+1}.png`);
  await b.close();
})();
