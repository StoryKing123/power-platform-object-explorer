// D365 Web API Type Definitions

// OData Response Wrapper
export interface ODataResponse<T> {
  '@odata.context'?: string
  '@odata.count'?: number
  '@odata.nextLink'?: string
  value: T[]
}

// Localized Label
export interface LocalizedLabel {
  Label: string
  LanguageCode: number
}

export interface Label {
  LocalizedLabels: LocalizedLabel[]
  UserLocalizedLabel?: LocalizedLabel
}

// Entity Definition
export interface EntityDefinition {
  MetadataId: string
  LogicalName: string
  SchemaName: string
  DisplayName?: Label
  Description?: Label
  ObjectTypeCode: number
  IsCustomEntity: boolean
  IsManaged: boolean
  IsActivity: boolean
  IsValidForAdvancedFind: boolean
  PrimaryIdAttribute: string
  PrimaryNameAttribute: string
  ModifiedOn?: string
  IsCustomizable?: BooleanManagedProperty
}

// System Form
export interface SystemForm {
  formid: string
  name: string
  type: number
  objecttypecode: string
  description?: string
  formactivationstate: number
  isdefault: boolean
  iscustomizable?: BooleanManagedProperty
  modifiedon?: string
}

// Saved Query (System View)
export interface SavedQuery {
  savedqueryid: string
  name: string
  returnedtypecode: string
  description?: string
  querytype: number
  isdefault: boolean
  statecode: number
  statuscode: number
  iscustomizable?: BooleanManagedProperty
  modifiedon?: string
}

// User Query (Personal View)
export interface UserQuery {
  userqueryid: string
  name: string
  returnedtypecode: string
  description?: string
  querytype: number
  statecode: number
  statuscode: number
  modifiedon?: string
}

// Workflow
export interface Workflow {
  workflowid: string
  workflowidunique?: string
  solutionid?: string
  name: string
  type: number
  category: number
  primaryentity?: string
  description?: string
  statecode: number
  statuscode: number
  ismanaged: boolean
  iscustomizable?: BooleanManagedProperty
  createdon?: string
  modifiedon?: string
  modernflowtype?: number
  clientdata?: string
  _ownerid_value?: string
  _owninguser_value?: string
  _owningteam_value?: string
  _createdby_value?: string
  owninguser?: {
    fullname?: string
    systemuserid?: string
  }
  owningteam?: {
    name?: string
    teamid?: string
  }
  createdby?: {
    fullname?: string
    systemuserid?: string
  }
}

// Plugin Assembly
export interface PluginAssembly {
  pluginassemblyid: string
  name: string
  version?: string
  culture?: string
  publickeytoken?: string
  description?: string
  isolationmode: number
  sourcetype: number
  modifiedon?: string
}

// SDK Message Processing Step
export interface SdkMessageProcessingStep {
  sdkmessageprocessingstepid: string
  name: string
  stage: number
  mode: number
  rank: number
  description?: string
  statecode: number
  statuscode: number
  modifiedon?: string
  plugintypeid?: {
    typename: string
  }
  sdkmessageid?: {
    name: string
  }
  sdkmessagefilterid?: {
    primaryobjecttypecode: string
  }
}

// Web Resource
export interface WebResource {
  webresourceid: string
  name: string
  displayname?: string
  webresourcetype: number
  description?: string
  iscustomizable?: BooleanManagedProperty
  ismanaged: boolean
  modifiedon?: string
}

// App Module (Model-driven App)
export interface AppModule {
  appmoduleid: string
  name: string
  uniquename?: string
  description?: string
  statecode: number
  statuscode: number
  publisherid?: {
    friendlyname: string
  }
  modifiedon?: string
  createdon?: string
}

// Canvas App (Power Apps)
export interface CanvasApp {
  canvasappid: string
  name?: string
  displayname?: string
  description?: string
  statecode?: number
  statuscode?: number
  createdon?: string
  modifiedon?: string
  [key: string]: any
}

// Security Role
export interface Role {
  roleid: string
  name: string
  businessunitid?: {
    name: string
  }
  description?: string
  ismanaged: boolean
  iscustomizable?: BooleanManagedProperty
  modifiedon?: string
}

// Boolean Managed Property
export interface BooleanManagedProperty {
  Value: boolean
  CanBeChanged: boolean
  ManagedPropertyLogicalName: string
}

// OData Query Parameters
export interface ODataParams {
  $select?: string
  $filter?: string
  $orderby?: string
  $top?: number
  $skip?: number
  $expand?: string
  $count?: boolean
}

// API Error Response
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    innererror?: {
      message: string
      type: string
      stacktrace: string
    }
  }
}

// Solution
export interface Solution {
  solutionid: string
  uniquename: string
  friendlyname: string
  version: string
  publisherid?: {
    friendlyname: string
  }
  ismanaged: boolean
  installedon?: string
  description?: string
}

// Solution Component
export interface SolutionComponent {
  solutioncomponentid: string
  objectid: string
  componenttype: number
  solutionid?: {
    solutionid: string
    uniquename: string
    friendlyname: string
    version: string
    ismanaged: boolean
    installedon?: string
    publisherid?: {
      friendlyname: string
    }
  }
}

// Solution Component Summary (for search)
export interface SolutionComponentSummary {
  msdyn_solutioncomponentsummaryid: string | null
  msdyn_componenttype: number
  msdyn_componenttypename: string
  msdyn_name: string
  msdyn_displayname: string
  msdyn_description: string
  msdyn_objectid: string
  msdyn_objecttypecode: number
  msdyn_schemaname: string
  msdyn_primaryidattribute: string
  msdyn_iscustom: boolean
  msdyn_ismanaged: boolean
  msdyn_solutionid: string
}

// Organization
export interface Organization {
  organizationid: string
  name: string
  uniquename: string
  friendlyname?: string
  organizationversion?: string
}

// Custom Error Type
export interface ApiError {
  type: 'network' | 'auth' | 'server' | 'validation' | 'notfound'
  message: string
  details?: any
  statusCode?: number
  retryable: boolean
}
