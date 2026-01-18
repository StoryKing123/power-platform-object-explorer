import { Eye, MoreVertical, Play, ExternalLink, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Clock } from 'lucide-react'
import { type Component } from '@/data/mockData'
import { getStatusVariant, normalizeGuid, isCanvasApp, isModelDrivenApp, isEntity, isSecurityRole, getEntityMetadataWebResourceName } from '@/utils/componentHelpers'
import { getEnvironmentId } from '@/services/dataServices/environmentService'
import { getDefaultSolutionId } from '@/services/dataServices/searchService'
import { fetchFlowEditorInfoByWorkflowId } from '@/services/dataServices/flowService'
import { toast } from 'sonner'

interface ComponentTableRowProps {
  component: Component
  index: number
  onViewDetails: (component: Component) => void
}

/**
 * 组件表格行组件
 * 显示单个组件的信息和操作
 */
export const ComponentTableRow = ({ component, index, onViewDetails }: ComponentTableRowProps) => {
  const handlePlayModelDrivenApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const appId = normalizeGuid(component.id)
    if (!appId) {
      toast.error('Unable to open app: app ID not found')
      return
    }

    const playUrl = new URL('/main.aspx', window.location.origin)
    playUrl.searchParams.set('appid', appId)
    playUrl.searchParams.set('forceUCI', '1')
    window.open(playUrl.toString(), '_blank', 'noopener,noreferrer')
  }

  const handleEditModelDrivenApp = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const appId = normalizeGuid(component.id)
    if (!appId) {
      toast.error('Unable to open app: app ID not found')
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

    let solutionId: string
    try {
      toast.loading('Retrieving default solution ID...')
      solutionId = await getDefaultSolutionId()
      toast.dismiss()
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to retrieve default solution ID', {
        description: error instanceof Error ? error.message : 'Unable to get default solution ID from Dynamics 365 API'
      })
      return
    }

    const editUrl = `https://make.powerapps.com/e/${environmentId}/s/${solutionId}/app/edit/${appId}`
    window.open(editUrl, '_blank', 'noopener,noreferrer')
  }

  const handleEditCanvasApp = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const appId = normalizeGuid(component.id)
    if (!appId) {
      toast.error('Unable to open app: app ID not found')
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

    const editUrl = `https://make.powerapps.com/environments/${environmentId}/apps/${appId}/edit`
    window.open(editUrl, '_blank', 'noopener,noreferrer')
  }

  const handleOpenFlow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    let workflowidunique = component.metadata?.workflowidunique
    let solutionid = component.metadata?.solutionid

    // Fallback: search results may omit fields required to construct the Flow Editor URL.
    if (!workflowidunique || !solutionid) {
      const workflowid = normalizeGuid(component.metadata?.objectId ?? component.id)
      if (!workflowid) {
        toast.error('Unable to open flow: workflow ID not found')
        return
      }

      try {
        toast.loading('Retrieving flow details...')
        const info = await fetchFlowEditorInfoByWorkflowId(workflowid)
        toast.dismiss()

        if (!info) {
          toast.error('Unable to open flow: flow details not found (or not a cloud flow)')
          return
        }

        workflowidunique = info.workflowidunique
        solutionid = info.solutionid
      } catch (error) {
        toast.dismiss()
        toast.error('Failed to retrieve flow details', {
          description: error instanceof Error ? error.message : 'Unable to get flow details from Dynamics 365 API'
        })
        return
      }
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

    const flowEditorUrl = `https://make.powerautomate.com/environments/${environmentId}/solutions/${solutionid}/flows/${workflowidunique}`
    window.open(flowEditorUrl, '_blank', 'noopener,noreferrer')
  }

  const handleEditSecurityRole = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const roleId = normalizeGuid(component.id)
    if (!roleId) {
      toast.error('Unable to open security role: role ID not found')
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

    let solutionId: string
    try {
      toast.loading('Retrieving default solution ID...')
      solutionId = await getDefaultSolutionId()
      toast.dismiss()
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to retrieve default solution ID', {
        description: error instanceof Error ? error.message : 'Unable to get default solution ID from Dynamics 365 API'
      })
      return
    }

    const editUrl = `https://make.powerapps.com/e/${environmentId}/s/${solutionId}/securityRoles/${roleId}/roleEditor`
    window.open(editUrl, '_blank', 'noopener,noreferrer')
  }

  const handleViewMetadata = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const logicName = component.metadata?.msdyn_name
    if (!logicName) {
      toast.error('Unable to open metadata: entity logic name not found')
      return
    }

    const webResourceName = getEntityMetadataWebResourceName()
    if (!webResourceName) {
      toast.error('Entity Metadata web resource not configured')
      return
    }

    const metadataUrl = new URL(`/WebResources/${webResourceName}`, window.location.origin)
    metadataUrl.searchParams.set('logicname', logicName)
    window.open(metadataUrl.toString(), '_blank', 'noopener,noreferrer')
  }

  const isFlow = component.category === 'flows' || component.type.toLowerCase().includes('flow')

  return (
    <TableRow onClick={() => onViewDetails(component)}>
      <TableCell className="font-medium">
        {component.name}
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {component.type}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={getStatusVariant(component.status)}>
          {component.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          <span>{component.lastModified}</span>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(component)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {isEntity(component) && (
              <DropdownMenuItem onClick={handleViewMetadata}>
                <Database className="h-4 w-4 mr-2" />
                View Metadata in new tab
              </DropdownMenuItem>
            )}
            {isModelDrivenApp(component) && (
              <>
                <DropdownMenuItem onClick={handlePlayModelDrivenApp}>
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEditModelDrivenApp}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Edit in new tab
                </DropdownMenuItem>
              </>
            )}
            {isCanvasApp(component) && (
              <DropdownMenuItem onClick={handleEditCanvasApp}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Edit in new tab
              </DropdownMenuItem>
            )}
            {isFlow && (
              <DropdownMenuItem onClick={handleOpenFlow}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Flow Editor
              </DropdownMenuItem>
            )}
            {isSecurityRole(component) && (
              <DropdownMenuItem onClick={handleEditSecurityRole}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Edit in new tab
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
