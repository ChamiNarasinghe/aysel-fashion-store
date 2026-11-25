import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RegisterForm from "./register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function RegisterPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/");

  return <RegisterForm />;
}
