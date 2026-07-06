// Chalked v0 — LA sweeping only, thin vertical slice.
// Status model: green (clear) / amber (restriction starts soon) / red (restricted now).
// Amber threshold is tunable — see SPEC.md "Visual design: color-coded parking status".
const AMBER_THRESHOLD_HOURS = 2;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

function renderPanel(zone, status) {
  statusPanel.innerHTML =
    `<span class="dot ${status.level}"></span>` +
    `<strong>${zone.route_id}</strong> (${zone.maintenance_district_name}) — ${zone.day_of_week}s, ` +
    `${zone.start_time}–${zone.end_time}, weeks ${zone.weeks_of_month.join(" & ")}, ` +
    `${zone.side_of_street} side. ${status.label}`;
}

// Meters aren't a restriction with a status level -- they're a cost fact (SPEC.md's
// "Visual design" section: meters get their own treatment, not the green/amber/red scale).
// No color dot here on purpose; a blue marker on the map is enough to mark "this is a meter."
function renderMeterPanel(meter) {
  statusPanel.innerHTML =
    `<span class="dot blue"></span>` +
    `<strong>Meter ${meter.space_id}</strong> — ${meter.blockface}. ` +
    `${meter.rate_type} rate ${meter.rate}, ${meter.time_limit} limit. ` +
    `<em>No operating-hours/schedule data available for LA meters (see research/cities/los-angeles.md) — ` +
    `check the posted meter sign for when payment is actually required.</em>`;
}

// Permits are an eligibility gate, not a timing question (SPEC.md's Visual design section)
// -- the app can't know if *this user* holds the right permit for *this* district, so it's
// a flag, not a status level. The 2015 staleness (research/cities/los-angeles.md) is
// surfaced directly here, not just in docs -- a decade-old boundary shouldn't read with
// the same confidence as fresh data.
function renderPermitPanel(district) {
  statusPanel.innerHTML =
    `<span class="dot blue"></span>` +
    `<strong>Preferential Parking District ${district.district_number}</strong> ` +
    `(${district.district_name}) — permit required for unrestricted parking here. ` +
    `<strong style="color:#c62828">Data as of ${district.data_as_of}</strong> — LADOT hasn't ` +
    `confirmed an update since then, so district boundaries may not reflect changes made after that date.`;
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
