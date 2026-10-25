# CLAUDE.md

Chrome MV3 extension. Plain JS, no build step, no dependencies.

## Layout
- `extension/`: exactly what Chrome loads and what ships in the release zip. Nothing else goes here.
  - `background.js`: service worker. Context menu, settings migration, Maps URL builder
  - `options.html` / `options.js`: settings page (also opened by the toolbar icon)
- `icons-src/icon.svg` → `extension/icon48.png`, `icon128.png`
- `icons-src/icon-small.svg` → `extension/icon16.png`, `icon32.png`
  (the small icon is a separate design drawn on a 16px grid, not a downscale)
- `.github/workflows/release.yml`: builds the zip and creates the release on tag push

## Non-obvious constraints
- **Maps URL:** the documented `?api=1` format has no departure time, so we use the
  undocumented `/maps/dir/<from>/<to>/data=` format. `!8j<secs>` is local wall-clock
  time encoded as if UTC. Leave now is `!4m2!4m1!3e<mode>`. If you change it, verify
  in a real browser; there's no spec.
- **Menu titles** (verified against Chromium source, Oct 2026):
  - Chrome substitutes every `%s` with no `%%` escape, so neutralise `%s` in
    user-supplied text (`escapeTitlePart`)
  - Chrome escapes `&` in the selection but not in our title, so double `&` in
    user-supplied text
  - The selection is truncated to 50 chars and the full title to 75
- **Single top-level menu item only:** with more than one, Chrome collapses them under
  the extension name
- **Settings migration:** the legacy `home` key is migrated to `places[]` in
  `loadSettings()`. Keep it until it's safe to assume no v0 installs remain.

## Release
1. Bump `version` in `extension/manifest.json` and commit
2. `git tag vX.Y.Z && git push && git push --tags`
3. CI checks the tag matches the manifest version, zips `extension/`, and creates the release

## Testing
No test suite. Load unpacked (`extension/`) in `chrome://extensions` and reload after changes.
Context menus are drawn natively, so browser automation can't see them; verify by hand.
