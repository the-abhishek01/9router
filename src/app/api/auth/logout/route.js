import { NextResponse } from "next/server";
import { clearDashboardAuthCookie } from "@/lib/auth/dashboardSession";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  clearDashboardAuthCookie(response.cookies);
  response.cookies.delete("oidc_state");
  response.cookies.delete("oidc_nonce");
  response.cookies.delete("oidc_code_verifier");
  response.cookies.delete("saml_state");

  return response;
}
