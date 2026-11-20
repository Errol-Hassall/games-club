import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "#/components/app-shell";

export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) throw redirect({ to: "/login" });
    if (context.user.mustChangePassword && location.pathname !== "/account") {
      throw redirect({ to: "/account" });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  if (!user) return null;
  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  );
}
