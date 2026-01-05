import { useState, useEffect, useMemo } from 'react'
import { Database, Package, Loader2, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type Component, type Solution } from '@/data/mockData'
import { getIconComponent, getStatusVariant, isFlow } from '@/utils/componentHelpers'
import { formatInstalledOn } from '@/utils/formatters'
import { fetchComponentSolutions } from '@/services/dataServices/solutionService'
import { fetchFlowDetails } from '@/services/dataServices/flowService'
import { getEnvironmentId } from '@/services/dataServices/environmentService'
import { getFlowType } from '@/services/transformers/componentTransformer'
import type { Workflow } from '@/services/api/d365ApiTypes'
import { toast } from 'sonner'
import { PropertiesTabContent } from './PropertiesTabContent'
import { OverviewTabContent } from './OverviewTabContent'

interface ComponentDetailDialogProps {
  component: Component | null
  categories: any[]
  onClose: () => void
}

/**
 * 组件详情对话框
 */
export const ComponentDetailDialog = ({
  component,
  categories,
  onClose
}: ComponentDetailDialogProps) => {
  const [currentTab, setCurrentTab] = useState('overview')
  const [componentSolutions, setComponentSolutions] = useState<Solution[]>([])
  const [loadingSolutions, setLoadingSolutions] = useState(false)
  const [flowDetails, setFlowDetails] = useState<Workflow | null>(null)
  const [loadingFlowDetails, setLoadingFlowDetails] = useState(false)

  const sortedComponentSolutions = useMemo(() => {
    const getInstalledTime = (installedOn?: string) => {
      if (!installedOn) return null
      const time = new Date(installedOn).getTime()
      return Number.isFinite(time) ? time : null
    }

    return [...componentSolutions].sort((a, b) => {
      const aTime = getInstalledTime(a.installedOn)
      const bTime = getInstalledTime(b.installedOn)

      if (aTime != null && bTime != null) return bTime - aTime
      if (aTime != null) return -1
      if (bTime != null) return 1

      return a.displayName.localeCompare(b.displayName)
    })
  }, [componentSolutions])

  const openSolutionInPowerPlatform = async (solution: Solution) => {
    if (!solution?.id || solution.id === 'default') {
      toast.error('Unable to open solution: solution ID not found')
      return
    }

    let environmentId: string
    try {
      toast.loading('Retrieving environment ID...')
      environmentId = await getEnvironmentId()
      toast.dismiss()
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to retrieve environment ID', {
        description: error instanceof Error ? error.message : 'Unable to get environment ID from Dynamics 365 API'
      })
      return
    }

    const solutionUrl = `https://make.powerapps.com/environments/${environmentId}/solutions/${solution.id}`
    window.open(solutionUrl, '_blank')
  }

  useEffect(() => {
    if (currentTab === 'solutions' && component) {
      setLoadingSolutions(true)
      fetchComponentSolutions(component.id, component.category)
        .then(solutions => {
          setComponentSolutions(solutions)
        })
        .catch(error => {
          console.error('Failed to fetch solutions:', error)
          toast.error('Failed to load solutions')
          setComponentSolutions(component.solutions || [])
        })
        .finally(() => {
          setLoadingSolutions(false)
        })
    }
  }, [currentTab, component])

  // Fetch flow details when component is a flow
  useEffect(() => {
    if (!component || !isFlow(component)) {
      setFlowDetails(null)
      return
    }

    const workflowidunique = component.metadata?.workflowidunique
    if (!workflowidunique) {
      console.warn('Flow component missing workflowidunique in metadata')
      return
    }

    setLoadingFlowDetails(true)
    fetchFlowDetails(workflowidunique)
      .then(workflow => {
        setFlowDetails(workflow)
      })
      .catch(error => {
        console.error('Failed to fetch flow details:', error)
        toast.error('Failed to load flow details', {
          description: error instanceof Error ? error.message : 'Could not retrieve flow type information'
        })
      })
      .finally(() => {
        setLoadingFlowDetails(false)
      })
  }, [component])

  useEffect(() => {
    if (component) {
      setComponentSolutions(component.solutions || [])
      setCurrentTab('overview')
    }
  }, [component])

  if (!component) return null

  return (
    <Dialog open={!!component} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border border-border bg-muted flex items-center justify-center">
                  {(() => {
                    const Icon = getIconComponent(
                      categories.find(c => c.id === component.category)?.icon || 'LayoutGrid'
                    )
                    return <Icon className="h-5 w-5 text-muted-foreground" />
                  })()}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-lg tracking-tight">{component.name}</DialogTitle>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">{component.type}</Badge>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">{component.category}</Badge>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {component.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="solutions">Solutions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 min-h-[500px]">
                <OverviewTabContent
                  component={component}
                  flowDetails={flowDetails}
                  loadingFlowDetails={loadingFlowDetails}
                  getStatusVariant={getStatusVariant}
                  getFlowType={getFlowType}
                  isFlow={isFlow}
                />
              </TabsContent>

              <TabsContent value="properties" className="mt-4 min-h-[500px]">
                <PropertiesTabContent metadata={component.metadata} />
              </TabsContent>

              <TabsContent value="dependencies" className="space-y-4 mt-4 min-h-[500px]">
                <p className="text-sm text-muted-foreground">
                  This component has dependencies on the following items:
                </p>
                <div className="space-y-0">
                  {['System User Entity', 'Security Role', 'Business Unit'].map((dep) => (
                    <div
                      key={dep}
                      className="flex items-center gap-3 py-2 border-b border-border/40"
                    >
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{dep}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="solutions" className="space-y-4 mt-4 min-h-[500px]">
                {loadingSolutions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-sm text-muted-foreground">Loading solutions...</span>
                  </div>
                ) : componentSolutions && componentSolutions.length > 0 ? (
                  <div className="space-y-3">
                    <p className="mb-3 text-sm text-muted-foreground">
                      This component is included in {componentSolutions.length} solution{componentSolutions.length > 1 ? 's' : ''}:
                    </p>
                    {sortedComponentSolutions.map((solution) => (
                      <div
                        key={solution.id}
                        className="group cursor-pointer rounded-lg border border-border/50 bg-card/50 p-5 transition-all duration-200 hover:border-primary/40 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/5"
                        role="button"
                        tabIndex={0}
                        title="Open solution in Power Platform"
                        onClick={() => openSolutionInPowerPlatform(solution)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openSolutionInPowerPlatform(solution)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex items-center gap-2.5">
                              <Package className="h-4 w-4 shrink-0 text-primary" />
                              <h4 className="min-w-0 truncate text-sm font-semibold text-foreground">
                                {solution.displayName}
                              </h4>
                              {solution.isManaged && (
                                <Badge variant="default" className="text-xs px-2.5 py-1">
                                  Managed
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                              <div className="flex items-baseline gap-2 min-w-0">
                                <span className="text-xs font-medium text-muted-foreground shrink-0">Name</span>
                                <span className="text-xs font-mono text-foreground truncate">{solution.name}</span>
                              </div>
                              <div className="flex items-baseline gap-2 min-w-0">
                                <span className="text-xs font-medium text-muted-foreground shrink-0">Version</span>
                                <span className="text-xs font-mono text-foreground">{solution.version}</span>
                              </div>
                              <div className="flex items-baseline gap-2 min-w-0">
                                <span className="text-xs font-medium text-muted-foreground shrink-0">Publisher</span>
                                <span className="text-xs text-foreground truncate" title={solution.publisher}>
                                  {solution.publisher}
                                </span>
                              </div>
                              {solution.installedOn && (
                                <div className="flex items-baseline gap-2 min-w-0">
                                  <span className="text-xs font-medium text-muted-foreground shrink-0">Installed</span>
                                  <span className="text-xs font-mono text-foreground">
                                    {formatInstalledOn(solution.installedOn)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">
                      This component is not included in any solutions
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
