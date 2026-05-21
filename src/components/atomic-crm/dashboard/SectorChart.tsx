import { ResponsiveBar } from "@nivo/bar";
import { PieChart, TrendingUp, ShieldAlert } from "lucide-react";
import { useGetList } from "ra-core";
import { memo, useMemo } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal, Company } from "../types";

const devColors: Record<string, string> = {
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

const maintColors: Record<string, string> = {
  "communication-services": "#0f766e", // Dark Teal
  "consumer-discretionary": "#14b8a6", // Teal
  "consumer-staples": "#2dd4bf",       // Light Teal
  "energy": "#0d9488",                 // Teal-Green
  "financials": "#0284c7",             // Sky Blue
  "health-care": "#059669",            // Emerald-Green
  "industrials": "#4b5563",            // Cool Gray
  "information-technology": "#0891b2", // Cyan
  "materials": "#b45309",              // Amber
  "real-estate": "#047857",            // Forest Green
  "utilities": "#0e7490",              // Cyan-Blue
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
      "archived_at@is": null,
      ...(selectedCycle === "all" ? { "created_at@gte": threeMonthsAgo } : { commercial_cycle: selectedCycle }),
    },
  });

  const { data: companies, isPending: isPendingCompanies } = useGetList<Company>("companies", {
    pagination: { perPage: 1000, page: 1 },
  });

  const { devData, maintData } = useMemo(() => {
    if (!deals || !companies) return { devData: [], maintData: [] };

    // Filter only won deals to represent "ganho" (revenue realized)
    const wonDeals = deals.filter((deal) => deal.stage === "won");

    // Map company sector for Development
    const devTotals = wonDeals.reduce((acc, deal) => {
      const company = companies.find((c) => c.id === deal.company_id);
      const sector = company?.sector || "other";
      acc[sector] = (acc[sector] || 0) + (deal.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Map company sector for Maintenance (Annualized)
    const maintTotals = wonDeals.reduce((acc, deal) => {
      const company = companies.find((c) => c.id === deal.company_id);
      const sector = company?.sector || "other";
      acc[sector] = (acc[sector] || 0) + (deal.maintenance_amount || 0) * 12;
      return acc;
    }, {} as Record<string, number>);

    const formatData = (totals: Record<string, number>) =>
      Object.keys(totals)
        .map((sectorKey) => {
          const sectorLabel = companySectors.find((s) => s.value === sectorKey)?.label || sectorKey;
          return {
            sector: sectorLabel,
            sectorKey,
            Valor: totals[sectorKey],
          };
        })
        .filter((item) => item.Valor > 0)
        .sort((a, b) => b.Valor - a.Valor);

    return {
      devData: formatData(devTotals),
      maintData: formatData(maintTotals),
    };
  }, [deals, companies, companySectors]);

  if (isPendingDeals || isPendingCompanies) return null;

  const hasData = devData.length > 0 || maintData.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col bg-background/50 border border-border/40 rounded-xl p-5 shadow-sm min-h-[300px] justify-center items-center">
        <p className="text-sm text-muted-foreground italic">Nenhum ganho por setor registrado no período.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background/50 border border-border/40 rounded-xl p-5 shadow-sm">
      {/* Unified Header */}
      <div className="flex items-center mb-6 border-b border-border/10 pb-4">
        <div className="mr-3 flex">
          <PieChart className="text-pink-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Ganhos por Setor da Empresa
          </h2>
          <p className="text-xs text-muted-foreground">
            Distribuição de receita ganha por setor, dividida entre Desenvolvimento e Sustentação Anual
          </p>
        </div>
      </div>

      {/* Dual Charts Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Development Sector Chart */}
        <div className="flex flex-col border border-border/10 rounded-lg p-4 bg-card/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-indigo-400 w-4 h-4" />
            <h3 className="text-sm font-bold text-foreground">Novos Projetos (Desenvolvimento)</h3>
          </div>
          {devData.length ? (
            <div className="h-[250px]">
              <ResponsiveBar
                data={devData}
                keys={["Valor"]}
                indexBy="sector"
                layout="horizontal"
                colors={(bar) => devColors[bar.data.sectorKey] || "#cbd5e1"}
                margin={{ top: 10, right: 30, bottom: 30, left: 100 }}
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
                          backgroundColor: devColors[data.sectorKey] || "#cbd5e1",
                        }}
                      />
                      <span className="font-medium">Total Desenv:</span>
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
          ) : (
            <div className="h-[250px] flex items-center justify-center border border-dashed border-border/20 rounded-md">
              <span className="text-xs text-muted-foreground italic">Nenhum ganho de desenvolvimento registrado</span>
            </div>
          )}
        </div>

        {/* Maintenance Sector Chart */}
        <div className="flex flex-col border border-border/10 rounded-lg p-4 bg-card/10">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="text-emerald-400 w-4 h-4" />
            <h3 className="text-sm font-bold text-foreground">Sustentação Projetada Anual (Recorrente)</h3>
          </div>
          {maintData.length ? (
            <div className="h-[250px]">
              <ResponsiveBar
                data={maintData}
                keys={["Valor"]}
                indexBy="sector"
                layout="horizontal"
                colors={(bar) => maintColors[bar.data.sectorKey] || "#cbd5e1"}
                margin={{ top: 10, right: 30, bottom: 30, left: 100 }}
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
                          backgroundColor: maintColors[data.sectorKey] || "#cbd5e1",
                        }}
                      />
                      <span className="font-medium">Total Sust. Anual:</span>
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
          ) : (
            <div className="h-[250px] flex items-center justify-center border border-dashed border-border/20 rounded-md">
              <span className="text-xs text-muted-foreground italic">Nenhum ganho de sustentação anual registrado</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
});
