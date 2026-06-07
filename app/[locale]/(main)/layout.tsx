import GovHeader from "@/components/layout/GovHeader";
import GovFooter from "@/components/layout/GovFooter";
import UserGuideModal from "@/components/guide/UserGuideModal";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GovHeader />
      <UserGuideModal />
      <main className="min-h-screen gov-pattern">{children}</main>
      <GovFooter />
    </>
  );
}
