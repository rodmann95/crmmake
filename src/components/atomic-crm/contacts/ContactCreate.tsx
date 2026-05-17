import { CreateBase, Form, useGetIdentity, useTranslate, type MutationMode } from "ra-core";
import { useLocation } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SaveButton } from "@/components/admin/form";
import { CancelButton } from "@/components/admin/cancel-button";

import { ContactInputs } from "./ContactInputs";
import { FormToolbar } from "../layout/FormToolbar";
import {
  cleanupContactForCreate,
  defaultEmailJsonb,
  defaultPhoneJsonb,
} from "./contactModel";

const ContactCreateToolbar = ({
  companyIds,
  salesId,
}: {
  companyIds?: any[];
  salesId?: string | number;
}) => {
  const translate = useTranslate();
  const { reset } = useFormContext();
  return (
    <div
      role="toolbar"
      className="sticky flex pt-4 pb-4 md:pb-0 bottom-0 bg-linear-to-b from-transparent to-card to-10% flex-row justify-end gap-2"
    >
      <CancelButton />
      <SaveButton />
      {companyIds && companyIds.length > 0 && (
        <SaveButton
          label="crm.action.save_and_add_another"
          icon={<Plus className="h-4 w-4" />}
          variant="outline"
          mutationOptions={{
            onSuccess: () => {
              reset({
                sales_id: salesId,
                email_jsonb: defaultEmailJsonb,
                phone_jsonb: defaultPhoneJsonb,
                company_ids: companyIds,
              });
            },
          }}
          type="button"
          redirect={false}
        />
      )}
    </div>
  );
};

export const ContactCreate = ({
  mutationMode,
}: {
  mutationMode?: MutationMode;
}) => {
  const { identity } = useGetIdentity();

  const location = useLocation();
  const company_ids = location.state?.record?.company_ids;

  return (
    <CreateBase
      redirect={
        company_ids && company_ids.length > 0
          ? `/companies/${company_ids[0]}/show/contacts`
          : "show"
      }
      transform={cleanupContactForCreate}
      mutationMode={mutationMode}
    >
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form
            defaultValues={{
              sales_id: identity?.id,
              email_jsonb: defaultEmailJsonb,
              phone_jsonb: defaultPhoneJsonb,
              company_ids: company_ids || [],
            }}
          >
            <Card>
              <CardContent>
                <ContactInputs />
                <ContactCreateToolbar
                  companyIds={company_ids}
                  salesId={identity?.id}
                />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};
