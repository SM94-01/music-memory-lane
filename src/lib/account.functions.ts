import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    // Wipe profile-owned rows; tables with FK ON DELETE CASCADE will follow auth.users deletion too.
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { ok: true };
  });
