import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface PropertyItemProps {
  label: string
  value: any
}

/**
 * 单个属性行组件，支持一键复制
 */
export const PropertyItem = ({ label, value }: PropertyItemProps) => {
  const [copied, setCopied] = useState(false)

  // 格式化显示值
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return 'N/A'
    if (typeof val === 'boolean') return val ? 'Yes' : 'No'
    return String(val)
  }

  const displayValue = formatValue(value)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue)
      setCopied(true)
      toast.success(`Copied ${label}`, {
        description: displayValue.length > 50 ? `${displayValue.slice(0, 50)}...` : displayValue,
        duration: 2000
      })

      // 2秒后恢复图标
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy', {
        description: 'Please try again'
      })
    }
  }

  return (
    <div className="group flex items-center justify-between gap-3 py-2.5 px-3 hover:bg-muted/30 rounded-lg transition-colors">
      <span className="text-sm font-medium text-muted-foreground shrink-0">
        {label}
      </span>

      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-sm text-foreground font-mono truncate max-w-[300px]"
          title={displayValue}
        >
          {displayValue}
        </span>

        <motion.button
          type="button"
          onClick={handleCopy}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted/50 rounded"
          aria-label={`Copy ${label}`}
          whileTap={{ scale: 0.9 }}
          animate={copied ? { scale: [1, 1.2, 1] } : {}}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </motion.button>
      </div>
    </div>
  )
}
