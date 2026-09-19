"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.3 18.3 0 0 0-5.49 0c-.17-.39-.4-.87-.61-1.25a.08.08 0 0 0-.08-.04c-1.71.3-3.36.82-4.89 1.52a.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06c0 .02.01.04.03.05a19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.1c-.65-.25-1.27-.55-1.87-.89a.08.08 0 0 1 0-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1 0 .13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.1c.36.7.77 1.37 1.23 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}

const AUTH_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function AuthButton() {
  return AUTH_CONFIGURED ? <AuthControls /> : null;
}

function AuthControls() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <span className="h-8 w-24 shrink-0" aria-hidden="true" />;

  if (user) {
    const meta = user.user_metadata as { avatar_url?: string; full_name?: string; name?: string };
    const name = meta.full_name ?? meta.name ?? "Cuenta";
    return (
      <div className="flex shrink-0 items-center gap-2">
        {meta.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.avatar_url} alt="" className="h-7 w-7 rounded-full border border-border" />
        )}
        <span className="hidden max-w-28 truncate text-xs text-muted-foreground md:inline">{name}</span>
        <button
          type="button"
          aria-label="Cerrar sesión"
          onClick={() => createClient().auth.signOut()}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        createClient().auth.signInWithOAuth({
          provider: "discord",
          options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}` },
        })
      }
      className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-money/50 bg-money/10 px-3 py-1.5 text-xs font-medium tracking-wide text-money transition-colors hover:bg-money/20"
    >
      <DiscordMark className="h-4 w-4" />
      Entrar con Discord
    </button>
  );
}
