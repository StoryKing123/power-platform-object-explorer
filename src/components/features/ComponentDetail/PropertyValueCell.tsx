import { Badge } from '@/components/ui/badge'

interface PropertyValueCellProps {
  value: any
  propertyKey: string
}

/**
 * 智能值渲染组件，根据数据类型应用对应样式
 * - GUID: Monospace 代码块
 * - Long ID: Monospace 代码块
 * - Boolean: Badge
 * - 其他: 普通文本
 */
export const PropertyValueCell = ({ value, propertyKey }: PropertyValueCellProps) => {
  // N/A 处理
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground/40 italic">N/A</span>
  }

  // Boolean Badge
  if (typeof value === 'boolean') {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
        {value ? 'Yes' : 'No'}
      </Badge>
    )
  }

  const stringValue = String(value)

  // GUID 检测（格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
  const isGuid = /^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(stringValue)

  // 长字符串检测
  const isLongId = stringValue.length > 20

  // 属性名包含 ID 相关关键字
  const hasIdKeyword = /id|key|token|unique/i.test(propertyKey)

  // 使用 Monospace 代码块样式
  if (isGuid || (isLongId && hasIdKeyword)) {
    return (
      <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border text-foreground">
        {stringValue}
      </code>
    )
  }

  // 普通文本
  return <span className="text-xs text-foreground">{stringValue}</span>
}
