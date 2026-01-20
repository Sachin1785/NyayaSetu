"use client";

import { Header } from "@/components/layout/Header";
import { ComparatorView } from "@/components/comparator/ComparatorView";

export default function ComparatorPage() {
  return (
    <>
      <Header
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Comparator" },
        ]}
      />
      
      <div className="h-[calc(100vh-4rem)]">
        <ComparatorView />
      </div>
    </>
  );
}
