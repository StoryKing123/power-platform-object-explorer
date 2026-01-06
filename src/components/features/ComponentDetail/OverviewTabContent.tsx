import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Component } from '@/data/mockData'
import type { Workflow, ChoiceOption, EnvironmentVariableInfo } from '@/services/api/d365ApiTypes'

interface OverviewTabContentProps {
  component: Component
  flowDetails: Workflow | null
  loadingFlowDetails: boolean
  choiceOptions: ChoiceOption[]
  loadingChoiceOptions: boolean
  envVarInfo: EnvironmentVariableInfo | null
  loadingEnvVarInfo: boolean
  getStatusVariant: (status: string) => 'default' | 'secondary' | 'destructive' | 'outline'
  getFlowType: (workflow: Workflow) => string
  isFlow: (component: Component) => boolean
  isChoice: (component: Component) => boolean
  isEnvironmentVariable: (component: Component) => boolean
}

// 容器动画 - 子元素交错入场
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

// 列表项入场动画
const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24
    }
  }
}

// 选项卡片入场动画
const optionCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24
    }
  }
}

interface InfoListItemProps {
  label: string
  value: React.ReactNode
  loading?: boolean
}

/**
 * 信息列表项组件 - 紧凑的水平布局展示单个字段
 */
const InfoListItem = ({ label, value, loading }: InfoListItemProps) => (
  <motion.div
    variants={listItemVariants}
    className="group relative flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/30 border-b border-border/40 last:border-b-0"
  >
    {/* 标签 */}
    <div className="min-w-[120px] flex-shrink-0">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>

    {/* 值 */}
    <div className="flex-1 text-sm font-semibold text-foreground">
      {loading ? (
        <div className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      ) : (
        value
      )}
    </div>
  </motion.div>
)

/**
 * Overview 标签页内容组件，展示组件的基本信息
 * - Description（描述区域）
 * - Basic Info（基本信息列表）
 * - Options（选项网格，仅 Choice 类型）
 */
export const OverviewTabContent = ({
  component,
  flowDetails,
  loadingFlowDetails,
  choiceOptions,
  loadingChoiceOptions,
  envVarInfo,
  loadingEnvVarInfo,
  getStatusVariant,
  getFlowType,
  isFlow,
  isChoice,
  isEnvironmentVariable
}: OverviewTabContentProps) => {
  return (
    <div className="space-y-4">
      {/* Description 区域 */}
      {component.description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/40 backdrop-blur-md p-4 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
        >
          {/* 悬停渐变背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <div className="relative">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </h3>
            <p className="text-sm leading-relaxed text-foreground/90">
              {component.description}
            </p>
          </div>
        </motion.div>
      )}

      {/* Basic Information 列表 - 紧凑垂直布局 */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Basic Information
        </h3>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="overflow-hidden rounded-lg border border-border/50 bg-card/40 backdrop-blur-md"
        >
          {/* Type */}
          <InfoListItem label="Type" value={component.type} />

          {/* Category */}
          <InfoListItem label="Category" value={component.category} />

          {/* Status */}
          <InfoListItem
            label="Status"
            value={
              <Badge
                variant={getStatusVariant(component.status)}
                className="text-xs px-2 py-0.5"
              >
                {component.status}
              </Badge>
            }
          />

          {/* Last Modified */}
          <InfoListItem label="Last Modified" value={component.lastModified} />

          {/* Flow Type (条件渲染 - 仅 Flow 类型) */}
          {isFlow(component) && (
            <InfoListItem
              label="Flow Type"
              loading={loadingFlowDetails}
              value={flowDetails ? getFlowType(flowDetails) : 'Cloud Flow'}
            />
          )}
        </motion.div>
      </div>

      {/* Options 区域 (仅 Choice 类型显示) */}
      {isChoice(component) && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Options
          </h3>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="overflow-hidden rounded-lg border border-border/50 bg-card/40 backdrop-blur-md p-4"
          >
            {loadingChoiceOptions ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                <span className="mt-3 text-sm text-muted-foreground">Loading options...</span>
              </div>
            ) : choiceOptions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {choiceOptions.map((option) => (
                  <motion.div
                    key={option.value}
                    variants={optionCardVariants}
                  >
                    <Card className="group border-border/40 bg-background/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-3.5">
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
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No options available for this choice
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Environment Variable Values 区域 (仅 Environment Variable 类型显示) */}
      {isEnvironmentVariable(component) && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Environment Variable Values
          </h3>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="overflow-hidden rounded-lg border border-border/50 bg-card/40 backdrop-blur-md p-4"
          >
            {loadingEnvVarInfo ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                <span className="mt-3 text-sm text-muted-foreground">Loading values...</span>
              </div>
            ) : envVarInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Default Value Card */}
                <motion.div
                  variants={optionCardVariants}
                >
                  <Card className="group border-border/40 bg-background/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Default Value
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono"
                        >
                          {envVarInfo.typeName}
                        </Badge>
                      </div>
                      {envVarInfo.defaultValue ? (
                        <div className="mt-3 rounded-md bg-muted/40 border border-border p-3">
                          <p className="text-sm font-mono text-foreground break-all leading-relaxed">
                            {envVarInfo.defaultValue}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-md bg-muted/20 border border-dashed border-border p-3 text-center">
                          <p className="text-xs text-muted-foreground italic">
                            No default value set
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Current Value Card */}
                <motion.div
                  variants={optionCardVariants}
                >
                  <Card className="group border-border/40 bg-background/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Current Value
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono"
                        >
                          {envVarInfo.typeName}
                        </Badge>
                      </div>
                      {envVarInfo.currentValue ? (
                        <div className="mt-3 rounded-md bg-muted/40 border border-border p-3">
                          <p className="text-sm font-mono text-foreground break-all leading-relaxed">
                            {envVarInfo.currentValue}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-md bg-muted/20 border border-dashed border-border p-3 text-center">
                          <p className="text-xs text-muted-foreground italic">
                            Using default value
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No values available for this environment variable
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
