import { AppLayout } from "@/components/app-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Equito Vote | Proposals",
  description: "Multichain DAO voting protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `AppLayout` is a client component while `RootLayout` is a
  // server component to allow SEO metadata.
  return <AppLayout children={children} />;
}
