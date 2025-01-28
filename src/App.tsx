import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;