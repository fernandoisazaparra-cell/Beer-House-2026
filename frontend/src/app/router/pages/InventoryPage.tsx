import React from "react";
import { InventoryDashboard } from "../../../features/inventory/components/InventoryDashboard";

export const InventoryPage: React.FC = () => {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#121212" }}>
      <InventoryDashboard />
    </main>
  );
};

export default InventoryPage;
