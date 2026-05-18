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
  const totalProjected = totalMaintenance * 12;
  const { dealStages, currency } = useConfigurationContext();
  return (
    <div className="flex-1 pb-8 w-[85vw] sm:w-[320px] min-w-[290px] sm:min-w-[320px] bg-muted/40 rounded-xl p-3 flex flex-col h-full border border-border/40 shadow-sm snap-center">
      <div className="flex flex-col mb-4 px-1 gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {findDealLabel(dealStages, stage)}
        </h3>
        
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2.5 border border-border/50 flex flex-col gap-1.5 shadow-sm">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-muted-foreground font-medium">Desenv.:</span>
            <span className="font-bold text-foreground">
              {totalAmount.toLocaleString("pt-BR", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-muted-foreground font-medium">Sust. Mês:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {totalMaintenance.toLocaleString("pt-BR", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] border-t border-border/30 pt-1.5">
            <span className="text-muted-foreground font-semibold">Sust. Proj. (12m):</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {totalProjected.toLocaleString("pt-BR", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
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
