import GovHeader from "@/components/layout/GovHeader";
import GovFooter from "@/components/layout/GovFooter";
import OnboardingTour from "@/components/layout/OnboardingTour";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GovHeader />
      <OnboardingTour />
      <main className="min-h-screen gov-pattern">{children}</main>
      <GovFooter />
    </>
  );
}
