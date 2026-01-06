import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PropertyValueCell } from './PropertyValueCell'
import { CopyButton } from './CopyButton'

interface PropertyTableProps {
  properties: Array<{ key: string; value: any }>
}

/**
 * 属性表格组件，使用紧凑的表格布局展示属性列表
 * - Property Name 列（35%）
 * - Value 列（自适应）
 * - Copy Button 列（固定 40px）
 */
export const PropertyTable = ({ properties }: PropertyTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-muted/20 border-b border-border/40">
          <TableHead className="w-[35%] h-9 px-4 text-xs font-semibold text-muted-foreground">Property</TableHead>
          <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground">Value</TableHead>
          <TableHead className="w-10 h-9"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map(({ key, value }) => (
          <TableRow key={key} className="border-b border-border/30 last:border-b-0 hover:bg-muted/30 group transition-colors">
            <TableCell className="py-2 px-4 text-xs text-muted-foreground font-medium align-middle">
              {key}
            </TableCell>
            <TableCell className="py-2 px-4 align-middle">
              <PropertyValueCell value={value} propertyKey={key} />
            </TableCell>
            <TableCell className="py-2 px-1 align-middle">
              <CopyButton value={value} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
