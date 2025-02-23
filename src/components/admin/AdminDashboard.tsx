
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchProgressSection } from "./MatchProgressSection";
import { MatchResultsTable } from "./MatchResultsTable";
import { CourtStatusSection } from "./CourtStatusSection";

export const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Match Progress</TabsTrigger>
          <TabsTrigger value="results">Match Results</TabsTrigger>
          <TabsTrigger value="status">Court Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress">
          <MatchProgressSection />
        </TabsContent>
        
        <TabsContent value="results">
          <MatchResultsTable />
        </TabsContent>

        <TabsContent value="status">
          <CourtStatusSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};
