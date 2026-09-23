import pkg from "../../../../package.json" with { type: "json" };

export async function GET() {
  const currentVersion = pkg.version;
  return Response.json({ currentVersion, latestVersion: currentVersion, hasUpdate: false });
}
