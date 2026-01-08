// Web Resource Helper Functions

/**
 * 构建 Web Resource 的访问 URL
 * 在 D365 中，Web Resource 可以通过 /WebResources/{name} 访问
 *
 * @param name - Web Resource 的 name 字段 (例如: "new_/scripts/myfile.js")
 * @returns 相对 URL 路径
 */
export function buildWebResourceUrl(name: string): string {
  // Web Resource 的 URL 格式是 /WebResources/{name}
  // name 字段中的 / 会被自动处理，不需要额外编码
  return `/WebResources/${name}`
}

/**
 * 构建 Web Resource 的完整绝对 URL
 *
 * @param name - Web Resource 的 name 字段
 * @returns 完整的绝对 URL (基于当前浏览器的 origin)
 */
export function buildWebResourceAbsoluteUrl(name: string): string {
  const origin = window.location.origin
  const relativePath = buildWebResourceUrl(name)
  return `${origin}${relativePath}`
}

/**
 * 判断组件是否为 Web Resource 类型
 *
 * @param component - 组件对象
 * @returns 是否为 Web Resource
 */
export function isWebResource(component: { category?: string; type?: string }): boolean {
  return component.category === 'webresources' || component.type === 'Web Resource'
}
