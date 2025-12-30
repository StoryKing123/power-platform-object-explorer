import { RefreshCw, Sun, Moon, Search, X } from 'lucide-react'
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
import { type Category } from '@/data/mockData'
import { getIconComponent } from '@/utils/componentHelpers'

interface CommandPaletteProps {
  open: boolean
  darkMode: boolean
  categories: Category[]
  searchQuery: string
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
  onThemeToggle: () => void
  onCategoryChange: (categoryId: string) => void
  onSearchClear: () => void
}

/**
 * 命令面板组件
 * 提供快捷操作和导航
 */
export const CommandPalette = ({
  open,
  darkMode,
  categories,
  searchQuery,
  onOpenChange,
  onRefresh,
  onThemeToggle,
  onCategoryChange,
  onSearchClear
}: CommandPaletteProps) => {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or jump to a category…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onRefresh()
              onOpenChange(false)
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh data
            <CommandShortcut>R</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onThemeToggle()
              onOpenChange(false)
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
              onOpenChange(false)
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            Focus search
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
          {searchQuery ? (
            <CommandItem
              onSelect={() => {
                onSearchClear()
                onOpenChange(false)
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
          {categories.map((category) => {
            const Icon = getIconComponent(category.icon)
            return (
              <CommandItem
                key={category.id}
                onSelect={() => {
                  onCategoryChange(category.id)
                  onOpenChange(false)
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
  )
}
