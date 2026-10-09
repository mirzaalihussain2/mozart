import { requireUser } from "@/lib/server/session";

// Temporary placeholder; the real Create home (01-02) is milestone 2.

export const instant = false;

export default async function CreatePage() {
  const user = await requireUser();

  return (
    <main className="flex min-h-dvh flex-col items-start gap-4 px-6 pt-[60px]">
      <p className="text-lg font-semibold">Signed in as {user.firstName}</p>
      <form action="/auth/logout" method="post">
        <button
          type="submit"
          className="bg-raised text-text h-11 cursor-pointer rounded-full px-5 text-[15px] font-semibold"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
