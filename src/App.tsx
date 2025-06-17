
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";
import IncidentReport from "./pages/IncidentReport";
import AssignmentInstructions from "./pages/AssignmentInstructions";
import InstructionGenerator from "./pages/InstructionGenerator";
import EDOB from "./pages/EDOB";
import UniformCheck from "./pages/UniformCheck";
import UniformCheckLog from "./pages/UniformCheckLog"; // Import the new page
import BreakChecker from "./pages/BreakChecker";
import RadioHandover from "./pages/RadioHandover";
import RadioHandoverLog from "./pages/RadioHandoverLog";
import RotaBuilder from "./pages/RotaBuilder";
import ShiftConfirm from "./pages/ShiftConfirm";
import RotaDashboard from "./pages/RotaDashboard";
import VisitorForm from "./pages/VisitorForm";
import VisitorLogToday from "./pages/VisitorLogToday";
import TrainingDashboard from "./pages/TrainingDashboard";
import NoShowDashboard from "./pages/NoShowDashboard";
import DailySummary from "./pages/DailySummary";
import EmailFormatter from "./pages/EmailFormatter";
import ReportsList from "./pages/ReportsList";
import LicenceDashboard from "./pages/LicenceDashboard";
import PayrollVariance from "./pages/PayrollVariance";
import TenderWriter from "./pages/TenderWriter";
import AdminTools from "./pages/AdminTools";
import GuardWelfare from "./pages/GuardWelfare";
import FinancialTools from "./pages/FinancialTools";
import ComplianceAudit from "./pages/ComplianceAudit";
import EquipmentCheck from "./pages/EquipmentCheck";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <SidebarInset className="flex-1">
                <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1" />
                </header>
                <main className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/incident-reporting" element={<IncidentReport />} />
                    <Route path="/assignment-instructions" element={<AssignmentInstructions />} />
                    <Route path="/instruction-generator" element={<InstructionGenerator />} />
                    <Route path="/edob" element={<EDOB />} />
                    <Route path="/uniform-check" element={<UniformCheck />} />
                    <Route path="/uniform-check-log" element={<UniformCheckLog />} /> {/* Add new route */}
                    <Route path="/break-checker" element={<BreakChecker />} />
                    <Route path="/equipment-check" element={<EquipmentCheck />} />
                    <Route path="/radio-handover" element={<RadioHandover />} />
                    <Route path="/radio-handover-log" element={<RadioHandoverLog />} />
                    <Route path="/rota-builder" element={<RotaBuilder />} />
                    <Route path="/shift-confirm" element={<ShiftConfirm />} />
                    <Route path="/rota-dashboard" element={<RotaDashboard />} />
                    <Route path="/visitor-form" element={<VisitorForm />} />
                    <Route path="/visitor-log-today" element={<VisitorLogToday />} />
                    <Route path="/training-dashboard" element={<TrainingDashboard />} />
                    <Route path="/no-show-dashboard" element={<NoShowDashboard />} />
                    <Route path="/daily-summary" element={<DailySummary />} />
                    <Route path="/email-formatter" element={<EmailFormatter />} />
                    <Route path="/reports-list" element={<ReportsList />} />
                    <Route path="/licence-dashboard" element={<LicenceDashboard />} />
                    <Route path="/payroll-variance" element={<PayrollVariance />} />
                    <Route path="/tender-writer" element={<TenderWriter />} />
                    <Route path="/admin-tools" element={<AdminTools />} />
                    <Route path="/guard-welfare" element={<GuardWelfare />} />
                    <Route path="/financial-tools" element={<FinancialTools />} />
                    <Route path="/compliance-audit" element={<ComplianceAudit />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
