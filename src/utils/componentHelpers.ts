import { type Component } from '@/data/mockData'
import {
  LayoutGrid, Database, FileText, Table2,
  GitBranch, Puzzle, Globe, Package, Zap, Clock, Shield, List,
  type LucideIcon
} from 'lucide-react'

/**
 * 根据图标名称获取对应的 Lucide 图标组件
 */
export const getIconComponent = (iconName: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    LayoutGrid, Database, FileText, Table2,
    GitBranch, Puzzle, Globe, Package, Zap, Clock, Shield, List
  }
  return icons[iconName] || LayoutGrid
}

/**
 * 根据状态获取对应的 Badge 样式
 */
export const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
  switch(status) {
    case 'active': return 'outline'
    case 'inactive': return 'outline'
    case 'draft': return 'outline'
    default: return 'outline'
  }
}

/**
 * 标准化 GUID 格式，移除花括号
 */
export const normalizeGuid = (value?: string): string => {
  if (!value) return ''
  return value.trim().replace(/^{|}$/g, '')
}

/**
 * 判断组件是否为 Canvas App
 */
export const isCanvasApp = (component: Component): boolean => {
  const primaryIdAttribute = String(
    component.metadata?.primaryIdAttribute ??
    component.metadata?._searchResult?.msdyn_primaryidattribute ??
    ''
  ).toLowerCase()
  if (primaryIdAttribute === 'canvasappid') return true

  const componentTypeName = String(
    component.metadata?.componentTypeName ??
    component.metadata?._searchResult?.msdyn_componenttypename ??
    component.type ??
    ''
  )
  if (/canvas\s*app/i.test(componentTypeName)) return true

  // 本地化环境兼容 (zh-CN/zh-TW)
  return componentTypeName.includes('画布') || componentTypeName.includes('畫布')
}

/**
 * 判断组件是否为 Model-driven App
 */
export const isModelDrivenApp = (component: Component): boolean => {
  const primaryIdAttribute = String(
    component.metadata?.primaryIdAttribute ??
    component.metadata?._searchResult?.msdyn_primaryidattribute ??
    ''
  ).toLowerCase()
  if (primaryIdAttribute === 'appmoduleid') return true

  const componentTypeName = String(
    component.metadata?.componentTypeName ??
    component.metadata?._searchResult?.msdyn_componenttypename ??
    component.type ??
    ''
  )
  if (/model[-\s]driven/i.test(componentTypeName)) return true

  // 本地化环境兼容 (zh-CN/zh-TW)
  return componentTypeName.includes('模型驱动') || componentTypeName.includes('模型驅動')
}
