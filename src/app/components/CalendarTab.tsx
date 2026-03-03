import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Plus,
  Grid3x3,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  generateCalendarEvents,
  CalendarEvent,
  aircraftData,
} from "../data/mockData";

type ViewMode = "month" | "week" | "day";

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(
    generateCalendarEvents()
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string>("all");
  const [selectedInspection, setSelectedInspection] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [newEventDate, setNewEventDate] = useState<string>("");

  const [editForm, setEditForm] = useState({
    dueDate: "",
    notes: "",
  });

  const [createForm, setCreateForm] = useState({
    aircraftId: "",
    registration: "",
    inspectionType: "",
    dueDate: "",
    hoursRemaining: "",
    notes: "",
  });

  // Get unique inspection types
  const inspectionTypes = [
    "Annual Inspection",
    "100 Hour",
    "200 Hour",
    "Transponder Check",
    "ELT Inspection",
    "Pitot-Static",
  ];

  // Filter events based on selected filters
  const filteredEvents = events.filter((event) => {
    const matchesAircraft =
      selectedAircraft === "all" || event.aircraftId === selectedAircraft;
    const matchesInspection =
      selectedInspection === "all" ||
      event.inspectionType === selectedInspection;
    return matchesAircraft && matchesInspection;
  });

  // Get first and last day of current period
  const getDateRange = () => {
    if (viewMode === "month") {
      return {
        start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        end: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        ),
      };
    } else if (viewMode === "week") {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day;
      const start = new Date(currentDate);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else {
      // day view
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditForm({
      dueDate: event.dueDate,
      notes: event.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateEvent = (date: string) => {
    setNewEventDate(date);
    setCreateForm({
      aircraftId: "",
      registration: "",
      inspectionType: "",
      dueDate: date,
      hoursRemaining: "",
      notes: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleSaveCreate = () => {
    const aircraft = aircraftData.find((a) => a.id === createForm.aircraftId);
    if (!aircraft || !createForm.inspectionType || !createForm.dueDate)
      return;

    const newEvent: CalendarEvent = {
      id: `E${Date.now()}`,
      aircraftId: createForm.aircraftId,
      registration: aircraft.registration,
      inspectionType: createForm.inspectionType,
      dueDate: createForm.dueDate,
      hoursRemaining: parseInt(createForm.hoursRemaining) || 0,
      notes: createForm.notes,
    };

    setEvents((prev) => [...prev, newEvent]);
    setIsCreateDialogOpen(false);
  };

  const handleSaveEdit = () => {
    if (!selectedEvent) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id
          ? {
              ...e,
              dueDate: editForm.dueDate,
              notes: editForm.notes,
            }
          : e
      )
    );
    setIsEditDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;

    setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
    setIsEditDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (date: string) => {
    if (!draggedEvent) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === draggedEvent.id ? { ...e, dueDate: date } : e
      )
    );
    setDraggedEvent(null);
  };

  const clearFilters = () => {
    setSelectedAircraft("all");
    setSelectedInspection("all");
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDateLabel = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (viewMode === "week") {
      const range = getDateRange();
      return `${range.start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${range.end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const hasActiveFilters =
    selectedAircraft !== "all" || selectedInspection !== "all";

  const getEventColor = (event: CalendarEvent) => {
    if (event.hoursRemaining <= 50) {
      return "bg-red-500 hover:bg-red-600 border-red-600";
    } else if (event.hoursRemaining <= 100) {
      return "bg-amber-500 hover:bg-amber-600 border-amber-600";
    }
    return "bg-blue-500 hover:bg-blue-600 border-blue-600";
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left side - Navigation */}
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={goToToday} size="sm">
                Today
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  className="px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  className="px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="text-xl font-semibold min-w-[280px]">
                {getDateLabel()}
              </h2>
            </div>

            {/* Right side - View modes */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="month" className="gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Month
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-2">
                  <CalendarRange className="w-4 h-4" />
                  Week
                </TabsTrigger>
                <TabsTrigger value="day" className="gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Day
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Filter by:</span>
            </div>

            <Select
              value={selectedAircraft}
              onValueChange={setSelectedAircraft}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Aircraft" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Aircraft</SelectItem>
                {aircraftData.map((aircraft) => (
                  <SelectItem key={aircraft.id} value={aircraft.id}>
                    {aircraft.registration}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedInspection}
              onValueChange={setSelectedInspection}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Inspections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inspections</SelectItem>
                {inspectionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
                <Badge variant="secondary">
                  {filteredEvents.length} event
                  {filteredEvents.length !== 1 ? "s" : ""}
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === "month" && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={handleEventClick}
          onCreateEvent={handleCreateEvent}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          getEventColor={getEventColor}
          isToday={isToday}
        />
      )}

      {viewMode === "week" && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={handleEventClick}
          onCreateEvent={handleCreateEvent}
          getEventColor={getEventColor}
          isToday={isToday}
        />
      )}

      {viewMode === "day" && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={handleEventClick}
          onCreateEvent={handleCreateEvent}
          getEventColor={getEventColor}
        />
      )}

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Maintenance Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="createAircraft">Aircraft *</Label>
              <Select
                value={createForm.aircraftId}
                onValueChange={(value) => {
                  const aircraft = aircraftData.find((a) => a.id === value);
                  setCreateForm({
                    ...createForm,
                    aircraftId: value,
                    registration: aircraft?.registration || "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraftData.map((aircraft) => (
                    <SelectItem key={aircraft.id} value={aircraft.id}>
                      {aircraft.registration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createInspection">Inspection Type *</Label>
              <Select
                value={createForm.inspectionType}
                onValueChange={(value) =>
                  setCreateForm({ ...createForm, inspectionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inspection type" />
                </SelectTrigger>
                <SelectContent>
                  {inspectionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="createDate">Due Date *</Label>
                <Input
                  id="createDate"
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createHours">Hours Remaining</Label>
                <Input
                  id="createHours"
                  type="number"
                  placeholder="0"
                  value={createForm.hoursRemaining}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      hoursRemaining: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="createNotes">Notes</Label>
              <Textarea
                id="createNotes"
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm({ ...createForm, notes: e.target.value })
                }
                placeholder="Add notes about this maintenance event..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCreate}>Create Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aircraft</Label>
                  <Input value={selectedEvent.registration} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Hours Remaining</Label>
                  <Input
                    value={`${selectedEvent.hoursRemaining} hrs`}
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Inspection Type</Label>
                <Input value={selectedEvent.inspectionType} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Projected Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  placeholder="Add notes about this maintenance event..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              className="mr-auto"
            >
              Delete Event
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onEventClick,
  onCreateEvent,
  onDragStart,
  onDragOver,
  onDrop,
  getEventColor,
  isToday,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: string) => void;
  onDragStart: (event: CalendarEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (date: string) => void;
  getEventColor: (event: CalendarEvent) => string;
  isToday: (date: Date) => boolean;
}) {
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const days: Array<{
    date: number;
    isCurrentMonth: boolean;
    fullDate: Date;
  }> = [];

  // Previous month days
  for (let i = 0; i < firstDayOfWeek; i++) {
    const prevMonthDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      -firstDayOfWeek + i + 1
    );
    days.push({
      date: prevMonthDate.getDate(),
      isCurrentMonth: false,
      fullDate: prevMonthDate,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: i,
      isCurrentMonth: true,
      fullDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
    });
  }

  // Next month days
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      i
    );
    days.push({
      date: i,
      isCurrentMonth: false,
      fullDate: nextMonthDate,
    });
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => event.dueDate === dateStr);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-sm font-semibold text-slate-700"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day.fullDate);
              const isTodayDate = isToday(day.fullDate);
              const dateStr = day.fullDate.toISOString().split("T")[0];

              return (
                <div
                  key={index}
                  className={`min-h-[130px] border-r border-b border-slate-200 ${
                    !day.isCurrentMonth ? "bg-slate-50/50" : "bg-white"
                  } ${index % 7 === 6 ? "border-r-0" : ""} hover:bg-slate-50 transition-colors`}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(dateStr)}
                >
                  <div className="p-2 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`text-sm font-medium ${
                          !day.isCurrentMonth
                            ? "text-slate-400"
                            : isTodayDate
                            ? "text-white bg-blue-600 w-7 h-7 rounded-full flex items-center justify-center"
                            : "text-slate-900"
                        }`}
                      >
                        {day.date}
                      </div>
                      {day.isCurrentMonth && (
                        <button
                          onClick={() => onCreateEvent(dateStr)}
                          className="opacity-0 hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 overflow-y-auto">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={() => onDragStart(event)}
                          onClick={() => onEventClick(event)}
                          className={`px-2 py-1 rounded text-xs cursor-pointer text-white border ${getEventColor(
                            event
                          )} transition-all`}
                        >
                          <div className="font-semibold truncate">
                            {event.registration}
                          </div>
                          <div className="truncate opacity-90">
                            {event.inspectionType}
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-500 pl-2 font-medium">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Week View Component
function WeekView({
  currentDate,
  events,
  onEventClick,
  onCreateEvent,
  getEventColor,
  isToday,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: string) => void;
  getEventColor: (event: CalendarEvent) => string;
  isToday: (date: Date) => boolean;
}) {
  const day = currentDate.getDay();
  const diff = currentDate.getDate() - day;
  const weekStart = new Date(currentDate);
  weekStart.setDate(diff);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    weekDays.push(date);
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => event.dueDate === dateStr);
  };

  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isTodayDate = isToday(date);
              const dateStr = date.toISOString().split("T")[0];

              return (
                <div
                  key={index}
                  className="border-r border-slate-200 last:border-r-0"
                >
                  <div
                    className={`py-4 text-center border-b border-slate-200 ${
                      isTodayDate ? "bg-blue-50" : "bg-slate-50"
                    }`}
                  >
                    <div className="text-xs text-slate-500 font-medium mb-1">
                      {weekDayNames[date.getDay()]}
                    </div>
                    <div
                      className={`text-2xl font-semibold ${
                        isTodayDate
                          ? "text-white bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto"
                          : "text-slate-900"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="p-3 min-h-[500px] bg-white">
                    <button
                      onClick={() => onCreateEvent(dateStr)}
                      className="w-full py-2 mb-3 border-2 border-dashed border-slate-300 rounded text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <Plus className="w-4 h-4 mx-auto" />
                    </button>
                    <div className="space-y-2">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={`p-3 rounded-lg cursor-pointer text-white shadow-sm ${getEventColor(
                            event
                          )} transition-all`}
                        >
                          <div className="font-semibold text-sm mb-1">
                            {event.registration}
                          </div>
                          <div className="text-xs opacity-90">
                            {event.inspectionType}
                          </div>
                          <div className="text-xs mt-1 opacity-75">
                            {event.hoursRemaining} hrs remaining
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Day View Component
function DayView({
  currentDate,
  events,
  onEventClick,
  onCreateEvent,
  getEventColor,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent: (date: string) => void;
  getEventColor: (event: CalendarEvent) => string;
}) {
  const dateStr = currentDate.toISOString().split("T")[0];
  const dayEvents = events.filter((event) => event.dueDate === dateStr);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 pb-4 border-b border-slate-200">
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">
              {currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <p className="text-sm text-slate-500">
              {dayEvents.length} maintenance event
              {dayEvents.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>

          <button
            onClick={() => onCreateEvent(dateStr)}
            className="w-full py-4 mb-6 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create New Event
          </button>

          <div className="space-y-3">
            {dayEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No events scheduled for this day</p>
              </div>
            ) : (
              dayEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`p-5 rounded-lg cursor-pointer text-white shadow-md hover:shadow-lg ${getEventColor(
                    event
                  )} transition-all`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xl font-semibold mb-1">
                        {event.registration}
                      </div>
                      <div className="text-sm opacity-90">
                        {event.inspectionType}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white hover:bg-white/30"
                    >
                      {event.hoursRemaining} hrs
                    </Badge>
                  </div>
                  {event.notes && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-sm opacity-90">{event.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
