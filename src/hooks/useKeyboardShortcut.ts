import { useEffect } from 'react'

/**
 * 键盘快捷键 Hook
 */
export const useKeyboardShortcut = (key: string, callback: () => void) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        callback()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [key, callback])
}
