import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Toaster } from "@/components/ui/toaster";
import CourtSelection from "@/components/CourtSelection";
import CourtFixtures from "@/components/CourtFixtures";
import Scoreboard from "@/components/Scoreboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CourtSelection />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/court/:courtId/:date" element={<CourtFixtures />} />
          <Route path="/scoreboard/:courtId" element={<Scoreboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;