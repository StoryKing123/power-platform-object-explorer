import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Edit, Download, Database, Package, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { type Component, type Solution } from '@/data/mockData'
import { getIconComponent, getStatusVariant } from '@/utils/componentHelpers'
import { formatInstalledOn } from '@/utils/formatters'
import { fetchComponentSolutions } from '@/services/dataServices/solutionService'
import { getEnvironmentId } from '@/services/dataServices/environmentService'
import { toast } from 'sonner'

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
              <div className="flex items-center gap-4">
                <motion.div
                  className="rounded-xl bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400 p-4 shadow-xl shadow-primary/15"
                  whileHover={{ rotate: 6, scale: 1.01 }}
                  transition={{ duration: 0.25 }}
                >
                  {(() => {
                    const Icon = getIconComponent(
                      categories.find(c => c.id === component.category)?.icon || 'LayoutGrid'
                    )
                    return <Icon className="h-8 w-8 text-white" />
                  })()}
                </motion.div>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-2xl tracking-tight">{component.name}</DialogTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{component.type}</Badge>
                    <Badge variant="outline">{component.category}</Badge>
                    <Badge variant={getStatusVariant(component.status)}>
                      {component.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="solutions">Solutions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">Description</h3>
                  <p className="text-sm text-muted-foreground">{component.description}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-foreground">Type</h4>
                    <p className="text-sm text-muted-foreground">{component.type}</p>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-foreground">Category</h4>
                    <p className="text-sm text-muted-foreground">{component.category}</p>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-foreground">Status</h4>
                    <Badge variant={getStatusVariant(component.status)}>
                      {component.status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-foreground">Last Modified</h4>
                    <p className="text-sm text-muted-foreground">{component.lastModified}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="properties" className="space-y-4 mt-4">
                <div className="space-y-3">
                  {component.metadata ? (
                    Object.entries(component.metadata).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3"
                      >
                        <span className="font-medium text-foreground">{key}</span>
                        <span className="max-w-[60%] truncate text-right text-sm text-muted-foreground">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || 'N/A')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No metadata available</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="dependencies" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  This component has dependencies on the following items:
                </p>
                <div className="space-y-2">
                  {['System User Entity', 'Security Role', 'Business Unit'].map((dep) => (
                    <div
                      key={dep}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3"
                    >
                      <Database className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">{dep}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="solutions" className="space-y-4 mt-4">
                {loadingSolutions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-sm text-muted-foreground">Loading solutions...</span>
                  </div>
                ) : componentSolutions && componentSolutions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="mb-3 text-sm text-muted-foreground">
                      This component is included in {componentSolutions.length} solution{componentSolutions.length > 1 ? 's' : ''}:
                    </p>
                    {sortedComponentSolutions.map((solution) => (
                      <div
                        key={solution.id}
                        className="cursor-pointer rounded-xl border border-border/50 bg-muted/15 p-3 transition-colors hover:border-primary/40 hover:bg-muted/25"
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 shrink-0 text-primary" />
                              <h4 className="min-w-0 truncate text-sm font-semibold text-foreground">
                                {solution.displayName}
                              </h4>
                              {solution.isManaged && (
                                <Badge variant="secondary" className="text-[10px] leading-4 px-1.5 py-0">
                                  Managed
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium text-muted-foreground">Name</span>
                                <span className="font-mono">{solution.name}</span>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium text-muted-foreground">Version</span>
                                <span className="font-mono">{solution.version}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 min-w-0">
                                <span className="font-medium text-muted-foreground">Publisher</span>
                                <span className="truncate" title={solution.publisher}>
                                  {solution.publisher}
                                </span>
                              </span>
                              {solution.installedOn && (
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-medium text-muted-foreground">Installed</span>
                                  <span className="font-mono">{formatInstalledOn(solution.installedOn)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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

            <DialogFooter className="mt-6">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Component
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
