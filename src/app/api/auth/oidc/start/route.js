import { NextResponse } from "next/server";
import {
  buildOidcAuthorizationUrl,
  createOidcNonce,
  createOidcState,
  createPkcePair,
  fetchOidcDiscovery,
  getOidcRuntimeConfig,
  getPublicOrigin,
} from "@/lib/auth/oidc";
import { shouldUseSecureCookie } from "@/lib/auth/dashboardSession";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const config = await getOidcRuntimeConfig();
    if (!config) {
      return NextResponse.redirect(new URL("/login?error=oidc_not_configured", getPublicOrigin(request)));
    }

    const discovery = await fetchOidcDiscovery(config.issuerUrl);
    const state = createOidcState();
    const nonce = createOidcNonce();
    const { verifier, challenge } = createPkcePair();
    const redirectUri = `${getPublicOrigin(request)}/api/auth/oidc/callback`;
    const authUrl = buildOidcAuthorizationUrl({
      authorizationEndpoint: discovery.authorization_endpoint,
      clientId: config.clientId,
      redirectUri,
      scopes: config.scopes,
      state,
      nonce,
      codeChallenge: challenge,
    });

    const baseOptions = {
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    };

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("oidc_state", state, baseOptions);
    response.cookies.set("oidc_nonce", nonce, baseOptions);
    response.cookies.set("oidc_code_verifier", verifier, baseOptions);

    return response;
  } catch (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message || "oidc_start_failed")}`, getPublicOrigin(request)));
  }
}
