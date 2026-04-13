import { PublicSiteChrome } from "@/components/public-site";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicSiteChrome>{children}</PublicSiteChrome>;
}
