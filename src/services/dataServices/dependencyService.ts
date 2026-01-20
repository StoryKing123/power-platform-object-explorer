// Dependency Service - 获取组件依赖关系数据

/**
 * 依赖关系类型枚举
 */
export type DependencyRelationType =
  | 'Entity Reference'      // 表单/视图引用实体
  | 'Workflow Trigger'      // 工作流由实体触发
  | 'Plugin Registration'   // 插件注册到实体/消息
  | 'Flow Connection'       // 流使用连接引用
  | 'Environment Variable'  // 组件使用环境变量
  | 'Web Resource'          // 表单/应用使用Web资源
  | 'Choice Usage'          // 实体字段使用选择集
  | 'Form Reference'        // 应用使用表单
  | 'View Reference'        // 应用使用视图
  | 'Data Source'           // 组件访问实体数据
  | 'Custom Connector'      // 流使用自定义连接器
  | 'Security Role'         // 实体由安全角色保护
  | 'Solution Component'    // 通用组件依赖

/**
 * 组件依赖关系接口
 */
export interface ComponentDependency {
  // 标识信息
  id: string
  name: string
  displayName: string

  // 组件详情
  type: string
  category: string
  status: 'active' | 'inactive' | 'draft'

  // 依赖元数据
  dependencyType: 'Required' | 'Dependent' // Required = 此组件需要它, Dependent = 它需要此组件
  relationshipReason: string // 人类可读的解释
  relationshipType: DependencyRelationType

  // 附加上下文
  lastModified?: string
  isManaged?: boolean
  solutions?: string[] // 包含该依赖的解决方案名称
}

/**
 * 依赖响应结构
 */
export interface DependencyData {
  required: ComponentDependency[]    // 此组件依赖的组件
  dependent: ComponentDependency[]   // 依赖此组件的组件
}

/**
 * 生成实体的依赖关系
 */
function generateEntityDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [], // 实体是基础，不依赖其他组件
    dependent: [
      {
        id: `form-${componentId}-1`,
        name: 'account_main_form',
        displayName: `${componentName} Main Form`,
        type: 'Main Form',
        category: 'forms',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'This form is built on the entity',
        relationshipType: 'Entity Reference',
        lastModified: '2025-01-15T10:30:00Z',
        isManaged: false,
        solutions: ['CoreSolution']
      },
      {
        id: `view-${componentId}-1`,
        name: 'account_active_view',
        displayName: `Active ${componentName}s`,
        type: 'Public View',
        category: 'views',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'This view queries data from the entity',
        relationshipType: 'Data Source',
        lastModified: '2025-01-14T09:15:00Z',
        isManaged: false,
        solutions: ['CoreSolution']
      },
      {
        id: `workflow-${componentId}-1`,
        name: 'account_approval_workflow',
        displayName: `${componentName} Approval Process`,
        type: 'Workflow',
        category: 'workflows',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Triggered when entity record is created or updated',
        relationshipType: 'Workflow Trigger',
        lastModified: '2025-01-13T14:20:00Z',
        isManaged: false,
        solutions: ['BusinessProcessSolution']
      },
      {
        id: `plugin-${componentId}-1`,
        name: 'account_validation_plugin',
        displayName: `${componentName} Validation Plugin`,
        type: 'Plugin Step',
        category: 'plugins',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Registered on entity Create and Update messages',
        relationshipType: 'Plugin Registration',
        lastModified: '2025-01-12T11:45:00Z',
        isManaged: true,
        solutions: ['PluginFramework']
      }
    ]
  }
}

/**
 * 生成表单的依赖关系
 */
function generateFormDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [
      {
        id: `entity-${componentId}-parent`,
        name: 'account',
        displayName: 'Account',
        type: 'Entity',
        category: 'entities',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'This form is built on the Account entity',
        relationshipType: 'Entity Reference',
        lastModified: '2024-12-20T08:00:00Z',
        isManaged: true,
        solutions: ['SystemSolution']
      },
      {
        id: `webresource-${componentId}-1`,
        name: 'form_validation_script',
        displayName: 'Form Validation Script',
        type: 'JavaScript',
        category: 'webresources',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'JavaScript library for form validation logic',
        relationshipType: 'Web Resource',
        lastModified: '2025-01-10T16:30:00Z',
        isManaged: false,
        solutions: ['WebResourceLibrary']
      },
      {
        id: `choice-${componentId}-1`,
        name: 'account_category',
        displayName: 'Account Category',
        type: 'Choice',
        category: 'choices',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'Used in category field dropdown',
        relationshipType: 'Choice Usage',
        lastModified: '2024-11-15T12:00:00Z',
        isManaged: false,
        solutions: ['DataModelSolution']
      }
    ],
    dependent: [
      {
        id: `app-${componentId}-1`,
        name: 'sales_hub_app',
        displayName: 'Sales Hub',
        type: 'Model-driven App',
        category: 'apps',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Includes this form in the app sitemap',
        relationshipType: 'Form Reference',
        lastModified: '2025-01-18T13:45:00Z',
        isManaged: false,
        solutions: ['SalesAppSolution']
      }
    ]
  }
}

/**
 * 生成视图的依赖关系
 */
function generateViewDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [
      {
        id: `entity-${componentId}-parent`,
        name: 'contact',
        displayName: 'Contact',
        type: 'Entity',
        category: 'entities',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'This view queries data from the Contact entity',
        relationshipType: 'Entity Reference',
        lastModified: '2024-12-20T08:00:00Z',
        isManaged: true,
        solutions: ['SystemSolution']
      }
    ],
    dependent: [
      {
        id: `app-${componentId}-1`,
        name: 'customer_service_app',
        displayName: 'Customer Service Hub',
        type: 'Model-driven App',
        category: 'apps',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Uses this view in the app navigation',
        relationshipType: 'View Reference',
        lastModified: '2025-01-17T10:20:00Z',
        isManaged: false,
        solutions: ['ServiceAppSolution']
      }
    ]
  }
}

/**
 * 生成工作流/流的依赖关系
 */
function generateFlowDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [
      {
        id: `entity-${componentId}-trigger`,
        name: 'opportunity',
        displayName: 'Opportunity',
        type: 'Entity',
        category: 'entities',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'Flow is triggered when opportunity records change',
        relationshipType: 'Workflow Trigger',
        lastModified: '2024-12-20T08:00:00Z',
        isManaged: true,
        solutions: ['SystemSolution']
      },
      {
        id: `connection-${componentId}-1`,
        name: 'shared_office365',
        displayName: 'Office 365 Outlook Connection',
        type: 'Connection Reference',
        category: 'connectionreferences',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'Used to send email notifications',
        relationshipType: 'Flow Connection',
        lastModified: '2025-01-05T14:00:00Z',
        isManaged: false,
        solutions: ['ConnectorsSolution']
      },
      {
        id: `envvar-${componentId}-1`,
        name: 'approval_email_template',
        displayName: 'Approval Email Template URL',
        type: 'Environment Variable',
        category: 'environmentvariables',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'Configures the email template location',
        relationshipType: 'Environment Variable',
        lastModified: '2025-01-08T09:30:00Z',
        isManaged: false,
        solutions: ['ConfigurationSolution']
      }
    ],
    dependent: []
  }
}

/**
 * 生成插件的依赖关系
 */
function generatePluginDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [
      {
        id: `entity-${componentId}-target`,
        name: 'lead',
        displayName: 'Lead',
        type: 'Entity',
        category: 'entities',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'Plugin is registered on Lead entity messages',
        relationshipType: 'Plugin Registration',
        lastModified: '2024-12-20T08:00:00Z',
        isManaged: true,
        solutions: ['SystemSolution']
      }
    ],
    dependent: []
  }
}

/**
 * 生成应用的依赖关系
 */
function generateAppDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [
      {
        id: `entity-${componentId}-1`,
        name: 'account',
        displayName: 'Account',
        type: 'Entity',
        category: 'entities',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'App includes Account entity in sitemap',
        relationshipType: 'Data Source',
        lastModified: '2024-12-20T08:00:00Z',
        isManaged: true,
        solutions: ['SystemSolution']
      },
      {
        id: `form-${componentId}-1`,
        name: 'account_main_form',
        displayName: 'Account Main Form',
        type: 'Main Form',
        category: 'forms',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'Default form for account records in the app',
        relationshipType: 'Form Reference',
        lastModified: '2025-01-15T10:30:00Z',
        isManaged: false,
        solutions: ['CoreSolution']
      },
      {
        id: `view-${componentId}-1`,
        name: 'account_active_view',
        displayName: 'Active Accounts',
        type: 'Public View',
        category: 'views',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'Default view for account list in the app',
        relationshipType: 'View Reference',
        lastModified: '2025-01-14T09:15:00Z',
        isManaged: false,
        solutions: ['CoreSolution']
      },
      {
        id: `securityrole-${componentId}-1`,
        name: 'sales_manager_role',
        displayName: 'Sales Manager',
        type: 'Security Role',
        category: 'securityroles',
        status: 'active',
        dependencyType: 'Required',
        relationshipReason: 'Required security role for app access',
        relationshipType: 'Security Role',
        lastModified: '2024-10-01T08:00:00Z',
        isManaged: false,
        solutions: ['SecuritySolution']
      }
    ],
    dependent: []
  }
}

/**
 * 生成选择集的依赖关系
 */
function generateChoiceDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [],
    dependent: [
      {
        id: `entity-${componentId}-1`,
        name: 'account',
        displayName: 'Account',
        type: 'Entity',
        category: 'entities',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Uses this choice in account category field',
        relationshipType: 'Choice Usage',
        lastModified: '2024-12-20T08:00:00Z',
        isManaged: true,
        solutions: ['SystemSolution']
      },
      {
        id: `form-${componentId}-1`,
        name: 'account_main_form',
        displayName: 'Account Main Form',
        type: 'Main Form',
        category: 'forms',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Displays this choice in form field',
        relationshipType: 'Choice Usage',
        lastModified: '2025-01-15T10:30:00Z',
        isManaged: false,
        solutions: ['CoreSolution']
      }
    ]
  }
}

/**
 * 生成连接引用的依赖关系
 */
function generateConnectionReferenceDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [],
    dependent: [
      {
        id: `flow-${componentId}-1`,
        name: 'email_notification_flow',
        displayName: 'Email Notification Flow',
        type: 'Cloud Flow',
        category: 'flows',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Uses this connection to send emails',
        relationshipType: 'Flow Connection',
        lastModified: '2025-01-16T11:00:00Z',
        isManaged: false,
        solutions: ['AutomationSolution']
      },
      {
        id: `flow-${componentId}-2`,
        name: 'calendar_sync_flow',
        displayName: 'Calendar Synchronization',
        type: 'Cloud Flow',
        category: 'flows',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Uses this connection to sync calendar events',
        relationshipType: 'Flow Connection',
        lastModified: '2025-01-14T15:30:00Z',
        isManaged: false,
        solutions: ['IntegrationSolution']
      }
    ]
  }
}

/**
 * 生成环境变量的依赖关系
 */
function generateEnvironmentVariableDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [],
    dependent: [
      {
        id: `flow-${componentId}-1`,
        name: 'data_import_flow',
        displayName: 'Data Import Flow',
        type: 'Cloud Flow',
        category: 'flows',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'References this variable for configuration',
        relationshipType: 'Environment Variable',
        lastModified: '2025-01-19T08:45:00Z',
        isManaged: false,
        solutions: ['DataMigrationSolution']
      },
      {
        id: `plugin-${componentId}-1`,
        name: 'integration_plugin',
        displayName: 'External Integration Plugin',
        type: 'Plugin Step',
        category: 'plugins',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Uses this variable for API endpoint configuration',
        relationshipType: 'Environment Variable',
        lastModified: '2025-01-17T14:00:00Z',
        isManaged: false,
        solutions: ['IntegrationFramework']
      }
    ]
  }
}

/**
 * 生成Web资源的依赖关系
 */
function generateWebResourceDependencies(componentId: string, componentName: string): DependencyData {
  return {
    required: [],
    dependent: [
      {
        id: `form-${componentId}-1`,
        name: 'account_main_form',
        displayName: 'Account Main Form',
        type: 'Main Form',
        category: 'forms',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'Form uses this script for custom logic',
        relationshipType: 'Web Resource',
        lastModified: '2025-01-15T10:30:00Z',
        isManaged: false,
        solutions: ['CoreSolution']
      },
      {
        id: `app-${componentId}-1`,
        name: 'custom_portal_app',
        displayName: 'Custom Portal',
        type: 'Canvas App',
        category: 'apps',
        status: 'active',
        dependencyType: 'Dependent',
        relationshipReason: 'App references this resource for styling',
        relationshipType: 'Web Resource',
        lastModified: '2025-01-12T09:00:00Z',
        isManaged: false,
        solutions: ['PortalSolution']
      }
    ]
  }
}

/**
 * 为默认/未知组件类型生成通用依赖关系
 */
function generateDefaultDependencies(): DependencyData {
  return {
    required: [],
    dependent: []
  }
}

/**
 * 根据组件类型生成真实的模拟依赖数据
 * @param componentId - 组件ID
 * @param componentCategory - 组件类别
 * @param componentName - 组件名称
 */
function generateMockDependencies(
  componentId: string,
  componentCategory: string,
  componentName: string
): DependencyData {
  switch (componentCategory) {
    case 'entities':
      return generateEntityDependencies(componentId, componentName)
    case 'forms':
      return generateFormDependencies(componentId, componentName)
    case 'views':
      return generateViewDependencies(componentId, componentName)
    case 'workflows':
    case 'flows':
      return generateFlowDependencies(componentId, componentName)
    case 'plugins':
      return generatePluginDependencies(componentId, componentName)
    case 'apps':
      return generateAppDependencies(componentId, componentName)
    case 'choices':
      return generateChoiceDependencies(componentId, componentName)
    case 'connectionreferences':
      return generateConnectionReferenceDependencies(componentId, componentName)
    case 'environmentvariables':
      return generateEnvironmentVariableDependencies(componentId, componentName)
    case 'webresources':
      return generateWebResourceDependencies(componentId, componentName)
    default:
      return generateDefaultDependencies()
  }
}

/**
 * 获取组件依赖关系（模拟实现）
 * @param componentId - 组件唯一标识符
 * @param componentCategory - 组件类别（entities, forms, flows等）
 * @param componentName - 组件名称（可选，用于生成更真实的数据）
 * @returns Promise，包含required和dependent组件
 */
export async function fetchComponentDependencies(
  componentId: string,
  componentCategory: string,
  componentName: string = 'Component'
): Promise<DependencyData> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 600))

  // 生成基于组件类型的模拟数据
  const dependencies = generateMockDependencies(componentId, componentCategory, componentName)

  return dependencies
}
