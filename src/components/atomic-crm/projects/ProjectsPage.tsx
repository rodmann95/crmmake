import * as React from "react";
import { useGetList } from "ra-core";
import { Link } from "react-router";
import { CalendarRange, Filter, ChevronDown, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CompanyAvatar } from "../companies/CompanyAvatar";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { formatISODateString } from "../deals/dealUtils";

export const ProjectsPage = () => {
  const { dealStages, dealCycles } = useConfigurationContext();

  // Local state for filters
  const [selectedCycle, setSelectedCycle] = React.useState<string>("");
  const [selectedStages, setSelectedStages] = React.useState<string[]>([]);

  // Fetch all deals with pagination high enough to load active ones
  const { data: deals, isPending } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "project_start_date", order: "ASC" },
  });

  // Filter deals that have valid project dates defined
  const validDeals = React.useMemo(() => {
    return (deals || []).filter(
      (d) => d.project_start_date && d.project_end_date
    );
  }, [deals]);

  // Apply active filters
  const filteredDeals = React.useMemo(() => {
    return validDeals.filter((deal) => {
      const matchesCycle = !selectedCycle || deal.commercial_cycle === selectedCycle;
      const matchesStage =
        selectedStages.length === 0 || selectedStages.includes(deal.stage);
      return matchesCycle && matchesStage;
    });
  }, [validDeals, selectedCycle, selectedStages]);

  // Calculate dynamic timeline bounds based on filtered projects
  const { minDate, maxDate, totalDays, timelineMonths } = React.useMemo(() => {
    let min = new Date();
    let max = new Date();

    if (filteredDeals.length > 0) {
      const startDates = filteredDeals.map((d) => new Date(d.project_start_date!));
      const endDates = filteredDeals.map((d) => new Date(d.project_end_date!));
      min = new Date(Math.min(...startDates.map((d) => d.getTime())));
      max = new Date(Math.max(...endDates.map((d) => d.getTime())));
    }

    // Add padding of 15 days on each side
    const paddedMin = new Date(min);
    paddedMin.setDate(paddedMin.getDate() - 15);
    const paddedMax = new Date(max);
    paddedMax.setDate(paddedMax.getDate() + 15);

    const diffTime = Math.abs(paddedMax.getTime() - paddedMin.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 30;

    // Generate month markers
    const months: Date[] = [];
    const current = new Date(paddedMin);
    current.setDate(1);
    while (current <= paddedMax) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return {
      minDate: paddedMin,
      maxDate: paddedMax,
      totalDays: days,
      timelineMonths: months,
    };
  }, [filteredDeals]);

  // Helper to map stages to vibrant, beautiful gradients
  const getStageColorClass = (stage: string) => {
    switch (stage) {
      case "opportunity":
        return "from-blue-500/80 to-blue-600/80 border-blue-400/50 shadow-blue-500/10";
      case "proposal-sent":
        return "from-amber-500/80 to-amber-600/80 border-amber-400/50 shadow-amber-500/10";
      case "in-negotiation":
        return "from-purple-500/80 to-purple-600/80 border-purple-400/50 shadow-purple-500/10";
      case "won":
        return "from-emerald-500/80 to-emerald-600/80 border-emerald-400/50 shadow-emerald-500/10";
      default:
        return "from-gray-500/70 to-gray-600/70 border-gray-400/50 shadow-gray-500/10";
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text">
            Cronograma de Projetos (Gantt)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize os prazos previstos e a duração de todas as oportunidades ativas
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center bg-card/45 backdrop-blur-md p-4 rounded-xl border border-border/40 shadow-sm">
        {/* Status Multi-select Filter */}
        <div className="w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-10 px-4 flex items-center justify-between gap-2 bg-background border-border/80 hover:bg-muted/50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Etapas:{" "}
                    {selectedStages.length === 0
                      ? "Todas"
                      : `${selectedStages.length} selecionada(s)`}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Selecionar Etapas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {dealStages.map((stage) => {
                const isChecked = selectedStages.includes(stage.value);
                return (
                  <DropdownMenuCheckboxItem
                    key={stage.value}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStages([...selectedStages, stage.value]);
                      } else {
                        setSelectedStages(selectedStages.filter((s) => s !== stage.value));
                      }
                    }}
                  >
                    {stage.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
              {selectedStages.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-xs font-semibold text-primary cursor-pointer"
                    onClick={() => setSelectedStages([])}
                  >
                    Limpar Seleção
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Commercial Cycle Filter */}
        <div className="w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-10 px-4 flex items-center justify-between gap-2 bg-background border-border/80 hover:bg-muted/50 rounded-lg text-sm"
              >
                <span>
                  Ciclo:{" "}
                  {selectedCycle
                    ? dealCycles.find((c) => c.value === selectedCycle)?.label || selectedCycle
                    : "Todos"}
                </span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Filtrar por Ciclo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer flex items-center justify-between"
                onClick={() => setSelectedCycle("")}
              >
                <span>Todos</span>
                {!selectedCycle && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
              {dealCycles.map((cycle) => (
                <DropdownMenuItem
                  key={cycle.value}
                  className="cursor-pointer flex items-center justify-between"
                  onClick={() => setSelectedCycle(cycle.value)}
                >
                  <span>{cycle.label}</span>
                  {selectedCycle === cycle.value && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Clear Filters Helper */}
        {(selectedCycle || selectedStages.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCycle("");
              setSelectedStages([]);
            }}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground h-10 px-3"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Gantt Visualizer Section */}
      <Card className="border border-border/40 bg-card/35 backdrop-blur-md overflow-hidden shadow-md rounded-xl">
        <CardContent className="p-0">
          {isPending ? (
            <div className="flex flex-col items-center justify-center p-24 text-center">
              <div className="w-8 h-8 rounded-full border-4 border-t-primary border-r-transparent animate-spin mb-4" />
              <p className="text-muted-foreground">Carregando cronogramas...</p>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <CalendarRange className="w-12 h-12 text-muted-foreground/60 mb-4 animate-bounce" />
              <h3 className="text-lg font-bold">Nenhum projeto encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {validDeals.length === 0
                  ? "Certifique-se de preencher a 'Data de início previsto' e a 'Duração' no cadastro de suas oportunidades."
                  : "Não há projetos correspondentes aos filtros selecionados."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              {/* Gantt Container */}
              <div className="min-w-[800px] select-none">
                {/* 1. Chronological Timeline Header */}
                <div className="flex border-b border-border/30 bg-muted/40 h-12 items-center text-xs font-bold text-muted-foreground uppercase tracking-wider relative">
                  {/* Left Label column spacer */}
                  <div className="w-[280px] shrink-0 border-r border-border/30 px-6 flex items-center">
                    Projeto / Oportunidade
                  </div>

                  {/* Horizontal chronological grid header */}
                  <div className="flex-1 h-full relative">
                    {timelineMonths.map((monthDate, idx) => {
                      // Calculate width percentage for this month within the timeline
                      const nextMonth = new Date(monthDate);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      const monthStart = Math.max(monthDate.getTime(), minDate.getTime());
                      const monthEnd = Math.min(nextMonth.getTime(), maxDate.getTime());
                      const daysInTimeline = Math.ceil((monthEnd - monthStart) / (1000 * 60 * 60 * 24));
                      const monthWidthPercent = (daysInTimeline / totalDays) * 100;

                      return (
                        <div
                          key={idx}
                          className="absolute top-0 bottom-0 border-r border-border/10 flex items-center px-3"
                          style={{
                            left: `${((monthStart - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100}%`,
                            width: `${monthWidthPercent}%`,
                          }}
                        >
                          <span className="truncate">
                            {monthDate.toLocaleDateString("pt-BR", {
                              month: "short",
                              year: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Gantt Rows */}
                <div className="divide-y divide-border/20 relative">
                  {filteredDeals.map((deal) => {
                    const startVal = new Date(deal.project_start_date!);
                    const endVal = new Date(deal.project_end_date!);

                    // Calculate positional percentage
                    const startDayOffset = Math.ceil(
                      (startVal.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const durationDays = Math.ceil(
                      (endVal.getTime() - startVal.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    const leftPercent = Math.max(0, (startDayOffset / totalDays) * 100);
                    const widthPercent = Math.min(100 - leftPercent, (durationDays / totalDays) * 100);

                    return (
                      <div
                        key={deal.id}
                        className="flex h-16 items-center hover:bg-muted/15 transition-all duration-150 relative group"
                      >
                        {/* Left Column: Project/Company Identifier */}
                        <div className="w-[280px] shrink-0 border-r border-border/20 px-6 h-full flex items-center gap-3 bg-card/20 z-10">
                          <Link
                            to={`/deals/${deal.id}/show`}
                            className="hover:underline flex items-center gap-3 min-w-0"
                          >
                            <div className="shrink-0">
                              <CompanyAvatar width={40} height={40} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate max-w-[170px]">
                                {deal.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
                                {dealCycles.find((c) => c.value === deal.commercial_cycle)?.label ||
                                  deal.commercial_cycle}
                              </p>
                            </div>
                          </Link>
                        </div>

                        {/* Right Column: Timeline Grid Bar */}
                        <div className="flex-1 h-full relative flex items-center">
                          {/* Subtle background grid columns */}
                          {timelineMonths.map((monthDate, idx) => {
                            const nextMonth = new Date(monthDate);
                            nextMonth.setMonth(nextMonth.getMonth() + 1);
                            const monthStart = Math.max(monthDate.getTime(), minDate.getTime());
                            const monthLeftPercent =
                              ((monthStart - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;

                            return (
                              <div
                                key={idx}
                                className="absolute top-0 bottom-0 border-r border-border/5 pointer-events-none"
                                style={{ left: `${monthLeftPercent}%` }}
                              />
                            );
                          })}

                          {/* Gantt Bar */}
                          <div
                            className={`absolute h-7 rounded-lg bg-gradient-to-r ${getStageColorClass(
                              deal.stage
                            )} border shadow-sm flex items-center px-3 text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer`}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              minWidth: "24px",
                            }}
                          >
                            <span className="text-[10px] font-extrabold truncate drop-shadow-md">
                              {durationDays} dias
                            </span>
                          </div>

                          {/* Hover Details Card (Custom elegant tooltip) */}
                          <div className="absolute left-[30px] hidden group-hover:block bottom-14 z-50 w-72 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md p-4 shadow-xl text-popover-foreground text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <h4 className="font-extrabold text-sm mb-2 text-foreground border-b pb-1">
                              {deal.name}
                            </h4>
                            <div className="space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Etapa:</span>
                                <span className="font-semibold">
                                  {dealStages.find((s) => s.value === deal.stage)?.label ||
                                    deal.stage}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Início Previsto:</span>
                                <span className="font-semibold">
                                  {formatISODateString(deal.project_start_date!)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fim Previsto:</span>
                                <span className="font-semibold">
                                  {formatISODateString(deal.project_end_date!)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Duração:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {durationDays} dias
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

ProjectsPage.path = "/projects";
