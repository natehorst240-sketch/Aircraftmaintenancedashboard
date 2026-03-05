import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { aircraftData, inspectionHoursData } from "../data/mockData";
import { AlertTriangle, TrendingUp, Clock, Plane } from "lucide-react";

export default function OverviewTab() {
  // Sort aircraft by hours until 200hr (least to most)
  const sortedAircraft = [...aircraftData].sort(
    (a, b) => a.hoursUntil200Hr - b.hoursUntil200Hr
  );

  // Get bar color based on hours remaining
  const getBarColor = (hours: number) => {
    if (hours <= 50) return "#ef4444"; // red
    if (hours <= 100) return "#f59e0b"; // amber
    return "#10b981"; // green
  };

  // Get inspection status badge
  const getInspectionBadge = (hours: number) => {
    if (hours <= 50) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </Badge>
      );
    }
    if (hours <= 100) {
      return (
        <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 gap-1">
          <Clock className="w-3 h-3" />
          Warning
        </Badge>
      );
    }
    return <Badge variant="outline" className="text-green-600 border-green-600">Good</Badge>;
  };

  // All inspection types
  const inspectionTypes = [
    "Annual Inspection",
    "100 Hour",
    "Transponder Check",
    "ELT Inspection",
    "Pitot-Static",
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Aircraft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{aircraftData.length}</div>
            <p className="text-sm text-slate-500 mt-1">Active in fleet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Critical Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-red-600">
              {sortedAircraft.filter((a) => a.hoursUntil200Hr <= 50).length}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Aircraft need attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg. Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-baseline gap-2">
              {(
                aircraftData.reduce((sum, a) => sum + a.averageUtilization, 0) /
                aircraftData.length
              ).toFixed(1)}
              <span className="text-sm text-slate-500 font-normal">hrs/day</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              Fleet average
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Aircraft Utilization Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Aircraft Utilization</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Average hours flown per day by aircraft
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {aircraftData.map((aircraft) => (
              <div
                key={aircraft.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-900">
                    {aircraft.registration}
                  </span>
                </div>
                <div className="text-2xl font-semibold text-blue-600">
                  {aircraft.averageUtilization.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">hrs/day</div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">Total Time</div>
                  <div className="text-sm font-medium">
                    {aircraft.totalTime.toLocaleString()} hrs
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 200 Hour Inspection Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Hours Remaining Until Next 200-Hour Inspection</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Sorted by urgency (least to most hours remaining)
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={sortedAircraft}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="registration"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{
                  value: "Hours Remaining",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value} hours`, "Hours Remaining"]}
              />
              <Bar 
                dataKey="hoursUntil200Hr" 
                radius={[8, 8, 0, 0]}
              >
                {sortedAircraft.map((entry, idx) => (
                  <Cell 
                    key={`bar-cell-${idx}`} 
                    fill={getBarColor(entry.hoursUntil200Hr)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Inspection Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Hours Remaining</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            All scheduled inspections across the fleet
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Aircraft</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  {inspectionTypes.map((type) => (
                    <TableHead key={type} className="text-right min-w-32">
                      {type}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspectionHoursData.map((aircraft) => {
                  const aircraftInfo = aircraftData.find(
                    (a) => a.id === aircraft.aircraftId
                  );
                  const minHours = Math.min(
                    ...Object.values(aircraft.inspections)
                  );

                  return (
                    <TableRow key={aircraft.aircraftId}>
                      <TableCell className="font-medium">
                        {aircraft.registration}
                      </TableCell>
                      <TableCell>{getInspectionBadge(minHours)}</TableCell>
                      {inspectionTypes.map((type) => {
                        const hours = aircraft.inspections[type] || 0;
                        return (
                          <TableCell
                            key={type}
                            className="text-right"
                          >
                            <span
                              className={`font-medium ${
                                hours <= 50
                                  ? "text-red-600"
                                  : hours <= 100
                                  ? "text-amber-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {hours}
                            </span>
                            <span className="text-xs text-slate-500 ml-1">hrs</span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}