import { Draggable } from "@hello-pangea/dnd";
import { useRedirect, RecordContextProvider, useGetMany, type Identifier } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { SelectField } from "@/components/admin/select-field";
import { Card, CardContent } from "@/components/ui/card";

import { CompanyAvatar } from "../companies/CompanyAvatar";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal, Contact } from "../types";

const ContactsHeatList = ({ contactIds }: { contactIds: Identifier[] }) => {
  const { noteStatuses } = useConfigurationContext();
  const { data: contacts, isPending } = useGetMany<Contact>("contacts", {
    ids: contactIds || [],
  }, {
    enabled: !!contactIds?.length
  });

  if (isPending || !contacts?.length) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1 items-center">
      {contacts.map((contact) => {
        const statusConfig = noteStatuses.find(s => s.value === contact.status);
        return (
          <div
            key={contact.id}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/80 text-[9px] text-muted-foreground border border-border/30"
          >
            {statusConfig && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusConfig.color }}
              />
            )}
            <span className="font-semibold truncate max-w-[70px]">
              {contact.first_name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

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
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight text-foreground truncate">
                  {deal.name}
                </p>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <ReferenceField
                      source="company_id"
                      reference="companies"
                      link={false}
                    />
                  </div>
                  <ContactsHeatList contactIds={deal.contact_ids} />
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
            
            <div className="flex flex-col gap-1.5 mt-1 border-t border-border/30 pt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Desenv.</span>
                <span className="font-bold text-foreground">
                  {(deal.amount || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sust. Mês</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {(deal.maintenance_amount || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border/10 pt-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sust. Proj.</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {((deal.maintenance_amount || 0) * 12).toLocaleString("pt-BR", {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>

            {deal.category && (
              <div className="flex justify-end mt-1">
                <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                  <SelectField
                    source="category"
                    choices={dealCategories}
                    optionText="label"
                    optionValue="value"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </RecordContextProvider>
    </div>
  );
};
