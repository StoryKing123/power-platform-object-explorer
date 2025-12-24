// D365 Web API Configuration

export const D365_API_CONFIG = {
  // Base URL for D365 Web API
  baseUrl: '/api/data/v9.2/',

  // API Version
  apiVersion: 'v9.2',

  // Request timeout in milliseconds
  timeout: 30000,

  // Retry configuration
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
  },

  // Pagination settings
  pagination: {
    defaultPageSize: 50,
    maxPageSize: 100,
  },

  // Cache TTL settings (in milliseconds)
  cache: {
    componentList: 5 * 60 * 1000,    // 5 minutes
    componentDetail: 10 * 60 * 1000,  // 10 minutes
    categoryCount: 15 * 60 * 1000,    // 15 minutes
  },

  // Endpoints
  endpoints: {
    entities: 'EntityDefinitions',
    forms: 'systemforms',
    systemViews: 'savedqueries',
    personalViews: 'userqueries',
    workflows: 'workflows',
    pluginAssemblies: 'pluginassemblies',
    pluginSteps: 'sdkmessageprocessingsteps',
    webResources: 'webresourceset',
    canvasApps: 'canvasapps',
    solutions: 'solutions',
    solutionComponents: 'solutioncomponents',
    solutionComponentSummaries: 'msdyn_solutioncomponentsummaries',
    solutionComponentCountSummaries: 'msdyn_solutioncomponentcountsummaries',
    organizations: 'organizations',
  },

  // Default OData query parameters for each entity type
  queries: {
    entities: {
      // Note: EntityDefinitions is a metadata endpoint and doesn't support $filter or $orderby
      // We'll filter and sort client-side after fetching
      $select: 'MetadataId,LogicalName,DisplayName,SchemaName,ObjectTypeCode,IsCustomEntity,IsManaged,IsActivity,PrimaryIdAttribute,PrimaryNameAttribute,ModifiedOn,Description,IsValidForAdvancedFind,IsCustomizable',
    },
    forms: {
      $select: 'formid,name,type,objecttypecode,description,formactivationstate,isdefault,iscustomizable',
      $filter: 'formactivationstate eq 1',
      $orderby: 'name',
    },
    systemViews: {
      $select: 'savedqueryid,name,returnedtypecode,description,querytype,isdefault,iscustomizable,statecode,statuscode,modifiedon',
      $filter: 'statecode eq 0',
      $orderby: 'name',
    },
    personalViews: {
      $select: 'userqueryid,name,returnedtypecode,description,querytype,statecode,statuscode,modifiedon',
      $filter: 'statecode eq 0',
      $orderby: 'name',
    },
    workflows: {
      $select: 'workflowid,workflowidunique,solutionid,name,type,category,primaryentity,description,statecode,statuscode,ismanaged,iscustomizable,createdon,modifiedon',
      $filter: 'statecode eq 1',
      $orderby: 'name',
    },
    pluginAssemblies: {
      $select: 'pluginassemblyid,name,version,culture,publickeytoken,description,isolationmode,sourcetype,modifiedon',
      $orderby: 'name',
    },
    pluginSteps: {
      $select: 'sdkmessageprocessingstepid,name,stage,mode,rank,description,statecode,statuscode,modifiedon',
      $expand: 'plugintypeid($select=typename),sdkmessageid($select=name),sdkmessagefilterid($select=primaryobjecttypecode)',
      $filter: 'statecode eq 0',
      $orderby: 'rank',
    },
    webResources: {
      $select: 'webresourceid,name,displayname,webresourcetype,description,iscustomizable,ismanaged,modifiedon',
      $orderby: 'name',
    },
    solutions: {
      $select: 'solutionid,uniquename,friendlyname,version,ismanaged,installedon,description',
      $expand: 'publisherid($select=friendlyname)',
      $orderby: 'friendlyname',
    },
    solutionComponents: {
      $select: 'solutioncomponentid,objectid,componenttype',
      $expand: 'solutionid($select=solutionid,uniquename,friendlyname,version,ismanaged,installedon;$expand=publisherid($select=friendlyname))',
    },
    solutionComponentSearch: {
      $select: 'msdyn_name,msdyn_displayname,msdyn_description,msdyn_componenttype,msdyn_componenttypename,msdyn_objectid,msdyn_objecttypecode,msdyn_schemaname,msdyn_iscustom,msdyn_ismanaged',
      $orderby: 'msdyn_displayname asc',
    },
    defaultSolution: {
      $filter: "uniquename eq 'Default'",
      $select: 'solutionid,friendlyname,uniquename',
    },
  },
}

// Component type codes for solution components
export const COMPONENT_TYPE_CODES: Record<string, number> = {
  entity: 1,
  attribute: 2,
  relationship: 10,
  form: 60,
  view: 26,
  workflow: 29,
  pluginAssembly: 91,
  pluginStep: 92,
  webResource: 61,
  app: 80,
  canvasApp: 300,
  securityRole: 20,
}

// Category to component type mapping for search (supports multiple types per category)
export const CATEGORY_COMPONENT_TYPES: Record<string, number[]> = {
  entities: [1],
  forms: [24, 60],  // Both Form and System Form
  views: [26],
  workflows: [29],
  flows: [29],  // Modern flows (workflows with category 5)
  plugins: [91],
  webResources: [61],
  apps: [300],
  securityRoles: [20],
}

// Form type mappings
export const FORM_TYPES: Record<number, string> = {
  2: 'Main',
  5: 'Mobile',
  6: 'Quick View',
  7: 'Quick Create',
  11: 'Card',
  12: 'Main Interactive',
}

// Workflow category mappings
export const WORKFLOW_CATEGORIES: Record<number, string> = {
  0: 'Workflow',
  1: 'Dialog',
  2: 'Business Rule',
  3: 'Action',
  4: 'Business Process Flow',
  5: 'Modern Flow',
}

// Web resource type mappings
export const WEB_RESOURCE_TYPES: Record<number, string> = {
  1: 'HTML',
  2: 'CSS',
  3: 'JavaScript',
  4: 'XML',
  5: 'PNG',
  6: 'JPG',
  7: 'GIF',
  8: 'XAP',
  9: 'XSL',
  10: 'ICO',
  11: 'SVG',
  12: 'RESX',
}

// Plugin stage mappings
export const PLUGIN_STAGES: Record<number, string> = {
  10: 'Pre-validation',
  20: 'Pre-operation',
  40: 'Post-operation',
}

// Plugin mode mappings
export const PLUGIN_MODES: Record<number, string> = {
  0: 'Synchronous',
  1: 'Asynchronous',
}

// Modern Flow type mappings (category 5 workflows)
export const MODERN_FLOW_TYPES: Record<number, string> = {
  0: 'Instant Flow',       // Manual trigger (including Power Apps)
  1: 'Automated Flow',     // Automated trigger (Dataverse events)
  2: 'Scheduled Flow',     // Scheduled trigger
  3: 'Desktop Flow',       // Desktop flow
}
