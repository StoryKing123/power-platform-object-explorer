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
  msdyn_componentlogicalname: string
  msdyn_name: string
  msdyn_displayname: string
  msdyn_description: string
  msdyn_objectid: string
  msdyn_objecttypecode: number
  msdyn_schemaname: string | null
  msdyn_uniquename: string | null
  msdyn_primaryidattribute?: string
  msdyn_primaryentityname: string | null
  msdyn_iscustom: boolean | null
  msdyn_iscustomname: string | null
  msdyn_ismanaged: boolean
  msdyn_ismanagedname: string
  msdyn_iscustomizable: boolean
  msdyn_iscustomizablename: string
  msdyn_solutionid: string
  msdyn_status: string | number
  msdyn_statusname: string
  msdyn_standardstatus: string | number | null
  msdyn_modifiedon: string | null
  msdyn_createdon: string | null
  msdyn_owner: string | null
  msdyn_owningbusinessunit: string | null
  msdyn_typename: string | null
  msdyn_subtype: number | string | null
  msdyn_canvasappuniqueid: string | null
  msdyn_total: number
  msdyn_workflowcategory: number | null
  msdyn_workflowcategoryname: string | null
  msdyn_workflowidunique: string | null
  msdyn_executionorder: number | null
  msdyn_executionstage: number | null
  msdyn_isolationmode: number | null
  msdyn_sdkmessagename: string | null
  msdyn_connectorinternalid: string | null
  organizationid: string | null
  msdyn_isappaware: boolean | null
  msdyn_isappawarename: string | null
  msdyn_synctoexternalsearchindex: boolean | null
  msdyn_logicalcollectionname: string | null
  msdyn_deployment: number | null
  msdyn_eventhandler: string | null
  msdyn_fieldsecurity: number | null
  msdyn_isdefault: boolean | null
  msdyn_isdefaultname: string | null
  msdyn_publickeytoken: string | null
  msdyn_lcid: number | null
  msdyn_isauditenabled: boolean | null
  msdyn_isauditenabledname: string | null
  msdyn_istableenabled: boolean | null
  msdyn_fieldtype: string | null
  msdyn_relatedentity: string | null
  msdyn_version: string | null
  msdyn_relatedentityattribute: string | null
  msdyn_culture: string | null
  msdyn_hasactivecustomization: boolean
}

// Solution Component Count Summary (for category counts)
export interface SolutionComponentCountSummary {
  msdyn_componentlogicalname: string
  msdyn_componenttype: number
  msdyn_total: number
  msdyn_subtype?: number | null
  msdyn_workflowcategory?: number | null
}

// Organization
export interface Organization {
  organizationid: string
  name: string
  uniquename: string
  friendlyname?: string
  organizationversion?: string
}

// System User
export interface SystemUser {
  systemuserid: string
  fullname?: string
  internalemailaddress?: string
}

// Power Platform Connection (used by Connection References)
export interface PowerPlatformConnection {
  connectionid: string
  name?: string
  displayname?: string
  connectionname?: string
  _owninguser_value?: string
  _createdby_value?: string
  owninguser?: SystemUser
  createdby?: SystemUser
}

// Connection Reference
export interface ConnectionReference {
  connectionreferenceid: string
  connectionreferencedisplayname?: string
  connectionreferencelogicalname?: string
  connectionid?: string
  connectorid?: string
  _owninguser_value?: string
  _ownerid_value?: string
  _createdby_value?: string
}

export interface ConnectionReferenceBindingInfo {
  connectionId?: string
  connectionName?: string
  ownerName?: string
  ownerEmail?: string
}

// Custom Error Type
export interface ApiError {
  type: 'network' | 'auth' | 'server' | 'validation' | 'notfound'
  message: string
  details?: any
  statusCode?: number
  retryable: boolean
}

// Global OptionSet (Choice) Definition
export interface GlobalOptionSetDefinition {
  MetadataId: string
  Name: string
  DisplayName?: Label
  Description?: Label
  IsGlobal: boolean
  IsManaged: boolean
  IsCustomOptionSet: boolean
  OptionSetType?: string
  Options?: OptionMetadata[]
}

// Option Metadata
export interface OptionMetadata {
  Value: number
  Label?: Label
  Description?: Label
  Color?: string
  IsManaged?: boolean
  ExternalValue?: string
}

// Simplified Option for UI display
export interface ChoiceOption {
  value: number
  label: string
  description?: string
}

// Environment Variable Definition
export interface EnvironmentVariableDefinition {
  environmentvariabledefinitionid: string
  schemaname: string
  displayname?: string
  description?: string
  defaultvalue?: string
  type: number // 100000000=String, 100000001=Number, 100000002=Boolean, 100000003=JSON, 100000004=DataSource, 100000005=Secret
  isrequired?: boolean
  statecode?: number
  statuscode?: number
  modifiedon?: string
}

// Environment Variable Value
export interface EnvironmentVariableValue {
  environmentvariablevalueid: string
  value: string
  environmentvariabledefinitionid: string
}

// Environment Variable Info for UI (combines definition and value)
export interface EnvironmentVariableInfo {
  defaultValue?: string
  currentValue?: string
  type: number
  typeName: string
}
