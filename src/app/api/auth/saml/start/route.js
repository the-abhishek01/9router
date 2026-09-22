import { NextResponse } from "next/server";
import { getSettings } from "@/lib/localDb";
import { buildSamlAuthorizeUrl, getSamlBaseUrl, isSamlConfigured } from "@/lib/auth/saml";
import { shouldUseSecureCookie } from "@/lib/auth/dashboardSession";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const settings = await getSettings();
  const origin = getSamlBaseUrl(request, settings);
  try {
    if (!isSamlConfigured(settings)) {
      return NextResponse.redirect(new URL("/login?error=saml_not_configured", origin));
    }

    const { authorizeUrl, requestId } = await buildSamlAuthorizeUrl(request, settings);

    const cookieOptions = {
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    };

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set("saml_state", requestId, cookieOptions);

    return response;
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || "saml_start_failed")}`, origin)
    );
  }
}
