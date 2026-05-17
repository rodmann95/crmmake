import { useTranslate } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TasksListByDueDate } from "./TasksListByDueDate";
import { AddTask } from "./AddTask";

export const TasksPage = () => {
  const translate = useTranslate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">
          {translate("resources.tasks.name", { smart_count: 2 })}
        </h2>
        <AddTask selectContact selectDeal display="chip" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm border-none bg-transparent">
          <CardContent className="p-0">
            <TasksListByDueDate
              emptyPlaceholder={
                <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed rounded-2xl bg-muted/10">
                  <p className="text-muted-foreground text-lg mb-6">
                    {translate("resources.tasks.empty")}
                  </p>
                  <AddTask selectContact selectDeal />
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

TasksPage.path = "/tasks";
