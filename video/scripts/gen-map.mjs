// Tạo đường viền bản đồ miền Nam (Việt Nam, Campuchia) thành chuỗi SVG path, chạy một lần: node scripts/gen-map.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/countries-10m.json", import.meta.url)));
const all = feature(topo, topo.objects.countries).features;
const W = 1000, H = 1000;
const bbox = { type: "Feature", geometry: { type: "MultiPoint", coordinates: [[103.6, 8.4], [107.4, 11.6]] } };
const proj = geoMercator().fitExtent([[0, 0], [W, H]], bbox);
const path = geoPath(proj);
const get = (name) => path(all.find((f) => f.properties.name === name)).replace(/(\d+\.\d{1})\d+/g, "$1");
writeFileSync(
  new URL("../src/map/south.json", import.meta.url),
  JSON.stringify({ w: W, h: H, scale: proj.scale(), translate: proj.translate(), vn: get("Vietnam"), kh: get("Cambodia") }),
);
console.log("ok");
