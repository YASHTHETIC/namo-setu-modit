# Play Store — build & publish MODIT Android app (TWA)

The project is pre-wired: `playstore/twa-manifest.json` is the Bubblewrap config,
the upload keystore exists at `playstore/keys/modit-upload.keystore` (gitignored,
on the dev machine), and `apps/modit/web/public/.well-known/assetlinks.json`
carries its SHA-256 so Android verifies app↔domain ownership on
`https://modit.in/.well-known/assetlinks.json` automatically.

## One-time setup (~15 min)

1. Install the wrapper CLI (uses its own bundled JDK/Android SDK on first run):
   ```
   npm i -g @bubblewrap/cli
   bubblewrap doctor          # installs what's missing
   ```
2. Point Bubblewrap at the existing config + keystore:
   ```
   cd playstore
   bubblewrap init --manifest https://modit.in/manifest.json --directory .
   # when asked, import the existing key:
   bubblewrap updateConfig    # or edit twa-manifest.json signingKey.path below
   ```
3. Build the signed bundle:
   ```
   bubblewrap build           # → app-release-signed.aab
   ```
   If the build picks a fresh key instead of ours, set:
   ```
   bubblewrap update --skipVersionUpgrade --signingKeyPath keys/modit-upload.keystore
   ```
   Keystore passwords (local secrets file): see `keys/SECRETS.txt` — do not commit.

## Publish (~40 min, needs the fee)

1. Play Console account: USD 25 one-time (before you can upload anything).
2. Create app "MODIT - Construction Materials", category Shopping.
3. Upload `app-release-signed.aab` → internal testing track first.
4. Store listing assets: 512×512 launcher icon (have: `public/icons/icon-512.png`),
   2 screenshots minimum from a real phone, feature graphic 1024×500,
   privacy policy URL `https://modit.in/privacy` (live page already exists).
5. Content rating questionnaire, data-safety form (Razorpay handles cards —
   declare: collects name/phone/address, no card data read by app).
6. Submit → review usually 1–7 days.

## Release / version bumps

- Any code change requires bumping `versionCode`/`versionName` in
  `playstore/twa-manifest.json`, then `bubblewrap update && bubblewrap build`.
- Rotating a lost keystore = publishing crisis — back up
  `playstore/keys/modit-upload.keystore` to a password manager NOW.
