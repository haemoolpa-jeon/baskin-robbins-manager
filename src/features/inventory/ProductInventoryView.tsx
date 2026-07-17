import { useMemo, useState } from 'react'
import { ClipboardCheck, MapPin, PackagePlus, Search } from 'lucide-react'
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

  return (
    <section className={`domain-workspace domain-${category}`}>
      <div className="domain-heading">
        <div>
          <h2>{PRODUCT_CATEGORY_LABELS[category]}</h2>
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
        <label className="storage-search">
          <Search size={20} aria-hidden="true" />
          <input
            placeholder={`${PRODUCT_CATEGORY_LABELS[category].replace(/^\S+\s/, '')} 검색`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={`${PRODUCT_CATEGORY_LABELS[category]} 검색`}
          />
        </label>
        <button className="count-mode-btn" onClick={onCount}>
          <ClipboardCheck size={21} />
          빠른 실사
        </button>
      </div>

      <div className="product-category-tabs" aria-label="세부 종류">
        <button className={subtype === 'all' ? 'active' : ''} onClick={() => setSubtype('all')}>
          전체
        </button>
        {PRODUCT_SUBTYPE_OPTIONS[category].map((option) => {
          const count = categoryProducts.filter((product) => product.subtype === option.value).length
          if (count === 0) return null
          return (
            <button
              key={option.value}
              className={subtype === option.value ? 'active' : ''}
              onClick={() => setSubtype(option.value)}
            >
              {option.label} {count}
            </button>
          )
        })}
      </div>
      <div className="storage-filter-row">
        <button className={!shortageOnly ? 'active' : ''} onClick={() => setShortageOnly(false)}>
          전체 재고
        </button>
        <button
          className={shortageOnly ? 'active shortage' : ''}
          onClick={() => setShortageOnly(true)}
        >
          부족 재고만 {lowCount > 0 ? lowCount : ''}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="inventory-empty-state">
          <span>{category === 'cake' ? '🎂' : category === 'dessert' ? '🍡' : '🥄'}</span>
          <strong>표시할 품목이 없습니다</strong>
          <button className="btn btn-primary" onClick={onAdd}>첫 품목 추가</button>
        </div>
      ) : (
        <div className="product-grid">
          {visible.map((product) => {
            const empty = product.quantity === 0
            const low = !empty && product.quantity < product.par
            const expiredSoon = product.expiryDate && daysUntil(product.expiryDate) <= 30
            return (
              <button
                key={product.id}
                className={`product-card ${empty ? 'empty' : low ? 'low' : ''} ${product.available ? '' : 'unavailable'}`}
                onClick={() => onEdit(product)}
              >
                <span className="product-card-topline">
                  <span>{productSubtypeLabel(product.category, product.subtype)}</span>
                  {!product.available && <strong>판매중지</strong>}
                </span>
                <span className="product-card-name">{product.name}</span>
                <span className="product-card-qty">{product.quantity}{product.unit}</span>
                <span className="product-card-target">
                  {empty ? '품절 · ' : low ? '부족 · ' : ''}목표 {product.par}{product.unit}
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
