import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { required, useGetOne } from "ra-core";
import { DateTimeInput } from "@/components/admin";
import { useWatch } from "react-hook-form";

import { contactOptionText } from "../misc/ContactOption";
import { useConfigurationContext } from "../root/ConfigurationContext";

export const TaskFormContent = ({
  selectContact,
  selectDeal,
}: {
  selectContact?: boolean;
  selectDeal?: boolean;
}) => {
  const { taskTypes } = useConfigurationContext();
  
  const dealId = useWatch({ name: "deal_id" });
  const { data: deal } = useGetOne("deals", { id: dealId }, { enabled: !!dealId });

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        autoFocus
        source="text"
        validate={required()}
        multiline
        className="m-0"
        helperText={false}
      />

      {selectDeal && (
        <ReferenceInput source="deal_id" reference="deals">
          <AutocompleteInput
            label="resources.tasks.fields.deal_id"
            optionText="name"
            helperText={false}
            modal
          />
        </ReferenceInput>
      )}

      {selectContact && (
        <ReferenceInput 
          source="contact_id" 
          reference="contacts"
          filter={deal?.company_id ? { company_id: deal.company_id } : undefined}
        >
          <AutocompleteInput
            label="resources.tasks.fields.contact_id"
            optionText={contactOptionText}
            helperText={false}
            modal
          />
        </ReferenceInput>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateTimeInput
          source="due_date"
          helperText={false}
          validate={required()}
        />
        <SelectInput
          source="type"
          validate={required()}
          choices={taskTypes}
          optionText="label"
          optionValue="value"
          defaultValue="none"
          helperText={false}
        />
      </div>
    </div>
  );
};
