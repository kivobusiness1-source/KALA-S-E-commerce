/**
 * Commission Calculation Library — SERVER-SIDE ONLY
 *
 * This module contains the pure business logic for calculating affiliate commissions.
 * It must NEVER be imported on the client side.
 *
 * Rules:
 * - Commission is ALWAYS calculated server-side
 * - Tiered commission: Month 1 uses commissionMonth1PerUnit, Month 2+ uses commissionMonth2PlusPerUnit
 * - Falls back to commissionPerUnit if tiered rates are not set
 * - Formula: commissionTotal = totalUnits × commissionPerUnit
 * - For packs: totalUnits = quantity × packSize
 * - For individual items: totalUnits = quantity
 * - No affiliate code → no commission
 * - Commission is independent of selling price (never subtract from price)
 */

// ── Types ──────────────────────────────────────────────────

export interface CommissionInput {
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  quantity: number        // units or packs ordered
  unitPrice: number       // price per unit/pack
  isPack: boolean         // true if ordering by pack
  packSize?: number       // pack size (e.g., 12, 10)
  totalUnits: number      // actual number of physical units
}

export interface CommissionResult {
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  quantity: number
  unitPrice: number
  totalSaleAmount: number
  commissionPerUnit: number
  commissionTotal: number
  commissionMonth: number  // Which month this commission falls in (1 = first month, 2+ = subsequent)
}

/**
 * Tiered commission rates for a product/variant.
 * Used to determine the correct rate based on which month the affiliate is in.
 */
export interface TieredCommissionRates {
  commissionPerUnit?: number | null          // Fallback (no tiered config)
  commissionMonth1PerUnit?: number | null    // Month 1 rate
  commissionMonth2PlusPerUnit?: number | null // Month 2+ rate
}

// ── Core Calculation ───────────────────────────────────────

/**
 * Calculate total units for an order item.
 * For packs: quantity × packSize
 * For individual items: quantity
 */
export function calculateTotalUnits(
  quantity: number,
  isPack: boolean,
  packSize?: number,
): number {
  if (isPack && packSize && packSize > 0) {
    return quantity * packSize
  }
  return quantity
}

/**
 * Determine the commission month for an affiliate+product+customer triple.
 *
 * IMPORTANT: Each new customer starts at month 1, even if the affiliate has already
 * earned commissions from other customers for the same product.
 *
 * Month 1 = the calendar month in which the affiliate first earned commission on this product FOR THIS CUSTOMER.
 * Month 2+ = any subsequent calendar month for that same customer.
 *
 * @param firstCommissionAt - The date of the first commission for this affiliate+product+customer (null if none exists yet)
 * @param now - Current date/time
 * @returns The commission month number (1 = first month, 2+ = subsequent months)
 */
export function determineCommissionMonth(
  firstCommissionAt: Date | null | undefined,
  now: Date = new Date(),
): number {
  if (!firstCommissionAt) {
    // No prior commission → this is month 1
    return 1
  }

  // Calculate the number of full calendar months between firstCommissionAt and now
  const startYear = firstCommissionAt.getFullYear()
  const startMonth = firstCommissionAt.getMonth()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth()

  const monthDiff = (nowYear - startYear) * 12 + (nowMonth - startMonth)

  // If same month → month 1, otherwise month 2+
  return monthDiff === 0 ? 1 : Math.min(monthDiff + 1, 12)
}

/**
 * Get the appropriate commission rate based on the month.
 *
 * Priority:
 * 1. If commissionMonth is 1 and commissionMonth1PerUnit is set → use it
 * 2. If commissionMonth is 2+ and commissionMonth2PlusPerUnit is set → use it
 * 3. Fallback to commissionPerUnit
 *
 * @param rates - The tiered commission rates for the product/variant
 * @param commissionMonth - The month number (1 = first month, 2+ = subsequent)
 * @returns The commission per unit, or null if no rate is configured
 */
export function getTieredCommissionRate(
  rates: TieredCommissionRates,
  commissionMonth: number,
): number | null {
  if (commissionMonth === 1) {
    // Month 1: prefer month1 rate, fallback to general, then null
    if (rates.commissionMonth1PerUnit != null && rates.commissionMonth1PerUnit > 0) {
      return rates.commissionMonth1PerUnit
    }
  } else {
    // Month 2+: prefer month2+ rate, fallback to general, then null
    if (rates.commissionMonth2PlusPerUnit != null && rates.commissionMonth2PlusPerUnit > 0) {
      return rates.commissionMonth2PlusPerUnit
    }
  }

  // Fallback to generic commissionPerUnit
  if (rates.commissionPerUnit != null && rates.commissionPerUnit > 0) {
    return rates.commissionPerUnit
  }

  return null
}

/**
 * Calculate commission for a single order item with tiered rates.
 *
 * @param item - The order item details
 * @param rates - The tiered commission rates (from product/variant)
 * @param commissionMonth - The month number for this affiliate+product pair
 * @returns CommissionResult with commissionTotal, or null if no commission applies
 */
export function calculateTieredItemCommission(
  item: CommissionInput,
  rates: TieredCommissionRates,
  commissionMonth: number,
): CommissionResult | null {
  const commissionPerUnit = getTieredCommissionRate(rates, commissionMonth)

  if (commissionPerUnit === null || commissionPerUnit <= 0) {
    return null
  }

  const totalUnits = item.totalUnits
  const commissionTotal = totalUnits * commissionPerUnit
  const totalSaleAmount = item.quantity * item.unitPrice

  return {
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    variantName: item.variantName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalSaleAmount,
    commissionPerUnit,
    commissionTotal,
    commissionMonth,
  }
}

/**
 * Calculate commission for a single order item (legacy, non-tiered).
 *
 * @param item - The order item details
 * @param commissionPerUnit - Commission per physical unit (from product or variant)
 * @returns CommissionResult with commissionTotal, or null if no commission applies
 */
export function calculateItemCommission(
  item: CommissionInput,
  commissionPerUnit: number | null | undefined,
): CommissionResult | null {
  // If no commission rate is defined, no commission
  if (!commissionPerUnit || commissionPerUnit <= 0) {
    return null
  }

  const totalUnits = item.totalUnits
  const commissionTotal = totalUnits * commissionPerUnit
  const totalSaleAmount = item.quantity * item.unitPrice

  return {
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    variantName: item.variantName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalSaleAmount,
    commissionPerUnit,
    commissionTotal,
    commissionMonth: 1, // Default to month 1 for legacy
  }
}

/**
 * Calculate commissions for multiple items at once.
 * Filters out items with no commission.
 */
export function calculateOrderCommissions(
  items: CommissionInput[],
  getCommissionPerUnit: (item: CommissionInput) => number | null | undefined,
): CommissionResult[] {
  const results: CommissionResult[] = []

  for (const item of items) {
    const commissionPerUnit = getCommissionPerUnit(item)
    const result = calculateItemCommission(item, commissionPerUnit)
    if (result) {
      results.push(result)
    }
  }

  return results
}

/**
 * Sum total commission across all items.
 */
export function sumCommissions(results: CommissionResult[]): number {
  return results.reduce((sum, r) => sum + r.commissionTotal, 0)
}
