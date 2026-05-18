import {
  type Identifier,
  useDataProvider,
  useGetIdentity,
  useGetOne,
  useGetRecordRepresentation,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { CreateSheet } from "../misc/CreateSheet";
import { TaskFormContent } from "./TaskFormContent";
import { useQueryClient } from "@tanstack/react-query";

export interface TaskCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact_id?: Identifier;
  deal_id?: Identifier;
}

export const TaskCreateSheet = ({
  open,
  onOpenChange,
  contact_id,
  deal_id,
}: TaskCreateSheetProps) => {
  const { identity } = useGetIdentity();
  const translate = useTranslate();
  const getContactRepresentation = useGetRecordRepresentation("contacts");
  const getDealRepresentation = useGetRecordRepresentation("deals");

  const selectContact = contact_id == null;
  const selectDeal = deal_id == null;

  const { data: contact } = useGetOne(
    "contacts",
    { id: contact_id! },
    { enabled: !selectContact },
  );

  const { data: deal } = useGetOne(
    "deals",
    { id: deal_id! },
    { enabled: !selectDeal },
  );

  const [update] = useUpdate();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const notify = useNotify();

  if (!identity) return null;

  const handleSuccess = async (data: any) => {
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

    queryClient.invalidateQueries({
      queryKey: ["contacts", "getOne"],
    });
    queryClient.invalidateQueries({
      queryKey: ["tasks"],
    });

    notify("resources.tasks.added");
    // No redirect, only close the sheet
    onOpenChange(false);
  };

  return (
    <CreateSheet
      resource="tasks"
      title={
        <span className="text-xl font-semibold truncate pr-10">
          {!selectContact
            ? translate("resources.tasks.dialog.create_for", {
                name: getContactRepresentation(contact!),
              })
            : !selectDeal
              ? translate("resources.tasks.dialog.create_for", {
                  name: getDealRepresentation(deal!),
                })
              : translate("resources.tasks.dialog.create")}
        </span>
      }
      redirect={false}
      record={{
        type: "none",
        contact_id,
        deal_id,
        due_date: new Date().toISOString(),
        sales_id: identity.id,
      }}
      mutationOptions={{
        onSuccess: handleSuccess,
      }}
      open={open}
      onOpenChange={onOpenChange}
    >
      <TaskFormContent selectContact={selectContact} selectDeal={selectDeal} />
    </CreateSheet>
  );
};
