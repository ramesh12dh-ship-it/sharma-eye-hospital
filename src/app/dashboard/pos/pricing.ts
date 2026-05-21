export type PosProduct = {
  product_code: string
  stock: number
  mrp: number | null
  type: string | null
  brands: string | null
}

export type PosCartItem = {
  product: PosProduct
  saleAmount: number | ''
  discountPercent: number | ''
  taxRate: 5 | 12
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function discountFromSaleAmount(mrp: number | null, saleAmount: number | '') {
  if (!mrp || mrp <= 0 || saleAmount === '') return ''
  return roundMoney(Math.max(0, (1 - Number(saleAmount) / mrp) * 100))
}

export function createCartItem(product: PosProduct): PosCartItem {
  return {
    product,
    saleAmount: product.mrp ?? '',
    discountPercent: 0,
    taxRate: 5,
  }
}

export function updateCartItemSaleAmount(item: PosCartItem, saleAmount: number | ''): PosCartItem {
  return {
    ...item,
    saleAmount,
    discountPercent: discountFromSaleAmount(item.product.mrp, saleAmount),
  }
}

export function updateCartItemDiscount(item: PosCartItem, discountPercent: number | ''): PosCartItem {
  if (discountPercent === '') {
    return { ...item, discountPercent }
  }

  const boundedDiscount = Math.min(100, Math.max(0, discountPercent))
  if (!item.product.mrp) {
    return { ...item, discountPercent: boundedDiscount }
  }

  return {
    ...item,
    discountPercent: boundedDiscount,
    saleAmount: roundMoney(item.product.mrp * (1 - boundedDiscount / 100)),
  }
}

export function calculateCartTotals(cart: PosCartItem[]) {
  const mrpTotal = cart.reduce((sum, item) => sum + (Number(item.product.mrp) || 0), 0)
  const saleTotal = cart.reduce((sum, item) => sum + (Number(item.saleAmount) || 0), 0)
  const discountTotal = Math.max(0, mrpTotal - saleTotal)
  const taxAmount = cart.reduce(
    (sum, item) => sum + (Number(item.saleAmount) || 0) * (item.taxRate / 100),
    0,
  )

  return {
    mrpTotal,
    saleTotal,
    discountTotal,
    taxAmount,
    totalWithTax: saleTotal + taxAmount,
  }
}
