import { useState, useCallback } from "react";
import {
  Link,
  Link as RouterLink,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";
import {
  RecordContextProvider,
  ShowBase,
  useListContext,
  useLocaleState,
  useRecordContext,
  useShowContext,
  useTranslate,
  useUpdate,
  useNotify,
  useDataProvider,
  useGetList,
} from "ra-core";
import { UserPlus, UserSearch } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  ReferenceManyField,
  SortButton,
  ReferenceInput,
  AutocompleteInput,
  Form,
} from "@/components/admin";

import { Avatar as ContactAvatar } from "../contacts/Avatar";

import { useIsMobile } from "@/hooks/use-mobile";
import { ActivityLog } from "../activity/ActivityLog";
import { Avatar } from "../contacts/Avatar";
import { TagsList } from "../contacts/TagsList";
import { findDealLabel } from "../deals/dealUtils";
import { MobileContent } from "../layout/MobileContent";
import MobileHeader from "../layout/MobileHeader";
import { MobileBackButton } from "../misc/MobileBackButton";
import { formatRelativeDate } from "../misc/RelativeDate";
import { Status } from "../misc/Status";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Company, Contact, Deal } from "../types";
import {
  AdditionalInfo,
  AddressInfo,
  CompanyAside,
  CompanyInfo,
  ContextInfo,
} from "./CompanyAside";
import { CompanyAvatar } from "./CompanyAvatar";

export const CompanyShow = () => {
  const isMobile = useIsMobile();

  return (
    <ShowBase>
      {isMobile ? <CompanyShowContentMobile /> : <CompanyShowContent />}
    </ShowBase>
  );
};

const CompanyShowContentMobile = () => {
  const translate = useTranslate();
  const { record, isPending } = useShowContext<Company>();
  if (isPending || !record) return null;

  return (
    <>
      <MobileHeader>
        <MobileBackButton to="/" />
        <div className="flex flex-1">
          <Link to="/">
            <h1 className="text-xl font-semibold">
              {translate("resources.companies.forcedCaseName")}
            </h1>
          </Link>
        </div>
      </MobileHeader>

      <MobileContent>
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <CompanyAvatar />
            <div className="mx-3 flex-1">
              <h2 className="text-2xl font-bold">{record.name}</h2>
            </div>
          </div>
        </div>
        <CompanyInfo record={record} />
        <AddressInfo record={record} />
        <ContextInfo record={record} />
        <AdditionalInfo record={record} />
      </MobileContent>
    </>
  );
};

const CompanyShowContent = () => {
  const translate = useTranslate();
  const { record, isPending } = useShowContext<Company>();
  const navigate = useNavigate();

  // Get tab from URL or default to "activity"
  const tabMatch = useMatch("/companies/:id/show/:tab");
  const currentTab = tabMatch?.params?.tab || "activity";

  const handleTabChange = (value: string) => {
    if (value === currentTab) return;
    if (value === "activity") {
      navigate(`/companies/${record?.id}/show`);
      return;
    }
    navigate(`/companies/${record?.id}/show/${value}`);
  };

  if (isPending || !record) return null;

  return (
    <div className="mt-2 flex pb-2 gap-8">
      <div className="flex-1">
        <Card>
          <CardContent>
            <div className="flex mb-3">
              <CompanyAvatar />
              <h5 className="text-xl ml-2 flex-1">{record.name}</h5>
            </div>
            <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activity">
                  {translate("crm.common.activity")}
                </TabsTrigger>
                <TabsTrigger value="contacts">
                  {record.nb_contacts === 0
                    ? translate("resources.companies.no_contacts")
                    : translate("resources.companies.nb_contacts", {
                        smart_count: record.nb_contacts ?? 0,
                      })}
                </TabsTrigger>
                {record.nb_deals ? (
                  <TabsTrigger value="deals">
                    {translate("resources.companies.nb_deals", {
                      smart_count: record.nb_deals ?? 0,
                    })}
                  </TabsTrigger>
                ) : null}
              </TabsList>
              <TabsContent value="activity" className="pt-2">
                <ActivityLog companyId={record.id} context="company" />
              </TabsContent>
              <TabsContent value="contacts">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-row justify-end space-x-2 mt-1">
                    <div className="flex gap-2">
                      <AddExistingContactButton />
                      <CreateRelatedContactButton />
                    </div>
                  </div>
                  {record.nb_contacts ? (
                    <CompanyContactsList companyId={record.id} />
                  ) : null}
                </div>
              </TabsContent>
              <TabsContent value="deals">
                {record.nb_deals ? (
                  <ReferenceManyField
                    reference="deals"
                    target="company_id"
                    sort={{ field: "name", order: "ASC" }}
                  >
                    <DealsIterator />
                  </ReferenceManyField>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <CompanyAside />
    </div>
  );
};

const ContactsIterator = () => {
  const translate = useTranslate();
  const [locale = "en"] = useLocaleState();
  const location = useLocation();
  const { data: contacts, error, isPending } = useListContext<Contact>();

  if (isPending || error) return null;

  return (
    <div className="pt-0">
      {contacts.map((contact) => (
        <RecordContextProvider key={contact.id} value={contact}>
          <div className="p-0 text-sm">
            <RouterLink
              to={`/contacts/${contact.id}/show`}
              state={{ from: location.pathname }}
              className="flex items-center justify-between hover:bg-muted py-2 transition-colors"
            >
              <div className="mr-4">
                <Avatar />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {`${contact.first_name} ${contact.last_name}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {contact.title}
                  {contact.nb_tasks
                    ? ` - ${translate("crm.common.task_count", {
                        smart_count: contact.nb_tasks ?? 0,
                      })}`
                    : ""}
                  &nbsp; &nbsp;
                  <TagsList />
                </div>
              </div>
              {contact.last_seen && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {translate("crm.common.last_activity_with_date", {
                      date: formatRelativeDate(contact.last_seen, locale),
                    })}{" "}
                    <Status status={contact.status} />
                  </div>
                </div>
              )}
            </RouterLink>
          </div>
        </RecordContextProvider>
      ))}
    </div>
  );
};

// Substitui ReferenceManyField para evitar o filtro client-side do ra-core
// que descartava contatos cujo company_id !== company.id (M2M)
const CompanyContactsList = ({ companyId }: { companyId: any }) => {
  const translate = useTranslate();
  const [locale = "en"] = useLocaleState();
  const location = useLocation();
  const { data: contacts, isPending } = useGetList<Contact>("contacts", {
    filter: { company_id: companyId },
    sort: { field: "last_name", order: "ASC" },
    pagination: { page: 1, perPage: 100 },
  });

  if (isPending) return null;
  if (!contacts || contacts.length === 0) return null;

  return (
    <div className="pt-0">
      {contacts.map((contact) => (
        <RecordContextProvider key={contact.id} value={contact}>
          <div className="p-0 text-sm">
            <RouterLink
              to={`/contacts/${contact.id}/show`}
              state={{ from: location.pathname }}
              className="flex items-center justify-between hover:bg-muted py-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ContactAvatar />
                <div>
                  <div className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </div>
                  {contact.title && (
                    <div className="text-muted-foreground">{contact.title}</div>
                  )}
                </div>
              </div>
              {contact.last_seen && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {translate("crm.common.last_activity_with_date", {
                      date: formatRelativeDate(contact.last_seen, locale),
                    })}{" "}
                    <Status status={contact.status} />
                  </div>
                </div>
              )}
            </RouterLink>
          </div>
        </RecordContextProvider>
      ))}
    </div>
  );
};

const AddExistingContactButton = () => {
  const translate = useTranslate();
  const company = useRecordContext<Company>();
  const [open, setOpen] = useState(false);
  const [update, { isPending }] = useUpdate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [contactId, setContactId] = useState<any>(null);
  const methods = useForm();

  const handleLink = async () => {
    if (!contactId || !company) return;
    try {
      const { data: contact } = await dataProvider.getOne("contacts", {
        id: contactId,
      });
      const currentCompanyIds = (contact.company_ids || []).map((id: any) =>
        Number(id),
      );
      const companyIdNum = Number(company.id);

      if (currentCompanyIds.includes(companyIdNum)) {
        notify("resources.contacts.action.already_linked", {
          type: "warning",
          messageArgs: { _: "Contact is already linked to this company" },
        });
        setOpen(false);
        return;
      }

      await update(
        "contacts",
        {
          id: contactId,
          data: {
            company_ids: [...currentCompanyIds, companyIdNum],
            company_id: contact.company_id ? contact.company_id : companyIdNum,
          },
        },
        { returnPromise: true },
      );
      notify("resources.contacts.action.linked_success", {
        type: "success",
        messageArgs: { _: "Contact linked successfully" },
      });
      setOpen(false);
      setContactId(null);
    } catch (err) {
      console.error("Link error:", err);
      notify("ra.notification.http_error", { type: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <UserSearch className="h-4 w-4" />
          {translate("resources.contacts.action.link_existing")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {translate("resources.contacts.action.link_existing_title")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.contacts.action.link_existing_description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...methods}>
          <div className="py-4">
            <ReferenceInput source="contact_id" reference="contacts">
              <AutocompleteInput
                label="resources.contacts.forcedCaseName"
                optionText={(choice: Contact) =>
                  `${choice.first_name} ${choice.last_name}`
                }
                onChange={(value) => setContactId(value)}
                helperText={false}
                className="w-full"
              />
            </ReferenceInput>
          </div>
        </Form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {translate("ra.action.cancel")}
          </Button>
          <Button onClick={handleLink} disabled={!contactId || isPending}>
            {translate("ra.action.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CreateRelatedContactButton = () => {
  const translate = useTranslate();
  const company = useRecordContext<Company>();
  return (
    <Button variant="outline" asChild size="sm" className="h-9">
      <RouterLink
        to="/contacts/create"
        state={company ? { record: { company_ids: [company.id] } } : undefined}
        className="flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        {translate("resources.contacts.action.add")}
      </RouterLink>
    </Button>
  );
};

const DealsIterator = () => {
  const translate = useTranslate();
  const [locale = "en"] = useLocaleState();
  const { data: deals, error, isPending } = useListContext<Deal>();
  const { dealStages, dealCategories, currency } = useConfigurationContext();
  if (isPending || error) return null;
  return (
    <div>
      <div>
        {deals.map((deal) => (
          <div key={deal.id} className="p-0 text-sm">
            <RouterLink
              to={`/deals/${deal.id}/show`}
              className="flex items-center justify-between hover:bg-muted py-2 px-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium">{deal.name}</div>
                <div className="text-sm text-muted-foreground">
                  {findDealLabel(dealStages, deal.stage)},{" "}
                  {deal.amount.toLocaleString("en-US", {
                    notation: "compact",
                    style: "currency",
                    currency,
                    currencyDisplay: "narrowSymbol",
                    minimumSignificantDigits: 3,
                  })}
                  {deal.category
                    ? `, ${dealCategories.find((c) => c.value === deal.category)?.label ?? deal.category}`
                    : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {translate("crm.common.last_activity_with_date", {
                    date: formatRelativeDate(deal.updated_at, locale),
                  })}{" "}
                </div>
              </div>
            </RouterLink>
          </div>
        ))}
      </div>
    </div>
  );
};
