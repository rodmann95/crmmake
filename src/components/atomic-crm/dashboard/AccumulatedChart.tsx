import { ResponsiveBar } from "@nivo/bar";
import { format, startOfMonth } from "date-fns";
import { LineChart } from "lucide-react";
import { useGetList } from "ra-core";
import { memo, useMemo } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";

const threeMonthsAgo = new Date(
  new Date().setMonth(new Date().getMonth() - 6),
).toISOString();

const DEFAULT_LOCALE = "pt-BR";

export const AccumulatedChart = memo(({ selectedCycle }: { selectedCycle: string }) => {
  const { currency } = useConfigurationContext();
  const acceptedLanguages = navigator
    ? navigator.languages || [navigator.language]
    : [DEFAULT_LOCALE];

  const { data, isPending } = useGetList<Deal>("deals", {
    pagination: { perPage: 100, page: 1 },
    sort: {
      field: "created_at",
      order: "ASC",
    },
    filter: {
      ...(selectedCycle === "all" ? { "created_at@gte": threeMonthsAgo } : { commercial_cycle: selectedCycle }),
    },
  });

  const accumulatedData = useMemo(() => {
    if (!data) return [];

    // Filter only won deals to calculate absolute realized gains/growth
    const wonDeals = data.filter((deal) => deal.stage === "won");

    // Group by month
    const dealsByMonth = wonDeals.reduce((acc, deal) => {
      const wonDate = (deal as any).won_date ? new Date((deal as any).won_date) : new Date(deal.created_at ?? new Date());
      const month = startOfMonth(wonDate).toISOString();
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(deal);
      return acc;
    }, {} as Record<string, Deal[]>);

    // Get sorted chronological months
    const sortedMonths = Object.keys(dealsByMonth).sort();

    let cumulativeDev = 0;
    let cumulativeMaintMonth = 0;
    let cumulativeMaintProj = 0;

    return sortedMonths.map((monthStr) => {
      const monthDeals = dealsByMonth[monthStr];
      const devSum = monthDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
      const maintSum = monthDeals.reduce((sum, d) => sum + (d.maintenance_amount || 0), 0);

      cumulativeDev += devSum;
      cumulativeMaintMonth += maintSum;
      cumulativeMaintProj += maintSum * 12;

      return {
        date: format(new Date(monthStr), "MMM"),
        "Desenv. Acumulado": cumulativeDev,
        "Sust. Mês Acumulado": cumulativeMaintMonth,
        "Sust. Proj. Acumulado": cumulativeMaintProj,
      };
    });
  }, [data]);

  if (isPending) return null;

  if (!accumulatedData.length) {
    return (
      <div className="flex flex-col bg-background/50 border border-border/40 rounded-xl p-5 shadow-sm min-h-[300px] justify-center items-center">
        <p className="text-sm text-muted-foreground italic">Nenhum negócio ganho no período para gerar o acumulado.</p>
      </div>
    );
  }

  const rangeMax = accumulatedData.reduce((max, d) => {
    return Math.max(max, d["Desenv. Acumulado"], d["Sust. Proj. Acumulado"]);
  }, 0);

  return (
    <div className="flex flex-col bg-background/50 border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center mb-4">
        <div className="mr-3 flex">
          <LineChart className="text-indigo-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Evolução Comercial Acumulada
          </h2>
          <p className="text-xs text-muted-foreground">Crescimento acumulado de novos negócios ganhos</p>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveBar
          data={accumulatedData}
          indexBy="date"
          keys={[
            "Desenv. Acumulado",
            "Sust. Mês Acumulado",
            "Sust. Proj. Acumulado",
          ]}
          groupMode="grouped"
          colors={["#3b82f6", "#10b981", "#6366f1"]}
          margin={{ top: 30, right: 50, bottom: 30, left: 0 }}
          padding={0.2}
          valueScale={{
            type: "linear",
            min: 0,
            max: rangeMax * 1.15 || 1000,
          }}
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
                    backgroundColor:
                      id === "Desenv. Acumulado"
                        ? "#3b82f6"
                        : id === "Sust. Mês Acumulado"
                          ? "#10b981"
                          : "#6366f1",
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
          axisTop={{
            tickSize: 0,
            tickPadding: 12,
            style: {
              ticks: { text: { fill: "var(--color-muted-foreground)" } },
            },
          }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 12,
            style: {
              ticks: { text: { fill: "var(--color-muted-foreground)" } },
            },
          }}
          axisLeft={null}
          axisRight={{
            format: (v: any) => `${Math.abs(v / 1000)}k`,
            tickValues: 6,
            style: {
              ticks: { text: { fill: "var(--color-muted-foreground)" } },
            },
          }}
        />
      </div>
    </div>
  );
});
