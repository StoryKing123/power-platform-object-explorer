import { useState, useEffect, useMemo } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { type Component } from '@/data/mockData'
import { useComponentData } from '@/hooks/useComponentData'
import { useCategoryData } from '@/hooks/useCategoryData'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { AppBackground } from '@/components/layout/AppBackground'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { CommandPalette } from '@/components/features/CommandPalette/CommandPalette'
import { ComponentTable, SearchResultBanner } from '@/components/features/ComponentList/ComponentTable'
import { ComponentDetailDialog } from '@/components/features/ComponentDetail/ComponentDetailDialog'
import { toast } from 'sonner'

function App() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)

  const { darkMode, setDarkMode } = useTheme()

  const { categories, loading: categoriesLoading, error: categoriesError, refresh: refreshCategories } = useCategoryData()

  const { data: components, loading, error, hasMore, loadMore, refresh, totalCount } = useComponentData(
    selectedCategory,
    debouncedSearchQuery
  )

  const currentCategoryName = categories.find(c => c.id === selectedCategory)?.name || 'All Components'

  // 搜索查询防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // 组件数据错误提示
  useEffect(() => {
    if (error) {
      toast.error(error.message, {
        description: error.retryable ? 'Click refresh to try again' : undefined,
        action: error.retryable ? {
          label: 'Retry',
          onClick: refresh
        } : undefined
      })
    }
  }, [error, refresh])

  // 分类数据错误提示
  useEffect(() => {
    if (categoriesError) {
      toast.error('Failed to load categories', {
        description: categoriesError.message,
        action: categoriesError.retryable ? {
          label: 'Retry',
          onClick: refreshCategories
        } : undefined
      })
    }
  }, [categoriesError, refreshCategories])

  // 键盘快捷键
  useKeyboardShortcut('k', () => setCommandOpen(true))

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSearchQuery('')
    setDebouncedSearchQuery('')
  }

  const handleSearchClear = () => {
    setSearchQuery('')
  }

  return (
    <div className="relative h-svh w-full overflow-hidden bg-background text-foreground">
      <AppBackground />

      <div className="flex h-full overflow-hidden">
        <SidebarProvider>
          <AppSidebar
            categories={categories}
            categoriesLoading={categoriesLoading}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          <SidebarInset className="flex min-h-0 flex-1 min-w-0 flex-col bg-background/55 backdrop-blur-xl">
            <AppHeader
              currentCategoryName={currentCategoryName}
              totalCount={totalCount}
              searchQuery={searchQuery}
              loading={loading}
              darkMode={darkMode}
              onSearchChange={setSearchQuery}
              onSearchClear={handleSearchClear}
              onCommandOpen={() => setCommandOpen(true)}
              onRefresh={refresh}
              onThemeToggle={() => setDarkMode(v => !v)}
            />

            <div className="flex-1 overflow-auto p-4 md:p-6">
              <SearchResultBanner
                searchQuery={debouncedSearchQuery}
                totalCount={totalCount}
                onClearSearch={handleSearchClear}
              />

              <ComponentTable
                components={components}
                loading={loading}
                error={error}
                debouncedSearchQuery={debouncedSearchQuery}
                hasMore={hasMore}
                onViewDetails={setSelectedComponent}
                onRefresh={refresh}
                onLoadMore={loadMore}
              />
            </div>
          </SidebarInset>

          <CommandPalette
            open={commandOpen}
            darkMode={darkMode}
            categories={categories}
            searchQuery={searchQuery}
            onOpenChange={setCommandOpen}
            onRefresh={refresh}
            onThemeToggle={() => setDarkMode(v => !v)}
            onCategoryChange={handleCategoryChange}
            onSearchClear={handleSearchClear}
          />

          <ComponentDetailDialog
            component={selectedComponent}
            categories={categories}
            onClose={() => setSelectedComponent(null)}
          />
        </SidebarProvider>
      </div>
    </div>
  )
}

export default App
