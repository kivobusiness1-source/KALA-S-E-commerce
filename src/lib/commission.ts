/**
 * Commission Calculation Library — SERVER-SIDE ONLY
 *
 * This module contains the pure business logic for calculating affiliate commissions.
 * It must NEVER be imported on the client side.
 *
 * Rules:
 * - Commission is ALWAYS calculated server-side
 * - commissionPerUnit comes from Product or ProductVariant (variant overrides product)
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
 * Calculate commission for a single order item.
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
