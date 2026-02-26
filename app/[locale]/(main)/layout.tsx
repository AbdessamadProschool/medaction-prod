import GovHeader from "@/components/layout/GovHeader";
import GovFooter from "@/components/layout/GovFooter";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GovHeader />
      <main className="min-h-screen gov-pattern">{children}</main>
      <GovFooter />
    </>
  );
}
