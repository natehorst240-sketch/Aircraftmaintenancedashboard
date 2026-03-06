import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Input } from "./ui/input";
import { Search, AlertTriangle, Clock } from "lucide-react";
import { useMaintenanceData } from "../hooks/useMaintenanceData";

export default function ComponentsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const { aircraft, components, isUsingMockData } = useMaintenanceData();

  // Filter components by search term
  const filteredData = components
    .map((ac) => ({
      ...ac,
      components: ac.components.filter(
        (component) =>
          component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          component.serialNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ac.registration
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((ac) => ac.components.length > 0);

  const getStatusColor = (hours: number) => {
    if (hours <= 0)   return "border-red-600 bg-red-100";
    if (hours <= 25)  return "border-red-500 bg-red-50";
    if (hours <= 75)  return "border-amber-500 bg-amber-50";
    if (hours <= 150) return "border-blue-500 bg-blue-50";
    return "border-green-500 bg-green-50";
  };

  const getStatusBadge = (hours: number) => {
    if (hours <= 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Past Due
        </Badge>
      );
    }
    if (hours <= 25) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </Badge>
      );
    }
    if (hours <= 75) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 gap-1">
          <Clock className="w-3 h-3" />
          Warning
        </Badge>
      );
    }
    if (hours <= 150) {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          Monitor
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        Good
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Components Due in Next 200 Hours
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isUsingMockData
              ? "Showing demo data — CSV not loaded"
              : "Retirement / overhaul items within 200 flight hours"}
          </p>
        </div>
        <div className="w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search aircraft, components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Aircraft Component Cards - 3 per row */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((ac) => {
            const aircraftInfo = aircraft.find((a) => a.id === ac.aircraftId);

            // Sort components by hours remaining (past-due / lowest first)
            const sortedComponents = [...ac.components].sort(
              (a, b) => a.hoursRemaining - b.hoursRemaining
            );

            const pastDueCount = sortedComponents.filter(
              (c) => c.hoursRemaining <= 0
            ).length;
            const criticalCount = sortedComponents.filter(
              (c) => c.hoursRemaining > 0 && c.hoursRemaining <= 25
            ).length;
            const warningCount = sortedComponents.filter(
              (c) => c.hoursRemaining > 25 && c.hoursRemaining <= 75
            ).length;

            return (
              <Card
                key={ac.aircraftId}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {ac.registration}
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        {ac.components.length} component
                        {ac.components.length !== 1 ? "s" : ""} due
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {pastDueCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {pastDueCount} Past Due
                        </Badge>
                      )}
                      {criticalCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {criticalCount} Critical
                        </Badge>
                      )}
                      {warningCount > 0 && (
                        <Badge className="bg-amber-500 text-xs">
                          {warningCount} Warning
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sortedComponents.map((component) => {
                      const estimatedDays =
                        aircraftInfo && aircraftInfo.averageUtilization > 0
                          ? Math.ceil(
                              component.hoursRemaining /
                                aircraftInfo.averageUtilization
                            )
                          : null;

                      return (
                        <Tooltip key={component.id} delayDuration={200}>
                          <TooltipTrigger asChild>
                            <div
                              className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${getStatusColor(
                                component.hoursRemaining
                              )}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-slate-900 truncate text-sm">
                                    {component.name}
                                  </div>
                                  <div className="text-xs text-slate-600 mt-0.5">
                                    {component.hoursRemaining <= 0
                                      ? `${Math.abs(component.hoursRemaining).toFixed(1)} hrs past due`
                                      : `${component.hoursRemaining.toFixed(1)} hrs remaining`}
                                  </div>
                                </div>
                                {getStatusBadge(component.hoursRemaining)}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-sm p-4"
                            align="start"
                          >
                            <div className="space-y-2">
                              <div>
                                <div className="font-semibold text-sm">
                                  {component.name}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  Serial: {component.serialNumber}
                                </div>
                              </div>
                              <div className="border-t border-slate-200 pt-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Aircraft:</span>
                                  <span className="font-medium">{ac.registration}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Hours Remaining:</span>
                                  <span className="font-medium">
                                    {component.hoursRemaining.toFixed(1)} hrs
                                  </span>
                                </div>
                                {component.dueDate && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Next Due Date:</span>
                                    <span className="font-medium">{component.dueDate}</span>
                                  </div>
                                )}
                                {estimatedDays !== null && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Est. Days:</span>
                                    <span className="font-medium">~{estimatedDays} days</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-600">Total Time:</span>
                                  <span className="font-medium">
                                    {aircraftInfo?.totalTime.toLocaleString()} hrs
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>

                  {/* Aircraft Stats */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-slate-500">Total Time</div>
                        <div className="font-medium text-slate-900">
                          {aircraftInfo?.totalTime.toLocaleString()} hrs
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Avg. Usage</div>
                        <div className="font-medium text-slate-900">
                          {aircraftInfo?.averageUtilization.toFixed(1)} hrs/day
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm
                ? "No components found"
                : "No components due within 200 hours"}
            </h3>
            <p className="text-sm text-slate-500">
              {searchTerm
                ? "Try adjusting your search terms"
                : "All retirement and overhaul items are beyond the 200-hour window"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
