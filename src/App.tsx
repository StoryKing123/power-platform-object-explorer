import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutGrid, Database, FileText, Table2, GitBranch, Puzzle, Globe,
  Package, Zap, Clock, Search, Moon, Sun, Sparkles, MoreVertical,
  Edit, RefreshCw, X, Play,
  Eye, Download, LucideIcon, AlertCircle, Loader2, Shield, List, ExternalLink, Command as CommandIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { type Component, type Category, type Solution } from '@/data/mockData'
import { useComponentData } from '@/hooks/useComponentData'
import { useCategoryData } from '@/hooks/useCategoryData'
import { fetchComponentSolutions } from '@/services/dataServices/solutionService'
import { getEnvironmentId } from '@/services/dataServices/environmentService'
import { getDefaultSolutionId } from '@/services/dataServices/searchService'
import { toast } from 'sonner'

function App() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') return true
    if (stored === 'light') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })
  const [componentSolutions, setComponentSolutions] = useState<Solution[]>([])
  const [loadingSolutions, setLoadingSolutions] = useState(false)
  const [currentTab, setCurrentTab] = useState('overview')

  const sortedComponentSolutions = useMemo(() => {
    const getInstalledTime = (installedOn?: string) => {
      if (!installedOn) return null
      const time = new Date(installedOn).getTime()
      return Number.isFinite(time) ? time : null
    }

    return [...componentSolutions].sort((a, b) => {
      const aTime = getInstalledTime(a.installedOn)
      const bTime = getInstalledTime(b.installedOn)

      if (aTime != null && bTime != null) return bTime - aTime
      if (aTime != null) return -1
      if (bTime != null) return 1

      return a.displayName.localeCompare(b.displayName)
    })
  }, [componentSolutions])

  // Fetch category data using the custom hook
  const { categories, loading: categoriesLoading, error: categoriesError, refresh: refreshCategories } = useCategoryData()

  // Fetch component data using the custom hook
  const { data: components, loading, error, hasMore, loadMore, refresh, totalCount } = useComponentData(
    selectedCategory,
    debouncedSearchQuery
  )

  // Update categories with real counts for selected category
  const updatedCategories = useMemo<Category[]>(() => {
    return categories.map(cat => ({
      ...cat,
      count: cat.id === selectedCategory ? totalCount : cat.count
    }))
  }, [categories, selectedCategory, totalCount])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Show error toast for component data
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

  // Show error toast for category data
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

  // Keyboard shortcut for command palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Helper functions
  const getIconComponent = (iconName: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      LayoutGrid, Database, FileText, Table2,
      GitBranch, Puzzle, Globe, Package, Zap, Clock, Shield, List
    }
    return icons[iconName] || LayoutGrid
  }

  const formatInstalledOn = (installedOn?: string) => {
    if (!installedOn) return null
    if (!/[T:]/.test(installedOn)) return installedOn
    const date = new Date(installedOn)
    if (!Number.isFinite(date.getTime())) return installedOn
    return date.toISOString().replace('T', ' ').slice(0, 16) + 'Z'
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch(status) {
      case 'active': return 'outline'
      case 'inactive': return 'outline'
      case 'draft': return 'outline'
      default: return 'outline'
    }
  }

  const normalizeGuid = (value?: string): string => {
    if (!value) return ''
    return value.trim().replace(/^{|}$/g, '')
  }

  const isCanvasApp = (component: Component): boolean => {
    const primaryIdAttribute = String(
      component.metadata?.primaryIdAttribute ??
      component.metadata?._searchResult?.msdyn_primaryidattribute ??
      ''
    ).toLowerCase()
    if (primaryIdAttribute === 'canvasappid') return true

    const componentTypeName = String(
      component.metadata?.componentTypeName ??
      component.metadata?._searchResult?.msdyn_componenttypename ??
      component.type ??
      ''
    )
    if (/canvas\s*app/i.test(componentTypeName)) return true

    // Fallback for localized environments (e.g. zh-CN/zh-TW) where "Canvas App" is translated.
    return componentTypeName.includes('画布') || componentTypeName.includes('畫布')
  }

  const isModelDrivenApp = (component: Component): boolean => {
    const primaryIdAttribute = String(
      component.metadata?.primaryIdAttribute ??
      component.metadata?._searchResult?.msdyn_primaryidattribute ??
      ''
    ).toLowerCase()
    if (primaryIdAttribute === 'appmoduleid') return true

    const componentTypeName = String(
      component.metadata?.componentTypeName ??
      component.metadata?._searchResult?.msdyn_componenttypename ??
      component.type ??
      ''
    )
    if (/model[- ]driven/i.test(componentTypeName)) return true

    // Fallback for localized environments (e.g. zh-CN/zh-TW) where "Model-driven App" is translated.
    return componentTypeName.includes('模型驱动') || componentTypeName.includes('模型驅動')
  }

  const openSolutionInPowerPlatform = async (solution: Solution) => {
    if (!solution?.id || solution.id === 'default') {
      toast.error('Unable to open solution: solution ID not found')
      return
    }

    let environmentId: string
    try {
      toast.loading('Retrieving environment ID...')
      environmentId = await getEnvironmentId()
      toast.dismiss()
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to retrieve environment ID', {
        description: error instanceof Error ? error.message : 'Unable to get environment ID from Dynamics 365 API'
      })
      return
    }

    // Power Apps Maker portal solution URL
    // Format: https://make.powerapps.com/environments/{environmentId}/solutions/{solutionId}
    const solutionUrl = `https://make.powerapps.com/environments/${environmentId}/solutions/${solution.id}`
    window.open(solutionUrl, '_blank')
  }

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSearchQuery('')
    setDebouncedSearchQuery('')
  }

  // Fetch solutions when Solutions tab is selected
  useEffect(() => {
    if (currentTab === 'solutions' && selectedComponent) {
      setLoadingSolutions(true)
      fetchComponentSolutions(selectedComponent.id, selectedComponent.category)
        .then(solutions => {
          setComponentSolutions(solutions)
        })
        .catch(error => {
          console.error('Failed to fetch solutions:', error)
          toast.error('Failed to load solutions')
          // Fallback to component's default solutions
          setComponentSolutions(selectedComponent.solutions || [])
        })
        .finally(() => {
          setLoadingSolutions(false)
        })
    }
  }, [currentTab, selectedComponent])

  // Reset solutions when component changes
  useEffect(() => {
    if (selectedComponent) {
      setComponentSolutions(selectedComponent.solutions || [])
      setCurrentTab('overview')
    }
  }, [selectedComponent])

		  return (
		    <div className="relative h-svh w-full overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/25 via-fuchsia-500/15 to-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-56 -left-40 h-[34rem] w-[34rem] rounded-full bg-gradient-to-tr from-cyan-500/18 via-blue-500/10 to-transparent blur-3xl" />
        <div className="absolute -right-44 top-24 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-purple-500/18 via-primary/12 to-transparent blur-3xl" />
        <div className="absolute inset-0 opacity-15 dark:opacity-[0.07] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

		      {/* Main Layout with Sidebar */}
		      <div className="flex h-full overflow-hidden">
		        <SidebarProvider>
		          {/* Sidebar */}
		          <Sidebar
		            variant="inset"
		            collapsible="icon"
		            className="bg-sidebar/65 backdrop-blur-xl"
		          >
	            <SidebarHeader className="h-[88px] shrink-0 justify-center gap-3 p-4">
	              <div className="flex items-center gap-3">
	                <motion.div
	                  whileHover={{ rotate: 8, scale: 1.02 }}
	                  transition={{ duration: 0.25 }}
	                  className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-primary via-fuchsia-500 to-cyan-400 text-primary-foreground shadow-lg shadow-primary/15"
	                >
	                  <Sparkles className="h-5 w-5" />
	                </motion.div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-tight">Power Platform Explorer</div>
                  <div className="truncate text-xs text-muted-foreground">Component browser</div>
                </div>
	              </div>
	            </SidebarHeader>
		            <SidebarSeparator className="mx-0 opacity-60" />
		            <SidebarContent className="px-2 pb-2 overflow-hidden">
		              <SidebarGroup className="flex min-h-0 flex-1 flex-col p-0">
	                <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
	                  Categories
	                </SidebarGroupLabel>
	                <SidebarGroupContent className="flex min-h-0 flex-1 flex-col">
	                  <ScrollArea className="min-h-0 flex-1 pr-2">
	                    <SidebarMenu className="pr-2">
	                      {categoriesLoading ? (
	                        [...Array(11)].map((_, i) => (
	                          <SidebarMenuItem key={i}>
	                            <Skeleton className="h-10 w-full rounded-lg" />
                          </SidebarMenuItem>
                        ))
                      ) : (
                        updatedCategories.map((category) => {
                          const Icon = getIconComponent(category.icon)
                          return (
                            <SidebarMenuItem key={category.id}>
                              <SidebarMenuButton
                                isActive={selectedCategory === category.id}
                                onClick={() => handleCategoryChange(category.id)}
                                className="h-10 rounded-lg px-3 hover:bg-sidebar-accent/70 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                              >
                                <Icon className="h-4 w-4" />
                                <span className="flex-1">{category.name}</span>
                                <SidebarMenuBadge className="bg-sidebar-accent/70 text-sidebar-foreground/80 data-[active=true]:bg-primary/15 data-[active=true]:text-sidebar-foreground">
                                  {category.count}
                                </SidebarMenuBadge>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })
                      )}
                    </SidebarMenu>
                  </ScrollArea>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

		          {/* Main Content */}
		          <SidebarInset className="flex min-h-0 flex-1 min-w-0 flex-col bg-background/55 backdrop-blur-xl">
		            <header className="sticky top-0 z-40 h-[88px] shrink-0 border-b border-border/50 bg-background/55 backdrop-blur-xl">
		              <div className="flex h-full items-center gap-3 px-4">
		                <SidebarTrigger className="h-9 w-9 rounded-lg border border-border/50 bg-card/40 hover:bg-card/60" />

                <div className="hidden min-w-0 md:block">
                  <div className="truncate text-sm font-semibold tracking-tight">
                    {updatedCategories.find(c => c.id === selectedCategory)?.name || 'All Components'}
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
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search in ${updatedCategories.find(c => c.id === selectedCategory)?.name || 'All Components'}...`}
                      className="h-11 bg-card/40 pl-10 pr-24 backdrop-blur-md border-border/50 focus-visible:ring-primary/30"
                    />
                    {searchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-12 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg"
                        onClick={() => setSearchQuery('')}
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
                    onClick={() => setCommandOpen(true)}
                    title="Command palette (⌘K)"
                  >
                    <CommandIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg"
                    onClick={refresh}
                    title="Refresh data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg"
                    onClick={() => setDarkMode((v) => !v)}
                    title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-6">
            {/* Search Results Banner */}
            {debouncedSearchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">
                      搜索结果: <strong>"{debouncedSearchQuery}"</strong>
                      {totalCount !== undefined && (
                        <span className="ml-1">({totalCount} 项)</span>
                      )}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    清空搜索
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Component List */}
            {loading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to load components</h3>
                <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                <Button onClick={refresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </Card>
            ) : components.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No components found</h3>
                <p className="text-sm text-muted-foreground">
                  {debouncedSearchQuery
                    ? `没有找到匹配 "${debouncedSearchQuery}" 的组件`
                    : 'No components available in this category'}
                </p>
              </Card>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-md border bg-background"
                >
                  <Table className="table-fixed [&_th]:h-10 [&_th]:px-3 [&_td]:p-3">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[240px]">Name</TableHead>
                        <TableHead className="w-[140px]">Type</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead className="w-[110px] text-center">Status</TableHead>
                        <TableHead className="hidden lg:table-cell w-[150px]">Last Modified</TableHead>
                        <TableHead className="w-[44px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {components.map((component) => (
                          <TableRow
                            key={component.id}
                            className="group cursor-pointer"
                            onClick={() => setSelectedComponent(component)}
                          >
                            <TableCell className="font-medium">
                              <div className="truncate">{component.name}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="whitespace-nowrap">{component.type}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell max-w-md">
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {component.description}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={getStatusVariant(component.status)} className="whitespace-nowrap">
                                {component.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {component.lastModified}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedComponent(component)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {isModelDrivenApp(component) && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()

                                          const appId = normalizeGuid(component.id)
                                          if (!appId) {
                                            toast.error('Unable to open app: app ID not found')
                                            return
                                          }

                                          const playUrl = new URL('/main.aspx', window.location.origin)
                                          playUrl.searchParams.set('appid', appId)
                                          playUrl.searchParams.set('forceUCI', '1')
                                          window.open(playUrl.toString(), '_blank', 'noopener,noreferrer')
                                        }}
                                      >
                                        <Play className="h-4 w-4 mr-2" />
                                        Play
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async (e) => {
                                          e.preventDefault()
                                          e.stopPropagation()

                                          const appId = normalizeGuid(component.id)
                                          if (!appId) {
                                            toast.error('Unable to open app: app ID not found')
                                            return
                                          }

                                          let environmentId: string
                                          try {
                                            toast.loading('Retrieving environment ID...')
                                            environmentId = await getEnvironmentId()
                                            toast.dismiss()
                                          } catch (error) {
                                            toast.dismiss()
                                            toast.error('Failed to retrieve environment ID', {
                                              description: error instanceof Error ? error.message : 'Unable to get environment ID from Dynamics 365 API'
                                            })
                                            return
                                          }

                                          let solutionId: string
                                          try {
                                            toast.loading('Retrieving default solution ID...')
                                            solutionId = await getDefaultSolutionId()
                                            toast.dismiss()
                                          } catch (error) {
                                            toast.dismiss()
                                            toast.error('Failed to retrieve default solution ID', {
                                              description: error instanceof Error ? error.message : 'Unable to get default solution ID from Dynamics 365 API'
                                            })
                                            return
                                          }

                                          const editUrl = `https://make.powerapps.com/e/${environmentId}/s/${solutionId}/app/edit/${appId}`
                                          window.open(editUrl, '_blank', 'noopener,noreferrer')
                                        }}
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Edit in new tab
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {isCanvasApp(component) && (
                                    <DropdownMenuItem
                                      onClick={async (e) => {
                                        e.preventDefault()
                                        e.stopPropagation()

                                        const appId = normalizeGuid(component.id)
                                        if (!appId) {
                                          toast.error('Unable to open app: app ID not found')
                                          return
                                        }

                                        let environmentId: string
                                        try {
                                          toast.loading('Retrieving environment ID...')
                                          environmentId = await getEnvironmentId()
                                          toast.dismiss()
                                        } catch (error) {
                                          toast.dismiss()
                                          toast.error('Failed to retrieve environment ID', {
                                            description: error instanceof Error ? error.message : 'Unable to get environment ID from Dynamics 365 API'
                                          })
                                          return
                                        }

                                        const editUrl = `https://make.powerapps.com/environments/${environmentId}/apps/${appId}/edit`
                                        window.open(editUrl, '_blank', 'noopener,noreferrer')
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Edit in new tab
                                    </DropdownMenuItem>
                                  )}
                                  {(component.category === 'flows' || component.type.toLowerCase().includes('flow')) && (
                                    <DropdownMenuItem
                                      onClick={async (e) => {
                                        e.preventDefault()
                                        e.stopPropagation()

                                        // Get required fields from metadata
                                        let workflowidunique = component.metadata?.workflowidunique
                                        let solutionid = component.metadata?.solutionid

                                        // If metadata is incomplete (e.g., from search results), fetch full workflow data
                                        if (!workflowidunique || !solutionid) {
                                          try {
                                            toast.loading('Loading flow details...')
                                            const { fetchFlowById } = await import('@/services/dataServices/flowService')
                                            const fullFlowData = await fetchFlowById(component.id)
                                            toast.dismiss()

                                            workflowidunique = fullFlowData.workflowidunique
                                            solutionid = fullFlowData.solutionid
                                          } catch (error) {
                                            toast.dismiss()
                                            toast.error('Failed to load flow details', {
                                              description: error instanceof Error ? error.message : 'Unable to fetch flow data'
                                            })
                                            return
                                          }
                                        }

                                        if (!workflowidunique) {
                                          toast.error('Unable to open flow: workflowidunique not found')
                                          return
                                        }

                                        if (!solutionid) {
                                          toast.error('Unable to open flow: solutionid not found')
                                          return
                                        }

                                        // Get environment ID from Dynamics 365 API
                                        let environmentId: string
                                        try {
                                          toast.loading('Retrieving environment ID...')
                                          environmentId = await getEnvironmentId()
                                          toast.dismiss()
                                        } catch (error) {
                                          toast.dismiss()
                                          toast.error('Failed to retrieve environment ID', {
                                            description: error instanceof Error ? error.message : 'Unable to get environment ID from Dynamics 365 API'
                                          })
                                          return
                                        }

                                        // Construct Power Automate flow editor URL
                                        // Format: https://make.powerautomate.com/environments/{environmentId}/solutions/{solutionId}/flows/{workflowidunique}
                                        const flowEditorUrl = `https://make.powerautomate.com/environments/${environmentId}/solutions/${solutionid}/flows/${workflowidunique}`
                                        window.open(flowEditorUrl, '_blank')
                                      }}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open in Flow Editor
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </motion.div>

                {/* Load More Button */}
                {hasMore && !loading && (
                  <div className="mt-4 text-center">
                    <Button onClick={loadMore} variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </SidebarInset>

        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Type a command or jump to a category…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() => {
                  refresh()
                  setCommandOpen(false)
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh data
                <CommandShortcut>R</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setDarkMode((v) => !v)
                  setCommandOpen(false)
                }}
              >
                {darkMode ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                Toggle theme
                <CommandShortcut>T</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  requestAnimationFrame(() => document.getElementById('global-search')?.focus())
                  setCommandOpen(false)
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                Focus search
                <CommandShortcut>/</CommandShortcut>
              </CommandItem>
              {searchQuery ? (
                <CommandItem
                  onSelect={() => {
                    setSearchQuery('')
                    setCommandOpen(false)
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear search
                  <CommandShortcut>Esc</CommandShortcut>
                </CommandItem>
              ) : null}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Categories">
              {updatedCategories.map((category) => {
                const Icon = getIconComponent(category.icon)
                return (
                  <CommandItem
                    key={category.id}
                    onSelect={() => {
                      handleCategoryChange(category.id)
                      setCommandOpen(false)
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="truncate">{category.name}</span>
                    <CommandShortcut>{category.count}</CommandShortcut>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        {/* Component Detail Dialog */}
        <Dialog open={!!selectedComponent} onOpenChange={() => setSelectedComponent(null)}>
          <DialogContent className="max-w-5xl p-0">
            {selectedComponent ? (
              <ScrollArea className="max-h-[85vh]">
                <div className="p-6">
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="rounded-xl bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400 p-4 shadow-xl shadow-primary/15"
                        whileHover={{ rotate: 6, scale: 1.01 }}
                        transition={{ duration: 0.25 }}
                      >
                        {(() => {
                          const Icon = getIconComponent(
                            updatedCategories.find(c => c.id === selectedComponent.category)?.icon || 'LayoutGrid'
                          )
                          return <Icon className="h-8 w-8 text-white" />
                        })()}
                      </motion.div>
                      <div className="min-w-0">
                        <DialogTitle className="truncate text-2xl tracking-tight">{selectedComponent.name}</DialogTitle>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary">{selectedComponent.type}</Badge>
                          <Badge variant="outline">{selectedComponent.category}</Badge>
                          <Badge variant={getStatusVariant(selectedComponent.status)}>
                            {selectedComponent.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-6">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="properties">Properties</TabsTrigger>
                      <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                      <TabsTrigger value="solutions">Solutions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-4">
                      <div>
                        <h3 className="mb-2 font-semibold text-foreground">Description</h3>
                        <p className="text-sm text-muted-foreground">{selectedComponent.description}</p>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="mb-1 text-sm font-medium text-foreground">Type</h4>
                          <p className="text-sm text-muted-foreground">{selectedComponent.type}</p>
                        </div>
                        <div>
                          <h4 className="mb-1 text-sm font-medium text-foreground">Category</h4>
                          <p className="text-sm text-muted-foreground">{selectedComponent.category}</p>
                        </div>
                        <div>
                          <h4 className="mb-1 text-sm font-medium text-foreground">Status</h4>
                          <Badge variant={getStatusVariant(selectedComponent.status)}>
                            {selectedComponent.status}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="mb-1 text-sm font-medium text-foreground">Last Modified</h4>
                          <p className="text-sm text-muted-foreground">{selectedComponent.lastModified}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="properties" className="space-y-4 mt-4">
                      <div className="space-y-3">
                        {selectedComponent.metadata ? (
                          Object.entries(selectedComponent.metadata).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3"
                            >
                              <span className="font-medium text-foreground">{key}</span>
                              <span className="max-w-[60%] truncate text-right text-sm text-muted-foreground">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || 'N/A')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No metadata available</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="dependencies" className="space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground">
                        This component has dependencies on the following items:
                      </p>
                      <div className="space-y-2">
                        {['System User Entity', 'Security Role', 'Business Unit'].map((dep) => (
                          <div
                            key={dep}
                            className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3"
                          >
                            <Database className="h-4 w-4 text-primary" />
                            <span className="text-sm text-foreground">{dep}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="solutions" className="space-y-4 mt-4">
                      {loadingSolutions ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="ml-3 text-sm text-muted-foreground">Loading solutions...</span>
                        </div>
                      ) : componentSolutions && componentSolutions.length > 0 ? (
                        <div className="space-y-2">
                          <p className="mb-3 text-sm text-muted-foreground">
                            This component is included in {componentSolutions.length} solution{componentSolutions.length > 1 ? 's' : ''}:
                          </p>
                          {sortedComponentSolutions.map((solution) => (
                            <div
                              key={solution.id}
                              className="cursor-pointer rounded-xl border border-border/50 bg-muted/15 p-3 transition-colors hover:border-primary/40 hover:bg-muted/25"
                              role="button"
                              tabIndex={0}
                              title="Open solution in Power Platform"
                              onClick={() => openSolutionInPowerPlatform(solution)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  openSolutionInPowerPlatform(solution)
                                }
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 shrink-0 text-primary" />
                                    <h4 className="min-w-0 truncate text-sm font-semibold text-foreground">
                                      {solution.displayName}
                                    </h4>
                                    {solution.isManaged && (
                                      <Badge variant="secondary" className="text-[10px] leading-4 px-1.5 py-0">
                                        Managed
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                      <span className="font-medium text-muted-foreground">Name</span>
                                      <span className="font-mono">{solution.name}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <span className="font-medium text-muted-foreground">Version</span>
                                      <span className="font-mono">{solution.version}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 min-w-0">
                                      <span className="font-medium text-muted-foreground">Publisher</span>
                                      <span className="truncate" title={solution.publisher}>
                                        {solution.publisher}
                                      </span>
                                    </span>
                                    {solution.installedOn && (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="font-medium text-muted-foreground">Installed</span>
                                        <span className="font-mono">{formatInstalledOn(solution.installedOn)}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/60" />
                          <p className="text-sm text-muted-foreground">
                            This component is not included in any solutions
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <DialogFooter className="mt-6">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Component
                    </Button>
                  </DialogFooter>
                </div>
              </ScrollArea>
            ) : null}
          </DialogContent>
        </Dialog>
      </SidebarProvider>
      </div>
    </div>
  )
}

export default App
