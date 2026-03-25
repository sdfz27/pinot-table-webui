import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { indexingStepSchema } from "../../utils/validation";
import { useWizardStore } from "../../store/wizardStore";
import { StepIndicator } from "../wizard/StepIndicator";
import { NavigationButtons } from "../wizard/NavigationButtons";
import { SearchableColumnMultiSelect } from "../common/SearchableColumnMultiSelect";

const indexColumnArrayFields = [
  { key: "noDictionaryColumns", label: "No dictionary columns" },
  { key: "invertedIndexColumns", label: "Inverted index columns" },
  { key: "bloomFilterColumns", label: "Bloom filter columns" },
  { key: "onHeapDictionaryColumns", label: "On-heap dictionary columns" },
  { key: "rangeIndexColumns", label: "Range index columns" },
  { key: "varLengthDictionaryColumns", label: "Var-length dictionary columns" },
  { key: "jsonIndexColumns", label: "JSON index columns" },
] as const;

const indexingFormSchema = indexingStepSchema
  .extend({
    timeColumnName: z.string().optional(),
    retentionTimeUnit: z.enum(["HOURS", "DAYS", "MONTHS", "YEARS"]).optional().or(z.literal("")),
    retentionTimeValue: z.number().optional(),
    sortedColumn: z.string().optional(),
    loadMode: z.enum(["HEAP", "MMAP"]),
    completionMode: z.enum(["BUILD", "DOWNLOAD"]),
    noDictionaryColumns: z.array(z.string()),
    invertedIndexColumns: z.array(z.string()),
    bloomFilterColumns: z.array(z.string()),
    rangeIndexColumns: z.array(z.string()),
    onHeapDictionaryColumns: z.array(z.string()),
    varLengthDictionaryColumns: z.array(z.string()),
    jsonIndexColumns: z.array(z.string()),
    brokerTenant: z.string().optional(),
    serverTenant: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const b = (data.brokerTenant ?? "").trim();
    const s = (data.serverTenant ?? "").trim();
    if ((b && !s) || (!b && s)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide both broker and server tenant names, or leave both empty.",
        path: ["brokerTenant"],
      });
    }
  });

type IndexingFormData = z.infer<typeof indexingFormSchema>;

export function IndexingStep() {
  const {
    currentStep,
    columns,
    timeColumnName,
    replication,
    retentionTimeUnit,
    retentionTimeValue,
    completionMode,
    sortedColumn,
    loadMode,
    noDictionaryColumns,
    invertedIndexColumns,
    bloomFilterColumns,
    rangeIndexColumns,
    onHeapDictionaryColumns,
    varLengthDictionaryColumns,
    jsonIndexColumns,
    brokerTenant,
    serverTenant,
    updateIndexing,
    setStep,
  } = useWizardStore();

  const dateTimeColumns = columns.filter((c) => c.fieldType === "DATETIME");
  const allColumnNames = columns.map((c) => c.name).filter(Boolean);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IndexingFormData>({
    resolver: zodResolver(indexingFormSchema),
    defaultValues: {
      timeColumnName: timeColumnName || "",
      replication,
      retentionTimeUnit: retentionTimeUnit || "",
      retentionTimeValue: retentionTimeValue ?? 0,
      completionMode: completionMode === "BUILD" ? "BUILD" : "DOWNLOAD",
      sortedColumn: sortedColumn || "",
      loadMode,
      noDictionaryColumns: noDictionaryColumns ?? [],
      invertedIndexColumns: invertedIndexColumns ?? [],
      bloomFilterColumns: bloomFilterColumns ?? [],
      rangeIndexColumns: rangeIndexColumns ?? [],
      onHeapDictionaryColumns: onHeapDictionaryColumns ?? [],
      varLengthDictionaryColumns: varLengthDictionaryColumns ?? [],
      jsonIndexColumns: jsonIndexColumns ?? [],
      brokerTenant: brokerTenant || "",
      serverTenant: serverTenant || "",
    },
  });

  const onValid = (data: IndexingFormData) => {
    updateIndexing({
      timeColumnName: data.timeColumnName || "",
      replication: data.replication,
      retentionTimeUnit: (data.retentionTimeUnit as "HOURS" | "DAYS" | "MONTHS" | "YEARS" | "") || "",
      retentionTimeValue: data.retentionTimeValue ?? 0,
      completionMode: data.completionMode,
      sortedColumn: data.sortedColumn || "",
      loadMode: data.loadMode,
      noDictionaryColumns: data.noDictionaryColumns,
      invertedIndexColumns: data.invertedIndexColumns,
      bloomFilterColumns: data.bloomFilterColumns,
      rangeIndexColumns: data.rangeIndexColumns,
      onHeapDictionaryColumns: data.onHeapDictionaryColumns,
      varLengthDictionaryColumns: data.varLengthDictionaryColumns,
      jsonIndexColumns: data.jsonIndexColumns,
      brokerTenant: data.brokerTenant ?? "",
      serverTenant: data.serverTenant ?? "",
    });
    setStep(currentStep + 1);
  };

  const handleNext = () => {
    handleSubmit(onValid)();
  };

  const handleBack = () => {
    setStep(currentStep - 1);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <StepIndicator currentStep={currentStep} />
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold">Indexing &amp; Segments</h2>

          <div className="space-y-8">
            <section className="space-y-4 border-b border-gray-100 pb-6">
              <h3 className="text-base font-semibold text-gray-900">Segment settings</h3>
              <p className="text-sm text-gray-600">
                Time column, retention, replication, and segment completion apply to{" "}
                <code className="rounded bg-gray-100 px-1">segmentsConfig</code> in the table JSON.
              </p>
              {dateTimeColumns.length > 0 && (
                <div>
                  <label htmlFor="timeColumnName" className="block text-sm font-medium text-gray-700">
                    Time column name
                  </label>
                  <select
                    id="timeColumnName"
                    {...register("timeColumnName")}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">(None)</option>
                    {dateTimeColumns.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {dateTimeColumns.length === 0 && (
                <p className="text-sm text-gray-500">
                  No DateTime columns defined yet. Add a DateTime column in the schema step to set{" "}
                  <span className="font-medium">timeColumnName</span>.
                </p>
              )}
              <div>
                <label htmlFor="replication" className="block text-sm font-medium text-gray-700">
                  Replication
                </label>
                <input
                  id="replication"
                  type="number"
                  min={1}
                  {...register("replication", { valueAsNumber: true })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.replication && (
                  <p className="mt-1 text-sm text-red-600">{errors.replication.message}</p>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="retentionTimeValue" className="block text-sm font-medium text-gray-700">
                    Retention time value
                  </label>
                  <input
                    id="retentionTimeValue"
                    type="number"
                    min={0}
                    {...register("retentionTimeValue", { valueAsNumber: true })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="retentionTimeUnit" className="block text-sm font-medium text-gray-700">
                    Retention time unit
                  </label>
                  <select
                    id="retentionTimeUnit"
                    {...register("retentionTimeUnit")}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">(None)</option>
                    <option value="HOURS">HOURS</option>
                    <option value="DAYS">DAYS</option>
                    <option value="MONTHS">MONTHS</option>
                    <option value="YEARS">YEARS</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="completionMode" className="block text-sm font-medium text-gray-700">
                  Completion config (completion mode)
                </label>
                <p className="mt-0.5 text-xs text-gray-500">
                  Whether consuming segments are built locally or downloaded (e.g. from a peer). Default is DOWNLOAD.
                </p>
                <select
                  id="completionMode"
                  {...register("completionMode")}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="DOWNLOAD">DOWNLOAD</option>
                  <option value="BUILD">BUILD</option>
                </select>
              </div>
            </section>

            <section className="space-y-4 border-b border-gray-100 pb-6">
              <h3 className="text-base font-semibold text-gray-900">Indexing settings</h3>
              <p className="text-sm text-gray-600">
                Sorted column, load mode, and column-level index lists map to{" "}
                <code className="rounded bg-gray-100 px-1">tableIndexConfig</code>.
              </p>
              {allColumnNames.length > 0 && (
                <div>
                  <label htmlFor="sortedColumn" className="block text-sm font-medium text-gray-700">
                    Sorted column
                  </label>
                  <select
                    id="sortedColumn"
                    {...register("sortedColumn")}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">(None)</option>
                    {allColumnNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="loadMode" className="block text-sm font-medium text-gray-700">
                  Load mode
                </label>
                <select
                  id="loadMode"
                  {...register("loadMode")}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="HEAP">HEAP</option>
                  <option value="MMAP">MMAP</option>
                </select>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {indexColumnArrayFields.map(({ key, label }) => (
                  <SearchableColumnMultiSelect
                    key={key}
                    id={key}
                    label={label}
                    columnNames={allColumnNames}
                    selected={(watch(key) as string[]) ?? []}
                    onChange={(next) => setValue(key, next, { shouldDirty: true })}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Tenants</h3>
              <p className="text-sm text-gray-600">
                Optional broker and server tenant names for this table. Both must be set together or left empty.
              </p>
              <div>
                <label htmlFor="brokerTenant" className="block text-sm font-medium text-gray-700">
                  Broker tenant
                </label>
                <input
                  id="brokerTenant"
                  type="text"
                  placeholder="e.g. myBrokerTenant"
                  {...register("brokerTenant")}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.brokerTenant && (
                  <p className="mt-1 text-sm text-red-600">{errors.brokerTenant.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="serverTenant" className="block text-sm font-medium text-gray-700">
                  Server tenant
                </label>
                <input
                  id="serverTenant"
                  type="text"
                  placeholder="e.g. myServerTenant"
                  {...register("serverTenant")}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </section>
          </div>
        </div>
        <footer className="flex justify-between">
          <NavigationButtons
            currentStep={currentStep}
            onBack={handleBack}
            onNext={handleNext}
            isNextDisabled={false}
          />
        </footer>
      </div>
    </form>
  );
}
