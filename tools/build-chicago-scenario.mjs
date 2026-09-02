// One-shot generator for the "Chicago by Night" scenario geometry
// (regions.geojson + cities.geojson). Hand-authored approximations of the
// district boundaries; refinable later in the in-game map editor.
// Run: node tools/build-chicago-scenario.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "server", "data", "scenarios", "chicago-by-night");
mkdirSync(OUT, { recursive: true });

const CAMARILLA = "Chicago Camarilla";
const ANARCHS = "Chicago Anarch Movement";
const HECATA = "Hecata Family";

// [id, name, owner, claimants, ring]
const districts = [
  ["chi_loop", "The Loop", "", [CAMARILLA, ANARCHS], [
    [-87.636, 41.874], [-87.618, 41.874], [-87.612, 41.881], [-87.607, 41.887],
    [-87.614, 41.893], [-87.630, 41.893], [-87.636, 41.884],
  ]],
  ["chi_rivernorth", "River North & West Loop", CAMARILLA, null, [
    [-87.636, 41.874], [-87.670, 41.874], [-87.672, 41.890], [-87.665, 41.898],
    [-87.648, 41.898], [-87.636, 41.890],
  ]],
  ["chi_goldcoast", "Gold Coast & North Side", CAMARILLA, null, [
    [-87.614, 41.893], [-87.630, 41.893], [-87.634, 41.905], [-87.638, 41.925],
    [-87.646, 41.945], [-87.700, 41.945], [-87.700, 41.905], [-87.665, 41.898],
    [-87.648, 41.898], [-87.630, 41.896],
  ]],
  ["chi_hydepark", "Hyde Park & University", CAMARILLA, [ANARCHS], [
    [-87.606, 41.794], [-87.594, 41.798], [-87.591, 41.808], [-87.610, 41.812],
    [-87.618, 41.802], [-87.614, 41.795],
  ]],
  ["chi_pilsen", "Pilsen", ANARCHS, null, [
    [-87.640, 41.857], [-87.640, 41.870], [-87.636, 41.874], [-87.618, 41.874],
    [-87.610, 41.866], [-87.608, 41.857],
  ]],
  ["chi_littlevillage", "Little Village", ANARCHS, null, [
    [-87.735, 41.844], [-87.685, 41.844], [-87.685, 41.872], [-87.735, 41.872],
  ]],
  ["chi_northwest", "Northwest Side", ANARCHS, null, [
    [-87.672, 41.878], [-87.672, 41.905], [-87.700, 41.905], [-87.700, 41.945],
    [-87.742, 41.945], [-87.750, 41.920], [-87.745, 41.885], [-87.735, 41.872],
    [-87.685, 41.872], [-87.680, 41.874],
  ]],
  ["chi_southshore", "South Shore", ANARCHS, null, [
    [-87.610, 41.752], [-87.580, 41.756], [-87.576, 41.790], [-87.591, 41.808],
    [-87.610, 41.812], [-87.614, 41.795], [-87.612, 41.770],
  ]],
  ["chi_bridgeport", "Bridgeport", HECATA, null, [
    [-87.610, 41.830], [-87.608, 41.857], [-87.640, 41.857], [-87.642, 41.845],
    [-87.634, 41.832],
  ]],
  ["chi_littleitaly", "Little Italy & Tri-Taylor", HECATA, null, [
    [-87.640, 41.857], [-87.640, 41.870], [-87.636, 41.874], [-87.636, 41.890],
    [-87.648, 41.898], [-87.665, 41.898], [-87.672, 41.890], [-87.672, 41.878],
    [-87.685, 41.872], [-87.685, 41.860], [-87.660, 41.857],
  ]],
  ["chi_farsouth", "Far South Side", "", null, [
    [-87.610, 41.752], [-87.612, 41.770], [-87.614, 41.795], [-87.618, 41.802],
    [-87.622, 41.808], [-87.640, 41.812], [-87.650, 41.780], [-87.680, 41.750],
    [-87.690, 41.700], [-87.700, 41.665], [-87.650, 41.660], [-87.620, 41.700],
    [-87.612, 41.730],
  ]],
  ["chi_farnorth", "Far North Side", "", null, [
    [-87.646, 41.945], [-87.700, 41.945], [-87.735, 41.950], [-87.720, 41.995],
    [-87.672, 41.995], [-87.660, 41.968], [-87.638, 41.952],
  ]],
];

// [name, lng, lat, tier, population, capital]
const sites = [
  ["Palmer House", -87.6268, 41.8810, 4, 960000, "primary"],
  ["Auditorium Theatre", -87.6247, 41.8759, 3, 800000, ""],
  ["Wrigley Field", -87.6557, 41.9440, 3, 750000, ""],
  ["Newberry Library", -87.6293, 41.9017, 2, 500000, ""],
  ["The Whitford Institute", -87.6155, 41.8965, 2, 450000, ""],
  ["FBI Special Affairs Office", -87.6250, 41.8780, 2, 400000, ""],
  ["Costa Funeral Services", -87.6350, 41.8450, 2, 350000, ""],
  ["La Catrina", -87.6300, 41.8620, 2, 300000, ""],
  ["The Glass Door", -87.6790, 41.9020, 1, 150000, ""],
  ["Sol's 19th & Damen Haven", -87.6760, 41.8580, 1, 120000, ""],
];

const regions = {
  type: "FeatureCollection",
  features: districts.map(([id, name, owner, claimants, ring]) => ({
    type: "Feature",
    properties: {
      id,
      name,
      owner,
      gid0: "",
      country: "",
      typeId: "land",
      ...(claimants ? { claimants } : {}),
    },
    geometry: { type: "Polygon", coordinates: [[...ring, ring[0]]] },
  })),
};

const cities = {
  type: "FeatureCollection",
  features: sites.map(([city, lng, lat, tier, population, capital]) => ({
    type: "Feature",
    properties: { city, tier, population, ...(capital ? { capital } : {}) },
    geometry: { type: "Point", coordinates: [lng, lat] },
  })),
};

writeFileSync(join(OUT, "regions.geojson"), JSON.stringify(regions, null, 1) + "\n");
writeFileSync(join(OUT, "cities.geojson"), JSON.stringify(cities, null, 1) + "\n");
console.log(`wrote ${regions.features.length} districts, ${cities.features.length} sites`);
