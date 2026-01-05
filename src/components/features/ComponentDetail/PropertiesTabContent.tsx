import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Info, Tag, Users, Settings, Puzzle, FileQuestion } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { PropertyTable } from './PropertyTable'
import type { LucideIcon } from 'lucide-react'

interface PropertiesTabContentProps {
  metadata?: Record<string, any>
}

interface PropertyGroup {
  id: string
  title: string
  icon: LucideIcon
  properties: Array<{ key: string; value: any }>
}

/**
 * 智能分组 metadata 属性
 */
const groupMetadata = (metadata: Record<string, any>): PropertyGroup[] => {
  // 定义各分组包含的属性键
  const groupDefinitions = {
    identification: {
      title: 'Identification',
      icon: Info,
      keys: [
        'logicalName',
        'schemaName',
        'uniqueName',
        'internalName',
        'objectTypeCode',
        'returnedTypeCode',
        'workflowidunique',
        'objectId',
        'componentType',
        'componentTypeName'
      ]
    },
    typeCategory: {
      title: 'Type & Category',
      icon: Tag,
      keys: [
        'formType',
        'queryType',
        'viewType',
        'webResourceType',
        'workflowType',
        'workflowCategory',
        'modernFlowType',
        'subtype',
        'category',
        'type'
      ]
    },
    ownership: {
      title: 'Ownership & Lifecycle',
      icon: Users,
      keys: [
        'owner',
        'ownerId',
        'owningUserId',
        'owningTeamId',
        'owningUser',
        'owningTeam',
        'businessUnit',
        'publisher',
        'createdOn',
        'modifiedOn',
        'createdBy',
        'modifiedBy'
      ]
    },
    configuration: {
      title: 'Configuration',
      icon: Settings,
      keys: [
        'isManaged',
        'isCustomizable',
        'isDefault',
        'isActivity',
        'isCustom',
        'primaryIdAttribute',
        'primaryNameAttribute',
        'isolationMode',
        'sourceType',
        'canBeDeleted',
        'introducedVersion'
      ]
    },
    pluginSpecific: {
      title: 'Plugin Specific',
      icon: Puzzle,
      keys: [
        'stage',
        'stageName',
        'mode',
        'modeName',
        'rank',
        'message',
        'entity',
        'pluginType',
        'version',
        'culture',
        'publicKeyToken',
        'assemblyName'
      ]
    }
  }

  const groups: PropertyGroup[] = []
  const assignedKeys = new Set<string>()

  // 遍历每个分组定义，收集匹配的属性
  Object.entries(groupDefinitions).forEach(([id, definition]) => {
    const properties: Array<{ key: string; value: any }> = []

    definition.keys.forEach(key => {
      if (key in metadata) {
        properties.push({ key, value: metadata[key] })
        assignedKeys.add(key)
      }
    })

    // 只添加有属性的分组
    if (properties.length > 0) {
      groups.push({
        id,
        title: definition.title,
        icon: definition.icon,
        properties
      })
    }
  })

  // 收集未分组的其他属性
  const otherProperties: Array<{ key: string; value: any }> = []
  Object.entries(metadata).forEach(([key, value]) => {
    if (!assignedKeys.has(key)) {
      otherProperties.push({ key, value })
    }
  })

  // 如果有其他未分组属性，添加到"Other"分组
  if (otherProperties.length > 0) {
    groups.push({
      id: 'other',
      title: 'Other Properties',
      icon: Settings,
      properties: otherProperties
    })
  }

  return groups
}

/**
 * Properties 标签页主容器，使用 Accordion 展示智能分组的属性
 */
export const PropertiesTabContent = ({ metadata }: PropertiesTabContentProps) => {
  const propertyGroups = useMemo(() => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return []
    }
    return groupMetadata(metadata)
  }, [metadata])

  // 空状态
  if (propertyGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileQuestion className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <p className="text-sm text-muted-foreground">No metadata available</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          This component has no additional properties to display
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-2"
    >
      <Accordion type="multiple" defaultValue={['identification', 'typeCategory']} className="w-full">
        {propertyGroups.map((group) => (
          <AccordionItem
            key={group.id}
            value={group.id}
            className="border-border mb-2 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="py-2 px-3 hover:bg-muted/50 hover:no-underline rounded-t">
              <div className="flex items-center gap-2.5">
                <group.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold text-foreground">{group.title}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                  {group.properties.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-0 px-0">
              <PropertyTable properties={group.properties} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  )
}
