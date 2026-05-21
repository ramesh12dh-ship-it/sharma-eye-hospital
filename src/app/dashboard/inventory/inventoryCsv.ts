export type InventoryCsvRow = {
  product_code?: string | number | null
  lens_width?: string | number | null
  brands?: string | number | null
  location?: string | number | null
  type?: string | number | null
  comments?: string | number | null
  stock?: string | number | null
  cost_price?: string | number | null
  sale_price_s?: string | number | null
  sale_price_a?: string | number | null
  mrp?: string | number | null
}

export type InventoryProductUpsert = {
  product_code: string
  lens_width?: string | null
  brands?: string | null
  location?: string | null
  type?: string | null
  comments?: string | null
  stock?: number
  cost_price?: number | null
  sale_price_a?: number | null
  mrp?: number | null
}

export type InventoryUploadMode = 'safe' | 'stock-only' | 'rewrite'

export const inventoryTemplateHeaders = [
  'product_code',
  'type',
  'brands',
  'lens_width',
  'location',
  'stock',
  'cost_price',
  'sale_price_a',
  'mrp',
  'comments',
]

export function parseCsvText(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

function parseCsvNumber(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const num = Number(String(value).trim())
  return Number.isFinite(num) ? num : 'INVALID'
}

function hasColumn(row: InventoryCsvRow, key: keyof InventoryCsvRow) {
  return Object.prototype.hasOwnProperty.call(row, key)
}

function hasNonBlankColumn(row: InventoryCsvRow, key: keyof InventoryCsvRow) {
  return hasColumn(row, key) && String(row[key] ?? '').trim() !== ''
}

function assignText(
  target: InventoryProductUpsert,
  row: InventoryCsvRow,
  key: 'lens_width' | 'brands' | 'location' | 'type' | 'comments',
  mode: InventoryUploadMode,
) {
  if (mode === 'rewrite') {
    target[key] = parseCsvText(row[key])
    return
  }

  if (hasNonBlankColumn(row, key)) target[key] = parseCsvText(row[key])
}

function assignNumber(
  target: InventoryProductUpsert,
  row: InventoryCsvRow,
  key: 'stock' | 'cost_price' | 'sale_price_a' | 'mrp',
  value: number | null,
  mode: InventoryUploadMode,
) {
  if (key === 'stock') {
    if (mode === 'rewrite') {
      target.stock = value ?? 0
    } else if (hasNonBlankColumn(row, key)) {
      target.stock = value ?? 0
    }
    return
  }

  if (mode === 'rewrite') {
    target[key] = value
    return
  }

  if (hasNonBlankColumn(row, key)) target[key] = value
}

export function normalizeInventoryCsvRows(
  rows: InventoryCsvRow[],
  mode: InventoryUploadMode = 'safe',
) {
  const validRows: InventoryProductUpsert[] = []
  const rowErrors: string[] = []
  const duplicateSkus: string[] = []

  rows.forEach((row, index) => {
    const rowNum = index + 2
    if (!row.product_code || String(row.product_code).trim() === '') {
      rowErrors.push(`Row ${rowNum}: Missing product_code`)
      return
    }

    const product_code = String(row.product_code).trim()
    const stock = parseCsvNumber(row.stock)

    if (stock === 'INVALID') {
      rowErrors.push(`Row ${rowNum} (${product_code}): Invalid number format`)
      return
    }

    if (mode === 'stock-only') {
      if (!hasNonBlankColumn(row, 'stock')) {
        rowErrors.push(`Row ${rowNum} (${product_code}): Missing stock`)
        return
      }
      validRows.push({ product_code, stock: stock as number })
      return
    }

    const cp = parseCsvNumber(row.cost_price)
    const spa = parseCsvNumber(row.sale_price_a)
    const mrp = parseCsvNumber(row.mrp)

    if ([cp, spa, mrp].includes('INVALID')) {
      rowErrors.push(`Row ${rowNum} (${product_code}): Invalid number format`)
      return
    }

    const normalizedRow: InventoryProductUpsert = { product_code }
    assignText(normalizedRow, row, 'lens_width', mode)
    assignText(normalizedRow, row, 'brands', mode)
    assignText(normalizedRow, row, 'location', mode)
    assignText(normalizedRow, row, 'type', mode)
    assignText(normalizedRow, row, 'comments', mode)
    assignNumber(normalizedRow, row, 'stock', stock as number | null, mode)
    assignNumber(normalizedRow, row, 'cost_price', cp as number | null, mode)
    assignNumber(normalizedRow, row, 'sale_price_a', spa as number | null, mode)
    assignNumber(normalizedRow, row, 'mrp', mrp as number | null, mode)
    validRows.push(normalizedRow)
  })

  const uniqueRowsMap = new Map<string, InventoryProductUpsert>()
  for (const row of validRows) {
    if (uniqueRowsMap.has(row.product_code)) duplicateSkus.push(row.product_code)
    uniqueRowsMap.set(row.product_code, row)
  }

  return {
    uniqueValidRows: Array.from(uniqueRowsMap.values()),
    rowErrors,
    duplicateSkus,
  }
}
