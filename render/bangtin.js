// Dựng "Bảng tin tuyển dụng tổng hợp" theo nhận diện D24 Design:
//   - out/bangtin.png        ảnh Facebook 1080x1350
//   - out/v0.png ... vN.png  khung video dọc 1080x1920 (mở đầu, mỗi khu vực một khung, kết)
// Cách dùng: node render/bangtin.js examples/bangtin-mau.json out/
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || 'out';
fs.mkdirSync(out, { recursive: true });
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '..', 'assets', 'logo-d24.png')).toString('base64');

const C = { blue1: '#0813DF', blue2: '#0B86E8', navy: '#0A2A8C', orange: '#FF7F14', ink: '#0F1B3D', muted: '#5A6785', green: '#2E8B3E' };
const THEME = {
  orange: { head: `linear-gradient(90deg, ${C.orange}, #FFA23F)`, num: C.orange },
  blue: { head: `linear-gradient(90deg, ${C.blue1}, ${C.blue2})`, num: C.blue1 },
  green: { head: `linear-gradient(90deg, #1F7A34, #4CAF50)`, num: C.green },
};
const ICON = {
  briefcase: '<path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4zm2 0h2V5h-2v1z"/>',
  pin: '<path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>',
  calendar: '<path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2zM5 9v11h14V9H5z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">₫</text>',
  send: '<path d="M2 11l19-8-8 19-2-8-9-3z"/>',
};
const icon = (name, color, size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">${ICON[name]}</svg>`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,sans-serif;color:${C.ink};background:#EEF4FF}
.page{position:relative;overflow:hidden;background:#EEF4FF}
.hero{position:relative;color:#fff;background:linear-gradient(120deg,${C.navy} 0%,${C.blue1} 45%,${C.blue2} 100%);overflow:hidden}
.hero:before{content:"";position:absolute;right:-120px;top:-160px;width:520px;height:520px;border-radius:50%;background:rgba(255,255,255,.08)}
.hero:after{content:"";position:absolute;right:120px;bottom:-220px;width:380px;height:380px;border-radius:50%;background:rgba(255,127,20,.18)}
.logo{position:absolute;background:#fff;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.18);z-index:2}
.logo img{display:block}
.t1{font-weight:900;letter-spacing:-1px;line-height:1}
.t2{font-weight:900;color:${C.orange};letter-spacing:-1px;line-height:1}
.pill{display:inline-flex;align-items:center;gap:10px;background:#fff;color:${C.navy};font-weight:700;border-radius:999px}
.date{display:flex;align-items:center;gap:10px;font-weight:600;opacity:.95}
.slogan{position:absolute;font-style:italic;font-weight:700;color:#fff;transform:rotate(-8deg);text-align:center;line-height:1.25;z-index:2}
.slogan b{display:block;height:4px;background:${C.orange};border-radius:4px;margin-top:8px}
.stats{display:flex;gap:16px}
.stat{flex:1;display:flex;align-items:center;gap:14px;background:#fff;border-radius:18px;box-shadow:0 4px 14px rgba(10,42,140,.08)}
.stat .ic{border-radius:50%;display:flex;align-items:center;justify-content:center}
.stat .v{font-weight:900;line-height:1}
.stat .l{font-weight:700;line-height:1.2;white-space:pre-line}
.card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 14px rgba(10,42,140,.08)}
.head{color:#fff;display:flex;align-items:baseline;gap:10px}
.head .n{font-weight:900;letter-spacing:.5px}
.head .s{font-weight:600;opacity:.95}
.row{display:flex;align-items:center;border-top:1px solid #EDF0F6}
.row:first-child{border-top:0}
.num{flex:none;border-radius:50%;color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
.job{flex:1;min-width:0}
.pos{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.co{color:${C.muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sal{flex:none;font-weight:800;color:${C.orange};display:flex;align-items:center;gap:6px;white-space:nowrap}
.dl{flex:none;background:#F1F5FF;color:${C.navy};font-weight:700;border-radius:8px;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.cell{border-radius:14px;background:#F7FAFF;border-top:5px solid}
.prov{font-weight:900;display:flex;align-items:center;gap:6px}
.gj{margin-top:10px}
.gj .p{font-weight:800}
.gj .c{color:${C.muted}}
.gj .m{color:${C.orange};font-weight:800}
.foot{display:flex;gap:16px}
.note{flex:1.25;background:#FFF6EC;border-radius:18px}
.note h4{font-weight:900;color:${C.ink}}
.note li{list-style:none;display:flex;gap:8px;align-items:flex-start;color:${C.ink}}
.note li:before{content:"✓";color:#fff;background:${C.orange};border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-weight:900}
.cta{flex:1;border-radius:18px;background:linear-gradient(120deg,${C.navy},${C.blue1} 60%,${C.blue2});color:#fff;display:flex;align-items:center;gap:16px;font-weight:800;line-height:1.25}
.cta u{text-decoration:none;border-bottom:4px solid ${C.orange}}
`;

const hero = (w, h, s) => `
<div class="hero" style="height:${h}px;padding:${44 * s}px ${48 * s}px">
  <div class="logo" style="right:${44 * s}px;top:${40 * s}px;width:${150 * s}px;height:${110 * s}px"><img src="${logo}" style="width:${118 * s}px"></div>
  <div class="t1" style="font-size:${66 * s}px">BẢNG TIN TUYỂN DỤNG</div>
  <div class="t2" style="font-size:${74 * s}px;margin-top:${10 * s}px">TỔNG HỢP</div>
  <div class="pill" style="margin-top:${22 * s}px;font-size:${21 * s}px;padding:${10 * s}px ${20 * s}px">${icon('pin', C.blue1, 24 * s)}${d.regionsLine.map(esc).join(' &nbsp;•&nbsp; ')}</div>
  <div class="date" style="margin-top:${16 * s}px;font-size:${22 * s}px">${icon('calendar', '#fff', 26 * s)} Ngày ${esc(d.date)}</div>
  <div class="slogan" style="right:${70 * s}px;top:${185 * s}px;font-size:${26 * s}px">Nhiều cơ hội<br>tốt hơn tương lai<br>của bạn!<b></b></div>
</div>`;

const stats = s => `<div class="stats">${d.stats.map((x, i) => {
  const col = [C.blue1, C.orange, C.blue2][i % 3];
  return `<div class="stat" style="padding:${18 * s}px ${20 * s}px">
    <div class="ic" style="width:${64 * s}px;height:${64 * s}px;background:${col}1A">${icon(x.icon, col, 34 * s)}</div>
    <div class="v" style="font-size:${52 * s}px;color:${i === 1 ? C.orange : C.navy}">${esc(x.value)}</div>
    <div class="l" style="font-size:${19 * s}px">${esc(x.label)}</div></div>`;
}).join('')}</div>`;

const list = (L, s, opt = {}) => {
  const t = THEME[L.theme] || THEME.blue;
  const meta = j => `<div class="sal" style="font-size:${opt.sal || 16}px">${icon('coin', '#F4B400', (opt.sal || 16) + 4)}${esc(j.sal)}</div>
      <div class="dl" style="font-size:${opt.dl || 14}px;padding:${5 * s}px ${9 * s}px">Hạn ${esc(j.dl)}</div>`;
  const rows = L.jobs.map((j, i) => `
    <div class="row" style="padding:${opt.rowPad || 11}px ${16 * s}px;gap:${12 * s}px">
      <div class="num" style="width:${32 * s}px;height:${32 * s}px;font-size:${17 * s}px;background:${t.num}">${i + 1}</div>
      <div class="job"><div class="pos" style="font-size:${opt.pos || 18}px">${esc(j.pos)}</div><div class="co" style="font-size:${opt.co || 15}px">${esc(j.co)}</div>
        ${opt.stack ? `<div style="display:flex;gap:${12 * s}px;margin-top:${6 * s}px">${meta(j)}</div>` : ''}</div>
      ${opt.stack ? '' : meta(j)}
    </div>`).join('');
  return `<div class="card"><div class="head" style="background:${t.head};padding:${14 * s}px ${20 * s}px">
      <span class="n" style="font-size:${opt.head || 25}px">${esc(L.name)}</span><span class="s" style="font-size:${opt.sub || 16}px">– ${esc(L.sub)}</span></div>${rows}</div>`;
};

const grid = (G, s, opt = {}) => `<div class="card"><div class="head" style="background:${THEME.green.head};padding:${14 * s}px ${20 * s}px">
    ${icon('pin', '#fff', 26 * s)}<span class="n" style="font-size:${opt.head || 25}px">${esc(G.name)}</span><span class="s" style="font-size:${opt.sub || 16}px">– ${esc(G.sub)}</span></div>
  <div class="grid" style="padding:${14 * s}px;${opt.cols ? `grid-template-columns:repeat(${opt.cols},1fr)` : ''}">${G.cells.map(c => `
    <div class="cell" style="border-color:${c.color};padding:${12 * s}px">
      <div class="prov" style="color:${c.color};font-size:${opt.prov || 19}px">${icon('pin', c.color, 20 * s)}${esc(c.province)}</div>
      ${c.jobs.map(j => `<div class="gj"><div class="p" style="font-size:${opt.p || 15}px">${esc(j.pos)}</div><div class="c" style="font-size:${opt.c || 13.5}px">${esc(j.co)}</div><div class="m" style="font-size:${opt.m || 14}px">${esc(j.sal)}</div></div>`).join('')}
    </div>`).join('')}</div></div>`;

const foot = s => `<div class="foot">
  <div class="note" style="padding:${18 * s}px ${22 * s}px"><h4 style="font-size:${21 * s}px">Ghi chú</h4><ul style="margin-top:${8 * s}px">${d.notes.map(n => `<li style="font-size:${16 * s}px;margin-top:${6 * s}px"><span>${esc(n)}</span></li>`).join('')}</ul></div>
  <div class="cta" style="padding:${18 * s}px ${24 * s}px;font-size:${23 * s}px">${icon('send', '#fff', 54 * s)}<div><u>${esc(d.cta)}</u></div></div>
</div>`;

const facebook = () => `<div class="page" style="width:1080px;height:1350px">
  ${hero(1080, 372, 1)}
  <div style="padding:0 24px;margin-top:-34px;position:relative;z-index:3">${stats(0.82)}</div>
  <div style="display:flex;gap:16px;padding:16px 24px 0">
    <div style="flex:1;min-width:0">${list(d.lists[0], 0.85, { pos: 17.5, co: 14.5, sal: 15, dl: 13.5, head: 23, sub: 15, rowPad: 13 })}</div>
    <div style="flex:1;min-width:0">${list(d.lists[1], 0.85, { pos: 17.5, co: 14.5, sal: 15, dl: 13.5, head: 23, sub: 15, rowPad: 13 })}</div>
  </div>
  <div style="padding:16px 24px 0">${grid(d.grid, 0.9, { head: 23, sub: 15, prov: 21, p: 16.5, c: 14.5, m: 15.5 })}</div>
  <div style="padding:16px 24px 0">${foot(0.92)}</div>
</div>`;

const vFrame = inner => `<div class="page" style="width:1080px;height:1920px;display:flex;flex-direction:column">${inner}</div>`;
const vIntro = () => vFrame(`<div class="hero" style="height:900px;padding:90px 60px">
    <div class="logo" style="left:60px;top:80px;width:210px;height:150px"><img src="${logo}" style="width:166px"></div>
    <div class="t1" style="font-size:92px;margin-top:190px">BẢNG TIN<br>TUYỂN DỤNG</div>
    <div class="t2" style="font-size:112px;margin-top:18px">TỔNG HỢP</div>
    <div class="date" style="margin-top:40px;font-size:38px">${icon('calendar', '#fff', 44)} Ngày ${esc(d.date)}</div>
    <div class="slogan" style="right:60px;top:110px;font-size:36px">Nhiều cơ hội<br>tốt hơn tương lai<br>của bạn!<b></b></div>
  </div>
  <div style="padding:0 60px;margin-top:-60px;position:relative;z-index:3;display:flex;flex-direction:column;gap:22px">
    ${d.stats.map((x, i) => { const col = [C.blue1, C.orange, C.blue2][i % 3]; return `<div class="stat" style="padding:26px 34px;gap:26px">
      <div class="ic" style="width:96px;height:96px;background:${col}1A">${icon(x.icon, col, 52)}</div>
      <div class="v" style="font-size:84px;color:${i === 1 ? C.orange : C.navy}">${esc(x.value)}</div>
      <div class="l" style="font-size:34px">${esc(x.label)}</div></div>`; }).join('')}
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:0 60px">
    <div class="pill" style="font-size:32px;padding:16px 30px;box-shadow:0 4px 14px rgba(10,42,140,.12)">${icon('pin', C.blue1, 38)}${d.regionsLine.map(esc).join(' • ')}</div>
  </div>`);
const vHeader = (title) => `<div class="hero" style="height:250px;padding:56px 48px">
  <div class="logo" style="right:44px;top:50px;width:170px;height:124px"><img src="${logo}" style="width:134px"></div>
  <div class="t1" style="font-size:40px;opacity:.9">BẢNG TIN TUYỂN DỤNG</div>
  <div class="t2" style="font-size:64px;margin-top:14px">${esc(title)}</div></div>`;
const vList = L => vFrame(`${vHeader(L.name)}
  <div style="flex:1;padding:40px;display:flex;flex-direction:column;justify-content:center">${list(L, 2, { pos: 42, co: 32, sal: 34, dl: 30, head: 46, sub: 30, rowPad: 30, stack: true })}</div>`);
const vGrid = G => vFrame(`${vHeader('MIỀN TÂY')}
  <div style="flex:1;padding:40px;display:flex;flex-direction:column;justify-content:center">${grid(G, 2, { head: 42, sub: 28, cols: 2, prov: 46, p: 36, c: 29, m: 34 })}</div>`);
const vOutro = () => vFrame(`<div style="flex:1;background:linear-gradient(160deg,${C.navy},${C.blue1} 55%,${C.blue2});color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;text-align:center">
  <div style="background:#fff;border-radius:36px;padding:36px 44px"><img src="${logo}" style="width:300px;display:block"></div>
  <div style="margin-top:70px;font-size:68px;font-weight:900;line-height:1.15">Ứng tuyển<br><span style="color:${C.orange}">thế nào?</span></div>
  <div style="margin-top:40px;font-size:40px;font-weight:700;line-height:1.4">${esc(d.cta)}</div>
  <div style="margin-top:60px;font-size:34px;font-weight:600;opacity:.9;line-height:1.4">Việc mới mỗi ngày lúc 8:00 và 14:00</div>
  <div style="margin-top:50px;font-size:34px;font-weight:800;color:${C.orange};line-height:1.4">Nhà tuyển dụng thật<br>không bao giờ thu phí ứng viên</div>
</div>`);

(async () => {
  const b = await chromium.launch();
  const shot = async (html, w, h, file) => {
    const pg = await b.newPage({ viewport: { width: w, height: h } });
    await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`);
    await pg.screenshot({ path: path.join(out, file) });
    await pg.close();
  };
  await shot(facebook(), 1080, 1350, 'bangtin.png');
  const frames = [vIntro(), ...d.lists.map(vList), vGrid(d.grid), vOutro()];
  for (let i = 0; i < frames.length; i++) await shot(frames[i], 1080, 1920, `v${i}.png`);
  await b.close();
})();
