export function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR') + ' FCFA'
}

export function getCategoryColor(slug: string): string {
  return 'bg-gray-200'
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
    case 'pending': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'processing': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'shipped': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'delivered': return 'bg-green-50 text-green-700 border-green-200'
    case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
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
