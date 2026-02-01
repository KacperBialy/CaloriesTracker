import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

const PUBLIC_PATHS = ["/", "/update-password", "/api/auth/login", "/api/auth/register", "/api/auth/forgot-password"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // If the request has an authorization and refresh token, set the session
  if (request.headers.get("API-Key")) {
    const apiKey = request.headers.get("API-Key");
    const apiKeyData = Buffer.from(apiKey ?? "", "base64").toString("utf-8");
    const apiKeyDataJson = JSON.parse(apiKeyData);
    await supabase.auth.setSession({
      access_token: apiKeyDataJson.access_token,
      refresh_token: apiKeyDataJson.refresh_token,
    });
  }

  locals.supabase = supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  } else {
    return redirect("/");
  }

  return next();
});
