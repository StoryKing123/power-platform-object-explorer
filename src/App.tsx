import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid, Database, FileText, Table2, GitBranch, Puzzle, Globe,
  Package, Zap, Clock, Search, Moon, Sun, Sparkles, MoreVertical,
  Edit, RefreshCw, Menu, X,
  Eye, Download, LucideIcon, AlertCircle, Loader2, Shield, List, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { type Component, type Category, type Solution } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { useComponentData } from '@/hooks/useComponentData'
import { useCategoryData } from '@/hooks/useCategoryData'
import { fetchComponentSolutions } from '@/services/dataServices/solutionService'
import { getEnvironmentId } from '@/services/dataServices/environmentService'
import { toast } from 'sonner'

function App() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [componentSolutions, setComponentSolutions] = useState<Solution[]>([])
  const [loadingSolutions, setLoadingSolutions] = useState(false)
  const [currentTab, setCurrentTab] = useState('overview')

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

  // Keyboard shortcut for inline search input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        document.getElementById('inline-search-input')?.focus()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Helper functions
  const getIconComponent = (iconName: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      LayoutGrid, Database, FileText, Table2,
      GitBranch, Puzzle, Globe, Package, Zap, Clock, Shield, List
    }
    return icons[iconName] || LayoutGrid
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch(status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'draft': return 'outline'
      default: return 'secondary'
    }
  }

  const normalizeGuid = (value?: string): string => {
    if (!value) return ''
    return value.trim().replace(/^{|}$/g, '')
  }

  const isCanvasApp = (component: Component): boolean => {
    const componentTypeName = String(
      component.metadata?.componentTypeName ??
      component.metadata?._searchResult?.msdyn_componenttypename ??
      component.type ??
      ''
    )
    return /canvas\s*app/i.test(componentTypeName)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-lg bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 border-b border-white/20 shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">Power Platform Explorer</h1>
                <p className="text-sm text-white/80">Fast component browser for Power Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Inline Search Input */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  {/* Search Icon or Loading Spinner */}
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loading ? (
                      <Loader2 className="h-4 w-4 text-white/70 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 text-white/70" />
                    )}
                  </div>

                  {/* Input Field */}
                  <input
                    id="inline-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search in ${updatedCategories.find(c => c.id === selectedCategory)?.name || 'All Components'}...`}
                    className="w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  />

                  {/* Clear Button */}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={refresh}
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Dark Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-2">
                <Sun className="h-4 w-4 text-white" />
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                <Moon className="h-4 w-4 text-white" />
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-white/20"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <AnimatePresence>
            {(mobileMenuOpen || window.innerWidth >= 1024) && (
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className={cn(
                  "w-72 shrink-0",
                  mobileMenuOpen ? "fixed inset-y-0 left-0 z-40 mt-[88px]" : "hidden lg:block"
                )}
              >
                <div className="sticky top-24 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    <LayoutGrid className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Categories
                  </h2>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <nav className="space-y-2">
                      {categoriesLoading ? (
                        // Show skeleton loaders while categories are loading
                        [...Array(11)].map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))
                      ) : (
                        updatedCategories.map((category, index) => {
                          const Icon = getIconComponent(category.icon)
                          return (
                            <motion.div
                              key={category.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Button
                                variant={selectedCategory === category.id ? "default" : "ghost"}
                                className={cn(
                                  "w-full justify-start gap-3 transition-all duration-200",
                                  selectedCategory === category.id &&
                                  "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700"
                                )}
                                onClick={() => handleCategoryChange(category.id)}
                              >
                                <Icon className="h-5 w-5" />
                                <span className="flex-1 text-left">{category.name}</span>
                                <Badge variant="secondary" className="ml-auto">
                                  {category.count}
                                </Badge>
                              </Button>
                            </motion.div>
                          )
                        })
                      )}
                    </nav>
                  </ScrollArea>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search Results Banner */}
            {debouncedSearchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-900 dark:text-blue-100">
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
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.03 }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                  className="space-y-2"
                >
                  {components.map((component) => {
                  const Icon = getIconComponent(
                    updatedCategories.find(c => c.id === component.category)?.icon || 'LayoutGrid'
                  )
                  return (
                    <motion.div
                      key={component.id}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        show: { opacity: 1, x: 0 }
                      }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card
                        className="group cursor-pointer hover:shadow-lg transition-all duration-200 border hover:border-blue-400/50 dark:hover:border-blue-600/50 bg-white dark:bg-slate-800"
                        onClick={() => setSelectedComponent(component)}
                      >
                        <div className="flex items-center gap-3 p-3">
                          <motion.div
                            className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md shrink-0"
                            whileHover={{ rotate: 5 }}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                {component.name}
                              </h3>
                              <Badge variant="secondary" className="text-xs shrink-0">{component.type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {component.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="hidden sm:inline">{component.lastModified}</span>
                            </div>
                            <Badge variant={getStatusVariant(component.status)} className="text-xs">
                              {component.status}
                            </Badge>
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
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
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
          </main>
        </div>
      </div>

      {/* Component Detail Dialog */}
      <Dialog open={!!selectedComponent} onOpenChange={() => setSelectedComponent(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedComponent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <motion.div
                    className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {(() => {
                      const Icon = getIconComponent(
                        updatedCategories.find(c => c.id === selectedComponent.category)?.icon || 'LayoutGrid'
                      )
                      return <Icon className="h-8 w-8 text-white" />
                    })()}
                  </motion.div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedComponent.name}</DialogTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge>{selectedComponent.type}</Badge>
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
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Description</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedComponent.description}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">Type</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{selectedComponent.type}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">Category</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{selectedComponent.category}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">Status</h4>
                      <Badge variant={getStatusVariant(selectedComponent.status)}>
                        {selectedComponent.status}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">Last Modified</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{selectedComponent.lastModified}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="properties" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    {selectedComponent.metadata ? (
                      Object.entries(selectedComponent.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{key}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 text-right max-w-[60%] truncate">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || 'N/A')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400">No metadata available</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="dependencies" className="space-y-4 mt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    This component has dependencies on the following items:
                  </p>
                  <div className="space-y-2">
                    {['System User Entity', 'Security Role', 'Business Unit'].map((dep) => (
                      <div key={dep} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-slate-900 dark:text-slate-100">{dep}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="solutions" className="space-y-4 mt-4">
                  {loadingSolutions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                      <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">Loading solutions...</span>
                    </div>
	                  ) : componentSolutions && componentSolutions.length > 0 ? (
	                    <div className="space-y-3">
	                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
	                        This component is included in {componentSolutions.length} solution{componentSolutions.length > 1 ? 's' : ''}:
	                      </p>
	                      {componentSolutions.map((solution) => (
	                        <div
	                          key={solution.id}
	                          className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
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
	                          <div className="flex items-start justify-between gap-3">
	                            <div className="flex-1">
	                              <div className="flex items-center gap-2 mb-2">
	                                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
	                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{solution.displayName}</h4>
                                {solution.isManaged && (
                                  <Badge variant="secondary" className="text-xs">Managed</Badge>
	                                )}
	                              </div>
	                              <div className="space-y-1 text-sm">
	                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
	                                  <span className="font-medium">Name:</span>
	                                  <span className="font-mono text-xs">{solution.name}</span>
	                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <span className="font-medium">Version:</span>
                                  <span className="font-mono text-xs">{solution.version}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <span className="font-medium">Publisher:</span>
                                  <span>{solution.publisher}</span>
                                </div>
                                {solution.installedOn && (
                                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="font-medium">Installed:</span>
                                    <span>{solution.installedOn}</span>
                                  </div>
	                                )}
	                              </div>
	                            </div>
	                            <ExternalLink className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-1 shrink-0" />
	                          </div>
	                        </div>
	                      ))}
	                    </div>
	                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
