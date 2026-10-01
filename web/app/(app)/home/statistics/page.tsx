import type { Metadata } from "next";
import Statistics from "@/components/Statistics/Statistics";

export const metadata: Metadata = { title: "Statistics" };

export default function StatisticsPage() {
  return <Statistics />;
}
