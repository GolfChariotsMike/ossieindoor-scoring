import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Toaster } from "@/components/ui/toaster";
import CourtSelection from "@/components/CourtSelection";
import { ScoreboardContainer } from "@/components/scoreboard/ScoreboardContainer";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CourtSelection />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/court/:courtId/:date" element={<ScoreboardContainer />} />
          <Route path="/scoreboard/:courtId" element={<ScoreboardContainer />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;