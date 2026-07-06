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

const map = L.map("map").setView([34.0522, -118.2437], 11);
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

function styleFeature(now) {
  return (feature) => {
    const status = statusFor(now, feature.properties);
    return { color: colorFor(status.level), weight: 1, fillOpacity: 0.45 };
  };
}

function refreshColors() {
  if (!geoLayer) return;
  const now = new Date();
  geoLayer.setStyle(styleFeature(now));
}

fetch("data/la-sweeping.geojson")
  .then((r) => r.json())
  .then((data) => {
    sweepingData = data;
    const now = new Date();
    geoLayer = L.geoJSON(data, {
      style: styleFeature(now),
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          const status = statusFor(new Date(), feature.properties);
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

  const url =
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress" +
    `?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      const matches = data.result?.addressMatches;
      if (!matches || matches.length === 0) {
        statusPanel.textContent = "No match found for that address.";
        return;
      }
      const { x, y } = matches[0].coordinates;
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
      renderPanel(hit.properties, statusFor(new Date(), hit.properties));
    })
    .catch((err) => {
      statusPanel.textContent = "Address lookup failed: " + err.message;
    });
}
