import * as React from "react";
import { required, useTranslate } from "ra-core";
import { useWatch } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { NumberInput } from "@/components/admin/number-input";
import { DateInput } from "@/components/admin/date-input";
import { SelectInput } from "@/components/admin/select-input";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

import { contactOptionText } from "../misc/ContactOption";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput.tsx";

export const DealInputs = () => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col gap-8">
      <DealInfoInputs />

      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <DealLinkedToInputs />
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <DealMiscInputs />
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <DealProjectDatesInputs />
      </div>
    </div>
  );
};

const DealInfoInputs = () => {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <TextInput source="name" validate={required()} helperText={false} />
      <TextInput source="description" multiline rows={3} helperText={false} />
    </div>
  );
};

const DealLinkedToInputs = () => {
  const translate = useTranslate();
  const companyId = useWatch({ name: "company_id" });

  return (
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-base font-medium">
        {translate("resources.deals.inputs.linked_to")}
      </h3>
      <ReferenceInput source="company_id" reference="companies">
        <AutocompleteCompanyInput
          label="resources.deals.fields.company_id"
          validate={required()}
          modal
        />
      </ReferenceInput>

      <ReferenceArrayInput source="contact_ids" reference="contacts_summary">
        <AutocompleteArrayInput
          label="resources.deals.fields.contact_ids"
          optionText={contactOptionText}
          helperText={false}
          companyId={companyId}
        />
      </ReferenceArrayInput>
    </div>
  );
};
const DealMiscInputs = () => {
  const { dealStages, dealCategories, dealCycles, dealPipelineStatuses, currency, noteStatuses } = useConfigurationContext();
  const translate = useTranslate();
  const { setValue } = useFormContext();
  const stage = useWatch({ name: "stage" });
  const isWon = stage && dealPipelineStatuses.includes(stage);
  const maintenanceAmount = useWatch({ name: "maintenance_amount" }) || 0;
  const projectedMaintenance = maintenanceAmount * 12;

  return (
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-base font-medium">
        {translate("resources.deals.field_categories.misc")}
      </h3>

      <SelectInput
        source="category"
        choices={dealCategories}
        optionText="label"
        optionValue="value"
        helperText={false}
      />
      <div className="flex gap-4">
        <NumberInput
          source="amount"
          defaultValue={0}
          helperText={false}
          validate={required()}
          className="flex-1"
        />
        <NumberInput
          source="installments"
          label="Parcelas"
          defaultValue={1}
          helperText={false}
          className="flex-1"
        />
      </div>
      <div className="flex gap-4">
        <NumberInput
          source="maintenance_amount"
          defaultValue={0}
          helperText={false}
          className="flex-1"
        />
        <div className="flex-1 flex flex-col justify-end">
          <span className="text-[11px] font-medium text-muted-foreground uppercase mb-1">
            Valor Projetado Sustentação
          </span>
          <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/40 text-sm flex items-center font-medium">
            {projectedMaintenance.toLocaleString("pt-BR", {
              style: "currency",
              currency: currency || "BRL",
            })}
            <span className="text-[10px] text-muted-foreground ml-1">/ano</span>
          </div>
        </div>
      </div>
      <DateInput
        validate={required()}
        source="expected_closing_date"
        helperText={false}
        defaultValue={new Date().toISOString().split("T")[0]}
      />
      <SelectInput
        source="stage"
        choices={dealStages}
        optionText="label"
        optionValue="value"
        defaultValue="opportunity"
        helperText={false}
        validate={required()}
        onChange={(e) => {
          if (dealPipelineStatuses.includes(e.target.value)) {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const today = `${year}-${month}-${day}`;
            setValue("expected_closing_date", today);
            setValue("won_date", today);
          } else {
            setValue("won_date", null);
          }
        }}
      />
      <SelectInput
        source="status"
        label="Calor do Negócio"
        choices={noteStatuses}
        optionText="label"
        optionValue="value"
        defaultValue="cold"
        helperText={false}
      />
      {isWon && (
        <DateInput
          source="won_date"
          label="resources.deals.fields.won_date"
          helperText={false}
          validate={required()}
          defaultValue={new Date().toISOString().split("T")[0]}
        />
      )}
      <SelectInput
        source="commercial_cycle"
        choices={dealCycles}
        optionText="label"
        optionValue="value"
        helperText={false}
      />
    </div>
  );
};

const DealProjectDatesInputs = () => {
  const { setValue } = useFormContext();
  const startDate = useWatch({ name: "project_start_date" });
  const duration = useWatch({ name: "project_duration_days" });

  React.useEffect(() => {
    if (startDate && duration != null && !isNaN(Number(duration)) && Number(duration) >= 0) {
      const date = new Date(startDate);
      // We must avoid timezone shifts, so set date strictly
      date.setUTCDate(date.getUTCDate() + Number(duration));
      const formatted = date.toISOString().split("T")[0];
      setValue("project_end_date", formatted);
    }
  }, [startDate, duration, setValue]);

  return (
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-base font-medium">Datas do Projeto</h3>
      <DateInput
        source="project_start_date"
        label="Data de início previsto"
        helperText={false}
      />
      <NumberInput
        source="project_duration_days"
        label="Duração (dias)"
        helperText={false}
        min={0}
      />
      <DateInput
        source="project_end_date"
        label="Data de Fim previsto"
        helperText={false}
      />
    </div>
  );
};
