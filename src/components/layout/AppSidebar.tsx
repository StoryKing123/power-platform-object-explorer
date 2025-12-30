import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  SidebarHeader,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { type Category } from '@/data/mockData'
import { getIconComponent } from '@/utils/componentHelpers'

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
                  categories.map((category) => {
                    const Icon = getIconComponent(category.icon)
                    return (
                      <SidebarMenuItem key={category.id}>
                        <SidebarMenuButton
                          isActive={selectedCategory === category.id}
                          onClick={() => onCategoryChange(category.id)}
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
  )
}
