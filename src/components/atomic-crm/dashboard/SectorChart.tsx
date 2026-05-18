import { ResponsiveBar } from "@nivo/bar";
import { PieChart } from "lucide-react";
import { useGetList } from "ra-core";
import { memo, useMemo } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal, Company } from "../types";

const sectorColors: Record<string, string> = {
  "communication-services": "#a855f7", // Purple
  "consumer-discretionary": "#ec4899", // Pink
  "consumer-staples": "#f43f5e",       // Rose
  "energy": "#eab308",                 // Yellow
  "financials": "#3b82f6",             // Blue
  "health-care": "#10b981",            // Emerald
  "industrials": "#6b7280",            // Gray
  "information-technology": "#6366f1", // Indigo
  "materials": "#f97316",              // Orange
  "real-estate": "#14b8a6",            // Teal
  "utilities": "#06b6d4",              // Cyan
};

const threeMonthsAgo = new Date(
  new Date().setMonth(new Date().getMonth() - 6),
).toISOString();

const DEFAULT_LOCALE = "pt-BR";

export const SectorChart = memo(({ selectedCycle }: { selectedCycle: string }) => {
  const { companySectors, currency } = useConfigurationContext();
  const acceptedLanguages = navigator
    ? navigator.languages || [navigator.language]
    : [DEFAULT_LOCALE];

  const { data: deals, isPending: isPendingDeals } = useGetList<Deal>("deals", {
    pagination: { perPage: 1000, page: 1 },
    filter: {
      ...(selectedCycle === "all" ? { "created_at@gte": threeMonthsAgo } : { commercial_cycle: selectedCycle }),
    },
  });

  const { data: companies, isPending: isPendingCompanies } = useGetList<Company>("companies", {
    pagination: { perPage: 1000, page: 1 },
  });

  const chartData = useMemo(() => {
    if (!deals || !companies) return [];

    // Filter only won deals to represent "ganho" (revenue realized)
    const wonDeals = deals.filter((deal) => deal.stage === "won");

    // Map company sector
    const sectorTotals = wonDeals.reduce((acc, deal) => {
      const company = companies.find((c) => c.id === deal.company_id);
      const sector = company?.sector || "other";
      
      const totalValue = (deal.amount || 0) + (deal.maintenance_amount || 0) * 12;

      acc[sector] = (acc[sector] || 0) + totalValue;
      return acc;
    }, {} as Record<string, number>);

    // Format for horizontal bar chart
    return Object.keys(sectorTotals)
      .map((sectorKey) => {
        const sectorLabel = companySectors.find((s) => s.value === sectorKey)?.label || sectorKey;
        return {
          sector: sectorLabel,
          sectorKey,
          Valor: sectorTotals[sectorKey],
        };
      })
      .sort((a, b) => b.Valor - a.Valor); // Highest values at the top
  }, [deals, companies, companySectors]);

  if (isPendingDeals || isPendingCompanies) return null;

  if (!chartData.length) {
    return (
      <div className="flex flex-col bg-background/50 border border-border/40 rounded-xl p-5 shadow-sm min-h-[300px] justify-center items-center">
        <p className="text-sm text-muted-foreground italic">Nenhum ganho por setor registrado no período.</p>
      </div>
    );
  }

  // Get color for each bar
  const getColor = (bar: any) => {
    const key = bar.data.sectorKey;
    return sectorColors[key] || "#cbd5e1";
  };

  return (
    <div className="flex flex-col bg-background/50 border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center mb-4">
        <div className="mr-3 flex">
          <PieChart className="text-pink-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Ganhos por Setor da Empresa
          </h2>
          <p className="text-xs text-muted-foreground">Distribuição de receita (Desenv + Sust. Anual) por setor</p>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveBar
          data={chartData}
          keys={["Valor"]}
          indexBy="sector"
          layout="horizontal"
          colors={getColor}
          margin={{ top: 10, right: 30, bottom: 30, left: 130 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          enableGridX={true}
          enableGridY={false}
          enableLabel={false}
          tooltip={({ value, indexValue, data }) => (
            <div className="p-2 bg-secondary rounded shadow flex flex-col gap-1 text-secondary-foreground text-xs">
              <span className="font-bold">{indexValue}</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: sectorColors[data.sectorKey] || "#cbd5e1",
                  }}
                />
                <span className="font-medium">Total Ganho:</span>
                <span className="font-semibold">
                  {value.toLocaleString(acceptedLanguages.at(0) ?? DEFAULT_LOCALE, {
                    style: "currency",
                    currency,
                  })}
                </span>
              </div>
            </div>
          )}
          axisBottom={{
            tickSize: 0,
            tickPadding: 12,
            format: (v: any) => `${Math.abs(v / 1000)}k`,
            style: {
              ticks: { text: { fill: "var(--color-muted-foreground)" } },
            },
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 12,
            style: {
              ticks: { text: { fill: "var(--color-muted-foreground)" } },
            },
          }}
        />
      </div>
    </div>
  );
});
