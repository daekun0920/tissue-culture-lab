import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LocationTab } from '@/components/library/location-tab';
import { MediumTab } from '@/components/library/medium-tab';
import { CultureTab } from '@/components/library/culture-tab';
import { EmployeeTab } from '@/components/library/employee-tab';
import { ContainerTypeTab } from '@/components/library/container-type-tab';

export default function LibraryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Library</h1>

      <Tabs defaultValue="locations" className="w-full">
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="culture">Culture</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="containerTypes">Container Types</TabsTrigger>
        </TabsList>

        <TabsContent value="locations">
          <LocationTab />
        </TabsContent>
        <TabsContent value="medium">
          <MediumTab />
        </TabsContent>
        <TabsContent value="culture">
          <CultureTab />
        </TabsContent>
        <TabsContent value="employees">
          <EmployeeTab />
        </TabsContent>
        <TabsContent value="containerTypes">
          <ContainerTypeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
