/**
 * Digital Asset Links for Google Play (Trusted Web Activity).
 *
 * Serves an empty statement list until the real app-signing SHA-256 is
 * configured — an unverified fingerprint would fail Play verification
 * anyway, so we assert nothing until then.
 *
 * When the app is published, set ANDROID_SHA256_FINGERPRINT
 * (Play Console → Setup → App integrity → App signing key certificate)
 * and this endpoint starts serving the verified statement.
 *
 * Verify after deploy: https://modit.in/.well-known/assetlinks.json
 */
const FINGERPRINT = (process.env.ANDROID_SHA256_FINGERPRINT || "").trim();

export async function GET() {
  const statements =
    FINGERPRINT.length > 0
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: "in.modit.app",
              sha256_cert_fingerprints: [FINGERPRINT],
            },
          },
        ]
      : [];
  return Response.json(statements, {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
  });
}
