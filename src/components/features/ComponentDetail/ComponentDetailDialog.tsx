import { useState, useEffect, useMemo } from 'react'
import { Database, Package, Loader2, ExternalLink, Clock3 } from 'lucide-react'
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
import { fetchChoiceOptions } from '@/services/dataServices/choiceService'
import { fetchEnvironmentVariableInfo } from '@/services/dataServices/environmentVariableService'
import { fetchConnectionReferenceBindingInfo } from '@/services/dataServices/connectionReferenceService'
import { fetchWebResourceDetails } from '@/services/dataServices/webResourceService'
import { getEnvironmentId } from '@/services/dataServices/environmentService'
import { getFlowType } from '@/services/transformers/componentTransformer'
import type { Workflow, ChoiceOption, EnvironmentVariableInfo, ConnectionReferenceBindingInfo, WebResource } from '@/services/api/d365ApiTypes'
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
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([])
  const [loadingChoiceOptions, setLoadingChoiceOptions] = useState(false)
  const [envVarInfo, setEnvVarInfo] = useState<EnvironmentVariableInfo | null>(null)
  const [loadingEnvVarInfo, setLoadingEnvVarInfo] = useState(false)
  const [connectionReferenceInfo, setConnectionReferenceInfo] = useState<ConnectionReferenceBindingInfo | null>(null)
  const [loadingConnectionReferenceInfo, setLoadingConnectionReferenceInfo] = useState(false)
  const [webResourceDetails, setWebResourceDetails] = useState<WebResource | null>(null)
  const [loadingWebResourceDetails, setLoadingWebResourceDetails] = useState(false)

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

  const isChoice = (component: Component): boolean => {
    return component.category === 'choices' || component.type === 'Choice'
  }

  const isEnvironmentVariable = (component: Component): boolean => {
    return component.category === 'environmentvariables' || component.type === 'Environment Variable Definition'
  }

  const isConnectionReference = (component: Component): boolean => {
    return component.category === 'connectionreferences' || component.type === 'Connection Reference'
  }

  const isWebResource = (component: Component): boolean => {
    return component.category === 'webresources' || component.type === 'Web Resource'
  }

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

  // 获取 Choice 选项
  useEffect(() => {
    if (!component || !isChoice(component)) {
      setChoiceOptions([])
      return
    }

    const metadataId = component.id // msdyn_objectid 是 MetadataId
    if (!metadataId) {
      console.warn('Choice component missing MetadataId')
      return
    }

    setLoadingChoiceOptions(true)
    fetchChoiceOptions(metadataId)
      .then(options => {
        setChoiceOptions(options)
      })
      .catch(error => {
        console.error('Failed to fetch choice options:', error)
        toast.error('Failed to load choice options', {
          description: error instanceof Error ? error.message : 'Could not retrieve option values'
        })
      })
      .finally(() => {
        setLoadingChoiceOptions(false)
      })
  }, [component])

  // 获取环境变量的值
  useEffect(() => {
    if (!component || !isEnvironmentVariable(component)) {
      setEnvVarInfo(null)
      return
    }

    const definitionId = component.id // msdyn_objectid 是 environmentvariabledefinitionid
    if (!definitionId) {
      console.warn('Environment Variable component missing definitionId')
      return
    }

    setLoadingEnvVarInfo(true)
    fetchEnvironmentVariableInfo(definitionId)
      .then(info => {
        setEnvVarInfo(info)
      })
      .catch(error => {
        console.error('Failed to fetch environment variable info:', error)
        toast.error('Failed to load environment variable values', {
          description: error instanceof Error ? error.message : 'Could not retrieve environment variable values'
        })
      })
      .finally(() => {
        setLoadingEnvVarInfo(false)
      })
  }, [component])

  // 获取 Connection Reference 当前绑定的 Connection 与 owner 信息
  useEffect(() => {
    if (!component || !isConnectionReference(component)) {
      setConnectionReferenceInfo(null)
      return
    }

    const referenceId = component.id
    if (!referenceId) {
      console.warn('Connection Reference component missing referenceId')
      return
    }

    setLoadingConnectionReferenceInfo(true)
    fetchConnectionReferenceBindingInfo(referenceId)
      .then(info => {
        setConnectionReferenceInfo(info)
      })
      .catch(error => {
        console.error('Failed to fetch connection reference info:', error)
        toast.error('Failed to load connection binding information', {
          description: error instanceof Error ? error.message : 'Could not retrieve connection and owner details'
        })
        setConnectionReferenceInfo(null)
      })
      .finally(() => {
        setLoadingConnectionReferenceInfo(false)
      })
  }, [component])

  // 获取 Web Resource 详细信息
  useEffect(() => {
    if (!component || !isWebResource(component)) {
      setWebResourceDetails(null)
      return
    }

    const webresourceid = component.id
    if (!webresourceid) {
      console.warn('Web Resource component missing webresourceid')
      return
    }

    setLoadingWebResourceDetails(true)
    fetchWebResourceDetails(webresourceid)
      .then(details => {
        setWebResourceDetails(details)
      })
      .catch(error => {
        console.error('Failed to fetch web resource details:', error)
        toast.error('Failed to load web resource details', {
          description: error instanceof Error ? error.message : 'Could not retrieve web resource information'
        })
      })
      .finally(() => {
        setLoadingWebResourceDetails(false)
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
                  choiceOptions={choiceOptions}
                  loadingChoiceOptions={loadingChoiceOptions}
                  envVarInfo={envVarInfo}
                  loadingEnvVarInfo={loadingEnvVarInfo}
                  connectionReferenceInfo={connectionReferenceInfo}
                  loadingConnectionReferenceInfo={loadingConnectionReferenceInfo}
                  webResourceDetails={webResourceDetails}
                  loadingWebResourceDetails={loadingWebResourceDetails}
                  getStatusVariant={getStatusVariant}
                  getFlowType={getFlowType}
                  isFlow={isFlow}
                  isChoice={isChoice}
                  isEnvironmentVariable={isEnvironmentVariable}
                  isConnectionReference={isConnectionReference}
                  isWebResource={isWebResource}
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
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This component is included in {componentSolutions.length} solution{componentSolutions.length > 1 ? 's' : ''}:
                    </p>
                    <div className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm">
                      <div className="divide-y divide-border/60">
                        {sortedComponentSolutions.map((solution) => (
                          <div
                            key={solution.id}
                            className="group relative flex cursor-pointer flex-col gap-3 p-4 transition-colors duration-150 hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-6"
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
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="truncate text-base font-semibold text-blue-600 transition-colors group-hover:text-blue-700 group-hover:underline">
                                  {solution.displayName}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`border px-2 py-0.5 text-[11px] font-medium ${
                                    solution.isManaged
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                      : 'border-amber-200 bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {solution.isManaged ? 'Managed' : 'Unmanaged'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {solution.publisher ? `Publisher ${solution.publisher}` : 'Solution details'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                                  <span className="font-mono text-foreground">{solution.name}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <span>Version</span>
                                  <span className="font-medium text-foreground">{solution.version}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 self-start text-xs text-muted-foreground sm:flex-col sm:items-end sm:gap-2 sm:self-stretch">
                              {solution.installedOn && (
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  <span className="font-medium text-foreground">{formatInstalledOn(solution.installedOn)}</span>
                                </div>
                              )}
                              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-blue-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
