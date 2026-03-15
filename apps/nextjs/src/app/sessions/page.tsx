import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { SessionsList } from "./_components/sessions-list";

export default async function SessionsPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <main className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Saved Sessions
        </h1>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to decoder
        </Link>
      </div>
      <SessionsList />
    </main>
  );
}
