import { NextResponse } from "next/server";

/**
 * Digital Asset Links for the Play Store TWA (in.modit.app).
 * Google Play looks this up at https://modit.in/.well-known/assetlinks.json
 * during install to verify the Android app owns the website domain —
 * without a matching SHA-256 the TWA opens in a browser bar instead
 * of fullscreen. Fingerprints live here (public data, not a secret).
 */
const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "in.modit.app",
      sha256_cert_fingerprints: [
        "5A:39:D3:07:6A:82:D1:38:CB:3B:03:2C:DB:F8:79:80:8F:1F:A7:23:19:20:26:CD:5E:C2:55:D7:7E:D3:22:31",
      ],
    },
  },
];

export function GET() {
  return NextResponse.json(ASSET_LINKS, {
    headers: { "Content-Type": "application/json" },
  });
}
