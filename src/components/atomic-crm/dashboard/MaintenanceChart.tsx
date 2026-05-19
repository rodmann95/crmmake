import { ResponsiveBar } from "@nivo/bar";
import { format, startOfMonth } from "date-fns";
import { ShieldCheck } from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { memo, useMemo } from "react";

import { findDealLabel } from "../deals/dealUtils";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";

const multiplier = {
  opportunity: 0.2,
  "proposal-sent": 0.5,
  "in-negociation": 0.8,
  delayed: 0.3,
};

const threeMonthsAgo = new Date(
  new Date().setMonth(new Date().getMonth() - 6),
).toISOString();

const DEFAULT_LOCALE = "pt-BR";

export const MaintenanceChart = memo(({ selectedCycle }: { selectedCycle: string }) => {
  const translate = useTranslate();
  const { dealStages, currency } = useConfigurationContext();
  const acceptedLanguages = navigator
    ? navigator.languages || [navigator.language]
    : [DEFAULT_LOCALE];
  const wonLabel = findDealLabel(dealStages, "won") ?? "Ganho";
  const lostLabel = findDealLabel(dealStages, "lost") ?? "Perdido";

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

  const months = useMemo(() => {
    if (!data) return [];
    const dealsByMonth = data.reduce((acc, deal) => {
      // Won deals are grouped by won_date; all others by created_at
      const wonDate = deal.stage === "won" && (deal as any).won_date
        ? new Date((deal as any).won_date)
        : null;
      const groupDate = wonDate ?? new Date(deal.created_at ?? new Date());
      const month = startOfMonth(groupDate).toISOString();
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(deal);
      return acc;
    }, {} as any);

    const amountByMonth = Object.keys(dealsByMonth)
      .sort()
      .map((month) => {
        const monthDeals = dealsByMonth[month];
      return {
        date: format(new Date(month), "MMM"),
        won: monthDeals
          .filter((deal: Deal) => deal.stage === "won")
          .reduce((acc: number, deal: Deal) => acc + ((deal.maintenance_amount || 0) * 12), 0),
        pending: monthDeals
          .filter((deal: Deal) => !["won", "lost"].includes(deal.stage))
          .reduce((acc: number, deal: Deal) => {
            // @ts-expect-error - multiplier type issue
            const weight = multiplier[deal.stage] || 0;
            return acc + ((deal.maintenance_amount || 0) * 12) * weight;
          }, 0),
        lost: monthDeals
          .filter((deal: Deal) => deal.stage === "lost")
          .reduce((acc: number, deal: Deal) => acc - ((deal.maintenance_amount || 0) * 12), 0),
      };
    });

    return amountByMonth;
  }, [data]);

  if (isPending) return null;

  const range = months.reduce(
    (acc, month) => {
      acc.min = Math.min(acc.min, month.lost);
      acc.max = Math.max(
        acc.max,
        month.won + month.pending,
      );
      return acc;
    },
    { min: 0, max: 0 },
  );

  const getLabel = (id: string) => {
    switch (id) {
      case "won":
        return "Ganho (Sust. Anual)";
      case "pending":
        return "Pendente (Sust. Anual)";
      case "lost":
        return "Perdido (Sust. Anual)";
      default:
        return id;
    }
  };

  return (
    <div className="flex flex-col bg-background/50 border border-border/40 rounded-xl p-5 shadow-sm">
      <div className="flex items-center mb-4">
        <div className="mr-3 flex">
          <ShieldCheck className="text-emerald-500 w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {translate("crm.dashboard.maintenance_chart", {
            _: "Sustentação Projetada (Anual)",
          })}
        </h2>
      </div>
      <div className="h-[300px]">
        <ResponsiveBar
          data={months}
          indexBy="date"
          keys={["won", "pending", "lost"]}
          colors={["#10b981", "#6ee7b7", "#e25c3b"]}
          margin={{ top: 30, right: 50, bottom: 30, left: 0 }}
          padding={0.3}
          valueScale={{
            type: "linear",
            min: range.min * 1.2,
            max: range.max * 1.2,
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
                    backgroundColor: [
                      "#10b981",
                      "#6ee7b7",
                      "#e25c3b",
                    ][["won", "pending", "lost"].indexOf(id as string)],
                  }}
                />
                <span className="capitalize">{getLabel(id as string)}:</span>
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
              ticks: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
              legend: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
            },
          }}
          axisBottom={{
            legendPosition: "middle",
            legendOffset: 50,
            tickSize: 0,
            tickPadding: 12,
            style: {
              ticks: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
              legend: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
            },
          }}
          axisLeft={null}
          axisRight={{
            format: (v: any) => `${Math.abs(v / 1000)}k`,
            tickValues: 6,
            style: {
              ticks: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
              legend: {
                text: {
                  fill: "var(--color-muted-foreground)",
                },
              },
            },
          }}
          markers={
            [
              {
                axis: "y",
                value: 0,
                lineStyle: { strokeOpacity: 0 },
                textStyle: { fill: "#10b981" },
                legend: wonLabel,
                legendPosition: "top-left",
                legendOrientation: "vertical",
              },
              {
                axis: "y",
                value: 0,
                lineStyle: {
                  stroke: "#f47560",
                  strokeWidth: 1,
                },
                textStyle: { fill: "#e25c3b" },
                legend: lostLabel,
                legendPosition: "bottom-left",
                legendOrientation: "vertical",
              },
            ] as any
          }
        />
      </div>
    </div>
  );
});
