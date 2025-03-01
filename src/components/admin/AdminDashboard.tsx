
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchResultsTable } from "./MatchResultsTable";

export const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Match Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results">
          <MatchResultsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};
