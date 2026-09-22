import { NextResponse } from "next/server";
import {
  exchangeOidcCode,
  fetchOidcDiscovery,
  getOidcRuntimeConfig,
  getPublicOrigin,
  pickOidcDisplayName,
  pickOidcEmail,
  verifyOidcIdToken,
} from "@/lib/auth/oidc";
import { setDashboardAuthCookie } from "@/lib/auth/dashboardSession";

function clearOidcCookies(cookieStore) {
  cookieStore.delete("oidc_state");
  cookieStore.delete("oidc_nonce");
  cookieStore.delete("oidc_code_verifier");
}

function getCookie(request, name) {
  if (!request) return null;
  const fromCookies = request?.cookies?.get?.(name)?.value;
  if (fromCookies !== undefined && fromCookies !== null) return fromCookies;
  const cookieHeader = request?.headers?.get?.("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, getPublicOrigin(request)));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=oidc_missing_code", getPublicOrigin(request)));
  }

  const storedState = getCookie(request, "oidc_state");
  const storedNonce = getCookie(request, "oidc_nonce");
  const codeVerifier = getCookie(request, "oidc_code_verifier");

  if (!storedState || !storedNonce || !codeVerifier || storedState !== state) {
    const redirectRes = NextResponse.redirect(new URL("/login?error=oidc_invalid_state", getPublicOrigin(request)));
    clearOidcCookies(redirectRes.cookies);
    return redirectRes;
  }

  try {
    const config = await getOidcRuntimeConfig();
    if (!config) {
      const redirectRes = NextResponse.redirect(new URL("/login?error=oidc_not_configured", getPublicOrigin(request)));
      clearOidcCookies(redirectRes.cookies);
      return redirectRes;
    }

    const discovery = await fetchOidcDiscovery(config.issuerUrl);
    const discoveredIssuer = discovery.issuer || config.issuerUrl;
    const redirectUri = `${getPublicOrigin(request)}/api/auth/oidc/callback`;
    const tokenData = await exchangeOidcCode({
      tokenEndpoint: discovery.token_endpoint,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      redirectUri,
      codeVerifier,
    });

    if (!tokenData.id_token) {
      throw new Error("OIDC provider did not return an id_token");
    }

    const payload = await verifyOidcIdToken({
      idToken: tokenData.id_token,
      issuer: discoveredIssuer,
      audience: config.clientId,
      jwksUri: discovery.jwks_uri,
      nonce: storedNonce,
    });

    const successRes = NextResponse.redirect(new URL("/dashboard", getPublicOrigin(request)));
    clearOidcCookies(successRes.cookies);
    await setDashboardAuthCookie(successRes.cookies, request, {
      oidc: true,
      oidcSub: payload.sub || null,
      oidcEmail: pickOidcEmail(payload) || null,
      oidcName: pickOidcDisplayName(payload),
    });

    return successRes;
  } catch (error) {
    const errRes = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message || "oidc_callback_failed")}`, getPublicOrigin(request)));
    clearOidcCookies(errRes.cookies);
    return errRes;
  }
}
