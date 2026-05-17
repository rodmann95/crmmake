import { Draggable } from "@hello-pangea/dnd";
import { useRedirect, RecordContextProvider } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { NumberField } from "@/components/admin/number-field";
import { SelectField } from "@/components/admin/select-field";
import { Card, CardContent } from "@/components/ui/card";

import { CompanyAvatar } from "../companies/CompanyAvatar";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";

export const DealCard = ({ deal, index }: { deal: Deal; index: number }) => {
  if (!deal) return null;

  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <DealCardContent provided={provided} snapshot={snapshot} deal={deal} />
      )}
    </Draggable>
  );
};

export const DealCardContent = ({
  provided,
  snapshot,
  deal,
}: {
  provided?: any;
  snapshot?: any;
  deal: Deal;
}) => {
  const { dealCategories, currency } = useConfigurationContext();
  const redirect = useRedirect();
  const handleClick = () => {
    redirect(`/deals/${deal.id}/show`, undefined, undefined, undefined, {
      _scrollToTop: false,
    });
  };

  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={handleClick}
    >
      <RecordContextProvider value={deal}>
        <Card
          className={`py-1 transition-all duration-200 border-l-4 ${
            snapshot?.isDragging
              ? "opacity-90 transform rotate-2 shadow-xl border-l-primary scale-105 z-50"
              : "shadow-sm hover:shadow-md border-l-transparent hover:border-l-primary"
          }`}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-sm font-bold leading-tight text-foreground truncate">
                  {deal.name}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <ReferenceField
                    source="company_id"
                    reference="companies"
                    link={false}
                  />
                </div>
              </div>
              <div className="shrink-0">
                <ReferenceField
                  source="company_id"
                  reference="companies"
                  link={false}
                >
                  <CompanyAvatar width={28} height={28} />
                </ReferenceField>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm font-extrabold text-foreground tracking-tight flex items-center gap-1">
                <NumberField
                  source="amount"
                  options={{
                    notation: "compact",
                    style: "currency",
                    currency,
                    currencyDisplay: "narrowSymbol",
                    minimumSignificantDigits: 3,
                  }}
                />
                {deal.maintenance_amount != null && deal.maintenance_amount > 0 && (
                  <span className="text-xs text-muted-foreground font-medium flex items-center">
                    {" + "}
                    <NumberField
                      source="maintenance_amount"
                      options={{
                        notation: "compact",
                        style: "currency",
                        currency,
                        currencyDisplay: "narrowSymbol",
                        minimumSignificantDigits: 3,
                      }}
                    />
                    <span className="ml-0.5">/mês</span>
                  </span>
                )}
              </p>
              {deal.category && (
                <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  <SelectField
                    source="category"
                    choices={dealCategories}
                    optionText="label"
                    optionValue="value"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </RecordContextProvider>
    </div>
  );
};
