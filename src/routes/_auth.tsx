import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { Icon } from "#/components/icons";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.user && !context.user.mustChangePassword) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-forest p-10 text-cream lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute -top-40 -right-40 h-[34rem] w-[34rem] rounded-full opacity-25"
          style={{
            background:
              "conic-gradient(#e9b04b 0 45deg, #d6502b 45deg 90deg, #2f5c48 90deg 135deg, #e9b04b 135deg 180deg, #d6502b 180deg 225deg, #2f5c48 225deg 270deg, #e9b04b 270deg 315deg, #d6502b 315deg 360deg)",
          }}
        />
        <Link to="/login" className="relative inline-flex items-center gap-3">
          <span className="display flex h-11 w-11 items-center justify-center rounded-full bg-clay text-lg text-cream">
            GC
          </span>
          <span className="display text-2xl">Games Club</span>
        </Link>

        <div className="relative max-w-xl">
          <p className="text-[11px] font-bold tracking-[0.24em] text-gold uppercase">
            No required reading
          </p>
          <h1 className="display mt-4 text-6xl xl:text-7xl">
            Play.
            <br />
            Talk.
            <br />
            Repeat.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream/70">
            One game a month. A shelf of suggestions, a democratic vote, a wheel
            when nobody can decide, and a place to keep every hot take.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-cream/50">
          <Icon name="sparkles" className="h-4 w-4 text-gold" />
          Self-hosted for your own club. No feeds, no algorithms, no homework.
        </div>
      </section>

      <section className="flex flex-col px-5 py-8 sm:px-10 lg:px-14">
        <div className="mb-10 lg:hidden">
          <Link to="/login" className="inline-flex items-center gap-3">
            <span className="display flex h-10 w-10 items-center justify-center rounded-full bg-clay text-cream">
              GC
            </span>
            <span className="display text-xl text-ink">Games Club</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </section>
    </div>
  );
}
