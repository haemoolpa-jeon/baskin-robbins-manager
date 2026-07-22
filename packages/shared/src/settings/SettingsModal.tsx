import { useState } from 'react'
import { Store, Lock, LockOpen, Pencil } from 'lucide-react'
import { Modal } from '@shared/components/Modal'
import { useToast } from '@shared/components/Toast'
import { useConfirm } from '@shared/components/ConfirmDialog'
import { usePrompt } from '@shared/components/PromptModal'
import { useApp } from '@shared/app/AppProvider'
import { useRenameStore } from '@shared/data/store'
import { useLog } from '@shared/data/activity'
import { hasPin, setStoredPin } from '@shared/app/pin'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { storeId, storeName } = useApp()
  const toast = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()
  const renameStore = useRenameStore()
  const log = useLog(storeId)
  const [pinOn, setPinOn] = useState(hasPin())

  const editName = async () => {
    const name = await prompt({ title: '매장 이름', label: '매장 이름', initialValue: storeName, confirmText: '저장' })
    if (!name?.trim() || !storeId || name.trim() === storeName) return
    try {
      await renameStore.mutateAsync({ id: storeId, name: name.trim() })
      log(`매장 이름 변경: ${name.trim()}`, '설정')
      toast.success('저장되었습니다')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 실패')
    }
  }

  const setPin = async () => {
    const pin = await prompt({ title: '비밀번호 설정', label: '숫자 4자리', type: 'number', confirmText: '설정' })
    if (pin === null) return
    if (!/^\d{4}$/.test(pin)) return toast.error('숫자 4자리를 입력하세요')
    setStoredPin(pin)
    setPinOn(true)
    toast.success('비밀번호가 설정되었습니다')
  }

  const removePin = async () => {
    const ok = await confirm({ title: '잠금 끄기', message: '앱 비밀번호 잠금을 끌까요?', confirmText: '끄기' })
    if (!ok) return
    setStoredPin(null)
    setPinOn(false)
    toast.success('잠금이 해제되었습니다')
  }

  return (
    <Modal
      title="설정"
      onClose={onClose}
      actions={
        <button className="btn btn-block" onClick={onClose}>
          닫기
        </button>
      }
    >
      <button className="setting-row" onClick={editName}>
        <Store size={24} />
        <span className="grow">
          매장 이름
          <small>{storeName}</small>
        </span>
        <Pencil size={20} />
      </button>

      {pinOn ? (
        <>
          <button className="setting-row" onClick={setPin}>
            <Lock size={24} />
            <span className="grow">비밀번호 변경</span>
            <Pencil size={20} />
          </button>
          <button className="setting-row danger" onClick={removePin}>
            <LockOpen size={24} />
            <span className="grow">앱 잠금 끄기</span>
          </button>
        </>
      ) : (
        <button className="setting-row" onClick={setPin}>
          <Lock size={24} />
          <span className="grow">
            앱 잠금 설정
            <small>숫자 4자리로 앱을 보호합니다 (선택)</small>
          </span>
        </button>
      )}
    </Modal>
  )
}
