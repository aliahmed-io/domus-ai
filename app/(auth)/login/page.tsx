import type { Metadata } from "next";
import LocalEntry from "@/components/auth/LocalEntry";

export const metadata: Metadata = {
  title: "Enter the workshop",
  description: "Open your local Domus workshop. No account needed.",
};

export default function LoginPage() {
  return <LocalEntry />;
}
