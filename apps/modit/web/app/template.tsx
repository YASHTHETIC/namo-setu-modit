/**
 * Route-change entrance. Next.js remounts this on every navigation, so
 * each page fades/rises in once (see .page-in in globals.css). The
 * wrapper is layout-invisible: pages keep their own min-height/spacing,
 * and the sticky shell header lives outside this tree.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
