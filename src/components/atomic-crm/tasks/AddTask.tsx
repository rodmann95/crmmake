import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreateBase,
  Form,
  useDataProvider,
  useGetIdentity,
  useGetRecordRepresentation,
  useNotify,
  useRecordContext,
  useRefresh,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useState } from "react";
import { SaveButton } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TaskFormContent } from "./TaskFormContent";

export const AddTask = ({
  selectContact,
  selectDeal,
  display = "chip",
  record: recordProp,
}: {
  selectContact?: boolean;
  selectDeal?: boolean;
  display?: "chip" | "icon";
  record?: any;
}) => {
  const { identity } = useGetIdentity();
  const dataProvider = useDataProvider();
  const refresh = useRefresh();
  const queryClient = useQueryClient();
  const [update] = useUpdate();
  const notify = useNotify();
  const translate = useTranslate();
  const contextRecord = useRecordContext();
  const record = recordProp || contextRecord;
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const getContactRepresentation = useGetRecordRepresentation("contacts");
  const getDealRepresentation = useGetRecordRepresentation("deals");

  const handleSuccess = async (data: any) => {
    setOpen(false);
    
    if (data.contact_id) {
      const contact = await dataProvider.getOne("contacts", {
        id: data.contact_id,
      });
      if (contact.data) {
        await update("contacts", {
          id: contact.data.id,
          data: { last_seen: new Date().toISOString() },
          previousData: contact.data,
        });
      }
    }

    if (data.deal_id) {
      const deal = await dataProvider.getOne("deals", {
        id: data.deal_id,
      });
      if (deal.data) {
        await update("deals", {
          id: deal.data.id,
          data: { updated_at: new Date().toISOString() },
          previousData: deal.data,
        });
      }
    }

    notify("resources.tasks.added");
    refresh();
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  if (!identity) return null;

  const isForContact = !!record?.first_name;
  const isForDeal = !!record?.name && !record?.first_name;

  return (
    <>
      {display === "icon" ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="p-2 cursor-pointer"
                onClick={handleOpen}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {translate("resources.tasks.action.create")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className="my-2">
          <Button
            variant="outline"
            className="h-6 cursor-pointer"
            onClick={handleOpen}
            size="sm"
          >
            <Plus className="w-4 h-4" />
            {translate("resources.tasks.action.add")}
          </Button>
        </div>
      )}

      <CreateBase
        resource="tasks"
        record={{
          type: "none",
          contact_id: isForContact ? record.id : undefined,
          deal_id: isForDeal ? record.id : undefined,
          due_date: new Date().toISOString(),
          sales_id: identity.id,
        }}
        transform={(data) => ({
          ...data,
          contact_id: isForContact ? record.id : data.contact_id,
          deal_id: isForDeal ? record.id : data.deal_id,
        })}
        mutationOptions={{ onSuccess: handleSuccess }}
      >
        <Dialog open={open} onOpenChange={() => setOpen(false)}>
          <DialogContent className="lg:max-w-xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
            <Form className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>
                  {isForContact
                    ? translate("resources.tasks.dialog.create_for", {
                        name: getContactRepresentation(record),
                      })
                    : isForDeal
                      ? translate("resources.tasks.dialog.create_for", {
                          name: getDealRepresentation(record),
                        })
                      : translate("resources.tasks.dialog.create")}
                </DialogTitle>
              </DialogHeader>
              <TaskFormContent
                selectContact={selectContact}
                selectDeal={selectDeal}
              />
              <DialogFooter className="w-full justify-end">
                <SaveButton />
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </CreateBase>
    </>
  );
};
