import { ResponsiveBar } from "@nivo/bar";
import { DollarSign } from "lucide-react";
import { useGetList } from "ra-core";
import { memo, useMemo } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";

const threeMonthsAgo = new Date(
  new Date().setMonth(new Date().getMonth() - 6),
).toISOString();

const DEFAULT_LOCALE = "pt-BR";

export const NegotiationValueChart = memo(({ selectedCycle }: { selectedCycle: string }) => {
  const { dealStages, currency } = useConfigurationContext();
  const acceptedLanguages = navigator
    ? navigator.languages || [navigator.language]
    : [DEFAULT_LOCALE];

  const { data: deals, isPending } = useGetList<Deal>("deals", {
    pagination: { perPage: 1000, page: 1 },
    filter: {
      ...(selectedCycle === "all" ? { "created_at@gte": threeMonthsAgo } : { commercial_cycle: selectedCycle }),
    },
  });

  const totals = useMemo(() => {
    if (!deals) return { dev: 0, maint: 0, proj: 0, byStage: [] };

    // Filter deals in negotiation (not won, not lost)
    const activeDeals = deals.filter((deal) => !["won", "lost"].includes(deal.stage));

    const devTotal = activeDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const maintTotal = activeDeals.reduce((sum, d) => sum + (d.maintenance_amount || 0), 0);
    const projTotal = activeDeals.reduce((sum, d) => sum + (d.maintenance_amount || 0) * 12, 0);

    // Group by stage for the breakdown chart
    const stageBreakdown = activeDeals.reduce((acc, deal) => {
      const stageKey = deal.stage;
      if (!acc[stageKey]) {
        acc[stageKey] = { dev: 0, maintProj: 0 };
      }
      acc[stageKey].dev += deal.amount || 0;
      acc[stageKey].maintProj += (deal.maintenance_amount || 0) * 12;
      return acc;
    }, {} as Record<string, { dev: number; maintProj: number }>);

    // Format for chart
    const byStage = Object.keys(stageBreakdown).map((key) => {
      const stageLabel = dealStages.find((s) => s.value === key)?.label || key;
      return {
        estagio: stageLabel,
        "Valor Desenv.": stageBreakdown[key].dev,
        "Sust. Anual Proj.": stageBreakdown[key].maintProj,
      };
    });

    return {
      dev: devTotal,
      maint: maintTotal,
      proj: projTotal,
      byStage,
    };
  }, [deals, dealStages]);

  if (isPending) return null;

  const formattedCurrency = (val: number) => {
    return val.toLocaleString(acceptedLanguages.at(0) ?? DEFAULT_LOCALE, {
      style: "currency",
      currency: currency || "BRL",
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="flex flex-col bg-background/50 border border-border/40 rounded-xl p-5 shadow-sm gap-6">
      {/* Header */}
      <div className="flex items-center">
        <div className="mr-3 flex">
          <DollarSign className="text-amber-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Pipeline: Valores em Negociação
          </h2>
          <p className="text-xs text-muted-foreground">Volume financeiro ativo nas colunas (exceto ganho/perdido)</p>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/30 border border-border/30 rounded-lg p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Desenv. Ativo</span>
          <span className="text-sm sm:text-base font-extrabold text-blue-500 truncate">
            {formattedCurrency(totals.dev)}
          </span>
        </div>
        <div className="bg-muted/30 border border-border/30 rounded-lg p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sust. Mês Ativa</span>
          <span className="text-sm sm:text-base font-extrabold text-emerald-500 truncate">
            {formattedCurrency(totals.maint)}
          </span>
        </div>
        <div className="bg-muted/30 border border-border/30 rounded-lg p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sust. Anual Ativa</span>
          <span className="text-sm sm:text-base font-extrabold text-indigo-500 truncate">
            {formattedCurrency(totals.proj)}
          </span>
        </div>
      </div>

      {/* Chart Breakdown */}
      {totals.byStage.length > 0 ? (
        <div className="h-[220px]">
          <ResponsiveBar
            data={totals.byStage}
            keys={["Valor Desenv.", "Sust. Anual Proj."]}
            indexBy="estagio"
            groupMode="grouped"
            colors={["#3b82f6", "#10b981"]}
            margin={{ top: 10, right: 30, bottom: 35, left: 0 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            enableGridX={true}
            enableGridY={false}
            enableLabel={false}
            tooltip={({ id, value, indexValue }) => (
              <div className="p-2 bg-secondary rounded shadow flex flex-col gap-1 text-secondary-foreground text-xs">
                <span className="font-bold">{indexValue}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: id === "Valor Desenv." ? "#3b82f6" : "#10b981",
                    }}
                  />
                  <span className="font-medium">{id}:</span>
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
              tickPadding: 8,
              style: {
                ticks: { text: { fill: "var(--color-muted-foreground)", fontSize: 10 } },
              },
            }}
            axisLeft={null}
            axisRight={{
              format: (v: any) => `${Math.abs(v / 1000)}k`,
              tickValues: 4,
              style: {
                ticks: { text: { fill: "var(--color-muted-foreground)", fontSize: 9 } },
              },
            }}
          />
        </div>
      ) : (
        <div className="flex min-h-[150px] justify-center items-center">
          <p className="text-sm text-muted-foreground italic">Nenhum negócio ativo em negociação no momento.</p>
        </div>
      )}
    </div>
  );
});
