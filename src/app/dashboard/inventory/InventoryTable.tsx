'use client'

import { useState, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import Papa from 'papaparse'
import { Plus, Download, Upload, FileText, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TableShell, TableScroll, Table, Thead, Th, Tr, Td, TableEmpty } from '@/components/ui/Table'
import { FilterBar } from '@/components/filters/FilterBar'
import { FilterPanel, FilterSection } from '@/components/filters/FilterPanel'
import { FilterChip } from '@/components/filters/FilterChip'
import {
  MultiSelectPicker, StockPicker, PresencePicker, DateRangePicker,
} from '@/components/filters/FilterPickers'
import {
  useTableFilters,
  stringSerializer, stringArraySerializer,
  stockSerializer, presenceSerializer, dateRangeSerializer,
} from '@/components/filters/useTableFilters'
import type { PresenceFilter, StockFilter, DateRangeFilter } from '@/components/filters/types'
import { cn } from '@/lib/utils'

type Product = {
  product_code: string
  lens_width: string | null
  brands: string | null
  location: string | null
  type: string | null
  comments: string | null
  mrp: number | null
  cost_price: number | null
  sale_price_s: number | null
  sale_price_a: number | null
  stock: number
  date_added: string
}

type Feedback = { message: string; type: 'success' | 'error'; persistent?: boolean }

// =============================================================
// Filter definition
// =============================================================
const filterSerializers = {
  q:        stringSerializer(),
  type:     stringArraySerializer(),
  brand:    stringArraySerializer(),
  location: stringArraySerializer(),
  stock:    stockSerializer(),
  cost:     presenceSerializer(),
  sale_s:   presenceSerializer(),
  sale_a:   presenceSerializer(),
  mrp:      presenceSerializer(),
  added:    dateRangeSerializer(),
}

// =============================================================

export default function InventoryTable({
  initialProducts,
  userRole,
}: {
  initialProducts: Product[]
  userRole: string
}) {
  const isAdmin = userRole === 'admin'
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isAdding, setIsAdding] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ stock: 0 })
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [showAllColumns, setShowAllColumns] = useState(false)
  const { state: filters, setField, clearField, clearAll, replaceAll, activeCount } = useTableFilters(filterSerializers)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // ─── Distinct facet values for the multi-select pickers ─────────────
  const { uniqueTypes, uniqueBrands, uniqueLocations } = useMemo(() => {
    const t = new Set<string>(), b = new Set<string>(), l = new Set<string>()
    for (const p of products) {
      if (p.type) t.add(p.type)
      if (p.brands) b.add(p.brands)
      if (p.location) l.add(p.location)
    }
    return {
      uniqueTypes: Array.from(t).sort(),
      uniqueBrands: Array.from(b).sort(),
      uniqueLocations: Array.from(l).sort(),
    }
  }, [products])

  // ─── Filtering logic ────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = filters.q.toLowerCase().trim()
    return products.filter(p => {
      if (q) {
        const haystack = [
          p.product_code, p.brands, p.type, p.location, p.comments, p.lens_width,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (filters.type.length && (!p.type || !filters.type.includes(p.type))) return false
      if (filters.brand.length && (!p.brands || !filters.brand.includes(p.brands))) return false
      if (filters.location.length && (!p.location || !filters.location.includes(p.location))) return false

      if (!matchStock(p.stock, filters.stock)) return false
      if (!matchPresence(p.cost_price, filters.cost)) return false
      if (!matchPresence(p.sale_price_s, filters.sale_s)) return false
      if (!matchPresence(p.sale_price_a, filters.sale_a)) return false
      if (!matchPresence(p.mrp, filters.mrp)) return false
      if (!matchDate(p.date_added, filters.added)) return false

      return true
    })
  }, [products, filters])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Reset to first page whenever filters change
  useMemoResetPage(filters, () => setCurrentPage(1))

  // ─── Mutations (unchanged from before) ──────────────────────────────
  const showFeedback = (message: string, type: Feedback['type'], persistent = false) => {
    setFeedback({ message, type, persistent })
    if (!persistent) setTimeout(() => setFeedback(null), 5000)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProduct.product_code) return showFeedback('Product code is required', 'error')
    const { data, error } = await supabase
      .from('products')
      .upsert([newProduct], { onConflict: 'product_code' })
      .select()
    if (error) return showFeedback('Error saving product: ' + error.message, 'error')
    if (data) {
      setProducts(prev => {
        const exists = prev.find(p => p.product_code === data[0].product_code)
        return exists
          ? prev.map(p => (p.product_code === data[0].product_code ? data[0] : p))
          : [data[0], ...prev]
      })
      showFeedback('Product saved successfully', 'success')
      setIsAdding(false)
      setNewProduct({ stock: 0 })
    }
  }

  const handleDeleteProduct = async (productCode: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('product_code', productCode)
    if (error) {
      if (error.message.includes('violates foreign key constraint')) {
        showFeedback('Cannot delete this product because it has recorded sales. Void those sales in Reports first.', 'error')
      } else {
        showFeedback('Could not delete product. Please try again.', 'error')
      }
    } else {
      setProducts(prev => prev.filter(p => p.product_code !== productCode))
      showFeedback('Product deleted', 'success')
    }
  }

  const handleEditProduct = (product: Product) => {
    setNewProduct(product)
    setIsAdding(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDownloadTemplate = () => {
    const headers = ['product_code', 'type', 'brands', 'lens_width', 'location', 'stock', 'cost_price', 'sale_price_s', 'sale_price_a', 'mrp', 'comments']
    const blob = new Blob([headers.join(',') + '\n'], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, 'inventory_template.csv')
  }

  const handleExportData = () => {
    if (products.length === 0) return showFeedback('No products to export.', 'error')
    const blob = new Blob([Papa.unparse(products)], { type: 'text/csv;charset=utf-8;' })
    triggerDownload(blob, 'inventory_export.csv')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setFeedback(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        const rows = results.data as any[]
        const validRows: any[] = []
        const rowErrors: string[] = []
        const duplicateSkus: string[] = []

        rows.forEach((row, index) => {
          const rowNum = index + 2
          if (!row.product_code || String(row.product_code).trim() === '') {
            rowErrors.push(`Row ${rowNum}: Missing product_code`)
            return
          }
          const product_code = String(row.product_code).trim()
          const parseNumber = (val: any) => {
            if (!val || String(val).trim() === '') return null
            const num = parseFloat(val)
            return isNaN(num) ? 'INVALID' : num
          }
          const stock = parseNumber(row.stock) || 0
          const cp = parseNumber(row.cost_price)
          const sps = parseNumber(row.sale_price_s)
          const spa = parseNumber(row.sale_price_a)
          const mrp = parseNumber(row.mrp)
          if ([cp, sps, spa, mrp, stock].includes('INVALID' as any)) {
            rowErrors.push(`Row ${rowNum} (${product_code}): Invalid number format`)
            return
          }
          validRows.push({
            ...row,
            product_code,
            stock: stock as number,
            cost_price: cp as number | null,
            sale_price_s: sps as number | null,
            sale_price_a: spa as number | null,
            mrp: mrp as number | null,
          })
        })

        const uniqueRowsMap = new Map<string, any>()
        for (const row of validRows) {
          if (uniqueRowsMap.has(row.product_code)) duplicateSkus.push(row.product_code)
          uniqueRowsMap.set(row.product_code, row)
        }
        const uniqueValidRows = Array.from(uniqueRowsMap.values())

        if (uniqueValidRows.length === 0) {
          showFeedback('No valid products found. Make sure "product_code" column exists.', 'error')
          setIsUploading(false)
          return
        }

        const { data, error } = await supabase
          .from('products')
          .upsert(uniqueValidRows, { onConflict: 'product_code' })
          .select()

        if (error) {
          showFeedback('Error uploading CSV: ' + error.message, 'error', true)
        } else if (data) {
          let msg = `Successfully saved ${data.length} products.`
          if (duplicateSkus.length > 0) {
            const uniqueDupes = Array.from(new Set(duplicateSkus))
            msg += `\n\n${uniqueDupes.length} duplicate SKUs were merged (last row kept):\n` +
              uniqueDupes.slice(0, 10).map(s => `• ${s}`).join('\n')
            if (uniqueDupes.length > 10) msg += `\n…and ${uniqueDupes.length - 10} more.`
          }
          if (rowErrors.length > 0) {
            msg += `\n\n${rowErrors.length} rows skipped:\n` +
              rowErrors.slice(0, 10).map(e => `• ${e}`).join('\n')
            if (rowErrors.length > 10) msg += `\n…and ${rowErrors.length - 10} more.`
          }
          const needsPersistence = rowErrors.length > 0 || duplicateSkus.length > 0
          showFeedback(msg, rowErrors.length > 0 ? 'error' : 'success', needsPersistence)

          const newMap = new Map(data.map(item => [item.product_code, item]))
          setProducts(prev => {
            const merged = prev.map(p => (newMap.has(p.product_code) ? newMap.get(p.product_code)! : p))
            const added = data.filter(d => !prev.find(p => p.product_code === d.product_code))
            return [...added, ...merged]
          })
        }

        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
      error: error => {
        showFeedback('Error parsing CSV: ' + error.message, 'error')
        setIsUploading(false)
      },
    })
  }

  // ─── Presets ─────────────────────────────────────────────────────────
  const isLowStockPreset = filters.stock.mode === 'low'
  const isMissingPricingPreset =
    filters.cost.mode === 'missing' ||
    filters.sale_s.mode === 'missing' ||
    filters.sale_a.mode === 'missing' ||
    filters.mrp.mode === 'missing'
  const isMissingMrpPreset = filters.mrp.mode === 'missing'

  const applyLowStock = () =>
    setField('stock', isLowStockPreset ? { mode: 'any' } : { mode: 'low' })

  const applyMissingPricing = () => {
    if (isMissingPricingPreset) {
      replaceAll({
        cost:   { mode: 'any' },
        sale_s: { mode: 'any' },
        sale_a: { mode: 'any' },
        mrp:    { mode: 'any' },
      })
    } else {
      // Apply to whichever of these are not already set; default to all of them.
      replaceAll({
        cost:   { mode: 'missing' },
        sale_s: { mode: 'missing' },
        sale_a: { mode: 'missing' },
        mrp:    { mode: 'missing' },
      })
    }
  }

  const applyMissingMrp = () =>
    setField('mrp', isMissingMrpPreset ? { mode: 'any' } : { mode: 'missing' })

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {feedback && (
        <div
          className={cn(
            'flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-[13px]',
            feedback.type === 'success'
              ? 'border-accent-200 bg-accent-50 text-accent-700'
              : 'border-coral-200 bg-coral-50 text-coral-700',
          )}
        >
          <div className="whitespace-pre-line leading-relaxed">{feedback.message}</div>
          {feedback.persistent && (
            <button
              onClick={() => setFeedback(null)}
              className="shrink-0 rounded-md p-0.5 hover:bg-white/50"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsAdding(!isAdding)} size="sm">
            {isAdding ? <X size={14} /> : <Plus size={14} />}
            {isAdding ? 'Cancel' : 'Add product'}
          </Button>
          <Button onClick={handleDownloadTemplate} variant="secondary" size="sm">
            <FileText size={14} /> Template
          </Button>
          <input
            type="file" accept=".csv" ref={fileInputRef} className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary" size="sm"
            disabled={isUploading}
          >
            <Upload size={14} />
            {isUploading ? 'Uploading…' : 'Bulk upload'}
          </Button>
          <Button onClick={handleExportData} variant="secondary" size="sm" className="ml-auto">
            <Download size={14} /> Export
          </Button>
        </div>
      )}

      {isAdding && isAdmin && (
        <Card>
          <CardHeader><CardTitle>Add / update product</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField label="Product Code (SKU) *">
                  <Input required value={newProduct.product_code || ''}
                    onChange={e => setNewProduct({ ...newProduct, product_code: e.target.value })} />
                </FormField>
                <FormField label="Type">
                  <Input value={newProduct.type || ''}
                    onChange={e => setNewProduct({ ...newProduct, type: e.target.value })}
                    placeholder="e.g. SPECTACLE GLASS" />
                </FormField>
                <FormField label="Brand">
                  <Input value={newProduct.brands || ''}
                    onChange={e => setNewProduct({ ...newProduct, brands: e.target.value })} />
                </FormField>
                <FormField label="Lens Width">
                  <Input value={newProduct.lens_width || ''}
                    onChange={e => setNewProduct({ ...newProduct, lens_width: e.target.value })} />
                </FormField>
                <FormField label="Location">
                  <Input value={newProduct.location || ''}
                    onChange={e => setNewProduct({ ...newProduct, location: e.target.value })} />
                </FormField>
                <FormField label="Stock">
                  <Input type="number" value={newProduct.stock ?? 0}
                    onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })} />
                </FormField>
                <FormField label="Cost Price">
                  <Input type="number" value={newProduct.cost_price ?? ''}
                    onChange={e => setNewProduct({ ...newProduct, cost_price: parseFloat(e.target.value) })} />
                </FormField>
                <FormField label="Sale Price S (Store)">
                  <Input type="number" value={newProduct.sale_price_s ?? ''}
                    onChange={e => setNewProduct({ ...newProduct, sale_price_s: parseFloat(e.target.value) })} />
                </FormField>
                <FormField label="Sale Price A (Accounts)">
                  <Input type="number" value={newProduct.sale_price_a ?? ''}
                    onChange={e => setNewProduct({ ...newProduct, sale_price_a: parseFloat(e.target.value) })} />
                </FormField>
                <FormField label="MRP">
                  <Input type="number" value={newProduct.mrp ?? ''}
                    onChange={e => setNewProduct({ ...newProduct, mrp: parseFloat(e.target.value) })} />
                </FormField>
                <FormField label="Comments" className="md:col-span-2 lg:col-span-3">
                  <Input value={newProduct.comments || ''}
                    onChange={e => setNewProduct({ ...newProduct, comments: e.target.value })} />
                </FormField>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save product</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── Filter bar ──────────────────────────────────────────────── */}
      <FilterBar>
        <FilterBar.Toolbar>
          <FilterBar.Search
            value={filters.q}
            onChange={v => setField('q', v)}
            placeholder="Search SKU, brand, type, location, comments…"
          />
          <FilterBar.Presets>
            <FilterBar.Preset active={isLowStockPreset} onClick={applyLowStock}>
              Low stock
            </FilterBar.Preset>
            <FilterBar.Preset active={isMissingPricingPreset} onClick={applyMissingPricing}>
              Missing pricing
            </FilterBar.Preset>
            <FilterBar.Preset active={isMissingMrpPreset} onClick={applyMissingMrp}>
              Missing MRP
            </FilterBar.Preset>
          </FilterBar.Presets>
          <FilterBar.OpenButton onClick={() => setFilterPanelOpen(true)} count={activeCount} />
          <FilterBar.Actions>
            <FilterBar.Stats>
              <span className="font-medium text-ink-700 tabular">{filteredProducts.length}</span>
              {' of '}
              <span className="tabular">{products.length}</span>
              {' items'}
            </FilterBar.Stats>
          </FilterBar.Actions>
        </FilterBar.Toolbar>

        <FilterBar.Chips count={activeCount} onClearAll={clearAll}>
          {renderActiveChips(filters, setField, clearField, () => setFilterPanelOpen(true))}
        </FilterBar.Chips>
      </FilterBar>

      {/* ─── Table ──────────────────────────────────────────────────── */}
      {/* Density toggle — admins can opt into seeing the long-tail columns
          (Lens W., Location, Comments, Added). Default hides them so the
          table fits the viewport with no horizontal scroll. */}
      {isAdmin && (
        <div className="-mb-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowAllColumns(v => !v)}
            className="text-[12px] font-medium text-ink-500 hover:text-ink-800"
          >
            {showAllColumns ? 'Hide extra columns' : 'Show all columns'}
          </button>
        </div>
      )}

      <TableShell>
        <TableScroll>
          {/* Min-width only kicks in when "Show all columns" is on — that's
              when scroll is needed. Default view fits the viewport with no
              scroll. The fade overlay in TableScroll signals overflow. */}
          <Table minWidth={isAdmin && showAllColumns ? 1280 : undefined}>
            <Thead>
              <tr>
                <Th>SKU</Th>
                <Th>Type</Th>
                <Th>Brand</Th>
                {isAdmin && showAllColumns && <Th>Lens W.</Th>}
                {isAdmin && showAllColumns && <Th>Location</Th>}
                <Th>Stock</Th>
                {isAdmin && <Th className="text-right">Cost</Th>}
                <Th className="text-right">Sale S</Th>
                {isAdmin && <Th className="text-right">Sale A</Th>}
                {isAdmin && <Th className="text-right">MRP</Th>}
                {isAdmin && showAllColumns && <Th>Comments</Th>}
                {isAdmin && showAllColumns && <Th>Added</Th>}
                {isAdmin && <Th className="w-10" aria-label="Actions" />}
              </tr>
            </Thead>
          <tbody>
            {paginatedProducts.map(p => (
              <Tr key={p.product_code}>
                <Td className="font-medium text-ink-900">{p.product_code}</Td>
                <Td className="max-w-[200px] truncate text-ink-600" title={p.type ?? ''}>
                  {p.type ?? '—'}
                </Td>
                <Td className="max-w-[140px] truncate" title={p.brands ?? ''}>
                  {p.brands ?? '—'}
                </Td>
                {isAdmin && showAllColumns && <Td className="text-ink-500">{p.lens_width ?? '—'}</Td>}
                {isAdmin && showAllColumns && <Td className="text-ink-500">{p.location ?? '—'}</Td>}
                <Td>
                  <StockCell stock={p.stock} />
                </Td>
                {isAdmin && <Td className="text-right">{fmt(p.cost_price)}</Td>}
                <Td className="text-right">{fmt(p.sale_price_s)}</Td>
                {isAdmin && <Td className="text-right">{fmt(p.sale_price_a)}</Td>}
                {isAdmin && <Td className="text-right">{fmt(p.mrp)}</Td>}
                {isAdmin && showAllColumns && (
                  <Td className="max-w-[180px] truncate text-ink-500" title={p.comments ?? ''}>
                    {p.comments ?? ''}
                  </Td>
                )}
                {isAdmin && showAllColumns && (
                  <Td className="text-ink-500">
                    {p.date_added ? p.date_added.split('T')[0].slice(5) : ''}
                  </Td>
                )}
                {isAdmin && (
                  <Td className="w-10 text-right">
                    <RowActions
                      onEdit={() => handleEditProduct(p)}
                      onDelete={() => handleDeleteProduct(p.product_code)}
                    />
                  </Td>
                )}
              </Tr>
            ))}
            {paginatedProducts.length === 0 && (
              <TableEmpty
                colSpan={
                  isAdmin
                    ? showAllColumns ? 13 : 9
                    : 6
                }
                message={
                  activeCount > 0 || filters.q
                    ? 'No products match your filters.'
                    : 'No products yet.'
                }
              />
            )}
            </tbody>
          </Table>
        </TableScroll>
      </TableShell>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-[13px] text-ink-600">
          <Button variant="secondary" size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="tabular">
            Page <span className="font-medium text-ink-900">{currentPage}</span> of {totalPages}
          </span>
          <Button variant="secondary" size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {/* ─── Filter panel (drawer) ─────────────────────────────────── */}
      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        title="Inventory filters"
        activeCount={activeCount}
        onClearAll={clearAll}
      >
        <FilterSection title="Inventory">
          <MultiSelectPicker
            label="Type"
            options={uniqueTypes}
            value={filters.type}
            onChange={v => setField('type', v)}
          />
          <MultiSelectPicker
            label="Brand"
            options={uniqueBrands}
            value={filters.brand}
            onChange={v => setField('brand', v)}
          />
          <MultiSelectPicker
            label="Location"
            options={uniqueLocations}
            value={filters.location}
            onChange={v => setField('location', v)}
          />
        </FilterSection>

        <FilterSection title="Stock">
          <StockPicker value={filters.stock} onChange={v => setField('stock', v)} />
        </FilterSection>

        <FilterSection title="Pricing">
          <PresencePicker label="Cost"     value={filters.cost}   onChange={v => setField('cost', v)} />
          <PresencePicker label="Sale S"   value={filters.sale_s} onChange={v => setField('sale_s', v)} />
          <PresencePicker label="Sale A"   value={filters.sale_a} onChange={v => setField('sale_a', v)} />
          <PresencePicker label="MRP"      value={filters.mrp}    onChange={v => setField('mrp', v)} />
        </FilterSection>

        <FilterSection title="Date added">
          <DateRangePicker
            label="Range"
            value={filters.added}
            onChange={v => setField('added', v)}
          />
        </FilterSection>
      </FilterPanel>
    </div>
  )
}

// =============================================================
// Filter logic helpers
// =============================================================
function matchStock(stock: number, f: StockFilter): boolean {
  switch (f.mode) {
    case 'any':   return true
    case 'out':   return stock === 0
    case 'low':   return stock >= 1 && stock <= 2
    case 'in':    return stock > 0
    case 'range': {
      if (f.min != null && stock < f.min) return false
      if (f.max != null && stock > f.max) return false
      return true
    }
  }
}

function matchPresence(value: number | null, f: PresenceFilter): boolean {
  const isMissing = value === null || value === undefined || isNaN(Number(value))
  switch (f.mode) {
    case 'any':     return true
    case 'set':     return !isMissing
    case 'missing': return isMissing
    case 'range': {
      if (isMissing) return false
      const v = Number(value)
      if (f.min != null && v < f.min) return false
      if (f.max != null && v > f.max) return false
      return true
    }
  }
}

function matchDate(dateStr: string, f: DateRangeFilter): boolean {
  if (!f.from && !f.to) return true
  if (!dateStr) return false
  const d = dateStr.split('T')[0] // normalize to YYYY-MM-DD
  if (f.from && d < f.from) return false
  if (f.to && d > f.to) return false
  return true
}

// =============================================================
// Active filter chips
// =============================================================
function renderActiveChips(
  filters: any,
  setField: (k: any, v: any) => void,
  clearField: (k: any) => void,
  openPanel: () => void,
) {
  const chips: React.ReactNode[] = []

  if (filters.q) {
    chips.push(
      <FilterChip key="q" label="Search:" value={`"${filters.q}"`}
        onClick={openPanel} onRemove={() => clearField('q')} />
    )
  }
  if (filters.type.length) {
    chips.push(
      <FilterChip key="type" label="Type:" value={summarizeArray(filters.type)}
        onClick={openPanel} onRemove={() => clearField('type')} />
    )
  }
  if (filters.brand.length) {
    chips.push(
      <FilterChip key="brand" label="Brand:" value={summarizeArray(filters.brand)}
        onClick={openPanel} onRemove={() => clearField('brand')} />
    )
  }
  if (filters.location.length) {
    chips.push(
      <FilterChip key="location" label="Location:" value={summarizeArray(filters.location)}
        onClick={openPanel} onRemove={() => clearField('location')} />
    )
  }
  if (filters.stock.mode !== 'any') {
    chips.push(
      <FilterChip key="stock" label="Stock:" value={summarizeStock(filters.stock)}
        onClick={openPanel} onRemove={() => clearField('stock')} />
    )
  }
  for (const k of ['cost', 'sale_s', 'sale_a', 'mrp'] as const) {
    if (filters[k].mode !== 'any') {
      chips.push(
        <FilterChip key={k} label={`${labelOf(k)}:`} value={summarizePresence(filters[k])}
          onClick={openPanel} onRemove={() => clearField(k)} />
      )
    }
  }
  if (filters.added.from || filters.added.to) {
    chips.push(
      <FilterChip key="added" label="Added:" value={`${filters.added.from ?? '…'} → ${filters.added.to ?? '…'}`}
        onClick={openPanel} onRemove={() => clearField('added')} />
    )
  }

  return chips
}

const labelOf = (k: 'cost' | 'sale_s' | 'sale_a' | 'mrp') =>
  ({ cost: 'Cost', sale_s: 'Sale S', sale_a: 'Sale A', mrp: 'MRP' }[k])

function summarizeArray(arr: string[]) {
  if (arr.length === 0) return ''
  if (arr.length <= 2) return arr.join(', ')
  return `${arr.slice(0, 2).join(', ')} +${arr.length - 2}`
}

function summarizeStock(f: StockFilter) {
  switch (f.mode) {
    case 'out':   return '0 in stock'
    case 'low':   return 'Low (1–2)'
    case 'in':    return 'In stock'
    case 'range': return `${f.min ?? '…'}–${f.max ?? '…'}`
    default:      return ''
  }
}

function summarizePresence(f: PresenceFilter) {
  switch (f.mode) {
    case 'set':     return 'Is set'
    case 'missing': return 'Missing'
    case 'range':   return `${f.min ?? '…'}–${f.max ?? '…'}`
    default:        return ''
  }
}

// =============================================================
// Small components
// =============================================================
function FormField({
  label, children, className,
}: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

/**
 * Stock cell rendering — out-of-stock is the long-tail default state, not an
 * alarm. Only "low" (1–2) gets a warning color; everything else is neutral.
 */
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        onClick={onEdit}
        title="Edit"
        aria-label="Edit"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-brand-600 hover:bg-brand-50"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={onDelete}
        title="Delete"
        aria-label="Delete"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-coral-600 hover:bg-coral-50"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function StockCell({ stock }: { stock: number }) {
  if (stock >= 1 && stock <= 2) return <Badge tone="warn">{stock}</Badge>
  if (stock === 0) return <span className="text-ink-400">0</span>
  return <span className="font-medium text-ink-900">{stock}</span>
}

function fmt(v: number | null) {
  if (v === null || v === undefined || isNaN(v)) return <span className="text-ink-400">—</span>
  return <span className="text-ink-800">₹{v.toLocaleString('en-IN')}</span>
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Reset paginator to page 1 whenever the filter object reference changes.
 * Cheap effect — relies on stable reference from useTableFilters.
 */
function useMemoResetPage(filters: unknown, fn: () => void) {
  const ref = useRef(filters)
  if (ref.current !== filters) {
    ref.current = filters
    fn()
  }
}
