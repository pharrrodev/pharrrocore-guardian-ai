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

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/incident-reporting" element={<IncidentReport />} />
            <Route path="/assignment-instructions" element={<AssignmentInstructions />} />
            <Route path="/instruction-generator" element={<InstructionGenerator />} />
            <Route path="/edob" element={<EDOB />} />
            <Route path="/uniform-check" element={<UniformCheck />} />
            <Route path="/break-checker" element={<BreakChecker />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
