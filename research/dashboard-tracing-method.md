# Dashboard-tracing method

**The problem:** a lot of real city GIS data isn't listed on a clean, developer-facing "open data portal" page. It's the backing service behind a public, citizen-facing ArcGIS **dashboard** or web map — built for someone to look something up in a browser, not for a developer to query. Socrata-based portals (SF, Chicago, NYC) tend to advertise their APIs directly. ArcGIS-based cities often don't — but the data is still there, and still queryable, once you know where to look.

**How to find it:**

1. Get the dashboard's ArcGIS item ID from its URL (`arcgis.com/apps/dashboards/<id>`).
2. Query the item's metadata: `https://www.arcgis.com/sharing/rest/content/items/<id>?f=json` — look for a reference to a **Web Map** item ID inside the dashboard's own layout config.
3. Query that Web Map's data: `https://www.arcgis.com/sharing/rest/content/items/<webmap-id>/data?f=json` — this lists every `operationalLayers[]` entry, each with a real `url` pointing at the actual backing Feature Service.
4. Query the Feature Service directly: `<url>?f=json` for schema, `<url>/query?where=1=1&outFields=*&f=json` for real records. No API key needed for public services.

**Confirmed working on:**
- LA's street sweeping dashboard → `Posted_Street_Sweeping_Routes_Update` FeatureServer
- LA's Preferential Parking Districts dashboard → `LADOT_PPD` FeatureServer

Both documented in full in [Los Angeles](los-angeles.md).

**Where to apply this next:** any jurisdiction marked "unconfirmed" or "gap" in the coverage list — that status may just mean nobody's traced the dashboard yet, not that the data doesn't exist. Chicago and Seattle's sweeping-schedule gaps are the most likely next candidates for this to overturn, given LA's own gap turned out to be wrong twice.
