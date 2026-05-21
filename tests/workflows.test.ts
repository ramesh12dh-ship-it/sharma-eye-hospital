import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  inventoryTemplateHeaders,
  normalizeInventoryCsvRows,
} from '../src/app/dashboard/inventory/inventoryCsv.ts'
import {
  calculateCartTotals,
  createCartItem,
  updateCartItemDiscount,
  updateCartItemSaleAmount,
} from '../src/app/dashboard/pos/pricing.ts'
import {
  buildReportExportData,
  calculateReportTotals,
  getReportSaleAmount,
} from '../src/app/dashboard/reports/reportAccounting.ts'

describe('inventory CSV normalization', () => {
  it('accepts the current template without sale_price_s', () => {
    const result = normalizeInventoryCsvRows([
      {
        product_code: ' SKU-1 ',
        type: 'Frame',
        brands: 'Acme',
        lens_width: '52',
        location: 'Dhuri',
        stock: '4',
        cost_price: '100',
        sale_price_a: '150',
        mrp: '200',
        comments: ' Ready ',
      },
    ])

    assert.deepEqual(result.rowErrors, [])
    assert.deepEqual(result.duplicateSkus, [])
    assert.deepEqual(result.uniqueValidRows, [
      {
        product_code: 'SKU-1',
        type: 'Frame',
        brands: 'Acme',
        lens_width: '52',
        location: 'Dhuri',
        stock: 4,
        cost_price: 100,
        sale_price_a: 150,
        mrp: 200,
        comments: 'Ready',
      },
    ])
  })

  it('accepts old templates with sale_price_s and ignores that field', () => {
    const result = normalizeInventoryCsvRows([
      {
        product_code: 'SKU-2',
        stock: '1',
        cost_price: '80',
        sale_price_s: '999',
        sale_price_a: '140',
        mrp: '180',
      },
    ])

    assert.equal(result.uniqueValidRows.length, 1)
    assert.equal('sale_price_s' in result.uniqueValidRows[0], false)
    assert.equal(result.uniqueValidRows[0].sale_price_a, 140)
    assert.equal(result.uniqueValidRows[0].mrp, 180)
  })

  it('rejects invalid numeric values in active numeric columns', () => {
    const result = normalizeInventoryCsvRows([
      { product_code: 'BAD-COST', cost_price: 'abc' },
      { product_code: 'BAD-SALE-A', sale_price_a: 'abc' },
      { product_code: 'BAD-MRP', mrp: 'abc' },
      { product_code: 'BAD-STOCK', stock: 'abc' },
    ])

    assert.deepEqual(result.uniqueValidRows, [])
    assert.equal(result.rowErrors.length, 4)
    assert.ok(result.rowErrors.every(error => error.includes('Invalid number format')))
  })

  it('keeps stock, sale_price_a, and mrp aligned after duplicate SKU imports', () => {
    const result = normalizeInventoryCsvRows([
      { product_code: 'SKU-3', stock: '1', sale_price_a: '100', mrp: '120' },
      { product_code: 'SKU-3', stock: '9', sale_price_a: '190', mrp: '250' },
    ])

    assert.deepEqual(result.duplicateSkus, ['SKU-3'])
    assert.deepEqual(result.uniqueValidRows, [
      {
        product_code: 'SKU-3',
        stock: 9,
        sale_price_a: 190,
        mrp: 250,
      },
    ])
  })

  it('safe mode preserves existing values when CSV cells are blank', () => {
    const result = normalizeInventoryCsvRows([
      {
        product_code: 'SKU-6',
        stock: '3',
        cost_price: '',
        sale_price_a: '',
        mrp: '500',
        comments: '',
      },
    ])

    assert.deepEqual(result.rowErrors, [])
    assert.deepEqual(result.uniqueValidRows, [
      {
        product_code: 'SKU-6',
        stock: 3,
        mrp: 500,
      },
    ])
  })

  it('stock-only mode ignores every non-stock field', () => {
    const result = normalizeInventoryCsvRows([
      {
        product_code: 'SKU-7',
        stock: '8',
        mrp: 'not used',
        sale_price_a: 'also not used',
        comments: 'Should not upload',
      },
    ], 'stock-only')

    assert.deepEqual(result.rowErrors, [])
    assert.deepEqual(result.uniqueValidRows, [
      {
        product_code: 'SKU-7',
        stock: 8,
      },
    ])
  })

  it('stock-only mode rejects blank stock values', () => {
    const result = normalizeInventoryCsvRows([
      { product_code: 'SKU-8', stock: '' },
    ], 'stock-only')

    assert.deepEqual(result.uniqueValidRows, [])
    assert.deepEqual(result.rowErrors, ['Row 2 (SKU-8): Missing stock'])
  })

  it('rewrite mode clears blank fields and defaults blank stock to zero', () => {
    const result = normalizeInventoryCsvRows([
      {
        product_code: 'SKU-9',
        stock: '',
        cost_price: '',
        sale_price_a: '',
        mrp: '',
        comments: '',
      },
    ], 'rewrite')

    assert.deepEqual(result.rowErrors, [])
    assert.deepEqual(result.uniqueValidRows, [
      {
        product_code: 'SKU-9',
        lens_width: null,
        brands: null,
        location: null,
        type: null,
        comments: null,
        stock: 0,
        cost_price: null,
        sale_price_a: null,
        mrp: null,
      },
    ])
  })

  it('generates template headers without sale_price_s', () => {
    assert.equal(inventoryTemplateHeaders.includes('sale_price_s'), false)
    assert.deepEqual(
      inventoryTemplateHeaders,
      ['product_code', 'type', 'brands', 'lens_width', 'location', 'stock', 'cost_price', 'sale_price_a', 'mrp', 'comments'],
    )
  })
})

describe('POS pricing', () => {
  const product = {
    product_code: 'SKU-4',
    stock: 2,
    mrp: 1000,
    type: 'Frame',
    brands: 'Acme',
  }

  it('defaults sale price to MRP when a product is added', () => {
    assert.deepEqual(createCartItem(product), {
      product,
      saleAmount: 1000,
      discountPercent: 0,
      taxRate: 5,
    })
  })

  it('editing discount recalculates sale price', () => {
    const item = updateCartItemDiscount(createCartItem(product), 12.5)

    assert.equal(item.discountPercent, 12.5)
    assert.equal(item.saleAmount, 875)
  })

  it('clamps discount percent even when MRP is missing', () => {
    const missingMrpItem = createCartItem({ ...product, mrp: null })

    assert.equal(updateCartItemDiscount(missingMrpItem, 120).discountPercent, 100)
    assert.equal(updateCartItemDiscount(missingMrpItem, -5).discountPercent, 0)
    assert.equal(updateCartItemDiscount(missingMrpItem, 120).saleAmount, '')
  })

  it('editing sale price recalculates discount percent', () => {
    const item = updateCartItemSaleAmount(createCartItem(product), 750)

    assert.equal(item.saleAmount, 750)
    assert.equal(item.discountPercent, 25)
  })

  it('clears discount percent when editing sale price without MRP', () => {
    const item = updateCartItemSaleAmount(createCartItem({ ...product, mrp: null }), 750)

    assert.equal(item.saleAmount, 750)
    assert.equal(item.discountPercent, '')
  })

  it('calculates tax from final sale price, not MRP', () => {
    const item = updateCartItemDiscount({ ...createCartItem(product), taxRate: 12 }, 25)
    const totals = calculateCartTotals([item])

    assert.equal(totals.mrpTotal, 1000)
    assert.equal(totals.saleTotal, 750)
    assert.equal(totals.discountTotal, 250)
    assert.equal(totals.taxAmount, 90)
    assert.equal(totals.totalWithTax, 840)
  })

  it('requires manual sale price entry when MRP is missing', () => {
    const item = createCartItem({ ...product, mrp: null })

    assert.equal(item.saleAmount, '')
    assert.equal(item.discountPercent, 0)
  })
})

describe('reports accounting source of truth', () => {
  const sale = {
    product_code: 'SKU-5',
    sale_date: '2026-05-21T10:00:00.000Z',
    payment_mode: 'Cash',
    tax_rate: 5,
    sale_amount: 1,
    is_voided: false,
    products: { sale_price_a: 500 },
    patients: { name: 'Patient', phone: '123' },
  }

  it('uses sales.sale_amount for transaction-time report totals', () => {
    assert.equal(getReportSaleAmount(sale), 1)
    assert.equal(calculateReportTotals([sale]).totalSales, 1)
    assert.equal(calculateReportTotals([sale]).totalTax, 0.05)
  })

  it('excludes voided sales from report totals', () => {
    assert.deepEqual(
      calculateReportTotals([{ ...sale, is_voided: true }]),
      {
        totalSales: 0,
        totalTax: 0,
        transactionCount: 0,
      },
    )
  })

  it('exports transaction-time sale amount, not catalog sale_price_a', () => {
    const exportRow = buildReportExportData([sale])[0]

    assert.equal(exportRow['Sale amount'], 1)
    assert.equal('Sale price' in exportRow, false)
    assert.equal(exportRow['Payment Mode'], 'Cash')
  })
})

describe('workflow source guards', () => {
  it('keeps sale_price_s out of inventory UI text', () => {
    const source = readFileSync('src/app/dashboard/inventory/InventoryTable.tsx', 'utf8')

    assert.equal(source.includes('sale_price_s'), false)
    assert.equal(source.includes('Sale Price S'), false)
    assert.equal(source.includes('Sale S'), false)
    assert.equal(source.includes('Sale price A'), true)
    assert.equal(source.includes('MRP'), true)
  })

  it('fetches POS products with mrp instead of sale_price_s', () => {
    const source = readFileSync('src/app/dashboard/pos/page.tsx', 'utf8')

    assert.equal(source.includes('product_code, stock, mrp, type, brands'), true)
    assert.equal(source.includes('sale_price_s'), false)
  })

  it('submits final sale price and refreshes recent sales after recording', () => {
    const source = readFileSync('src/app/dashboard/pos/PosForm.tsx', 'utf8')

    assert.equal(source.includes('sale_amount: Number(item.saleAmount)'), true)
    assert.equal(source.includes('router.refresh()'), true)
  })
})
