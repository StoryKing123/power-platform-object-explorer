import { motion } from 'framer-motion'
import {
  Loader2,
  Database,
  Zap,
  Puzzle,
  Link,
  Variable,
  Globe,
  List,
  FileText,
  Table2,
  Package,
  Shield,
  Network,
  PackageOpen
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { ComponentDependency, DependencyData, DependencyRelationType } from '@/services/dataServices/dependencyService'

interface DependenciesTabContentProps {
  dependencies: DependencyData | null
  loading: boolean
  onDependencyClick: (dependency: ComponentDependency) => void
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

// 卡片入场动画
const cardVariants = {
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

/**
 * 获取依赖关系类型的图标
 */
function getRelationshipIcon(relationType: DependencyRelationType) {
  switch (relationType) {
    case 'Entity Reference':
      return Database
    case 'Workflow Trigger':
      return Zap
    case 'Plugin Registration':
      return Puzzle
    case 'Flow Connection':
      return Link
    case 'Environment Variable':
      return Variable
    case 'Web Resource':
      return Globe
    case 'Choice Usage':
      return List
    case 'Form Reference':
      return FileText
    case 'View Reference':
      return Table2
    case 'Data Source':
      return Database
    case 'Custom Connector':
      return Link
    case 'Security Role':
      return Shield
    case 'Solution Component':
    default:
      return Network
  }
}

/**
 * 获取依赖关系类型的颜色样式
 */
function getRelationshipTypeStyle(relationType: DependencyRelationType): string {
  const colorMap: Record<DependencyRelationType, string> = {
    'Entity Reference': 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
    'Workflow Trigger': 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
    'Plugin Registration': 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
    'Flow Connection': 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
    'Environment Variable': 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
    'Web Resource': 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
    'Choice Usage': 'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-300',
    'Form Reference': 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    'View Reference': 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300',
    'Data Source': 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300',
    'Custom Connector': 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
    'Security Role': 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300',
    'Solution Component': 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
  }
  return colorMap[relationType]
}

/**
 * 获取状态徽章的变体
 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default'
    case 'inactive':
      return 'secondary'
    case 'draft':
      return 'outline'
    default:
      return 'secondary'
  }
}

/**
 * 获取状态徽章的自定义样式
 */
function getStatusStyle(status: string): string {
  switch (status) {
    case 'active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
    case 'inactive':
      return 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300'
    case 'draft':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300'
  }
}

/**
 * 依赖项卡片组件
 */
interface DependencyCardProps {
  dependency: ComponentDependency
  onClick: (dependency: ComponentDependency) => void
}

const DependencyCard = ({ dependency, onClick }: DependencyCardProps) => {
  const RelationIcon = getRelationshipIcon(dependency.relationshipType)

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Card
        className="group relative cursor-pointer overflow-hidden border border-border/60 bg-card/40 p-4 backdrop-blur-md transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
        onClick={() => onClick(dependency)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(dependency)
          }
        }}
      >
        {/* 渐变背景装饰 */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />

        <div className="relative flex flex-col gap-3">
          {/* 顶部: 图标 + 名称 */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <RelationIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                {dependency.displayName}
              </h4>
              <p className="truncate text-xs text-muted-foreground font-mono">
                {dependency.name}
              </p>
            </div>
          </div>

          {/* 中部: 徽章 */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`border px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(dependency.status)}`}
            >
              {dependency.status.charAt(0).toUpperCase() + dependency.status.slice(1)}
            </Badge>
            <Badge
              variant="secondary"
              className="border-border/50 px-2 py-0.5 text-[10px] font-medium"
            >
              {dependency.type}
            </Badge>
            {dependency.isManaged !== undefined && (
              <Badge
                variant="outline"
                className={`border px-2 py-0.5 text-[10px] font-medium ${
                  dependency.isManaged
                    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                }`}
              >
                {dependency.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            )}
          </div>

          {/* 底部: 关系描述 */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dependency.relationshipReason}
            </p>
            <Badge
              variant="outline"
              className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-medium ${getRelationshipTypeStyle(dependency.relationshipType)}`}
            >
              <RelationIcon className="h-3 w-3" />
              {dependency.relationshipType}
            </Badge>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

/**
 * 空状态组件
 */
interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
}

const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon className="mx-auto mb-3 h-12 w-12 text-muted-foreground/60" />
    <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
)

/**
 * 依赖区域组件
 */
interface DependencySectionProps {
  title: string
  description: string
  dependencies: ComponentDependency[]
  onDependencyClick: (dependency: ComponentDependency) => void
  emptyIcon: React.ElementType
  emptyTitle: string
  emptyDescription: string
}

const DependencySection = ({
  title,
  description,
  dependencies,
  onDependencyClick,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: DependencySectionProps) => (
  <div className="space-y-4">
    {/* 区域标题 */}
    <div className="flex items-center gap-2">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <Badge variant="secondary" className="text-xs">
        {dependencies.length}
      </Badge>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>

    {/* 依赖列表 */}
    {dependencies.length > 0 ? (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {dependencies.map((dep) => (
          <DependencyCard key={dep.id} dependency={dep} onClick={onDependencyClick} />
        ))}
      </motion.div>
    ) : (
      <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
    )}
  </div>
)

/**
 * 依赖标签页内容组件
 */
export default function DependenciesTabContent({
  dependencies,
  loading,
  onDependencyClick,
}: DependenciesTabContentProps) {
  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-sm text-muted-foreground">Loading dependencies...</span>
      </div>
    )
  }

  // 无依赖数据
  if (!dependencies) {
    return (
      <EmptyState
        icon={Network}
        title="Unable to Load Dependencies"
        description="Dependency information could not be retrieved"
      />
    )
  }

  // 完全无依赖关系
  const hasNoDependencies = dependencies.required.length === 0 && dependencies.dependent.length === 0

  if (hasNoDependencies) {
    return (
      <EmptyState
        icon={Network}
        title="No Dependencies Found"
        description="This component has no dependency relationships"
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Required Components 区域 */}
      <DependencySection
        title="Required Components"
        description="Components that this component depends on to function properly"
        dependencies={dependencies.required}
        onDependencyClick={onDependencyClick}
        emptyIcon={PackageOpen}
        emptyTitle="No Required Components"
        emptyDescription="This component operates independently without dependencies"
      />

      {/* 分隔线 */}
      {dependencies.required.length > 0 && dependencies.dependent.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60"></div>
          </div>
        </div>
      )}

      {/* Dependent Components 区域 */}
      <DependencySection
        title="Dependent Components"
        description="Components that depend on this component"
        dependencies={dependencies.dependent}
        onDependencyClick={onDependencyClick}
        emptyIcon={Network}
        emptyTitle="No Dependent Components"
        emptyDescription="No other components currently depend on this component"
      />
    </div>
  )
}
