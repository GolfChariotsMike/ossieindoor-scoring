import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import CourtSelection from "@/components/CourtSelection";
import Scoreboard from "@/components/Scoreboard";
import CourtFixtures from "@/components/CourtFixtures";
import MirroredScoreboard from "@/components/scoreboard/MirroredScoreboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<CourtSelection />} />
          <Route path="/court/:courtId/:date" element={<CourtFixtures />} />
          <Route path="/scoreboard/:courtId" element={<Scoreboard />} />
          <Route path="/display/:courtId" element={<MirroredScoreboard />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;