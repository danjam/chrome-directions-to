const MENU_ID = "directions-to";

const DEFAULTS = {
  places: [],        // [{ name, address }]
  defaultIndex: 0,
  suffix: "UK",
  mode: "transit",
  when: "next",      // "now" | "next"
  day: 1,            // 0=Sun ... 6=Sat
  time: "07:00",     // HH:MM, local
  home: ""           // legacy single-address setting, migrated into places
};

async function loadSettings() {
  const s = await chrome.storage.local.get(DEFAULTS);
  if (!s.places.length && s.home) {
    s.places = [{ name: "Home", address: s.home }];
    s.defaultIndex = 0;
    await chrome.storage.local.set({ places: s.places, defaultIndex: 0 });
    await chrome.storage.local.remove("home");
  }
  return s;
}

// Chrome menu titles (verified against Chromium source, Oct 2026):
// - every "%s" is replaced with the selection; there is no %% escape
// - "&" in our title is a Windows mnemonic marker (Chrome escapes it in the selection, not in our text)
function escapeTitlePart(text) {
  return text.replace(/&/g, "&&").replace(/%s/g, "%\u200Bs");
}

function menuTitle(s) {
  const origin = s.places[s.defaultIndex] || s.places[0];
  return origin
    ? `Directions from ${escapeTitlePart(origin.name)} to "%s"`
    : 'Get directions to "%s"';
}

async function buildMenu() {
  const s = await loadSettings();
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: MENU_ID, title: menuTitle(s), contexts: ["selection"] });
  return s;
}

chrome.runtime.onInstalled.addListener(async (details) => {
  const s = await buildMenu(); // also runs migration on update
  if (details.reason === "install" || !s.places.length) chrome.runtime.openOptionsPage();
});

chrome.runtime.onStartup.addListener(buildMenu);

// Keep the menu title in sync with the default place.
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !(changes.places || changes.defaultIndex)) return;
  const s = await loadSettings();
  chrome.contextMenus.update(MENU_ID, { title: menuTitle(s) });
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

function cleanPlace(text) {
  return text
    .replace(/\s+/g, " ")
    // strip things like "· 12 miles away" / "5 km" that sites put next to the town
    .replace(/[·•|]?\s*\d+(\.\d+)?\s*(miles?|mi|km|kilometres?|kilometers?)\b.*$/i, "")
    .replace(/^[\s,·•|-]+|[\s,·•|-]+$/g, "")
    .trim();
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const s = await loadSettings();
  const origin = s.places[s.defaultIndex] || s.places[0];

  if (!origin || !origin.address) {
    chrome.runtime.openOptionsPage();
    return;
  }

  let dest = cleanPlace(info.selectionText);
  if (!dest) return;
  if (s.suffix && !dest.toLowerCase().includes(s.suffix.toLowerCase())) {
    dest = `${dest}, ${s.suffix}`;
  }

  const departSecs = s.when === "next" ? nextDepartureSecs(Number(s.day), s.time) : null;
  chrome.tabs.create({ url: buildUrl(origin.address, dest, s.mode, departSecs) });
});

// Google Maps' documented URL API has no departure-time parameter, so this uses
// the undocumented /maps/dir/ "data=" format (verified working Oct 2026):
//   !2m3!6e0!7e2!8j<secs>  -> depart at <secs> (local wall-clock time encoded as if UTC)
//   !3e<n>                 -> mode: 0 driving, 1 cycling, 2 walking, 3 transit
const MODE_CODE = { driving: 0, bicycling: 1, walking: 2, transit: 3 };

// Next occurrence of <day> at <HH:MM> after now. Today counts if that time hasn't passed yet.
function nextDepartureSecs(day, time, now = new Date()) {
  const [hh, mm] = (time || "07:00").split(":").map(Number);
  let daysAhead = (day - now.getDay() + 7) % 7;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  if (daysAhead === 0 && nowMins >= hh * 60 + mm) daysAhead = 7;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0) / 1000;
}

function buildUrl(origin, dest, mode, departSecs) {
  const code = MODE_CODE[mode] ?? 3;
  const data = departSecs
    ? `!4m6!4m5!2m3!6e0!7e2!8j${departSecs}!3e${code}`
    : `!4m2!4m1!3e${code}`; // leave now
  return (
    "https://www.google.com/maps/dir/" +
    encodeURIComponent(origin) + "/" +
    encodeURIComponent(dest) +
    "/data=" + data
  );
}
