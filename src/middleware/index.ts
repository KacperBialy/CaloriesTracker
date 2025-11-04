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
