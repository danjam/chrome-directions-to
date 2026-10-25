# Directions To

A Chrome extension: highlight a place name on any web page, right-click, and open
Google Maps directions to it from one of your saved starting points.

## Features

- Right-click selected text → **Directions from <your default place> to "<selection>"**
- Multiple saved starting places (Home, Work, …), with one marked as default
- Travel mode: transit, walking, cycling or driving
- Departure: **leave now**, or **next <day> at <time>** (e.g. next Monday 07:00), so
  public transport results reflect a realistic journey
- Strips trailing distance text like "· 12 miles away" from the selection
- Optional region suffix (e.g. "UK") to disambiguate town names
- No tracking, no network requests of its own. Settings are stored locally in your
  browser (`chrome.storage.local`) and only leave it as part of the Maps URL you open

## Install

Not on the Chrome Web Store. Install it manually:

1. Download `chrome-directions-to-vX.Y.Z.zip` from the
   [latest release](../../releases/latest)
2. Unzip it somewhere permanent (not Downloads). Chrome loads it from that folder
   every time it starts.
3. Open `chrome://extensions` and turn on **Developer mode**
4. Click **Load unpacked** and select the unzipped folder
5. The settings page opens. Add at least one place and save

To update: replace the folder contents with the new release and click the reload
icon on the extension's card.

Developers can clone the repo and load the `extension/` folder directly.

## Usage

1. Highlight a town or place on any page
2. Right-click → **Directions from Home to "…"** (or whichever place is your default)
3. Google Maps opens in a new tab with the route

Click the toolbar icon to open settings, where you can change places, the default,
travel mode and departure time.

## How the departure time works

Google's documented Maps URL format (`/maps/dir/?api=1`) has no departure-time
parameter. This extension uses the undocumented `/maps/dir/<from>/<to>/data=…`
format instead:

| Segment | Meaning |
|---|---|
| `!2m3!6e0!7e2!8j<secs>` | Depart at `<secs>`: local wall-clock time encoded as if UTC |
| `!3e<n>` | Mode: 0 driving, 1 cycling, 2 walking, 3 transit |

Verified working in October 2026. Because it's undocumented, Google could change it
without notice. If the departure time stops being applied, that's the likely cause.

"Next <day>" includes today if that time hasn't passed yet.

## Permissions

| Permission | Why |
|---|---|
| `contextMenus` | Adds the right-click item |
| `storage` | Saves your places and preferences locally |

No host permissions. The extension never reads page content beyond the text you
select and right-click.

## Licence

MIT, see [LICENSE](LICENSE).
