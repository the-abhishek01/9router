import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/localDb";
import { isOidcConfigured } from "@/lib/auth/oidc";
import { isSamlConfigured } from "@/lib/auth/saml";
import { getDashboardAuthSession } from "@/lib/auth/dashboardSession";

export const dynamic = "force-dynamic";

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

export async function GET(request) {
  try {
    let authToken = getCookie(request, "auth_token");
    if (!authToken && !request) {
      try {
        const cookieStore = await cookies();
        authToken = cookieStore?.get?.("auth_token")?.value;
      } catch {}
    }
    const settings = await getSettings();
    const session = await getDashboardAuthSession(authToken);
    const requireLogin = settings.requireLogin !== false;
    const authMode = settings.authMode || "password";
    const ssoType = settings.ssoType || "oidc";
    const oidcName = String(session?.oidcName || "").trim();
    const oidcEmail = String(session?.oidcEmail || "").trim();
    const samlName = String(session?.samlName || "").trim();
    const samlEmail = String(session?.samlEmail || "").trim();

    const displayName =
      samlName ||
      samlEmail ||
      oidcName ||
      oidcEmail ||
      (session?.saml ? "SAML user" : session?.oidc ? "OIDC user" : "Password user");

    const loginMethod = session?.saml ? "SAML" : session?.oidc ? "OIDC" : "Password";

    return NextResponse.json({
      requireLogin,
      authMode,
      ssoType,
      oidcConfigured: isOidcConfigured(settings),
      oidcLoginLabel: (settings.oidcLoginLabel || "Sign in with OIDC").trim() || "Sign in with OIDC",
      samlConfigured: isSamlConfigured(settings),
      samlLoginLabel: (settings.samlLoginLabel || "Sign in with SAML SSO").trim() || "Sign in with SAML SSO",
      hasPassword: !!settings.password,
      displayName,
      loginMethod,
      authenticated: !!session,
      oidcName: oidcName || null,
      oidcEmail: oidcEmail || null,
      oidcLogin: !!session?.oidc,
      samlName: samlName || null,
      samlEmail: samlEmail || null,
      samlLogin: !!session?.saml,
    });
  } catch {
    return NextResponse.json({
      requireLogin: true,
      authMode: "password",
      ssoType: "oidc",
      oidcConfigured: false,
      oidcLoginLabel: "Sign in with OIDC",
      samlConfigured: false,
      samlLoginLabel: "Sign in with SAML SSO",
      hasPassword: false,
      displayName: "Password user",
      loginMethod: "Password",
      authenticated: false,
      oidcName: null,
      oidcEmail: null,
      oidcLogin: false,
      samlName: null,
      samlEmail: null,
      samlLogin: false,
    });
  }
}
