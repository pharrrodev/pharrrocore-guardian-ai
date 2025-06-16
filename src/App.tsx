
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
import AdminTools from "./pages/AdminTools";
import Auth from "./pages/Auth";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/incident-reporting" element={<ProtectedRoute><IncidentReport /></ProtectedRoute>} />
              <Route path="/assignment-instructions" element={<ProtectedRoute><AssignmentInstructions /></ProtectedRoute>} />
              <Route path="/instruction-generator" element={<ProtectedRoute><InstructionGenerator /></ProtectedRoute>} />
              <Route path="/edob" element={<ProtectedRoute><EDOB /></ProtectedRoute>} />
              <Route path="/uniform-check" element={<ProtectedRoute><UniformCheck /></ProtectedRoute>} />
              <Route path="/break-checker" element={<ProtectedRoute><BreakChecker /></ProtectedRoute>} />
              <Route path="/radio-handover" element={<ProtectedRoute><RadioHandover /></ProtectedRoute>} />
              <Route path="/radio-handover-log" element={<ProtectedRoute><RadioHandoverLog /></ProtectedRoute>} />
              <Route path="/rota-builder" element={<ProtectedRoute><RotaBuilder /></ProtectedRoute>} />
              <Route path="/shift-confirm" element={<ProtectedRoute><ShiftConfirm /></ProtectedRoute>} />
              <Route path="/rota-dashboard" element={<ProtectedRoute><RotaDashboard /></ProtectedRoute>} />
              <Route path="/visitor-form" element={<ProtectedRoute><VisitorForm /></ProtectedRoute>} />
              <Route path="/visitor-log-today" element={<ProtectedRoute><VisitorLogToday /></ProtectedRoute>} />
              <Route path="/training-dashboard" element={<ProtectedRoute><TrainingDashboard /></ProtectedRoute>} />
              <Route path="/no-show-dashboard" element={<ProtectedRoute><NoShowDashboard /></ProtectedRoute>} />
              <Route path="/daily-summary" element={<ProtectedRoute><DailySummary /></ProtectedRoute>} />
              <Route path="/email-formatter" element={<ProtectedRoute><EmailFormatter /></ProtectedRoute>} />
              <Route path="/reports-list" element={<ProtectedRoute><ReportsList /></ProtectedRoute>} />
              <Route path="/licence-dashboard" element={<ProtectedRoute><LicenceDashboard /></ProtectedRoute>} />
              <Route path="/payroll-variance" element={<ProtectedRoute><PayrollVariance /></ProtectedRoute>} />
              <Route path="/tender-writer" element={<ProtectedRoute><TenderWriter /></ProtectedRoute>} />
              <Route path="/admin-tools" element={<ProtectedRoute><AdminTools /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
