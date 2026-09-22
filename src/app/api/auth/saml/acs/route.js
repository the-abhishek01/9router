import { NextResponse } from "next/server";
import { getSettings } from "@/lib/localDb";
import {
  getSamlBaseUrl,
  isSamlConfigured,
  pickSamlDisplayName,
  pickSamlEmail,
  validateSamlResponse,
} from "@/lib/auth/saml";
import { setDashboardAuthCookie } from "@/lib/auth/dashboardSession";
import { checkLock, recordFail, recordSuccess, getClientIp } from "@/lib/auth/loginLimiter";

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

export async function POST(request) {
  const settings = await getSettings();
  const origin = getSamlBaseUrl(request, settings);
  const ip = getClientIp(request);

  const lock = checkLock(ip);
  if (lock.locked) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(`Too many failed attempts. Try again in ${lock.retryAfter}s.`)}`,
        origin
      )
    );
  }

  const storedRequestId = getCookie(request, "saml_state") || "";

  try {
    const formData = await request.formData();
    const SAMLResponse = formData.get("SAMLResponse");

    if (!SAMLResponse) {
      recordFail(ip);
      const res = NextResponse.redirect(new URL("/login?error=saml_missing_response", origin));
      res.cookies.delete("saml_state");
      return res;
    }

    if (!isSamlConfigured(settings)) {
      recordFail(ip);
      const res = NextResponse.redirect(new URL("/login?error=saml_not_configured", origin));
      res.cookies.delete("saml_state");
      return res;
    }

    const profile = await validateSamlResponse(request, { SAMLResponse }, storedRequestId, settings);

    const samlEmail = pickSamlEmail(profile, settings) || null;
    const samlName = pickSamlDisplayName(profile, settings) || "SAML user";

    recordSuccess(ip);

    const redirectRes = NextResponse.redirect(new URL("/dashboard", origin));
    redirectRes.cookies.delete("saml_state");
    await setDashboardAuthCookie(redirectRes.cookies, request, {
      saml: true,
      samlEmail,
      samlName,
    });

    return redirectRes;
  } catch (error) {
    recordFail(ip);
    const errRes = NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || "saml_acs_failed")}`, origin)
    );
    errRes.cookies.delete("saml_state");
    return errRes;
  }
}
