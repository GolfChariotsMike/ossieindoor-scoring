import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CourtSelection from "./components/CourtSelection";
import CourtFixtures from "./components/CourtFixtures";
import Scoreboard from "./components/Scoreboard";
import { AdminRoute } from "./components/admin/AdminRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CourtSelection />} />
        <Route path="/courts/:courtId/:date" element={<CourtFixtures />} />
        <Route path="/scoreboard/:courtId" element={<Scoreboard />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </Router>
  );
}

export default App;