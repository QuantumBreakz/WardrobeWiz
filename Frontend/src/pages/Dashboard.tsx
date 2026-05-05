import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { Outlet } from "react-router-dom";
import { BackButton } from "@/components/common/BackButton";

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 p-6 space-y-4">
            <BackButton className="w-fit" fallback="/" />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
