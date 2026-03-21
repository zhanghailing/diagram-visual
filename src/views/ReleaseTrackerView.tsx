import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ReleaseStatusPanel } from '@/components/ReleaseStatusPanel'
import { LiveStateView } from '@/components/LiveStateView'

export function ReleaseTrackerView() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">Release Tracker</h2>
      </div>

      <Tabs defaultValue="tracker" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-2 border-b">
          <TabsList className="h-8">
            <TabsTrigger value="tracker" className="text-xs">Track Releases</TabsTrigger>
            <TabsTrigger value="live" className="text-xs">Live State</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="tracker" className="flex-1 overflow-hidden mt-0">
          <ReleaseStatusPanel />
        </TabsContent>
        <TabsContent value="live" className="flex-1 overflow-auto mt-0">
          <LiveStateView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
