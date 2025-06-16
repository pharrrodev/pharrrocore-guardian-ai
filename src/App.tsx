
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
import EDOB from "./pages/EDOB";
import UniformCheck from "./pages/UniformCheck";
import BreakChecker from "./pages/BreakChecker";
import RadioHandover from "./pages/RadioHandover";
import RadioHandoverLog from "./pages/RadioHandoverLog";

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
            <Route path="/edob" element={<EDOB />} />
            <Route path="/uniform-check" element={<UniformCheck />} />
            <Route path="/break-checker" element={<BreakChecker />} />
            <Route path="/radio-handover" element={<RadioHandover />} />
            <Route path="/radio-handover-log" element={<RadioHandoverLog />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
