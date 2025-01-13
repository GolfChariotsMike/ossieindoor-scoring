import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Scoreboard from "@/components/Scoreboard";
import StandaloneScoreboard from "@/components/StandaloneScoreboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/scoreboard/:courtId" element={<Scoreboard />} />
        <Route path="/standalone-scoreboard" element={<StandaloneScoreboard />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;