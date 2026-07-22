import { useMemo, useState } from 'react'
import { ClipboardCheck, MapPin, PackagePlus } from 'lucide-react'
import { SearchInput } from '@shared/components/SearchInput'
import { ChipTabs, type ChipOption } from '@shared/components/ChipTabs'
import { EmptyState } from '@shared/components/EmptyState'
import { stockStatus } from '@/lib/stock'
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_SUBTYPE_OPTIONS,
  productSubtypeLabel,
  type InventoryProduct,
  type ProductCategory,
} from '@/lib/types'

interface Props {
  category: ProductCategory
  products: InventoryProduct[]
  onEdit: (product: InventoryProduct) => void
  onAdd: () => void
  onCount: () => void
}

export function ProductInventoryView({ category, products, onEdit, onAdd, onCount }: Props) {
  const [query, setQuery] = useState('')
  const [subtype, setSubtype] = useState('all')
  const [shortageOnly, setShortageOnly] = useState(false)

  const categoryProducts = useMemo(
    () => products.filter((product) => product.category === category),
    [category, products],
  )
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return categoryProducts
      .filter((product) => subtype === 'all' || product.subtype === subtype)
      .filter((product) => !shortageOnly || (product.available && product.quantity < product.par))
      .filter((product) => !normalized || product.name.toLowerCase().includes(normalized))
      .sort((a, b) => {
        const statusDiff = Number(a.quantity >= a.par) - Number(b.quantity >= b.par)
        return statusDiff || a.name.localeCompare(b.name, 'ko')
      })
  }, [categoryProducts, query, shortageOnly, subtype])

  const lowCount = categoryProducts.filter(
    (product) => product.available && product.quantity < product.par,
  ).length

  const subtypeOptions: ChipOption<string>[] = [
    { value: 'all', label: '전체' },
    ...PRODUCT_SUBTYPE_OPTIONS[category]
      .map((option) => ({
        value: option.value,
        label: option.label,
        count: categoryProducts.filter((product) => product.subtype === option.value).length,
      }))
      .filter((option) => option.count > 0),
  ]
  const categoryName = PRODUCT_CATEGORY_LABELS[category]

  return (
    <section className={`domain-workspace domain-${category}`}>
      <div className="domain-heading">
        <div>
          <h2>{categoryName}</h2>
          <p>
            {categoryProducts.length}개 품목
            {lowCount > 0 && <strong> · 부족 {lowCount}개</strong>}
          </p>
        </div>
        <button className="btn btn-primary domain-add" onClick={onAdd}>
          <PackagePlus size={20} /> 추가
        </button>
      </div>

      <div className="storage-tools">
        <SearchInput
          ariaLabel={`${categoryName} 검색`}
          placeholder={`${categoryName.replace(/^\S+\s/, '')} 검색`}
          value={query}
          onChange={setQuery}
        />
        <button className="count-mode-btn" onClick={onCount}>
          <ClipboardCheck size={21} />
          빠른 실사
        </button>
      </div>

      <ChipTabs scroll ariaLabel="세부 종류" value={subtype} onChange={setSubtype} options={subtypeOptions} />
      <ChipTabs
        ariaLabel="재고 필터"
        value={shortageOnly ? 'low' : 'all'}
        onChange={(v) => setShortageOnly(v === 'low')}
        options={[
          { value: 'all', label: '전체 재고' },
          { value: 'low', label: '부족 재고만', count: lowCount, tone: 'shortage' },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={category === 'cake' ? '🎂' : category === 'dessert' ? '🍡' : '🥄'}
          title="표시할 품목이 없습니다"
          hint="검색·필터를 지우거나 새 품목을 추가해 보세요."
          action={
            <button className="btn btn-primary" onClick={onAdd}>
              첫 품목 추가
            </button>
          }
        />
      ) : (
        <div className="product-grid">
          {visible.map((product) => {
            const status = stockStatus(product.quantity, product.par)
            const expiredSoon = product.expiryDate && daysUntil(product.expiryDate) <= 30
            return (
              <button
                key={product.id}
                className={`product-card ${status === 'ok' ? '' : status} ${product.available ? '' : 'unavailable'}`}
                onClick={() => onEdit(product)}
              >
                <span className="product-card-topline">
                  <span>{productSubtypeLabel(product.category, product.subtype)}</span>
                  {!product.available && <strong>판매중지</strong>}
                </span>
                <span className="product-card-name">{product.name}</span>
                <span className="product-card-qty">{product.quantity}{product.unit}</span>
                <span className="product-card-target">
                  {status === 'empty' ? '품절 · ' : status === 'low' ? '부족 · ' : ''}목표 {product.par}{product.unit}
                  {product.packSize ? ` · ${product.unit}당 ${product.packSize}개` : ''}
                </span>
                {(product.sizeLabel || product.location || product.expiryDate) && (
                  <span className="product-card-meta">
                    {product.sizeLabel && <span>{product.sizeLabel}</span>}
                    {product.location && <span><MapPin size={13} />{product.location}</span>}
                    {product.expiryDate && (
                      <span className={expiredSoon ? 'expiry-soon' : ''}>소비기한 {product.expiryDate}</span>
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}
