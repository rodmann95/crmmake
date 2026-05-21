import * as React from "react";
import { Zap, Plus } from "lucide-react";
import { useGetIdentity, useGetList } from "ra-core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { SimpleList } from "../simple-list/SimpleList";
import { CompanyAvatar } from "../companies/CompanyAvatar";
import { ReferenceField } from "@/components/admin/reference-field";
import type { Deal } from "../types";
import { useConfigurationContext } from "../root/ConfigurationContext";

export const HotDeals = () => {
  const { identity } = useGetIdentity();
  const { currency, dealStages } = useConfigurationContext();

  const {
    data: dealData,
    isPending: dealsLoading,
  } = useGetList<Deal>(
    "deals",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "updated_at", order: "DESC" },
      filter: { status: "hot", sales_id: identity?.id },
    },
    { enabled: Number.isInteger(identity?.id) },
  );

  // Client-side filter to only keep open (non-won, non-lost) deals for maximum safety across database adapters
  const openHotDeals = React.useMemo(() => {
    if (!dealData) return [];
    return dealData.filter(
      (deal) => deal.stage !== "won" && deal.stage !== "lost"
    );
  }, [dealData]);

  const totals = React.useMemo(() => {
    let dev = 0;
    let maint = 0;
    openHotDeals.forEach(deal => {
      dev += deal.amount || 0;
      maint += deal.maintenance_amount || 0;
    });
    return { dev, maint, proj: maint * 12, total: dev + (maint * 12) };
  }, [openHotDeals]);

  const formattedCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <div className="mr-3 flex">
          <Zap className="text-amber-500 fill-amber-500/20 w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          Negócios Quentes
        </h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground"
                asChild
              >
                <Link to="/deals">
                  <Plus className="w-4 h-4 text-primary" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Ir para o Funil
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {openHotDeals.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-1 flex flex-col gap-1.5 shadow-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Soma Desenv.:</span>
            <span className="font-bold text-foreground">{formattedCurrency(totals.dev)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Sust. Proj. (12m):</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formattedCurrency(totals.proj)}</span>
          </div>
          <div className="flex justify-between items-center text-[13px] border-t border-amber-500/20 pt-1.5 mt-0.5">
            <span className="font-bold text-amber-700 dark:text-amber-500">Total Quente:</span>
            <span className="font-extrabold text-amber-700 dark:text-amber-500">{formattedCurrency(totals.total)}</span>
          </div>
        </div>
      )}

      <Card className="py-0 border border-border/40 shadow-sm rounded-xl overflow-hidden">
        <SimpleList<Deal>
          linkType="show"
          data={openHotDeals}
          total={openHotDeals.length}
          isPending={dealsLoading}
          resource="deals"
          className="[&>li:first-child>a]:rounded-t-xl [&>li:last-child>a]:rounded-b-xl"
          primaryText={(deal) => deal.name}
          secondaryText={(deal) => {
            const stageLabel = dealStages.find(s => s.value === deal.stage)?.label || deal.stage;
            return (
              <span className="flex justify-between items-center w-full mt-0.5">
                <span className="truncate text-xs text-muted-foreground">{stageLabel}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                  {(deal.amount || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: currency || "BRL",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </span>
            );
          }}
          leftAvatar={(deal) => (
            <div className="shrink-0">
              <ReferenceField
                record={deal}
                source="company_id"
                reference="companies"
                link={false}
              >
                <CompanyAvatar width={40} height={40} />
              </ReferenceField>
            </div>
          )}
          empty={
            <div className="p-5 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum negócio quente aberto no momento.
              </p>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Abra suas oportunidades no funil e altere o "Calor do Negócio" para acompanhar os destaques por aqui!
              </p>
            </div>
          }
        />
      </Card>
    </div>
  );
};
