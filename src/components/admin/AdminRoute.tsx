import { useState } from "react";
import { PinEntry } from "./PinEntry";
import { AdminDashboard } from "./AdminDashboard";

export const AdminRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <PinEntry onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboard />;
};