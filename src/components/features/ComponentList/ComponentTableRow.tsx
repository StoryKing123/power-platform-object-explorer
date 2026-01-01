import { Eye, MoreVertical, Play, ExternalLink, Database } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Clock } from 'lucide-react'
import { type Component } from '@/data/mockData'
import { getStatusVariant, normalizeGuid, isCanvasApp, isModelDrivenApp, isEntity, getEntityMetadataWebResourceName } from '@/utils/componentHelpers'
import { getEnvironmentId } from '@/services/dataServices/environmentService'
import { getDefaultSolutionId } from '@/services/dataServices/searchService'
import { toast } from 'sonner'

interface ComponentTableRowProps {
  component: Component
  index: number
  onViewDetails: (component: Component) => void
}

// 表格行动画 variants
const rowVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  hover: {
    scale: 1.005,
    backgroundColor: 'color-mix(in oklch, var(--muted) 60%, transparent)',
    boxShadow: '0 2px 8px -2px oklch(0 0 0 / 0.08)',
    transition: { duration: 0.2, ease: 'easeOut' }
  }
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
    <motion.tr
      variants={rowVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group cursor-pointer border-b border-border/50"
      onClick={() => onViewDetails(component)}
    >
      <TableCell className="font-medium">
        <div className="truncate">{component.name}</div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="whitespace-nowrap transition-all duration-200 group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary"
        >
          {component.type}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant={getStatusVariant(component.status)}
          className="whitespace-nowrap transition-all duration-200 group-hover:shadow-sm"
        >
          {component.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
        <div className="flex items-center gap-2 transition-colors group-hover:text-foreground/80">
          <Clock className="h-3.5 w-3.5 opacity-60" />
          <span>{component.lastModified}</span>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.2, ease: 'backOut' } }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:bg-accent/80 group-hover:scale-105"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </motion.div>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}
