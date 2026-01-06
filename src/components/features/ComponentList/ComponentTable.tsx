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
      <div className="w-full">
        <Table>
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
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-5 w-20" />
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
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
            ? `No components found matching "${debouncedSearchQuery}"`
            : 'No components available in this category'}
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="w-full">
        <Table>
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
      </div>

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
 * Search result banner component
 */
export const SearchResultBanner = ({ searchQuery, totalCount, onClearSearch }: SearchResultBannerProps) => {
  if (!searchQuery) return null

  return (
    <div className="mb-4 flex items-center justify-between border-b pb-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4" />
        <span className="text-sm">
          Search results: <strong>"{searchQuery}"</strong>
          {totalCount !== undefined && (
            <span className="ml-1 text-muted-foreground">({totalCount} {totalCount === 1 ? 'item' : 'items'})</span>
          )}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSearch}
      >
        Clear search
      </Button>
    </div>
  )
}
