import { Eye, MoreVertical, Play, ExternalLink } from 'lucide-react'
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
import { getStatusVariant, normalizeGuid, isCanvasApp, isModelDrivenApp } from '@/utils/componentHelpers'
import { getEnvironmentId } from '@/services/dataServices/environmentService'
import { getDefaultSolutionId } from '@/services/dataServices/searchService'
import { toast } from 'sonner'

interface ComponentTableRowProps {
  component: Component
  onViewDetails: (component: Component) => void
}

/**
 * 组件表格行组件
 * 显示单个组件的信息和操作
 */
export const ComponentTableRow = ({ component, onViewDetails }: ComponentTableRowProps) => {
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

    const workflowidunique = component.metadata?.workflowidunique
    const solutionid = component.metadata?.solutionid

    if (!workflowidunique) {
      toast.error('Unable to open flow: workflowidunique not found')
      return
    }

    if (!solutionid) {
      toast.error('Unable to open flow: solutionid not found')
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

    const flowEditorUrl = `https://make.powerautomate.com/environments/${environmentId}/solutions/${solutionid}/flows/${workflowidunique}`
    window.open(flowEditorUrl, '_blank')
  }

  const isFlow = component.category === 'flows' || component.type.toLowerCase().includes('flow')

  return (
    <TableRow
      className="group cursor-pointer"
      onClick={() => onViewDetails(component)}
    >
      <TableCell className="font-medium">
        <div className="truncate">{component.name}</div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="whitespace-nowrap">{component.type}</Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell max-w-md">
        <div className="text-sm text-muted-foreground line-clamp-2">
          {component.description}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={getStatusVariant(component.status)} className="whitespace-nowrap">
          {component.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {component.lastModified}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(component)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
