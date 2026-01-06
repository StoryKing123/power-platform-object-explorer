import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import type { Component } from '@/data/mockData'
import type { Workflow, ChoiceOption } from '@/services/api/d365ApiTypes'

interface OverviewTabContentProps {
  component: Component
  flowDetails: Workflow | null
  loadingFlowDetails: boolean
  choiceOptions: ChoiceOption[]
  loadingChoiceOptions: boolean
  getStatusVariant: (status: string) => 'default' | 'secondary' | 'destructive' | 'outline'
  getFlowType: (workflow: Workflow) => string
  isFlow: (component: Component) => boolean
  isChoice: (component: Component) => boolean
}

/**
 * Overview 标签页内容组件，展示组件的基本信息
 * - Description（描述区域）
 * - Basic Info（基本信息紧凑表格）
 */
export const OverviewTabContent = ({
  component,
  flowDetails,
  loadingFlowDetails,
  choiceOptions,
  loadingChoiceOptions,
  getStatusVariant,
  getFlowType,
  isFlow,
  isChoice
}: OverviewTabContentProps) => {
  return (
    <div className="space-y-4">
      {/* Description 区域 */}
      {component.description && (
        <div className="rounded-md border border-border bg-card p-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-sm text-foreground leading-relaxed">{component.description}</p>
        </div>
      )}

      {/* Basic Info 紧凑表格 */}
      <div className="rounded-md border border-border overflow-hidden">
        <div className="bg-secondary/50 px-3 py-2 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Basic Information
          </h3>
        </div>
        <Table>
          <TableBody>
            {/* Type */}
            <TableRow className="border-b-0 hover:bg-secondary/30">
              <TableCell className="py-2 px-3 text-xs text-muted-foreground font-medium w-[30%]">
                Type
              </TableCell>
              <TableCell className="py-2 px-3 text-xs text-foreground">{component.type}</TableCell>
            </TableRow>

            {/* Category */}
            <TableRow className="border-b-0 hover:bg-secondary/30">
              <TableCell className="py-2 px-3 text-xs text-muted-foreground font-medium">
                Category
              </TableCell>
              <TableCell className="py-2 px-3 text-xs text-foreground">
                {component.category}
              </TableCell>
            </TableRow>

            {/* Status */}
            <TableRow className="border-b-0 hover:bg-secondary/30">
              <TableCell className="py-2 px-3 text-xs text-muted-foreground font-medium">
                Status
              </TableCell>
              <TableCell className="py-2 px-3">
                <Badge
                  variant={getStatusVariant(component.status)}
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {component.status}
                </Badge>
              </TableCell>
            </TableRow>

            {/* Last Modified */}
            <TableRow className="border-b-0 hover:bg-secondary/30">
              <TableCell className="py-2 px-3 text-xs text-muted-foreground font-medium">
                Last Modified
              </TableCell>
              <TableCell className="py-2 px-3 text-xs text-foreground">
                {component.lastModified}
              </TableCell>
            </TableRow>

            {/* Flow Type (仅 Flow 类型显示) */}
            {isFlow(component) && (
              <TableRow className="border-b-0 hover:bg-secondary/30">
                <TableCell className="py-2 px-3 text-xs text-muted-foreground font-medium">
                  Flow Type
                </TableCell>
                <TableCell className="py-2 px-3">
                  {loadingFlowDetails ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    </div>
                  ) : flowDetails ? (
                    <span className="text-xs text-foreground">{getFlowType(flowDetails)}</span>
                  ) : (
                    <span className="text-xs text-foreground">Cloud Flow</span>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Options 区域 (仅 Choice 类型显示) */}
      {isChoice(component) && (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="bg-secondary/50 px-3 py-2 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Options
            </h3>
          </div>
          <div className="p-4">
            {loadingChoiceOptions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading options...</span>
              </div>
            ) : choiceOptions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {choiceOptions.map((option) => (
                  <Card
                    key={option.value}
                    className="group hover:shadow-md transition-shadow duration-200"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground leading-tight">
                          {option.label}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono"
                        >
                          {option.value}
                        </Badge>
                      </div>
                      {option.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          {option.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  No options available for this choice
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
