import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { email } = await request.json();

  const supabase = createSupabaseServerInstance({
    cookies: {} as any, // HACK: cookies are not available here
    headers: request.headers,
  });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("/update-password", request.url).toString(),
  });

  if (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 400,
    });
  }

  return new Response(null, { status: 200 });
};
