import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { PropertyItem } from './PropertyItem'

interface PropertyCardProps {
  title: string
  icon: LucideIcon
  properties: Array<{ key: string; value: any }>
  cardIndex: number
}

// 卡片入场动画变体
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
}

/**
 * 属性分组卡片组件，展示语义化分组的属性列表
 */
export const PropertyCard = ({
  title,
  icon: Icon,
  properties,
  cardIndex
}: PropertyCardProps) => {
  if (properties.length === 0) return null

  return (
    <motion.div
      variants={cardVariants}
      className="bg-card/40 backdrop-blur-md border border-border/40 rounded-xl p-5 min-h-[160px] transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* 卡片头部 */}
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
        <div className="h-8 w-8 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h4 className="text-sm font-semibold text-foreground tracking-tight">
          {title}
        </h4>
      </div>

      {/* 属性列表 */}
      <div className="space-y-0.5">
        {properties.map(({ key, value }) => (
          <PropertyItem key={key} label={key} value={value} />
        ))}
      </div>
    </motion.div>
  )
}
