'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package,
  Truck,
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShoppingCart,
  StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WholesaleProductType {
  id: string
  name: string
  description: string | null
  lotSize: number
  lotUnit: string
  pricePerLot: number
  comparePrice: number | null
  image: string | null
  isActive: boolean
  minLots: number
  stockLots: number
}

interface PaymentMethodType {
  id: string
  name: string
  description: string | null
  accountInfo: string | null
  icon: string | null
  isActive: boolean
  isCash: boolean
  sortOrder: number
}

interface CustomerInfo {
  customerName: string
  customerPhone: string
  customerEmail: string
  companyName: string
  nif: string
  stat: string
  address: string
  quartier: string
  city: string
}

interface OrderItem {
  wholesaleProductId: string
  lotsQuantity: number
}

interface TrackedWholesaleOrder {
  id: string
  orderNumber: string
  trackingCode: string
  customerName: string
  customerEmail: string
  customerPhone: string
  companyName: string | null
  nif: string | null
  stat: string | null
  address: string
  city: string
  quartier: string | null
  status: string
  totalAmount: number
  notes: string | null
  paymentRef: string | null
  paymentStatus: string
  createdAt: string
  items: {
    productName: string
    lotsQuantity: number
    lotSize: number
    lotUnit: string
    totalUnits: number
    pricePerLot: number
    totalPrice: number
  }[]
  paymentMethod: {
    id: string
    name: string
    description: string | null
    accountInfo: string | null
    icon: string | null
    isCash: boolean
  } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    processing: 'En traitement',
    ready: 'Prête',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  }
  return map[status] || status
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-emerald-50 text-emerald-700',
    processing: 'bg-amber-50 text-amber-700',
    ready: 'bg-teal-50 text-teal-700',
    shipped: 'bg-blue-50 text-blue-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

// ─── Step Labels ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Vos Coordonnées', icon: User },
  { label: 'Votre Commande', icon: ShoppingCart },
  { label: 'Paiement', icon: CreditCard },
] as const

const WHOLESALE_STATUS_STEPS = ['pending', 'confirmed', 'processing', 'ready', 'shipped', 'delivered'] as const

const WHOLESALE_STEP_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En traitement',
  ready: 'Prête',
  shipped: 'Expédiée',
  delivered: 'Livrée',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps = 3 }: { currentStep: number; totalSteps?: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentStep
        const isCurrent = i === currentStep
        const Icon = step.icon
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span
                className={`text-xs font-medium text-center max-w-[80px] ${
                  isCurrent ? 'text-emerald-700' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors duration-300 ${
                  isCompleted ? 'bg-emerald-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function InlineError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  )
}

// ─── Step 1: Customer Info ───────────────────────────────────────────────────

function StepCoordonnees({
  data,
  onChange,
  errors,
}: {
  data: CustomerInfo
  onChange: (field: keyof CustomerInfo, value: string) => void
  errors: Record<string, string>
}) {
  const fields: { key: keyof CustomerInfo; label: string; required?: boolean; icon: typeof User; placeholder: string; type?: string }[] = [
    { key: 'customerName', label: 'Nom complet', required: true, icon: User, placeholder: 'Ex: Jean Mouanda' },
    { key: 'customerPhone', label: 'Téléphone', required: true, icon: Phone, placeholder: 'Ex: +242 06 123 4567', type: 'tel' },
    { key: 'customerEmail', label: 'Email', required: true, icon: Mail, placeholder: 'Ex: jean@entreprise.cg', type: 'email' },
  ]

  const optionalFields: { key: keyof CustomerInfo; label: string; icon: typeof Building; placeholder: string }[] = [
    { key: 'companyName', label: "Nom de l'entreprise", icon: Building, placeholder: 'Ex: Congo Services SARL' },
    { key: 'nif', label: 'NIF', icon: Building, placeholder: 'Numéro Identification Fiscale' },
    { key: 'stat', label: 'STAT', icon: Building, placeholder: 'STAT' },
  ]

  const addressFields: { key: keyof CustomerInfo; label: string; required?: boolean; icon: typeof MapPin; placeholder: string }[] = [
    { key: 'address', label: 'Adresse', required: true, icon: MapPin, placeholder: 'Ex: 45 Ave. Amilcar Cabral' },
    { key: 'quartier', label: 'Quartier', icon: MapPin, placeholder: 'Ex: Bacongo' },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Vos Coordonnées</h3>
        <p className="text-sm text-gray-500">Renseignez vos informations pour la commande</p>
      </div>

      {/* Required fields */}
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <Label htmlFor={f.key} className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <f.icon className="w-3.5 h-3.5 text-emerald-600" />
              {f.label}
              {f.required && <span className="text-red-400">*</span>}
            </Label>
            <Input
              id={f.key}
              type={f.type || 'text'}
              placeholder={f.placeholder}
              value={data[f.key]}
              onChange={(e) => onChange(f.key, e.target.value)}
              className={`border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 ${errors[f.key] ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''}`}
            />
            {errors[f.key] && <InlineError message={errors[f.key]} />}
          </div>
        ))}
      </div>

      <Separator />

      {/* Optional business fields */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Informations entreprise (optionnel)</p>
        <div className="space-y-4">
          {optionalFields.map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key} className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <f.icon className="w-3.5 h-3.5 text-gray-400" />
                {f.label}
              </Label>
              <Input
                id={f.key}
                placeholder={f.placeholder}
                value={data[f.key]}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Address fields */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Adresse de livraison</p>
        <div className="space-y-4">
          {addressFields.map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key} className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <f.icon className="w-3.5 h-3.5 text-emerald-600" />
                {f.label}
                {f.required && <span className="text-red-400">*</span>}
              </Label>
              <Input
                id={f.key}
                placeholder={f.placeholder}
                value={data[f.key]}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={`border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 ${errors[f.key] ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors[f.key] && <InlineError message={errors[f.key]} />}
            </div>
          ))}
          {/* City field (fixed) */}
          <div>
            <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Ville
            </Label>
            <Input id="city" value={data.city} disabled className="border-gray-200 bg-gray-50 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Order Items ─────────────────────────────────────────────────────

function StepCommande({
  products,
  quantities,
  onQuantityChange,
  loading,
  error,
}: {
  products: WholesaleProductType[]
  quantities: Record<string, number>
  onQuantityChange: (productId: string, qty: number) => void
  loading: boolean
  error: string | null
}) {
  const totalAmount = products.reduce((sum, p) => sum + (quantities[p.id] || 0) * p.pricePerLot, 0)
  const hasItems = products.some((p) => (quantities[p.id] || 0) > 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-gray-500">Chargement des produits…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Aucun produit disponible en gros pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Votre Commande</h3>
        <p className="text-sm text-gray-500">Sélectionnez les produits et la quantité de lots souhaitée</p>
      </div>

      <div className="space-y-4">
        {products.map((product) => {
          const qty = quantities[product.id] || 0
          const lineTotal = qty * product.pricePerLot
          const meetsMin = qty === 0 || qty >= product.minLots

          return (
            <Card key={product.id} className={`border transition-all duration-200 ${qty > 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Product image placeholder */}
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm">{product.name}</h4>
                    {product.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                        1 lot = {product.lotSize} {product.lotUnit}
                      </Badge>
                      <span className="text-sm font-bold text-emerald-700">{formatPrice(product.pricePerLot)}/lot</span>
                      {product.comparePrice && (
                        <span className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
                      )}
                    </div>
                    {product.stockLots > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{product.stockLots} lots disponibles</p>
                    )}
                  </div>
                </div>

                {/* Quantity input */}
                <div className="mt-3 flex items-center gap-3">
                  <Label className="text-xs text-gray-500 whitespace-nowrap">Nombre de lots :</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 border-gray-200"
                      onClick={() => onQuantityChange(product.id, Math.max(0, qty - 1))}
                      disabled={qty <= 0}
                    >
                      <span className="text-lg leading-none">−</span>
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={qty}
                      onChange={(e) => onQuantityChange(product.id, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 text-center border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 border-gray-200"
                      onClick={() => onQuantityChange(product.id, qty + 1)}
                    >
                      <span className="text-lg leading-none">+</span>
                    </Button>
                  </div>
                  {qty > 0 && !meetsMin && (
                    <InlineError message={`Minimum ${product.minLots} lots`} />
                  )}
                  {qty > 0 && meetsMin && (
                    <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">
                      = {qty * product.lotSize} {product.lotUnit} → <span className="font-semibold text-emerald-700">{formatPrice(lineTotal)}</span>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Running total */}
      <Separator />
      <div className="flex items-center justify-between px-2">
        <span className="text-sm text-gray-600">{hasItems ? 'Total estimé' : 'Sélectionnez des produits'}</span>
        <span className={`text-lg font-bold ${hasItems ? 'text-emerald-700' : 'text-gray-300'}`}>
          {formatPrice(totalAmount)}
        </span>
      </div>
    </div>
  )
}

// ─── Step 3: Payment ─────────────────────────────────────────────────────────

function StepPaiement({
  paymentMethods,
  selectedMethodId,
  onSelectMethod,
  paymentRef,
  onPaymentRefChange,
  notes,
  onNotesChange,
  loading,
  error,
}: {
  paymentMethods: PaymentMethodType[]
  selectedMethodId: string | null
  onSelectMethod: (id: string) => void
  paymentRef: string
  onPaymentRefChange: (val: string) => void
  notes: string
  onNotesChange: (val: string) => void
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-gray-500">Chargement des modes de paiement…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId)

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Paiement</h3>
        <p className="text-sm text-gray-500">Choisissez votre mode de paiement</p>
      </div>

      {/* Payment method cards */}
      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethodId === method.id
          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    isSelected ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}
                >
                  {method.icon || (method.isCash ? '💵' : '📱')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>{method.name}</p>
                  {method.isCash && (
                    <p className="text-xs text-gray-500 mt-0.5">Paiement à la livraison</p>
                  )}
                  {!method.isCash && method.accountInfo && (
                    <p className="text-xs text-gray-500 mt-0.5">Envoyer au : <span className="font-mono font-medium">{method.accountInfo}</span></p>
                  )}
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Mobile money instructions */}
      {selectedMethod && !selectedMethod.isCash && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-emerald-800">Instructions pour {selectedMethod.name}</p>
            <ol className="text-xs text-gray-700 space-y-1.5 list-decimal list-inside">
              <li>Envoyez le montant exact au numéro <span className="font-mono font-semibold">{selectedMethod.accountInfo}</span></li>
              <li>Notez la référence/ID de la transaction</li>
              <li>Saisissez cette référence ci-dessous</li>
            </ol>
            <div>
              <Label htmlFor="paymentRef" className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                Référence de transaction
              </Label>
              <Input
                id="paymentRef"
                placeholder="Ex: TXN123456"
                value={paymentRef}
                onChange={(e) => onPaymentRefChange(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash on delivery note */}
      {selectedMethod?.isCash && (
        <Card className="border-teal-200 bg-teal-50/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <p className="text-sm text-teal-800">
                Vous paierez en espèces lors de la livraison. Préparez le montant exact pour faciliter la transaction.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Notes */}
      <div>
        <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5 text-gray-400" />
          Notes / Commentaires (optionnel)
        </Label>
        <Textarea
          id="notes"
          placeholder="Instructions spéciales, horaire de livraison préféré…"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
        />
      </div>
    </div>
  )
}

// ─── Review & Confirm ────────────────────────────────────────────────────────

function ReviewStep({
  customer,
  products,
  quantities,
  paymentMethods,
  selectedMethodId,
  paymentRef,
  notes,
  onConfirm,
  loading,
}: {
  customer: CustomerInfo
  products: WholesaleProductType[]
  quantities: Record<string, number>
  paymentMethods: PaymentMethodType[]
  selectedMethodId: string | null
  paymentRef: string
  notes: string
  onConfirm: () => void
  loading: boolean
}) {
  const selectedProducts = products.filter((p) => (quantities[p.id] || 0) > 0)
  const totalAmount = selectedProducts.reduce((sum, p) => sum + (quantities[p.id] || 0) * p.pricePerLot, 0)
  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId)

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Récapitulatif de la Commande</h3>
        <p className="text-sm text-gray-500">Vérifiez vos informations avant de confirmer</p>
      </div>

      {/* Customer info */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            Vos Coordonnées
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1">
          <p className="text-sm text-gray-800 font-medium">{customer.customerName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{customer.customerPhone}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{customer.customerEmail}</p>
          {customer.companyName && <p className="text-xs text-gray-500 flex items-center gap-1"><Building className="w-3 h-3" />{customer.companyName}</p>}
          {(customer.nif || customer.stat) && (
            <p className="text-xs text-gray-500">
              {customer.nif && `NIF: ${customer.nif}`}
              {customer.nif && customer.stat && ' · '}
              {customer.stat && `STAT: ${customer.stat}`}
            </p>
          )}
          <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{customer.address}{customer.quartier ? `, ${customer.quartier}` : ''}, {customer.city}</p>
        </CardContent>
      </Card>

      {/* Order items */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            Votre Commande
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {selectedProducts.map((p) => {
            const qty = quantities[p.id]
            return (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{qty} lots × {p.lotSize} {p.lotUnit} = {qty * p.lotSize} {p.lotUnit}</p>
                </div>
                <p className="font-semibold text-emerald-700 ml-3 whitespace-nowrap">{formatPrice(qty * p.pricePerLot)}</p>
              </div>
            )
          })}
          <Separator className="my-2" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="text-lg font-bold text-emerald-700">{formatPrice(totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card className="border-gray-200">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-1">
          {selectedMethod ? (
            <>
              <p className="text-sm text-gray-800 font-medium">{selectedMethod.name}</p>
              {!selectedMethod.isCash && selectedMethod.accountInfo && (
                <p className="text-xs text-gray-500">Compte : <span className="font-mono">{selectedMethod.accountInfo}</span></p>
              )}
              {selectedMethod.isCash && <p className="text-xs text-gray-500">Paiement à la livraison</p>}
              {paymentRef && <p className="text-xs text-gray-500">Réf. : {paymentRef}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-500">Aucun mode sélectionné</p>
          )}
        </CardContent>
      </Card>

      {notes && (
        <Card className="border-gray-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-emerald-600" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-gray-600">{notes}</p>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={onConfirm}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Envoi en cours…
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Confirmer la commande
          </>
        )}
      </Button>
    </div>
  )
}

// ─── Order Success ───────────────────────────────────────────────────────────

function OrderSuccess({
  trackingCode,
  orderNumber,
  onNewOrder,
}: {
  trackingCode: string
  orderNumber: string
  onNewOrder: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(trackingCode).then(() => {
      setCopied(true)
      toast.success('Code copié !')
      setTimeout(() => setCopied(false), 2000)
    })
  }, [trackingCode])

  return (
    <div className="text-center space-y-6 py-6">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-800">Commande confirmée !</h3>
        <p className="text-sm text-gray-500 mt-1">Votre commande a été enregistrée avec succès.</p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/40 max-w-sm mx-auto">
        <CardContent className="p-5 space-y-3">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Votre code de suivi</p>
          <p className="text-3xl font-mono font-bold text-emerald-700 tracking-widest">{trackingCode}</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-gray-500">Commande n° {orderNumber}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
          >
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? 'Copié !' : 'Copier le code'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-sm mx-auto">
        <p className="text-xs text-amber-800 font-medium">
          ⚠️ Conservez ce code de suivi précieusement. Il vous sera nécessaire pour suivre l&apos;état de votre commande.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={onNewOrder}
        className="border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        Nouvelle commande
      </Button>
    </div>
  )
}

// ─── Order Tracking Tab ──────────────────────────────────────────────────────

function TrackingTab() {
  const [trackingCode, setTrackingCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<TrackedWholesaleOrder | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingCode.trim()) {
      setError('Veuillez entrer un code de suivi')
      return
    }
    setLoading(true)
    setError(null)
    setOrder(null)
    try {
      const res = await fetch('/api/wholesale/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode: trackingCode.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
      } else {
        setError(data.error || 'Commande non trouvée')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <form onSubmit={handleTrack} className="space-y-3">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Suivre ma Commande</h3>
          <p className="text-sm text-gray-500">Entrez le code de suivi reçu lors de votre commande</p>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Ex: GRC-A1B2C3"
              value={trackingCode}
              onChange={(e) => { setTrackingCode(e.target.value.toUpperCase()); setError(null) }}
              className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 font-mono"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rechercher'}
          </Button>
        </div>
        {error && <InlineError message={error} />}
      </form>

      {/* Tracked order details */}
      {order && (
        <div className="space-y-4">
          {/* Order header */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">Commande n° {order.orderNumber}</span>
                    <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Code de suivi</p>
                  <p className="font-mono font-bold text-emerald-700 text-sm">{order.trackingCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status timeline */}
          <Card className="border-gray-200">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Progression</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {order.status === 'cancelled' ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-red-600">Commande annulée</p>
                </div>
              ) : (
                <div className="py-2">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-4 left-4 right-4 h-[2px] bg-gray-200 rounded-full" />
                    <div
                      className="absolute top-4 left-4 h-[2px] bg-emerald-400 rounded-full transition-all duration-700"
                      style={{
                        width:
                          WHOLESALE_STATUS_STEPS.indexOf(order.status as typeof WHOLESALE_STATUS_STEPS[number]) >= 0
                            ? `${(WHOLESALE_STATUS_STEPS.indexOf(order.status as typeof WHOLESALE_STATUS_STEPS[number]) / (WHOLESALE_STATUS_STEPS.length - 1)) * 87}%`
                            : '0%',
                      }}
                    />
                    {WHOLESALE_STATUS_STEPS.map((step, i) => {
                      const currentIdx = WHOLESALE_STATUS_STEPS.indexOf(order.status as typeof WHOLESALE_STATUS_STEPS[number])
                      const isCompleted = i <= currentIdx
                      const isCurrent = i === currentIdx

                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted
                                ? `bg-emerald-600 ${isCurrent ? 'ring-2 ring-emerald-200 ring-offset-2' : ''}`
                                : 'bg-gray-100'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-medium whitespace-nowrap ${
                              isCurrent ? 'text-emerald-700' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                            }`}
                          >
                            {WHOLESALE_STEP_LABELS[step]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="border-gray-200">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-800 font-medium">{item.productName}</p>
                    <p className="text-xs text-gray-500">
                      {item.lotsQuantity} lots × {item.lotSize} {item.lotUnit} = {item.totalUnits} {item.lotUnit}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-700">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="text-base font-bold text-emerald-700">{formatPrice(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Customer info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-gray-200">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  Paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1">
                {order.paymentMethod ? (
                  <p className="text-sm text-gray-800">{order.paymentMethod.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Non spécifié</p>
                )}
                <p className="text-xs text-gray-500">
                  Statut : {order.paymentStatus === 'paid' ? 'Payé' : order.paymentStatus === 'partial' ? 'Partiel' : 'Non payé'}
                </p>
                {order.paymentRef && <p className="text-xs text-gray-500">Réf. : {order.paymentRef}</p>}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1">
                <p className="text-sm text-gray-800 font-medium">{order.customerName}</p>
                <p className="text-xs text-gray-500">{order.customerPhone}</p>
                <p className="text-xs text-gray-500">{order.customerEmail}</p>
                {order.companyName && <p className="text-xs text-gray-500">{order.companyName}</p>}
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {order.address}{order.quartier ? `, ${order.quartier}` : ''}, {order.city}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty state when no search yet */}
      {!order && !error && !loading && (
        <div className="text-center py-10">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-gray-400">Entrez votre code de suivi pour voir l&apos;état de votre commande en gros</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function WholesaleSection() {
  // Active tab: 'order' or 'track'
  const [activeTab, setActiveTab] = useState<'order' | 'track'>('order')

  // Wizard step (0, 1, 2, 3=review, 4=success)
  const [step, setStep] = useState(0)

  // Customer info
  const [customer, setCustomer] = useState<CustomerInfo>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    companyName: '',
    nif: '',
    stat: '',
    address: '',
    quartier: '',
    city: 'Brazzaville',
  })

  // Product quantities
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Payment
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null)
  const [paymentRef, setPaymentRef] = useState('')
  const [notes, setNotes] = useState('')

  // API data
  const [products, setProducts] = useState<WholesaleProductType[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true)
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null)

  // Submission
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Success
  const [trackingCode, setTrackingCode] = useState('')
  const [orderNumber, setOrderNumber] = useState('')

  // Validation errors for step 1
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})

  // ─── Fetch products ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/wholesale/products')
        const data = await res.json()
        if (data.success) {
          setProducts(data.data)
        } else {
          setProductsError(data.error || 'Erreur de chargement')
        }
      } catch {
        setProductsError('Erreur de connexion')
      } finally {
        setProductsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // ─── Fetch payment methods ─────────────────────────────────────────────────

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch('/api/wholesale/payment-methods')
        const data = await res.json()
        if (data.success) {
          setPaymentMethods(data.data)
        } else {
          setPaymentMethodsError(data.error || 'Erreur de chargement')
        }
      } catch {
        setPaymentMethodsError('Erreur de connexion')
      } finally {
        setPaymentMethodsLoading(false)
      }
    }
    fetchMethods()
  }, [])

  // ─── Quantity change handler ──────────────────────────────────────────────

  const handleQuantityChange = useCallback((productId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: qty }))
  }, [])

  // ─── Customer field change handler ────────────────────────────────────────

  const handleCustomerChange = useCallback((field: keyof CustomerInfo, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }))
    setStepErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev }
        delete next[field]
        return next
      }
      return prev
    })
  }, [])

  // ─── Step navigation ──────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!customer.customerName.trim()) errs.customerName = 'Le nom est requis'
    if (!customer.customerPhone.trim()) errs.customerPhone = 'Le téléphone est requis'
    if (!customer.customerEmail.trim()) errs.customerEmail = "L'email est requis"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.customerEmail)) errs.customerEmail = 'Email invalide'
    if (!customer.address.trim()) errs.address = "L'adresse est requise"
    setStepErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = (): boolean => {
    const hasValid = products.some((p) => {
      const qty = quantities[p.id] || 0
      return qty >= p.minLots
    })
    if (!hasValid) {
      toast.error('Sélectionnez au moins un produit avec la quantité minimum requise')
      return false
    }
    // Check that all selected meet min
    const allMeetMin = products.every((p) => {
      const qty = quantities[p.id] || 0
      return qty === 0 || qty >= p.minLots
    })
    if (!allMeetMin) {
      toast.error('Certains produits ne respectent pas la quantité minimum de lots')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return
    if (step === 1 && !validateStep2()) return
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  // ─── Submit order ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      const orderItems = products
        .filter((p) => (quantities[p.id] || 0) > 0)
        .map((p) => ({
          wholesaleProductId: p.id,
          lotsQuantity: quantities[p.id],
        }))

      const res = await fetch('/api/wholesale/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.customerName,
          customerPhone: customer.customerPhone,
          customerEmail: customer.customerEmail,
          companyName: customer.companyName || undefined,
          nif: customer.nif || undefined,
          stat: customer.stat || undefined,
          address: customer.address,
          quartier: customer.quartier || undefined,
          city: customer.city,
          items: orderItems,
          paymentMethodId: selectedMethodId || undefined,
          paymentRef: paymentRef || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTrackingCode(data.data.trackingCode)
        setOrderNumber(data.data.orderNumber)
        setStep(4)
        toast.success('Commande en gros confirmée !')
      } else {
        setSubmitError(data.error || 'Erreur lors de la commande')
        toast.error(data.error || 'Erreur lors de la commande')
      }
    } catch {
      const msg = 'Erreur de connexion. Veuillez réessayer.'
      setSubmitError(msg)
      toast.error(msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  // ─── Reset for new order ──────────────────────────────────────────────────

  const handleNewOrder = () => {
    setStep(0)
    setCustomer({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      companyName: '',
      nif: '',
      stat: '',
      address: '',
      quartier: '',
      city: 'Brazzaville',
    })
    setQuantities({})
    setSelectedMethodId(null)
    setPaymentRef('')
    setNotes('')
    setStepErrors({})
    setSubmitError(null)
    setTrackingCode('')
    setOrderNumber('')
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <section id="wholesale" className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Commandes en Gros
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
            Prix dégressifs pour les professionnels, hôtels, restaurants et entreprises. Minimum 5 lots par produit.
          </p>
          <div className="w-16 h-1 bg-emerald-600 rounded-full mx-auto mt-4" />
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveTab('order')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'order'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Commander en Gros
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'track'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4" />
              Suivre ma Commande
            </button>
          </div>
        </div>

        {/* Tab content */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-8">
            {activeTab === 'order' && (
              <>
                {/* Success state */}
                {step === 4 ? (
                  <OrderSuccess
                    trackingCode={trackingCode}
                    orderNumber={orderNumber}
                    onNewOrder={handleNewOrder}
                  />
                ) : (
                  <>
                    {/* Step indicator */}
                    {step < 3 && <StepIndicator currentStep={step} />}

                    {/* Step content */}
                    <div className="transition-all duration-300">
                      {step === 0 && (
                        <StepCoordonnees
                          data={customer}
                          onChange={handleCustomerChange}
                          errors={stepErrors}
                        />
                      )}
                      {step === 1 && (
                        <StepCommande
                          products={products}
                          quantities={quantities}
                          onQuantityChange={handleQuantityChange}
                          loading={productsLoading}
                          error={productsError}
                        />
                      )}
                      {step === 2 && (
                        <StepPaiement
                          paymentMethods={paymentMethods}
                          selectedMethodId={selectedMethodId}
                          onSelectMethod={setSelectedMethodId}
                          paymentRef={paymentRef}
                          onPaymentRefChange={setPaymentRef}
                          notes={notes}
                          onNotesChange={setNotes}
                          loading={paymentMethodsLoading}
                          error={paymentMethodsError}
                        />
                      )}
                      {step === 3 && (
                        <ReviewStep
                          customer={customer}
                          products={products}
                          quantities={quantities}
                          paymentMethods={paymentMethods}
                          selectedMethodId={selectedMethodId}
                          paymentRef={paymentRef}
                          notes={notes}
                          onConfirm={handleSubmit}
                          loading={submitLoading}
                        />
                      )}
                    </div>

                    {/* Submit error */}
                    {submitError && step === 3 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-sm text-red-600">{submitError}</p>
                      </div>
                    )}

                    {/* Navigation buttons */}
                    {step < 3 && (
                      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
                        <Button
                          variant="outline"
                          onClick={handlePrev}
                          disabled={step === 0}
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Précédent
                        </Button>
                        <Button
                          onClick={handleNext}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          {step === 2 ? 'Vérifier la commande' : 'Suivant'}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}

                    {/* Back button from review */}
                    {step === 3 && !submitLoading && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={handlePrev}
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Modifier la commande
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === 'track' && <TrackingTab />}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
