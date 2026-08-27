export function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR') + ' FCFA'
}

export function getCategoryColor(slug: string): string {
  switch (slug) {
    case 'savon-liquide':
      return 'from-emerald-400 to-teal-500'
    case 'detergent':
      return 'from-amber-400 to-orange-500'
    case 'eau-de-javel':
      return 'from-cyan-400 to-sky-500'
    default:
      return 'from-emerald-400 to-emerald-600'
  }
}

export function getCategoryInitial(slug: string): string {
  switch (slug) {
    case 'savon-liquide':
      return 'SL'
    case 'detergent':
      return 'DT'
    case 'eau-de-javel':
      return 'EJ'
    default:
      return 'CC'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'processing': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'shipped': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'En attente'
    case 'confirmed': return 'Confirmée'
    case 'processing': return 'En traitement'
    case 'shipped': return 'Expédiée'
    case 'delivered': return 'Livrée'
    case 'cancelled': return 'Annulée'
    default: return status
  }
}

export function isNewProduct(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return created >= thirtyDaysAgo
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
