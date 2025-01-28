import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Toaster } from "@/components/ui/toaster";
import { Home } from "@/components/Home";
import { Fixtures } from "@/components/Fixtures";
import { Results } from "@/components/Results";
import { Standings } from "@/components/Standings";
import { Clubs } from "@/components/Clubs";
import { ClubDetails } from "@/components/ClubDetails";
import { TeamDetails } from "@/components/TeamDetails";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/results" element={<Results />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:clubId" element={<ClubDetails />} />
          <Route path="/teams/:teamId" element={<TeamDetails />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;