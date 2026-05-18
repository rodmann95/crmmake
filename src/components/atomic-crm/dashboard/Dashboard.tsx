import { useGetList } from "ra-core";
import { useState } from "react";

import type { Contact, ContactNote } from "../types";
import { DashboardActivityLog } from "./DashboardActivityLog";
import { DashboardStepper } from "./DashboardStepper";
import { DealsChart } from "./DealsChart";
import { MaintenanceChart } from "./MaintenanceChart";
import { AccumulatedChart } from "./AccumulatedChart";
import { SectorChart } from "./SectorChart";
import { HotContacts } from "./HotContacts";
import { TasksList } from "./TasksList";
import { Welcome } from "./Welcome";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export const Dashboard = () => {
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

  const { total: totalDeal, isPending: isPendingDeal } = useGetList<Contact>(
    "deals",
    {
      pagination: { page: 1, perPage: 1 },
    },
  );

  const isPending = isPendingContact || isPendingContactNotes || isPendingDeal;

  if (isPending) {
    return null;
  }

  if (!totalContact) {
    return <DashboardStepper step={1} />;
  }

  if (!totalContactNotes) {
    return <DashboardStepper step={2} contactId={dataContact?.[0]?.id} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Global Filter Bar */}
      <Card className="bg-card border shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Dashboard Comercial</h2>
            <p className="text-sm text-muted-foreground">Monitore o desempenho financeiro e funil de vendas</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ciclo Comercial</span>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Selecione o Ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ciclos</SelectItem>
                {dealCycles.map((cycle) => (
                  <SelectItem key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3">
          <div className="flex flex-col gap-4">
            {import.meta.env.VITE_IS_DEMO === "true" ? <Welcome /> : null}
            <HotContacts />
          </div>
        </div>
        <div className="md:col-span-6">
          <div className="flex flex-col gap-6">
            {totalDeal ? <DealsChart selectedCycle={selectedCycle} /> : null}
            {totalDeal ? <MaintenanceChart selectedCycle={selectedCycle} /> : null}
            {totalDeal ? <AccumulatedChart selectedCycle={selectedCycle} /> : null}
            {totalDeal ? <SectorChart selectedCycle={selectedCycle} /> : null}
            <DashboardActivityLog />
          </div>
        </div>

        <div className="md:col-span-3">
          <TasksList />
        </div>
      </div>
    </div>
  );
};
