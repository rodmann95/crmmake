import { useGetList, useTimeout } from "ra-core";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Link } from "react-router";
import type { Contact, ContactNote } from "../types";
import { DashboardActivityLog } from "./DashboardActivityLog";
import { DashboardStepper } from "./DashboardStepper";
import { Welcome } from "./Welcome";
import { DealsChart } from "./DealsChart";
import { NegotiationValueChart } from "./NegotiationValueChart";
import { MaintenanceChart } from "./MaintenanceChart";
import { AccumulatedChart } from "./AccumulatedChart";
import { SectorChart } from "./SectorChart";
import MobileHeader from "../layout/MobileHeader";
import { MobileContent } from "../layout/MobileContent";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  return (
    <>
      <MobileHeader>
        <div className="flex items-center gap-2 text-secondary-foreground no-underline py-3">
          <img
            className="[.light_&]:hidden h-6"
            src={darkModeLogo}
            alt={title}
          />
          <img
            className="[.dark_&]:hidden h-6"
            src={lightModeLogo}
            alt={title}
          />
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <Button asChild variant="ghost" size="icon" className="text-secondary-foreground shrink-0 rounded-full">
          <Link to="/settings" aria-label="Settings">
            <Settings className="size-5" />
          </Link>
        </Button>
      </MobileHeader>
      <MobileContent>{children}</MobileContent>
    </>
  );
};

const Loading = () => (
  <Wrapper>
    <Skeleton className="h-4 w-3/4 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
  </Wrapper>
);

export const MobileDashboard = () => {
  const [selectedCycle, setSelectedCycle] = useState<string>("all");
  const { dealCycles } = useConfigurationContext();

  const {
    data: dataContact,
    total: totalContact,
    isPending: isPendingContact,
  } = useGetList<Contact>("contacts", {
    pagination: { page: 1, perPage: 1 },
  });
  const { total: totalContactNotes, isPending: isPendingContactNotes } =
    useGetList<ContactNote>("contact_notes", {
      pagination: { page: 1, perPage: 1 },
    });
  const { total: totalDeal, isPending: isPendingDeal } = useGetList("deals", {
    pagination: { page: 1, perPage: 1 },
  });
  const oneSecondHasPassed = useTimeout(1000);

  const isPending = isPendingContact || isPendingContactNotes || isPendingDeal;

  if (isPending) {
    return oneSecondHasPassed ? <Loading /> : null;
  }

  if (!totalContact) {
    return (
      <Wrapper>
        <DashboardStepper step={1} />
      </Wrapper>
    );
  }

  if (!totalContactNotes) {
    return (
      <Wrapper>
        <DashboardStepper step={2} contactId={dataContact?.[0]?.id} />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="flex flex-col gap-6 mt-1 pb-16">
        {import.meta.env.VITE_IS_DEMO === "true" ? <Welcome /> : null}

        {/* Mobile Filter Bar */}
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-4 flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Dashboard Comercial</h2>
              <p className="text-xs text-muted-foreground">Monitore o desempenho do funil</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ciclo Comercial</span>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="w-[140px] bg-background text-xs h-9">
                  <SelectValue placeholder="Selecione o Ciclo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os Ciclos</SelectItem>
                  {dealCycles.map((cycle) => (
                    <SelectItem key={cycle.value} value={cycle.value} className="text-xs">
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {totalDeal ? <DealsChart selectedCycle={selectedCycle} /> : null}
        {totalDeal ? <NegotiationValueChart selectedCycle={selectedCycle} /> : null}
        {totalDeal ? <MaintenanceChart selectedCycle={selectedCycle} /> : null}
        {totalDeal ? <AccumulatedChart selectedCycle={selectedCycle} /> : null}
        {totalDeal ? <SectorChart selectedCycle={selectedCycle} /> : null}
        <DashboardActivityLog />
      </div>
    </Wrapper>
  );
};
