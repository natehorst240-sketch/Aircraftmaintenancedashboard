import { createBrowserRouter } from "react-router";
import DashboardLayout from "./components/DashboardLayout";
import OverviewTab from "./components/OverviewTab";
import CalendarTab from "./components/CalendarTab";
import ComponentsTab from "./components/ComponentsTab";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: OverviewTab },
      { path: "calendar", Component: CalendarTab },
      { path: "components", Component: ComponentsTab },
    ],
  },
]);
