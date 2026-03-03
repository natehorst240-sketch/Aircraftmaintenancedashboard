import { Link, Outlet, useLocation } from "react-router";
import { Plane } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

export default function DashboardLayout() {
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname === "/calendar") return "calendar";
    if (location.pathname === "/components") return "components";
    return "overview";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">
                  Aircraft Maintenance Dashboard
                </h1>
                <p className="text-sm text-slate-500">
                  Real-time tracking and projections
                </p>
              </div>
            </div>
            <div className="text-sm text-slate-600">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6">
          <Tabs value={getActiveTab()} className="w-full">
            <TabsList className="h-12 bg-transparent border-b-0 w-full justify-start gap-1">
              <Link to="/">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6"
                >
                  Overview
                </TabsTrigger>
              </Link>
              <Link to="/calendar">
                <TabsTrigger
                  value="calendar"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6"
                >
                  Calendar
                </TabsTrigger>
              </Link>
              <Link to="/components">
                <TabsTrigger
                  value="components"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6"
                >
                  Components
                </TabsTrigger>
              </Link>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
