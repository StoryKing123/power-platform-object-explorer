import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getIconComponent } from '@/utils/componentHelpers'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { type Category } from '@/data/mockData'

interface AppSidebarProps {
  categories: Category[]
  categoriesLoading: boolean
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

/**
 * 应用侧边栏组件
 * 显示分类导航菜单
 */
export const AppSidebar = ({
  categories,
  categoriesLoading,
  selectedCategory,
  onCategoryChange
}: AppSidebarProps) => {
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="bg-sidebar/65 backdrop-blur-xl"
    >
      <SidebarHeader className="h-[88px] shrink-0 justify-center gap-3 p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-primary via-fuchsia-500 to-cyan-400 text-primary-foreground shadow-lg shadow-primary/15"
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight">Component Detective</div>
            <div className="truncate text-xs text-muted-foreground">Component browser</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 pb-2 overflow-hidden">
        <SidebarGroup className="flex min-h-0 flex-1 flex-col p-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 group-data-[collapsible=icon]:!mt-0">
            Categories
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1 pr-2">
              <SidebarMenu className="pr-2">
                {categoriesLoading ? (
                  [...Array(11)].map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <Skeleton className="h-8 w-full rounded-md" />
                    </SidebarMenuItem>
                  ))
                ) : (
                  categories.map((category) => {
                    const Icon = getIconComponent(category.icon)
                    return (
                      <SidebarMenuItem key={category.id}>
                        <SidebarMenuButton
                          isActive={selectedCategory === category.id}
                          onClick={() => onCategoryChange(category.id)}
                          className="h-7 rounded-md px-2 text-xs"
                          tooltip={category.name}
                        >
                          <Icon className="h-4 w-4 shrink-0 hidden group-data-[collapsible=icon]:block" />
                          <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
                            {category.name}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground group-data-[collapsible=icon]:hidden">
                            {category.count}
                          </span>
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
  )
}
