import { cookies } from "next/headers";
import { verifyTokenMiddleware } from "../../lib/jwt";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { Suspense } from "react";
import Loading from "../loading";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) return null;

  try {
    const user = await verifyTokenMiddleware(token);
    return user;
  } catch (error) {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  return (
    <Suspense fallback={<Loading />}>
      <DashboardClient user={user} />
    </Suspense>
  );
}
