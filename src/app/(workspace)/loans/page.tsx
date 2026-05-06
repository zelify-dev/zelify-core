import { LoansScreen } from "@/modules/loans/screens/loans-screen";

type LoansPageProps = {
  searchParams?: Promise<{ view?: string }>;
};

export default async function LoansPage({ searchParams }: LoansPageProps) {
  void searchParams;
  return <LoansScreen />;
}
