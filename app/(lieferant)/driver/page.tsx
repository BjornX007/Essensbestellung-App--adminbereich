import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth"; // adjust to your auth import
import DriverView from "@/components/driver/DriverView";
export const dynamic = "force-dynamic";
export const metadata = { title: "Driver · Almira" };

export default async function DriverPage() {
  const session = await auth.getSession();

  if (!session?.data?.user) redirect("/sign-in");
  if (session.data.user.role !== "driver") redirect("/");

  return <DriverView />;
}