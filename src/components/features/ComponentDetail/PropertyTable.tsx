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
    <Table className="border-t">
      <TableHeader>
        <TableRow className="hover:bg-transparent border-b-0">
          <TableHead className="w-[35%] h-8 px-3 text-xs font-medium">Property</TableHead>
          <TableHead className="h-8 px-3 text-xs font-medium">Value</TableHead>
          <TableHead className="w-10 h-8"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map(({ key, value }) => (
          <TableRow key={key} className="border-b-0 hover:bg-muted/50 group">
            <TableCell className="py-1.5 px-3 text-xs text-muted-foreground font-medium align-middle">
              {key}
            </TableCell>
            <TableCell className="py-1.5 px-3 align-middle">
              <PropertyValueCell value={value} propertyKey={key} />
            </TableCell>
            <TableCell className="py-1.5 px-1 align-middle">
              <CopyButton value={value} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
