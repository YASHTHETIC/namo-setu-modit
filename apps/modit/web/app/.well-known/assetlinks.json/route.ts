/**
 * Digital Asset Links for Google Play (Trusted Web Activity).
 *
 * REPLACE the placeholder fingerprint below with the real SHA-256 of the
 * app-signing certificate BEFORE publishing. Get it from:
 *  - PWABuilder download page ("Signing key" section), or
 *  - Play Console → Setup → App integrity → App signing key certificate.
 *
 * Verify after deploy: https://modit.in/.well-known/assetlinks.json
 * must return this file with Content-Type: application/json.
 */
const STATEMENTS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      // TODO: replace with real SHA-256 from Play Console → Setup → App integrity.
      package_name: "in.modit.app",
      sha256_cert_fingerprints: ["REPLACE_WITH_REAL_SHA256_FINGERPRINT"],
    },
  },
];

export async function GET() {
  return Response.json(STATEMENTS, {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
  });
}
