import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Salad,
  ScanLine,
  Stethoscope,
  ChefHat,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Users,
  User as UserIcon,
} from "lucide-react";
import React from "react";
import { useAppState } from "@/context/app-state";
import { ChatWidget } from "@/components/app/ChatWidget";

export const AppLayout: React.FC = () => {
  const { currentUser, setCurrentUser } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  const isDoctor = currentUser?.role === "doctor";
  const { doctors } = useAppState();
  const firstDoctorId = doctors[0]?.id;
  
  const menu = isDoctor
    ? [
        { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
        { to: "/doctor/patients", label: "Patients", icon: Users },
        {
          to: "/doctor/generator/diet",
          label: "Diet Plans",
          icon: Salad,
        },
        {
          to: "/doctor/generator/recipes",
          label: "Recipes",
          icon: ChefHat,
        },
        { to: "/doctor/messages", label: "Messages", icon: MessageCircle },
        { to: "/doctor/profile", label: "Profile", icon: UserIcon },
      ]
    : [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/tracking", label: "Health Tracking", icon: BarChart3 },
        { to: "/recipes", label: "My Recipes", icon: ChefHat },
        { to: "/scan", label: "Food Scan", icon: ScanLine },
        { to: firstDoctorId ? `/messages/${firstDoctorId}` : "/messages", label: "Messages", icon: MessageCircle },
        { to: "/profile", label: "My Profile", icon: UserIcon },
      ];

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <SidebarProvider>
      <Sidebar className="bg-white border-r border-gray-100 shadow-sm">
        <SidebarHeader className="px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
              <Salad className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">SwasthaSetu</h1>
              <p className="text-xs text-gray-500">Holistic Nutrition</p>
            </div>
          </div>
        </SidebarHeader>

        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Avatar className="h-9 w-9 bg-green-100">
              <AvatarFallback className="bg-green-600 text-white text-sm font-medium">
                {currentUser?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{isDoctor ? 'Doctor' : 'Patient'}</p>
            </div>
          </div>
        </div>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarMenu className="space-y-1">
              {menu.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150",
                          isActive
                            ? "bg-green-50 text-green-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )
                      }
                    >
                      <>
                        <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors duration-150"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">SwasthaSetu v1.0.0</p>
          </div>
        </SidebarFooter>

        <SidebarRail className="bg-gray-50" />
      </Sidebar>

      <SidebarInset>
        <Topbar />
        <div className="px-6 py-6 bg-gray-50 min-h-screen">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

const Topbar: React.FC = () => {
  const { currentUser } = useAppState();
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-gray-600 hover:text-gray-900 transition-all" />
        <div className="text-lg font-semibold text-gray-900">
          {currentUser?.role === "doctor" ? "Doctor Pannel" : "Swastha Setu"}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
            >
              <MessageCircle className="h-4 w-4" /> Assistant
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[480px] p-0 bg-white/80 backdrop-blur-sm border border-gray-200"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Assistant</SheetTitle>
            </SheetHeader>
            <ChatWidget mode="panel" />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
