
import { 
  FileText, 
  AlertTriangle, 
  Users, 
  Calendar,
  Shield,
  Book,
  Settings,
  BarChart3,
  Radio,
  UserCheck,
  Coffee,
  ClipboardCheck,
  Building,
  Clock,
  Mail,
  TrendingUp,
  Briefcase,
  DollarSign,
  Heart,
  CheckSquare
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  // Core Operations
  {
    title: "EDOB",
    url: "/edob",
    icon: FileText,
    color: "bg-blue-500",
    group: "Core Operations"
  },
  {
    title: "Incident Reporting",
    url: "/incident-reporting",
    icon: AlertTriangle,
    color: "bg-red-500",
    group: "Core Operations"
  },
  {
    title: "Visitor Management",
    url: "/visitor-form",
    icon: Users,
    color: "bg-green-500",
    group: "Core Operations"
  },
  {
    title: "Daily Summary",
    url: "/daily-summary",
    icon: BarChart3,
    color: "bg-purple-500",
    group: "Core Operations"
  },
  
  // Daily Operations
  {
    title: "Assignment Instructions",
    url: "/assignment-instructions",
    icon: Book,
    color: "bg-orange-500",
    group: "Daily Operations"
  },
  {
    title: "Uniform Check",
    url: "/uniform-check",
    icon: UserCheck,
    color: "bg-indigo-500",
    group: "Daily Operations"
  },
  {
    title: "Break Checker",
    url: "/break-checker",
    icon: Coffee,
    color: "bg-amber-500",
    group: "Daily Operations"
  },
  {
    title: "Equipment Check",
    url: "/equipment-check",
    icon: ClipboardCheck,
    color: "bg-cyan-500",
    group: "Daily Operations"
  },
  
  // Communication
  {
    title: "Radio Handover",
    url: "/radio-handover",
    icon: Radio,
    color: "bg-pink-500",
    group: "Communication"
  },
  {
    title: "Radio Handover Log",
    url: "/radio-handover-log",
    icon: Radio,
    color: "bg-rose-500",
    group: "Communication"
  },
  {
    title: "Email Formatter",
    url: "/email-formatter",
    icon: Mail,
    color: "bg-teal-500",
    group: "Communication"
  },
  
  // Scheduling & Staff
  {
    title: "Rota Builder",
    url: "/rota-builder",
    icon: Calendar,
    color: "bg-violet-500",
    group: "Scheduling & Staff"
  },
  {
    title: "Shift Confirm",
    url: "/shift-confirm",
    icon: Clock,
    color: "bg-emerald-500",
    group: "Scheduling & Staff"
  },
  {
    title: "Rota Dashboard",
    url: "/rota-dashboard",
    icon: Building,
    color: "bg-lime-500",
    group: "Scheduling & Staff"
  },
  {
    title: "Training Dashboard",
    url: "/training-dashboard",
    icon: Calendar,
    color: "bg-sky-500",
    group: "Scheduling & Staff"
  },
  
  // Business Sustainability
  {
    title: "Guard Welfare",
    url: "/guard-welfare",
    icon: Heart,
    color: "bg-red-600",
    group: "Business Sustainability"
  },
  {
    title: "Financial Tools",
    url: "/financial-tools",
    icon: DollarSign,
    color: "bg-green-600",
    group: "Business Sustainability"
  },
  {
    title: "Compliance Audit",
    url: "/compliance-audit",
    icon: CheckSquare,
    color: "bg-blue-600",
    group: "Business Sustainability"
  },
  
  // Management & Analytics
  {
    title: "No Show Dashboard",
    url: "/no-show-dashboard",
    icon: Users,
    color: "bg-gray-500",
    group: "Management & Analytics"
  },
  {
    title: "Payroll Variance",
    url: "/payroll-variance",
    icon: TrendingUp,
    color: "bg-yellow-500",
    group: "Management & Analytics"
  },
  {
    title: "Licence Dashboard",
    url: "/licence-dashboard",
    icon: Shield,
    color: "bg-red-600",
    group: "Management & Analytics"
  },
  {
    title: "Tender Writer",
    url: "/tender-writer",
    icon: Briefcase,
    color: "bg-slate-500",
    group: "Management & Analytics"
  },
  
  // Administrative
  {
    title: "Admin Tools",
    url: "/admin-tools",
    icon: Settings,
    color: "bg-gray-600",
    group: "Administrative"
  },
  {
    title: "Reports List",
    url: "/reports-list",
    icon: FileText,
    color: "bg-indigo-600",
    group: "Administrative"
  },
  {
    title: "Today's Visitors",
    url: "/visitor-log-today",
    icon: Users,
    color: "bg-purple-600",
    group: "Administrative"
  },
  {
    title: "Instruction Generator",
    url: "/instruction-generator",
    icon: Book,
    color: "bg-orange-600",
    group: "Administrative"
  }
];

const groupedItems = menuItems.reduce((acc, item) => {
  if (!acc[item.group]) {
    acc[item.group] = [];
  }
  acc[item.group].push(item);
  return acc;
}, {} as Record<string, typeof menuItems>);

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          {state === "expanded" && (
            <div>
              <h1 className="font-bold text-lg">PharroCore</h1>
              <p className="text-xs text-muted-foreground">Security Management</p>
            </div>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup key={groupName}>
            <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
              {groupName}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link to={item.url} className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md ${item.color} text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {state === "expanded" && (
                            <span className="text-sm">{item.title}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
