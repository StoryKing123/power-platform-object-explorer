import { Search, Loader2, X, RefreshCw, Moon, Sun, Command as CommandIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface AppHeaderProps {
  currentCategoryName: string
  totalCount: number | undefined
  searchQuery: string
  loading: boolean
  darkMode: boolean
  onSearchChange: (value: string) => void
  onSearchClear: () => void
  onCommandOpen: () => void
  onRefresh: () => void
  onThemeToggle: () => void
}

/**
 * 应用头部组件
 * 包含搜索栏、操作按钮等
 */
export const AppHeader = ({
  currentCategoryName,
  totalCount,
  searchQuery,
  loading,
  darkMode,
  onSearchChange,
  onSearchClear,
  onCommandOpen,
  onRefresh,
  onThemeToggle
}: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 h-[88px] shrink-0 border-b border-border/50 bg-background/55 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4">
        <SidebarTrigger className="h-9 w-9 rounded-lg border border-border/50 bg-card/40 hover:bg-card/60" />

        <div className="hidden min-w-0 md:block">
          <div className="truncate text-sm font-semibold tracking-tight">
            {currentCategoryName}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {totalCount !== undefined ? `${totalCount} items` : '—'} • Press ⌘K for commands
          </div>
        </div>

        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </div>
            <Input
              id="global-search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`Search in ${currentCategoryName}...`}
              className="h-11 bg-card/40 pl-10 pr-24 backdrop-blur-md border-border/50 focus-visible:ring-primary/30"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-12 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg"
                onClick={onSearchClear}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-2 md:flex">
              <kbd className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg"
            onClick={onCommandOpen}
            title="Command palette (⌘K)"
          >
            <CommandIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg"
            onClick={onRefresh}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg"
            onClick={onThemeToggle}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
