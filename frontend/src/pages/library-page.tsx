import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LocationTab } from '@/components/library/location-tab';
import { MediumTab } from '@/components/library/medium-tab';
import { CultureTab } from '@/components/library/culture-tab';

export default function LibraryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Library</h1>

      <Tabs defaultValue="locations" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="culture">Culture</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
