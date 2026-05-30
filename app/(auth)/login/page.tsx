import type { Metadata } from "next";
import LoginClient from "@/components/auth/LoginClient";

export const metadata: Metadata = {
  title: "Sign In | Domus",
  description: "Sign in to your Domus spatial workspace using Puter identity services.",
};

export default function LoginPage() {
  return <LoginClient />;
}
