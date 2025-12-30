import { motion } from 'framer-motion'
import { Search, AlertCircle, RefreshCw, Package } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Component } from '@/data/mockData'
import { ComponentTableRow } from './ComponentTableRow'

interface ComponentTableProps {
  components: Component[]
  loading: boolean
  error: { message: string; retryable?: boolean } | null
  debouncedSearchQuery: string
  hasMore: boolean
  onViewDetails: (component: Component) => void
  onRefresh: () => void
  onLoadMore: () => void
}

/**
 * 组件表格组件
 * 显示组件列表
 */
export const ComponentTable = ({
  components,
  loading,
  error,
  debouncedSearchQuery,
  hasMore,
  onViewDetails,
  onRefresh,
  onLoadMore
}: ComponentTableProps) => {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-lg shadow-black/5">
        <Table className="table-fixed [&_th]:h-10 [&_th]:px-3 [&_td]:p-3">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[200px]">Type</TableHead>
              <TableHead className="w-[140px] text-center">Status</TableHead>
              <TableHead className="hidden lg:table-cell w-[180px]">Last Modified</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(8)].map((_, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="border-b border-border/50"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load components</h3>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    )
  }

  if (components.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No components found</h3>
        <p className="text-sm text-muted-foreground">
          {debouncedSearchQuery
            ? `没有找到匹配 "${debouncedSearchQuery}" 的组件`
            : 'No components available in this category'}
        </p>
      </Card>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-lg shadow-black/5"
      >
        <Table className="table-fixed [&_th]:h-10 [&_th]:px-3 [&_td]:p-3">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[200px]">Type</TableHead>
              <TableHead className="w-[140px] text-center">Status</TableHead>
              <TableHead className="hidden lg:table-cell w-[180px]">Last Modified</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.map((component, index) => (
              <ComponentTableRow
                key={component.id}
                component={component}
                index={index}
                onViewDetails={onViewDetails}
              />
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <Button onClick={onLoadMore} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Load More
          </Button>
        </div>
      )}
    </>
  )
}

interface SearchResultBannerProps {
  searchQuery: string
  totalCount: number | undefined
  onClearSearch: () => void
}

/**
 * 搜索结果横幅组件
 */
export const SearchResultBanner = ({ searchQuery, totalCount, onClearSearch }: SearchResultBannerProps) => {
  if (!searchQuery) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">
            搜索结果: <strong>"{searchQuery}"</strong>
            {totalCount !== undefined && (
              <span className="ml-1">({totalCount} 项)</span>
            )}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSearch}
          className="text-muted-foreground hover:text-foreground"
        >
          清空搜索
        </Button>
      </div>
    </motion.div>
  )
}
