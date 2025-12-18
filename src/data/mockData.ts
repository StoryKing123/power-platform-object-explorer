// Power Platform 组件模拟数据

export interface Category {
  id: string
  name: string
  icon: string
  count: number
}

export interface Solution {
  id: string
  name: string
  displayName: string
  version: string
  publisher: string
  isManaged: boolean
  installedOn?: string
}

export interface Component {
  id: string
  name: string
  type: string
  category: string
  status: 'active' | 'inactive' | 'draft'
  lastModified: string
  description: string
  solutions?: Solution[]
  metadata?: {
    logicalName?: string
    schemaName?: string
    objectTypeCode?: number | string
    isManaged?: boolean
    isCustomizable?: boolean
    [key: string]: any
  }
}

export interface Stat {
  name: string
  value: string
  change: string | null
  icon: string
}

export interface Activity {
  action: string
  component: string
  time: string
  user: string
}

export const categories: Category[] = [
  { id: 'all', name: 'All Components', icon: 'LayoutGrid', count: 156 },
  { id: 'entities', name: 'Entities', icon: 'Database', count: 42 },
  { id: 'forms', name: 'Forms', icon: 'FileText', count: 28 },
  { id: 'views', name: 'Views', icon: 'Table2', count: 35 },
  { id: 'workflows', name: 'Workflows', icon: 'GitBranch', count: 24 },
  { id: 'plugins', name: 'Plugins', icon: 'Puzzle', count: 18 },
  { id: 'webresources', name: 'Web Resources', icon: 'Globe', count: 9 },
  { id: 'apps', name: 'Apps', icon: 'Package', count: 15 },
  { id: 'flows', name: 'Flows', icon: 'Zap', count: 32 },
  { id: 'securityroles', name: 'Security Roles', icon: 'Shield', count: 12 },
  { id: 'choices', name: 'Choices', icon: 'List', count: 45 },
]

export const components: Component[] = [
  {
    id: '1',
    name: 'Account',
    type: 'Entity',
    category: 'entities',
    status: 'active',
    lastModified: '2024-01-15',
    description: 'Standard account entity for managing customer information',
    solutions: [
      { id: 'sol1', name: 'Default', displayName: 'Default Solution', version: '1.0.0.0', publisher: 'Microsoft', isManaged: false },
      { id: 'sol2', name: 'SalesModule', displayName: 'Sales Module', version: '2.1.0.5', publisher: 'Contoso', isManaged: true, installedOn: '2024-01-10' },
    ]
  },
  {
    id: '2',
    name: 'Contact Main Form',
    type: 'Form',
    category: 'forms',
    status: 'active',
    lastModified: '2024-01-14',
    description: 'Primary form for contact entity with all fields',
    solutions: [
      { id: 'sol1', name: 'Default', displayName: 'Default Solution', version: '1.0.0.0', publisher: 'Microsoft', isManaged: false },
      { id: 'sol3', name: 'ContactCustomizations', displayName: 'Contact Customizations', version: '1.5.2.0', publisher: 'Contoso', isManaged: false },
    ]
  },
  {
    id: '3',
    name: 'Active Contacts View',
    type: 'View',
    category: 'views',
    status: 'active',
    lastModified: '2024-01-13',
    description: 'Shows all active contacts in the system',
    solutions: [
      { id: 'sol1', name: 'Default', displayName: 'Default Solution', version: '1.0.0.0', publisher: 'Microsoft', isManaged: false },
    ]
  },
  {
    id: '4',
    name: 'Lead Qualification',
    type: 'Workflow',
    category: 'workflows',
    status: 'draft',
    lastModified: '2024-01-12',
    description: 'Automated lead qualification business process flow',
    solutions: [
      { id: 'sol2', name: 'SalesModule', displayName: 'Sales Module', version: '2.1.0.5', publisher: 'Contoso', isManaged: true, installedOn: '2024-01-10' },
      { id: 'sol4', name: 'MarketingAutomation', displayName: 'Marketing Automation', version: '3.0.1.2', publisher: 'Fabrikam', isManaged: true, installedOn: '2024-01-05' },
    ]
  },
  {
    id: '5',
    name: 'PreCreate Account',
    type: 'Plugin',
    category: 'plugins',
    status: 'active',
    lastModified: '2024-01-11',
    description: 'Validates account data before creation',
    solutions: [
      { id: 'sol5', name: 'DataValidation', displayName: 'Data Validation Suite', version: '1.2.3.4', publisher: 'Contoso', isManaged: false },
    ]
  },
  {
    id: '6',
    name: 'Opportunity',
    type: 'Entity',
    category: 'entities',
    status: 'active',
    lastModified: '2024-01-10',
    description: 'Track potential sales and business deals',
    solutions: [
      { id: 'sol1', name: 'Default', displayName: 'Default Solution', version: '1.0.0.0', publisher: 'Microsoft', isManaged: false },
      { id: 'sol2', name: 'SalesModule', displayName: 'Sales Module', version: '2.1.0.5', publisher: 'Contoso', isManaged: true, installedOn: '2024-01-10' },
      { id: 'sol6', name: 'CRMEnhancements', displayName: 'CRM Enhancements', version: '2.0.0.1', publisher: 'Fabrikam', isManaged: false },
    ]
  },
  {
    id: '7',
    name: 'Case Quick Form',
    type: 'Form',
    category: 'forms',
    status: 'active',
    lastModified: '2024-01-09',
    description: 'Simplified case creation form for quick entry',
    solutions: [
      { id: 'sol1', name: 'Default', displayName: 'Default Solution', version: '1.0.0.0', publisher: 'Microsoft', isManaged: false },
      { id: 'sol7', name: 'ServiceModule', displayName: 'Service Module', version: '1.8.0.0', publisher: 'Contoso', isManaged: true, installedOn: '2023-12-15' },
    ]
  },
  {
    id: '8',
    name: 'My Open Cases',
    type: 'View',
    category: 'views',
    status: 'active',
    lastModified: '2024-01-08',
    description: 'Personal view for assigned open cases',
    solutions: [
      { id: 'sol7', name: 'ServiceModule', displayName: 'Service Module', version: '1.8.0.0', publisher: 'Contoso', isManaged: true, installedOn: '2023-12-15' },
    ]
  },
  {
    id: '9',
    name: 'Email Notification',
    type: 'Workflow',
    category: 'workflows',
    status: 'active',
    lastModified: '2024-01-07',
    description: 'Send automatic email notifications on record changes',
    solutions: [
      { id: 'sol1', name: 'Default', displayName: 'Default Solution', version: '1.0.0.0', publisher: 'Microsoft', isManaged: false },
      { id: 'sol4', name: 'MarketingAutomation', displayName: 'Marketing Automation', version: '3.0.1.2', publisher: 'Fabrikam', isManaged: true, installedOn: '2024-01-05' },
    ]
  },
  {
    id: '10',
    name: 'PostUpdate Contact',
    type: 'Plugin',
    category: 'plugins',
    status: 'inactive',
    lastModified: '2024-01-06',
    description: 'Synchronize contact data with external system',
    solutions: [
      { id: 'sol8', name: 'IntegrationSuite', displayName: 'Integration Suite', version: '1.0.5.3', publisher: 'Contoso', isManaged: false },
    ]
  },
  {
    id: '11',
    name: 'Product Catalog',
    type: 'Entity',
    category: 'entities',
    status: 'active',
    lastModified: '2024-01-05',
    description: 'Manage product information and pricing',
    solutions: [
      { id: 'sol1', name: 'Default', displayName: 'Default Solution', version: '1.0.0.0', publisher: 'Microsoft', isManaged: false },
    ]
  },
  {
    id: '12',
    name: 'Dashboard Scripts',
    type: 'WebResource',
    category: 'webresources',
    status: 'active',
    lastModified: '2024-01-04',
    description: 'JavaScript files for dashboard functionality',
    solutions: [
      { id: 'sol1', name: 'Default', displayName: 'Default Solution', version: '1.0.0.0', publisher: 'Microsoft', isManaged: false },
      { id: 'sol9', name: 'UICustomizations', displayName: 'UI Customizations', version: '1.3.0.0', publisher: 'Fabrikam', isManaged: false },
    ]
  },
]

export const stats: Stat[] = [
  { name: 'Total Components', value: '156', change: '+12%', icon: 'Package' },
  { name: 'Active Workflows', value: '24', change: '+5%', icon: 'Zap' },
  { name: 'Entities', value: '42', change: '+3%', icon: 'Database' },
  { name: 'Last Updated', value: 'Today', change: null, icon: 'Clock' },
]

export const recentActivity: Activity[] = [
  { action: 'Modified', component: 'Account Entity', time: '2 mins ago', user: 'John D.' },
  { action: 'Created', component: 'New Lead Form', time: '15 mins ago', user: 'Sarah K.' },
  { action: 'Deployed', component: 'Email Plugin', time: '1 hour ago', user: 'Mike R.' },
  { action: 'Updated', component: 'Sales Pipeline View', time: '3 hours ago', user: 'Lisa M.' },
  { action: 'Deleted', component: 'Old Test Workflow', time: '5 hours ago', user: 'Tom B.' },
]
