import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { useConfirm } from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { useLog } from '@/data/activity'
import { useDeleteProduct, useSaveProduct } from '@/data/products'
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_ORDER,
  PRODUCT_SUBTYPE_OPTIONS,
  type InventoryProduct,
  type ProductCategory,
} from '@/lib/types'

interface Props {
  product: InventoryProduct | null
  defaultCategory: ProductCategory
  storeId: string | null
  onClose: () => void
}

export function ProductModal({ product, defaultCategory, storeId, onClose }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const log = useLog(storeId)
  const saveProduct = useSaveProduct(storeId)
  const deleteProduct = useDeleteProduct(storeId)
  const initialCategory = product?.category ?? defaultCategory
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState<ProductCategory>(initialCategory)
  const [subtype, setSubtype] = useState(
    product?.subtype ?? PRODUCT_SUBTYPE_OPTIONS[initialCategory][0].value,
  )
  const [quantity, setQuantity] = useState(product?.quantity ?? 0)
  const [par, setPar] = useState(product?.par ?? (initialCategory === 'supply' ? 3 : 2))
  const [unit, setUnit] = useState(product?.unit ?? (initialCategory === 'supply' ? '팩' : '개'))
  const [sizeLabel, setSizeLabel] = useState(product?.sizeLabel ?? '')
  const [location, setLocation] = useState(
    product?.location ?? (initialCategory === 'cake' ? '케이크 냉동고' : initialCategory === 'dessert' ? '디저트 냉동고' : '포장재 선반'),
  )
  const [expiryDate, setExpiryDate] = useState(product?.expiryDate ?? '')
  const [packSize, setPackSize] = useState(product?.packSize ?? 0)
  const [available, setAvailable] = useState(product?.available ?? true)
  const busy = saveProduct.isPending || deleteProduct.isPending

  const changeCategory = (next: ProductCategory) => {
    setCategory(next)
    setSubtype(PRODUCT_SUBTYPE_OPTIONS[next][0].value)
    setUnit(next === 'supply' ? '팩' : '개')
    setPackSize(0)
  }

  const save = async () => {
    if (!name.trim()) return toast.error('품목 이름을 입력하세요')
    try {
      await saveProduct.mutateAsync({
        id: product?.id,
        name,
        category,
        subtype,
        quantity,
        par,
        unit,
        sizeLabel,
        location,
        expiryDate: category === 'supply' ? null : expiryDate || null,
        packSize: category === 'supply' && packSize > 0 ? packSize : null,
        available,
      })
      log(`${product ? '품목 수정' : '품목 추가'}: ${name.trim()} ${quantity}${unit}`, '재고')
      toast.success(product ? '품목을 수정했습니다' : '품목을 추가했습니다')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '품목 저장 실패')
    }
  }

  const remove = async () => {
    if (!product) return
    const ok = await confirm({
      title: `${product.name} 삭제`,
      message: '이 품목과 현재 재고를 영구 삭제할까요?',
      danger: true,
      confirmText: '삭제',
    })
    if (!ok) return
    try {
      await deleteProduct.mutateAsync(product.id)
      log(`품목 삭제: ${product.name}`, '재고')
      toast.success('품목을 삭제했습니다')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '품목 삭제 실패')
    }
  }

  const categoryName = PRODUCT_CATEGORY_LABELS[category].replace(/^\S+\s/, '')

  return (
    <Modal
      title={product ? product.name : `${categoryName} 추가`}
      subtitle="현재 수량과 주문 기준을 함께 관리합니다"
      onClose={onClose}
      actions={
        <>
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>저장</button>
        </>
      }
    >
      <div className="field">
        <label>재고 종류</label>
        <div className="product-domain-select">
          {PRODUCT_CATEGORY_ORDER.map((value) => (
            <button key={value} className={category === value ? 'active' : ''} onClick={() => changeCategory(value)}>
              {PRODUCT_CATEGORY_LABELS[value]}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="product-name">품목 이름</label>
        <input
          id="product-name"
          className="input"
          placeholder={category === 'cake' ? '예: 골라먹는 27 큐브' : category === 'dessert' ? '예: 아이스 모찌 스트로베리' : '예: 파인트 뚜껑'}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="product-subtype">세부 종류</label>
        <select id="product-subtype" className="input" value={subtype} onChange={(event) => setSubtype(event.target.value)}>
          {PRODUCT_SUBTYPE_OPTIONS[category].map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="product-form-counts">
        <QuantityField label="현재 재고" value={quantity} onChange={setQuantity} />
        <QuantityField label="목표 재고" value={par} onChange={setPar} />
      </div>

      <div className="form-grid-two">
        <div className="field">
          <label htmlFor="product-unit">관리 단위</label>
          <select id="product-unit" className="input" value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option value="개">개</option>
            <option value="팩">팩</option>
            <option value="박스">박스</option>
            <option value="묶음">묶음</option>
            <option value="롤">롤</option>
            <option value="kg">kg</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="product-size">규격·호환 사이즈</label>
          <input
            id="product-size"
            className="input"
            placeholder={category === 'supply' ? '예: 파인트 336g' : '예: 미니, 27 큐브'}
            value={sizeLabel}
            onChange={(event) => setSizeLabel(event.target.value)}
          />
        </div>
      </div>

      {category === 'supply' ? (
        <div className="field">
          <label htmlFor="product-pack-size">{unit}당 낱개 수 <small>(선택)</small></label>
          <input
            id="product-pack-size"
            className="input"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="예: 50"
            value={packSize || ''}
            onChange={(event) => setPackSize(Math.max(0, Number(event.target.value)))}
          />
        </div>
      ) : (
        <div className="field">
          <label htmlFor="product-expiry">가장 가까운 소비기한 <small>(선택)</small></label>
          <input
            id="product-expiry"
            className="input"
            type="date"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
          />
          <div className="field-hint">먼저 꺼내야 할 제품의 날짜를 기록하세요</div>
        </div>
      )}

      <div className="field">
        <label htmlFor="product-location">보관 위치</label>
        <input
          id="product-location"
          className="input"
          placeholder="예: 케이크 냉동고 A칸"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
      </div>

      <button className={`availability-toggle ${available ? 'on' : ''}`} onClick={() => setAvailable((value) => !value)}>
        <span>{available ? (category === 'supply' ? '사용중' : '판매중') : '사용중지'}</span>
        <small>{available ? '부족 재고와 주문 준비에 포함됩니다' : '부족 계산에서 제외됩니다'}</small>
      </button>
      {product && <button className="btn btn-danger product-delete" onClick={remove} disabled={busy}>품목 삭제</button>}
    </Modal>
  )
}

function QuantityField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="mini-stepper">
        <button onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0}>−</button>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
          aria-label={label}
        />
        <button onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  )
}
