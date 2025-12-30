/**
 * 格式化安装时间
 */
export const formatInstalledOn = (installedOn?: string): string | null => {
  if (!installedOn) return null
  if (!/[T:]/.test(installedOn)) return installedOn
  const date = new Date(installedOn)
  if (!Number.isFinite(date.getTime())) return installedOn
  return date.toISOString().replace('T', ' ').slice(0, 16) + 'Z'
}
