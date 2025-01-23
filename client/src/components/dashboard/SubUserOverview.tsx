import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, AlertTriangle } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { t } from "@/lib/i18n";

interface SubUserOverviewProps {
  totalUsers: number;
  maxUsers: number;
  onAddEmployee: () => void;
}

export default function SubUserOverview({
  totalUsers,
  maxUsers,
  onAddEmployee,
}: SubUserOverviewProps) {
  const usagePercentage = (totalUsers / maxUsers) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = totalUsers >= maxUsers;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('employees.totalEmployees')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              von {maxUsers} verfügbaren Plätzen
            </p>
          </CardContent>
        </Card>

        <Card className={isNearLimit ? "border-yellow-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('employees.overview')}</CardTitle>
            {isNearLimit && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={usagePercentage} />
              <p className="text-xs text-muted-foreground">
                {usagePercentage.toFixed(1)}% der Kapazität genutzt
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              onClick={onAddEmployee}
              disabled={isAtLimit}
              className="space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>{t('employees.addEmployee')}</span>
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {isNearLimit && (
        <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {isAtLimit
                  ? "Sie haben die maximale Anzahl von Mitarbeitern erreicht. Bitte upgraden Sie Ihren Plan, um weitere Mitarbeiter hinzuzufügen."
                  : "Sie nähern sich Ihrem Mitarbeiterlimit. Erwägen Sie ein Upgrade Ihres Plans, um weitere Mitarbeiter hinzuzufügen."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}