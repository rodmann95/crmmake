import { Droppable } from "@hello-pangea/dnd";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { findDealLabel } from "./dealUtils";
import { DealCard } from "./DealCard";

export const DealColumn = ({
  stage,
  deals,
}: {
  stage: string;
  deals: Deal[];
}) => {
  const totalAmount = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const totalMaintenance = deals.reduce((sum, deal) => sum + (deal.maintenance_amount || 0), 0);
  const { dealStages, currency } = useConfigurationContext();
  return (
    <div className="flex-1 pb-8 min-w-[320px] bg-muted/40 rounded-xl p-3 flex flex-col h-full border border-border/40 shadow-sm snap-center">
      <div className="flex flex-col mb-4 px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
          {findDealLabel(dealStages, stage)}
        </h3>
        <div className="flex flex-col">
          <p className="text-xl font-extrabold text-foreground tracking-tight">
            {totalAmount.toLocaleString("en-US", {
              notation: "compact",
              style: "currency",
              currency,
              currencyDisplay: "narrowSymbol",
              minimumSignificantDigits: 3,
            })}
          </p>
          {totalMaintenance > 0 && (
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              + {totalMaintenance.toLocaleString("en-US", {
                notation: "compact",
                style: "currency",
                currency,
                currencyDisplay: "narrowSymbol",
                minimumSignificantDigits: 3,
              })} / mês
            </p>
          )}
        </div>
      </div>
      <Droppable droppableId={stage}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`flex flex-col gap-3 h-full min-h-[150px] rounded-lg transition-colors duration-200 ${
              snapshot.isDraggingOver ? "bg-muted/70 ring-2 ring-primary/20" : ""
            }`}
          >
            {deals.map((deal, index) => (
              <DealCard key={deal.id} deal={deal} index={index} />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
