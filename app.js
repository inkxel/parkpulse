// Chalked v0 — LA sweeping only, thin vertical slice.
// Status model: green (clear) / amber (restriction starts soon) / red (restricted now).
// Amber threshold is tunable — see SPEC.md "Visual design: color-coded parking status".
const AMBER_THRESHOLD_HOURS = 2;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Census state FIPS -> USPS abbreviation, for displaying national-layer jurisdiction names.
const FIPS_TO_STATE = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
  "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
  "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
  "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
  "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY", "60": "AS", "66": "GU", "69": "MP", "72": "PR", "78": "VI",
};

function nthWeekdayOfMonth(date) {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

// Finds the next occurrence (today or later, searched forward day by day) of a zone's
// posted day-of-week + week-of-month rule, and returns hours until its start/end
// relative to `now`. Only searches a few weeks ahead — plenty for an amber threshold
// measured in hours, not an arbitrary future-scheduling engine.
function nextOccurrence(now, zone) {
  const targetDow = DAY_NAMES.indexOf(zone.day_of_week);
  if (targetDow === -1) return null;

  for (let offset = 0; offset < 35; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    day.setHours(0, 0, 0, 0);
    if (day.getDay() !== targetDow) continue;
    if (!zone.weeks_of_month.includes(nthWeekdayOfMonth(day))) continue;

    const [sh, sm] = zone.start_time.split(":").map(Number);
    const [eh, em] = zone.end_time.split(":").map(Number);
    const start = new Date(day);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(day);
    end.setHours(eh, em, 0, 0);

    if (end > now) return { start, end };
  }
  return null;
}

function statusFor(now, zone) {
  const occ = nextOccurrence(now, zone);
  if (!occ) return { level: "green", label: "Clear — no upcoming sweeping found" };

  if (now >= occ.start && now <= occ.end) {
    return { level: "red", label: `Restricted now — sweeping until ${formatTime(occ.end)}` };
  }
  const hoursUntil = (occ.start - now) / 36e5;
  if (hoursUntil <= AMBER_THRESHOLD_HOURS) {
    return { level: "amber", label: `Clear, but sweeping starts ${formatRelative(hoursUntil)}` };
  }
  return { level: "green", label: `Clear — next sweeping ${occ.start.toLocaleDateString()} ${formatTime(occ.start)}` };
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatRelative(hours) {
  const mins = Math.round(hours * 60);
  if (mins < 60) return `in ${mins} min`;
  return `in ${Math.round(hours * 10) / 10} hr`;
}

function colorFor(level) {
  return { green: "#2e7d32", amber: "#d99e00", red: "#c62828" }[level];
}

// Debug-only clock override for validating that status coloring actually differentiates
// (?debugTime=2026-07-06T08:30:00-07:00), instead of trusting it because a live screenshot
// happened to be all-green. Never used for real users; a visible banner marks it clearly.
const DEBUG_TIME = new URLSearchParams(location.search).get("debugTime");
function getNow() {
  return DEBUG_TIME ? new Date(DEBUG_TIME) : new Date();
}
if (DEBUG_TIME) {
  const banner = document.createElement("div");
  banner.style.cssText =
    "background:#fff3cd;color:#7a5c00;padding:0.4rem 1rem;font-size:0.8rem;text-align:center;border-bottom:1px solid #e0c46c;";
  banner.textContent = `⚠ Debug clock active — simulating ${getNow().toString()}, not real time.`;
  document.body.insertBefore(banner, document.body.firstChild);
}

// First-run disclaimer notice (SPEC.md "Trust, error reporting & disclaimer") -- shown once
// per browser via localStorage, not once per page load, so it's a real deliberate read
// rather than a modal muscle-memory dismisses without looking. The persistent footer strip
// in index.html stays too, for anyone who wants to re-check it later without clearing storage.
const DISCLAIMER_ACK_KEY = "chalked_disclaimer_ack_v1";
const disclaimerOverlay = document.getElementById("disclaimer-modal-overlay");
if (localStorage.getItem(DISCLAIMER_ACK_KEY)) {
  disclaimerOverlay.classList.add("hidden");
}
document.getElementById("disclaimer-ack-btn").addEventListener("click", () => {
  localStorage.setItem(DISCLAIMER_ACK_KEY, "1");
  disclaimerOverlay.classList.add("hidden");
});

const map = L.map("map").setView([34.0522, -118.2437], 11);
// Exposed for QA/testing (e.g. Playwright driving the map programmatically).
// Gotcha worth remembering: map.latLngToContainerPoint() returns coordinates relative to
// the #map div, not the page -- add document.getElementById("map").getBoundingClientRect()'s
// left/top before feeding a computed point to something like Playwright's page.mouse.click(),
// which expects page-relative coordinates. Missing this offset (the header's height) produces
// a "close but always misses" click that looks like an app bug but isn't -- confirmed by
// firing the Leaflet click event directly on the layer object instead, which worked.
window.map = map;
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

const statusPanel = document.getElementById("status-panel");
let sweepingData = null;
let geoLayer = null;

// Per-category confidence/staleness badge -- SPEC.md's "Trust, error reporting &
// disclaimer" section: the data_as_of timestamp (schema/common-schema.md) needs to be a
// visible signal in the UI, not just a schema field nobody sees. Silent staleness reads as
// confident when it isn't, which is worse than showing no data at all -- LA's permits (2015)
// is the concrete case that forced this, but the badge is shared across all three
// categories so a future stale sweeping/meters source gets the same honest treatment
// automatically, not a bespoke one-off like the old permits-only text did.
const STALE_THRESHOLD_DAYS = 180;

function confidenceBadge(dataAsOf) {
  if (!dataAsOf) return `<span style="color:#888">Data vintage unknown.</span>`;
  const asOfDate = new Date(dataAsOf);
  const ageDays = (getNow() - asOfDate) / 86400000;
  const label = asOfDate.toLocaleDateString();
  if (ageDays > STALE_THRESHOLD_DAYS) {
    return `<strong style="color:#c62828">Data as of ${label} — may be outdated.</strong>`;
  }
  return `<span style="color:#2e7d32">Data current as of ${label}.</span>`;
}

// Builds a prefilled GitHub issue-creation link rather than posting anything ourselves --
// see schema/error-report-pipeline.md for why (no backend, no anonymous auto-post; a real
// GitHub account to submit through IS the anti-spam/moderation step, not a placeholder for
// one). GitHub's issue forms prefill fields whose id matches a query param name.
function reportIssueUrl(category, jurisdictionLabel) {
  const params = new URLSearchParams({
    template: "data-issue.yml",
    title: `[data-issue] ${category} — ${jurisdictionLabel}`,
    jurisdiction: jurisdictionLabel,
    category,
  });
  return `https://github.com/inkxel/chalked/issues/new?${params.toString()}`;
}

function reportLink(category, jurisdictionLabel) {
  return `<a href="${reportIssueUrl(category, jurisdictionLabel)}" target="_blank" rel="noopener">Report a problem →</a>`;
}

function renderPanel(zone, status) {
  statusPanel.innerHTML =
    `<span class="dot ${status.level}"></span>` +
    `<strong>${zone.route_id}</strong> (${zone.maintenance_district_name}) — ${zone.day_of_week}s, ` +
    `${zone.start_time}–${zone.end_time}, weeks ${zone.weeks_of_month.join(" & ")}, ` +
    `${zone.side_of_street} side. ${status.label} ${confidenceBadge(zone.data_as_of)} ` +
    reportLink("sweeping", "Los Angeles, CA");
}

// Meters aren't a restriction with a status level -- they're a cost fact (SPEC.md's
// "Visual design" section: meters get their own treatment, not the green/amber/red scale).
// No color dot here on purpose; a blue marker on the map is enough to mark "this is a meter."
function renderMeterPanel(meter) {
  statusPanel.innerHTML =
    `<span class="dot blue"></span>` +
    `<strong>Meter ${meter.space_id}</strong> — ${meter.blockface}. ` +
    `${meter.rate_type} rate ${meter.rate}, ${meter.time_limit} limit. ${confidenceBadge(meter.data_as_of)} ` +
    `<em>No operating-hours/schedule data available for LA meters (see research/cities/los-angeles.md) — ` +
    `check the posted meter sign for when payment is actually required.</em> ` +
    reportLink("meters", "Los Angeles, CA");
}

// Permits are an eligibility gate, not a timing question (SPEC.md's Visual design section)
// -- the app can't know if *this user* holds the right permit for *this* district, so it's
// a flag, not a status level. The 2015 staleness (research/cities/los-angeles.md) now comes
// through the shared confidenceBadge() instead of bespoke inline text, same as the other
// two categories.
function renderPermitPanel(district) {
  statusPanel.innerHTML =
    `<span class="dot blue"></span>` +
    `<strong>Preferential Parking District ${district.district_number}</strong> ` +
    `(${district.district_name}) — permit required for unrestricted parking here. ` +
    `${confidenceBadge(district.data_as_of)} LADOT hasn't confirmed an update since then, so ` +
    `district boundaries may not reflect changes made after that date. ` +
    reportLink("permits", "Los Angeles, CA");
}

function styleFeature(now) {
  return (feature) => {
    const status = statusFor(now, feature.properties);
    return { color: colorFor(status.level), weight: 1, fillOpacity: 0.45 };
  };
}

function refreshColors() {
  if (!geoLayer) return;
  const now = getNow();
  geoLayer.setStyle(styleFeature(now));
}

// National base layer + coverage registry (SPEC.md's "national map shell from day one").
// 19,731 places rendered via the canvas renderer, non-interactive per-feature -- with
// this many polygons, per-feature DOM/hit-testing (the default SVG renderer path) would
// be far too slow. Interactivity is handled once, at the map level, via turf lookup
// against the already-loaded data instead of ~20k individual Leaflet click listeners.
let nationalPlacesData = null;
let coverageRegistry = null;

// A jurisdiction is "covered" (blue outline) if ANY category is actually built -- see
// schema/coverage-registry.md. Partial coverage (e.g. a future "Chicago minus meters")
// still reads as covered at this national zoom level; the per-category gap only becomes
// visible once you're inside that jurisdiction, which is the intended behavior.
function isCovered(registryEntry) {
  return !!registryEntry && Object.values(registryEntry.categories).some((status) => status === "built");
}

Promise.all([
  fetch("data/national-places.geojson").then((r) => r.json()),
  fetch("data/coverage_registry.json").then((r) => r.json()),
]).then(([places, registry]) => {
  nationalPlacesData = places;
  coverageRegistry = registry;

  L.geoJSON(places, {
    renderer: L.canvas(),
    interactive: false,
    style: (feature) => {
      return isCovered(coverageRegistry[feature.properties.place_id])
        ? { color: "#1565c0", weight: 1.5, fillOpacity: 0, opacity: 0.6 }
        : { color: "#555", weight: 0.6, fillColor: "#888", fillOpacity: 0.55, opacity: 0.6 };
    },
  }).addTo(map);
}).catch((err) => {
  statusPanel.textContent = "Couldn't load the national coverage map: " + err.message;
});

// One click handler for the whole national layer, not ~20k per-feature ones (see above).
// Only fires for clicks that no more-specific layer (sweeping/meters/permits) already
// handled -- Leaflet's path click handlers stop propagation to the map by default, so a
// click that actually lands on a colored zone never reaches here.
map.on("click", (e) => {
  if (!nationalPlacesData) return;
  const point = turf.point([e.latlng.lng, e.latlng.lat]);
  const place = nationalPlacesData.features.find((f) => turf.booleanPointInPolygon(point, f));

  if (!place) {
    statusPanel.textContent = "No jurisdiction found here (water, or an unincorporated area outside any incorporated place).";
    return;
  }

  const registryEntry = coverageRegistry[place.properties.place_id];
  if (isCovered(registryEntry)) {
    statusPanel.innerHTML =
      `You're in <strong>${place.properties.name}</strong> — click a colored sweeping/meters/permits zone above for its specific status, ` +
      `or this spot may just not have one nearby.`;
  } else {
    statusPanel.innerHTML =
      `You're in <strong>${place.properties.name}, ${FIPS_TO_STATE[place.properties.state_fips] || place.properties.state_fips}</strong> — ` +
      `<span style="color:#c62828">not covered yet.</span> ` +
      `<a href="https://github.com/inkxel/chalked" target="_blank">Help us add it →</a>`;
  }
});

fetch("data/la-sweeping.geojson")
  .then((r) => r.json())
  .then((data) => {
    sweepingData = data;
    const now = getNow();
    geoLayer = L.geoJSON(data, {
      style: styleFeature(now),
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          const status = statusFor(getNow(), feature.properties);
          renderPanel(feature.properties, status);
        });
      },
    }).addTo(map);
  })
  .catch((err) => {
    statusPanel.textContent = "Couldn't load sweeping data: " + err.message;
  });

// Keep colors honest if the page is left open across a status change.
setInterval(refreshColors, 60_000);

// Meters layer -- 34,943 individual points citywide, far too many for plain markers
// without choking the browser. Clustered (Leaflet.markercluster), off by default so the
// sweeping layer stays legible; toggle to load it in (fetched once, lazily).
let metersLayer = null;
let metersLoadPromise = null;

function loadMetersLayer() {
  if (metersLoadPromise) return metersLoadPromise;
  metersLoadPromise = fetch("data/la-meters.geojson")
    .then((r) => r.json())
    .then((data) => {
      metersLayer = L.markerClusterGroup({ disableClusteringAtZoom: 18 });
      data.features.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const marker = L.circleMarker([lat, lng], {
          radius: 5,
          color: "#1565c0",
          fillColor: "#1565c0",
          fillOpacity: 0.8,
          weight: 1,
        });
        marker.on("click", () => renderMeterPanel(feature.properties));
        metersLayer.addLayer(marker);
      });
      return metersLayer;
    })
    .catch((err) => {
      statusPanel.textContent = "Couldn't load meters data: " + err.message;
    });
  return metersLoadPromise;
}

document.getElementById("layer-meters").addEventListener("change", (e) => {
  if (e.target.checked) {
    loadMetersLayer().then((layer) => layer && map.addLayer(layer));
  } else if (metersLayer) {
    map.removeLayer(metersLayer);
  }
});

document.getElementById("layer-sweeping").addEventListener("change", (e) => {
  if (!geoLayer) return;
  if (e.target.checked) map.addLayer(geoLayer);
  else map.removeLayer(geoLayer);
});

// Permits layer -- only 155 districts citywide, small enough to render directly, no
// clustering needed. Distinct blue outline (not the sweeping green/amber/red scale),
// matching CURB's own "permit-blue" precedent for the same reason: eligibility, not timing.
let permitsLayer = null;
let permitsLoadPromise = null;

function loadPermitsLayer() {
  if (permitsLoadPromise) return permitsLoadPromise;
  permitsLoadPromise = fetch("data/la-permits.geojson")
    .then((r) => r.json())
    .then((data) => {
      permitsLayer = L.geoJSON(data, {
        style: { color: "#1565c0", weight: 1.5, fillOpacity: 0.15, dashArray: "4 3" },
        onEachFeature: (feature, layer) => {
          layer.on("click", () => renderPermitPanel(feature.properties));
        },
      });
      return permitsLayer;
    })
    .catch((err) => {
      statusPanel.textContent = "Couldn't load permits data: " + err.message;
    });
  return permitsLoadPromise;
}

document.getElementById("layer-permits").addEventListener("change", (e) => {
  if (e.target.checked) {
    loadPermitsLayer().then((layer) => layer && map.addLayer(layer));
  } else if (permitsLayer) {
    map.removeLayer(permitsLayer);
  }
});

// Address search via the free US Census Geocoder — no API key, and it's the same
// national data source (Census) already planned as the base boundary layer.
document.getElementById("search-btn").addEventListener("click", searchAddress);
document.getElementById("address-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchAddress();
});

let marker = null;

function searchAddress() {
  const address = document.getElementById("address-input").value.trim();
  if (!address) return;
  statusPanel.textContent = "Looking up address...";

  // Note: the US Census Geocoder (free, no key) was tried first, but it doesn't send
  // CORS headers, so a browser fetch is blocked outright — confirmed by testing it
  // directly, not assumed. Nominatim (OSM) does support CORS from a browser context
  // and was verified working the same way. Keep this if a nicer/quota-friendlier
  // option is needed later — see SPEC.md for the "no OSM dependency for regulation
  // data" rule, which doesn't apply here since this is geocoding, not rule data.
  // countrycodes=us matters, not just tidiness: a bare 5-digit ZIP like "90018" is
  // globally ambiguous (Italy uses the same format) and resolves to the wrong
  // country without it — found by actually testing a ZIP-only search, not assumed.
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      if (!data || data.length === 0) {
        statusPanel.textContent = "No match found for that address.";
        return;
      }
      const x = parseFloat(data[0].lon);
      const y = parseFloat(data[0].lat);
      const point = turf.point([x, y]);

      map.setView([y, x], 16);
      if (marker) map.removeLayer(marker);
      marker = L.marker([y, x]).addTo(map);

      if (!sweepingData) {
        statusPanel.textContent = "Sweeping data still loading — try again in a moment.";
        return;
      }
      const hit = sweepingData.features.find((f) => turf.booleanPointInPolygon(point, f));
      if (!hit) {
        statusPanel.innerHTML =
          '<span class="dot green"></span>No posted sweeping zone found at this address (or it\'s outside the covered area).';
        return;
      }
      renderPanel(hit.properties, statusFor(getNow(), hit.properties));
    })
    .catch((err) => {
      statusPanel.textContent = "Address lookup failed: " + err.message;
    });
}
