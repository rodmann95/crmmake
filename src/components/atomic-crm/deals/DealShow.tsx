import { useMutation } from "@tanstack/react-query";
import { isValid } from "date-fns";
import { Archive, ArchiveRestore } from "lucide-react";
import {
  InfiniteListBase,
  ShowBase,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useTranslate,
  useUpdate,
} from "ra-core";
import { DeleteButton } from "@/components/admin/delete-button";
import { EditButton } from "@/components/admin/edit-button";
import { ReferenceArrayField } from "@/components/admin/reference-array-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { CompanyAvatar } from "../companies/CompanyAvatar";
import { NoteCreate } from "../notes/NoteCreate";
import { NotesIterator } from "../notes/NotesIterator";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { ContactList } from "./ContactList";
import { findDealLabel, formatISODateString } from "./dealUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksIterator } from "../tasks/TasksIterator";
import { AddTask } from "../tasks/AddTask";
import { List } from "@/components/admin/list";

export const DealShow = ({ open, id }: { open: boolean; id?: string }) => {
  const redirect = useRedirect();
  const handleClose = () => {
    redirect("list", "deals");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl p-0 overflow-y-auto h-full sm:h-auto max-h-screen sm:max-h-[90vh] rounded-none sm:rounded-xl border-none sm:border">
        {id ? (
          <ShowBase id={id}>
            <DealShowContent />
          </ShowBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const DealShowContent = () => {
  const translate = useTranslate();
  const { dealStages, dealCategories, currency } = useConfigurationContext();
  const record = useRecordContext<Deal>();
  if (!record) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {record.archived_at ? <ArchivedTitle /> : null}

      {/* Header Section */}
      <div className="p-4 sm:p-6 border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pr-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <ReferenceField
              source="company_id"
              reference="companies"
              link="show"
            >
              <CompanyAvatar />
            </ReferenceField>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {record.name}
              </h2>
              <ReferenceField
                source="company_id"
                reference="companies"
                link="show"
                className="text-sm text-muted-foreground hover:underline"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
            {record.archived_at ? (
              <>
                <UnarchiveButton record={record} />
                <DeleteButton />
              </>
            ) : (
              <>
                <ArchiveButton record={record} />
                <EditButton />
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-start gap-4 sm:gap-y-6 sm:gap-x-12">
          <div className="space-y-1 min-w-[120px] sm:min-w-[140px]">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {translate("resources.deals.fields.amount")}
            </p>
            <p className="text-base sm:text-lg font-semibold text-primary">
              {record.amount.toLocaleString("pt-BR", {
                style: "currency",
                currency,
              })}
            </p>
          </div>

          {record.installments != null && (
            <div className="space-y-1 min-w-[120px] sm:min-w-[140px]">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Parcelas
              </p>
              <p className="text-base sm:text-lg font-semibold text-primary">
                {record.installments}
              </p>
            </div>
          )}

          {record.maintenance_amount != null && (
            <>
              <div className="space-y-1 min-w-[120px] sm:min-w-[140px]">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {translate("resources.deals.fields.maintenance_amount")}
                </p>
                <p className="text-base sm:text-lg font-semibold text-emerald-600">
                  {record.maintenance_amount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency,
                  })}
                  <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">
                    /mês
                  </span>
                </p>
              </div>

              <div className="space-y-1 min-w-[120px] sm:min-w-[140px]">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valor Proj. Sustentação
                </p>
                <p className="text-base sm:text-lg font-semibold text-emerald-600">
                  {(record.maintenance_amount * 12).toLocaleString("pt-BR", {
                    style: "currency",
                    currency,
                  })}
                  <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-1">
                    /ano
                  </span>
                </p>
              </div>
            </>
          )}

          <div className="space-y-1 min-w-[120px] sm:min-w-[140px] max-w-[250px]">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {translate("resources.deals.fields.stage")}
            </p>
            <Badge
              variant="secondary"
              className="px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium h-auto whitespace-normal text-left"
            >
              {findDealLabel(dealStages, record.stage)}
            </Badge>
          </div>

          <div className="space-y-1 min-w-[120px] sm:min-w-[140px]">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight break-words">
              {translate("resources.deals.fields.expected_closing_date")}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">
                {isValid(new Date(record.expected_closing_date))
                  ? formatISODateString(record.expected_closing_date)
                  : "N/A"}
              </span>
              {new Date(record.expected_closing_date) < new Date() &&
              !record.archived_at ? (
                <Badge variant="destructive" className="text-[9px] sm:text-[10px] uppercase px-1 py-0">
                  {translate("crm.common.past")}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 sm:px-6 border-b bg-background sticky top-0 z-10">
          <TabsList className="h-12 w-full justify-start bg-transparent p-0 gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
            <TabsTrigger
              value="overview"
              className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {translate("crm.common.overview") || "Visão Geral"}
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {translate("crm.common.activity") || "Atividade"}
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {translate("resources.tasks.name", { smart_count: 2 })}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="overview" className="p-4 sm:p-6 m-0 space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="md:col-span-2 space-y-6">
                {record.description && (
                  <div className="space-y-2">
                    <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {translate("resources.deals.fields.description")}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-line bg-muted/20 p-4 rounded-lg border border-border/50">
                      {record.description}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {translate("resources.deals.fields.contact_ids")}
                  </h3>
                  {!!record.contact_ids?.length ? (
                    <ReferenceArrayField
                      source="contact_ids"
                      reference="contacts_summary"
                    >
                      <ContactList />
                    </ReferenceArrayField>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      Nenhum contato vinculado.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-xl border bg-card shadow-sm space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Metadata
                  </h3>
                  <div className="space-y-3">
                    {record.category && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">
                          {translate("resources.deals.fields.category")}
                        </span>
                        <span className="font-medium text-right">
                          {dealCategories.find(
                            (c) => c.value === record.category,
                          )?.label ?? record.category}
                        </span>
                      </div>
                    )}
                    {record.commercial_cycle && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">
                          {translate("resources.deals.fields.commercial_cycle")}
                        </span>
                        <span className="font-medium text-right">
                          {record.commercial_cycle}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs sm:text-sm border-t pt-3 mt-3">
                      <span className="text-muted-foreground">Criado em</span>
                      <span className="font-medium text-right">
                        {formatISODateString(record.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="p-4 sm:p-6 m-0">
            <InfiniteListBase
              resource="deal_notes"
              filter={{ deal_id: record.id }}
              sort={{ field: "date", order: "DESC" }}
              perPage={25}
              disableSyncWithLocation
              storeKey={false}
              empty={<NoteCreate reference={"deals"} />}
            >
              <div className="space-y-6">
                <NoteCreate reference={"deals"} />
                <Separator />
                <NotesIterator reference="deals" />
              </div>
            </InfiniteListBase>
          </TabsContent>

          <TabsContent value="tasks" className="p-4 sm:p-6 m-0">
            <InfiniteListBase
              resource="tasks"
              filter={{ deal_id: record.id }}
              sort={{ field: "due_date", order: "ASC" }}
              perPage={25}
              disableSyncWithLocation
              storeKey={false}
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {translate("resources.tasks.name", { smart_count: 2 })}
                  </h3>
                  <AddTask
                    selectContact={true}
                    selectDeal={false}
                    display="chip"
                    record={record}
                  />
                </div>
                <Separator />
                <TasksIterator showContact />
              </div>
            </InfiniteListBase>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

const ArchivedTitle = () => {
  const translate = useTranslate();
  return (
    <div className="bg-orange-500 px-6 py-4">
      <h3 className="text-lg font-bold text-white">
        {translate("resources.deals.archived.title")}
      </h3>
    </div>
  );
};

const ArchiveButton = ({ record }: { record: Deal }) => {
  const translate = useTranslate();
  const [update] = useUpdate();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();
  const handleClick = () => {
    update(
      "deals",
      {
        id: record.id,
        data: { archived_at: new Date().toISOString() },
        previousData: record,
      },
      {
        onSuccess: () => {
          redirect("list", "deals");
          notify("resources.deals.archived.success", {
            type: "info",
            undoable: false,
          });
          refresh();
        },
        onError: () => {
          notify("resources.deals.archived.error", {
            type: "error",
          });
        },
      },
    );
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <Archive className="w-4 h-4" />
      {translate("resources.deals.archived.action")}
    </Button>
  );
};

const UnarchiveButton = ({ record }: { record: Deal }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();

  const { mutate } = useMutation({
    mutationFn: () => dataProvider.unarchiveDeal(record),
    onSuccess: () => {
      redirect("list", "deals");
      notify("resources.deals.unarchived.success", {
        type: "info",
        undoable: false,
      });
      refresh();
    },
    onError: () => {
      notify("resources.deals.unarchived.error", {
        type: "error",
      });
    },
  });

  const handleClick = () => {
    mutate();
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <ArchiveRestore className="w-4 h-4" />
      {translate("resources.deals.unarchived.action")}
    </Button>
  );
};
