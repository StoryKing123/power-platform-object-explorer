// Component Transformer - Transform D365 data to Component interface

import type { Component } from '@/data/mockData'
import type {
  EntityDefinition,
  SystemForm,
  SavedQuery,
  UserQuery,
  Workflow,
	PluginAssembly,
	SdkMessageProcessingStep,
	WebResource,
	AppModule,
	CanvasApp,
	Role,
} from '../api/d365ApiTypes'
import {
  FORM_TYPES,
  WORKFLOW_CATEGORIES,
  WEB_RESOURCE_TYPES,
  PLUGIN_STAGES,
  PLUGIN_MODES,
  MODERN_FLOW_TYPES,
} from '../api/d365ApiConfig'

/**
 * Format date to relative or absolute format
 */
function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // Use relative time for recent changes
  if (diffMins < 60) {
    return diffMins <= 1 ? '1 min ago' : `${diffMins} mins ago`
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  }

  // Use absolute date for older items
  return date.toISOString().split('T')[0] || 'Unknown'
}

/**
 * Get label text from D365 Label object
 */
function getLabelText(label: any): string {
  if (!label) return ''
  if (label.UserLocalizedLabel?.Label) return label.UserLocalizedLabel.Label
  if (label.LocalizedLabels?.[0]?.Label) return label.LocalizedLabels[0].Label
  return ''
}

/**
 * Get default solution for components
 */
function getDefaultSolution() {
  return [{
    id: 'default',
    name: 'Default',
    displayName: 'Default Solution',
    version: '1.0.0.0',
    publisher: 'Default Publisher',
    isManaged: false,
  }]
}

/**
 * Transform Entity to Component
 */
export function transformEntity(entity: EntityDefinition): Component {
  const displayName = getLabelText(entity.DisplayName) || entity.LogicalName
  const description = getLabelText(entity.Description) || `Entity: ${entity.LogicalName}`

  return {
    id: entity.MetadataId,
    name: displayName,
    type: entity.IsCustomEntity ? 'Custom Entity' : 'System Entity',
    category: 'entities',
    status: 'active',
    lastModified: formatDate(entity.ModifiedOn),
    description,
    solutions: getDefaultSolution(),
    metadata: {
      logicalName: entity.LogicalName,
      schemaName: entity.SchemaName,
      objectTypeCode: entity.ObjectTypeCode,
      isManaged: entity.IsManaged,
      isCustomizable: entity.IsCustomizable?.Value,
      isActivity: entity.IsActivity,
      primaryIdAttribute: entity.PrimaryIdAttribute,
      primaryNameAttribute: entity.PrimaryNameAttribute,
    },
  }
}

/**
 * Transform Form to Component
 */
export function transformForm(form: SystemForm): Component {
  const formType = FORM_TYPES[form.type] || `Type ${form.type}`

  return {
    id: form.formid,
    name: form.name,
    type: formType,
    category: 'forms',
    status: form.formactivationstate === 1 ? 'active' : 'inactive',
    lastModified: formatDate(form.modifiedon),
    description: form.description || `${formType} form for ${form.objecttypecode}`,
    solutions: getDefaultSolution(),
    metadata: {
      objectTypeCode: form.objecttypecode,
      formType: form.type,
      isDefault: form.isdefault,
      isCustomizable: form.iscustomizable?.Value,
    },
  }
}

/**
 * Transform SavedQuery (System View) to Component
 */
export function transformSystemView(view: SavedQuery): Component {
  return {
    id: view.savedqueryid,
    name: view.name,
    type: 'System View',
    category: 'views',
    status: view.statecode === 0 ? 'active' : 'inactive',
    lastModified: formatDate(view.modifiedon),
    description: view.description || `System view for ${view.returnedtypecode}`,
    solutions: getDefaultSolution(),
    metadata: {
      returnedTypeCode: view.returnedtypecode,
      queryType: view.querytype,
      isDefault: view.isdefault,
      isCustomizable: view.iscustomizable?.Value,
      viewType: 'system',
    },
  }
}

/**
 * Transform UserQuery (Personal View) to Component
 */
export function transformPersonalView(view: UserQuery): Component {
  return {
    id: view.userqueryid,
    name: view.name,
    type: 'Personal View',
    category: 'views',
    status: view.statecode === 0 ? 'active' : 'inactive',
    lastModified: formatDate(view.modifiedon),
    description: view.description || `Personal view for ${view.returnedtypecode}`,
    solutions: getDefaultSolution(),
    metadata: {
      returnedTypeCode: view.returnedtypecode,
      queryType: view.querytype,
      viewType: 'personal',
    },
  }
}

/**
 * Transform Workflow to Component
 */
export function transformWorkflow(workflow: Workflow): Component {
  const category = WORKFLOW_CATEGORIES[workflow.category] || `Category ${workflow.category}`

  // Determine status
  let status: 'active' | 'inactive' | 'draft' = 'inactive'
  if (workflow.statecode === 1) {
    status = 'active'
  } else if (workflow.statuscode === 1) {
    status = 'draft'
  }

  return {
    id: workflow.workflowid,
    name: workflow.name,
    type: category,
    category: 'workflows',
    status,
    lastModified: formatDate(workflow.modifiedon),
    description: workflow.description || `${category} for ${workflow.primaryentity || 'multiple entities'}`,
    solutions: getDefaultSolution(),
    metadata: {
      workflowType: workflow.type,
      workflowCategory: workflow.category,
      workflowidunique: workflow.workflowidunique,
      solutionid: workflow.solutionid,
      primaryEntity: workflow.primaryentity,
      isManaged: workflow.ismanaged,
      isCustomizable: workflow.iscustomizable?.Value,
      createdOn: workflow.createdon,
    },
  }
}

/**
 * Transform Plugin Assembly to Component
 */
export function transformPluginAssembly(assembly: PluginAssembly): Component {
  return {
    id: assembly.pluginassemblyid,
    name: assembly.name,
    type: 'Plugin Assembly',
    category: 'plugins',
    status: 'active',
    lastModified: formatDate(assembly.modifiedon),
    description: assembly.description || `Plugin assembly: ${assembly.name}`,
    solutions: getDefaultSolution(),
    metadata: {
      version: assembly.version,
      culture: assembly.culture,
      publicKeyToken: assembly.publickeytoken,
      isolationMode: assembly.isolationmode,
      sourceType: assembly.sourcetype,
    },
  }
}

/**
 * Transform Plugin Step to Component
 */
export function transformPluginStep(step: SdkMessageProcessingStep): Component {
  const stage = PLUGIN_STAGES[step.stage] || `Stage ${step.stage}`
  const mode = PLUGIN_MODES[step.mode] || `Mode ${step.mode}`
  const message = step.sdkmessageid?.name || 'Unknown'
  const entity = step.sdkmessagefilterid?.primaryobjecttypecode || 'None'

  return {
    id: step.sdkmessageprocessingstepid,
    name: step.name,
    type: 'Plugin Step',
    category: 'plugins',
    status: step.statecode === 0 ? 'active' : 'inactive',
    lastModified: formatDate(step.modifiedon),
    description: step.description || `${stage} ${mode} step for ${message} on ${entity}`,
    solutions: getDefaultSolution(),
    metadata: {
      stage: step.stage,
      stageName: stage,
      mode: step.mode,
      modeName: mode,
      rank: step.rank,
      message,
      entity,
      pluginType: step.plugintypeid?.typename,
    },
  }
}

/**
 * Transform Web Resource to Component
 */
export function transformWebResource(resource: WebResource): Component {
  const resourceType = WEB_RESOURCE_TYPES[resource.webresourcetype] || `Type ${resource.webresourcetype}`

  return {
    id: resource.webresourceid,
    name: resource.displayname || resource.name,
    type: resourceType,
    category: 'webresources',
    status: 'active',
    lastModified: formatDate(resource.modifiedon),
    description: resource.description || `${resourceType} web resource`,
    solutions: getDefaultSolution(),
    metadata: {
      internalName: resource.name,
      webResourceType: resource.webresourcetype,
      isManaged: resource.ismanaged,
      isCustomizable: resource.iscustomizable?.Value,
    },
  }
}

/**
 * Transform App Module to Component
 */
export function transformApp(app: AppModule): Component {
  return {
    id: app.appmoduleid,
    name: app.name,
    type: 'Model-driven App',
    category: 'apps',
    status: app.statecode === 0 ? 'active' : 'inactive',
    lastModified: formatDate(app.modifiedon),
    description: app.description || `Model-driven app: ${app.name}`,
    solutions: getDefaultSolution(),
    metadata: {
      uniqueName: app.uniquename,
      publisher: app.publisherid?.friendlyname,
      createdOn: app.createdon,
    },
  }
}

/**
 * Transform Canvas App to Component
 */
export function transformCanvasApp(app: CanvasApp): Component {
  const name = String(app.displayname ?? app.name ?? 'Canvas App')
  const statecode = typeof app.statecode === 'number' ? app.statecode : 0

  return {
    id: app.canvasappid,
    name,
    type: 'Canvas App',
    category: 'apps',
    status: statecode === 0 ? 'active' : 'inactive',
    lastModified: formatDate(app.modifiedon),
    description: app.description || `Canvas app: ${name}`,
    solutions: getDefaultSolution(),
    metadata: {
      componentTypeName: 'Canvas App',
      createdOn: app.createdon,
    },
  }
}

/**
 * Get flow type from clientdata or modernflowtype
 * 优先使用clientdata判断（更可靠），modernflowtype作为fallback
 */
export function getFlowType(flow: Workflow): string {
  // Parse clientdata to determine flow type (优先使用，更准确)
  if (flow.clientdata) {
    try {
      const clientData = JSON.parse(flow.clientdata)
      const triggers = clientData?.properties?.definition?.triggers

      if (triggers && typeof triggers === 'object') {
        const triggerKeys = Object.keys(triggers)
        const firstTriggerKey = triggerKeys[0]

        if (firstTriggerKey) {
          const firstTrigger = (triggers as Record<string, any>)[firstTriggerKey]

          if (firstTrigger && typeof firstTrigger === 'object') {
            const triggerType = (firstTrigger as any)?.type?.toLowerCase()
            const triggerKind = (firstTrigger as any)?.kind?.toLowerCase()

            // Recurrence trigger → Scheduled Flow
            if (triggerType === 'recurrence') {
              return 'Scheduled Flow'
            }
            // Request trigger with PowerApp kind → Instant Flow
            else if (triggerType === 'request' && triggerKind?.includes('powerapps')) {
              return 'Instant Flow'
            }
            // Request or Button trigger → Instant Flow
            else if (triggerType === 'request' || triggerKind === 'button') {
              return 'Instant Flow'
            }
            // OpenApiConnectionWebhook → Automated Flow (Dataverse/CDS triggers)
            else if (triggerType === 'openapiconnectionwebhook') {
              return 'Automated Flow'
            }
            // Other Dataverse/Dynamics triggers → Automated Flow
            else if (triggerType?.includes('dataverse') || triggerType?.includes('dynamics')) {
              return 'Automated Flow'
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse flow clientdata:', error)
    }
  }

  // Fallback to modernflowtype if clientdata parsing failed
  if (flow.modernflowtype !== undefined && flow.modernflowtype !== null) {
    return MODERN_FLOW_TYPES[flow.modernflowtype] || 'Cloud Flow'
  }

  return 'Cloud Flow'
}

/**
 * Get owner name from flow
 */
function getOwnerName(flow: Workflow): string {
  // Try owninguser first (most common case)
  if (flow.owninguser?.fullname) return flow.owninguser.fullname

  // Try owningteam if owner is a team
  if (flow.owningteam?.name) return flow.owningteam.name

  // Fallback to createdby
  if (flow.createdby?.fullname) return flow.createdby.fullname

  return 'Unknown'
}

/**
 * Transform Flow (Workflow with category 5) to Component
 */
export function transformFlow(flow: Workflow): Component {
  // Determine status
  let status: 'active' | 'inactive' | 'draft' = 'inactive'
  if (flow.statecode === 1) {
    status = 'active'
  } else if (flow.statuscode === 1) {
    status = 'draft'
  }

  // Get flow type
  const flowType = getFlowType(flow)

  // Get owner name
  const ownerName = getOwnerName(flow)

  // Build description with flow type and owner
  const description = `${flowType} - Owner: ${ownerName}`

  return {
    id: flow.workflowid,
    name: flow.name,
    type: flowType,
    category: 'flows',
    status,
    lastModified: formatDate(flow.modifiedon),
    description,
    solutions: getDefaultSolution(),
    metadata: {
      workflowType: flow.type,
      workflowidunique: flow.workflowidunique,
      solutionid: flow.solutionid,
      primaryEntity: flow.primaryentity,
      isManaged: flow.ismanaged,
      isCustomizable: flow.iscustomizable?.Value,
      createdOn: flow.createdon,
      modernFlowType: flow.modernflowtype,
      owner: ownerName,
      ownerId: flow._ownerid_value,
      owningUserId: flow._owninguser_value,
      owningTeamId: flow._owningteam_value,
    },
  }
}

/**
 * Transform Security Role to Component
 */
export function transformSecurityRole(role: Role): Component {
  return {
    id: role.roleid,
    name: role.name,
    type: role.ismanaged ? 'System Role' : 'Custom Role',
    category: 'securityroles',
    status: 'active',
    lastModified: formatDate(role.modifiedon),
    description: role.description || `Security role: ${role.name}`,
    solutions: getDefaultSolution(),
    metadata: {
      businessUnit: role.businessunitid?.name,
      isManaged: role.ismanaged,
      isCustomizable: role.iscustomizable?.Value,
    },
  }
}

/**
 * Transform any D365 entity to Component based on type
 */
export function transformToComponent(
  data: any,
  type: 'entity' | 'form' | 'systemView' | 'personalView' | 'workflow' | 'pluginAssembly' | 'pluginStep' | 'webResource' | 'app' | 'canvasApp' | 'flow' | 'securityRole'
): Component {
  switch (type) {
    case 'entity':
      return transformEntity(data as EntityDefinition)
    case 'form':
      return transformForm(data as SystemForm)
    case 'systemView':
      return transformSystemView(data as SavedQuery)
    case 'personalView':
      return transformPersonalView(data as UserQuery)
    case 'workflow':
      return transformWorkflow(data as Workflow)
    case 'pluginAssembly':
      return transformPluginAssembly(data as PluginAssembly)
    case 'pluginStep':
      return transformPluginStep(data as SdkMessageProcessingStep)
    case 'webResource':
      return transformWebResource(data as WebResource)
    case 'app':
      return transformApp(data as AppModule)
    case 'canvasApp':
      return transformCanvasApp(data as CanvasApp)
    case 'flow':
      return transformFlow(data as Workflow)
    case 'securityRole':
      return transformSecurityRole(data as Role)
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}
