import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/pages/Index";
import CourtFixtures from "@/components/CourtFixtures";
import Scoreboard from "@/components/Scoreboard";
import StandaloneScoreboard from "@/components/StandaloneScoreboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/court/:courtId/:date" element={<CourtFixtures />} />
          <Route path="/scoreboard/:courtId" element={<Scoreboard />} />
          <Route path="/standalone-scoreboard" element={<StandaloneScoreboard />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;