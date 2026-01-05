import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface CopyButtonProps {
  value: any
}

/**
 * 复制按钮组件，支持一键复制任意值到剪贴板
 */
export const CopyButton = ({ value }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    // 格式化值为字符串
    const stringValue =
      value === null || value === undefined
        ? 'N/A'
        : typeof value === 'boolean'
          ? value
            ? 'Yes'
            : 'No'
          : String(value)

    try {
      await navigator.clipboard.writeText(stringValue)
      setCopied(true)
      toast.success('Copied', {
        description: stringValue.length > 50 ? `${stringValue.slice(0, 50)}...` : stringValue,
        duration: 1500
      })
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted/50 rounded"
      aria-label="Copy value"
      whileTap={{ scale: 0.9 }}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </motion.button>
  )
}
