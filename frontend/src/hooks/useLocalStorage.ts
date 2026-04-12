import { useState, useCallback } from 'react'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const set = useCallback(
    (newVal: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof newVal === 'function' ? (newVal as (p: T) => T)(prev) : newVal
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    [key]
  )

  const remove = useCallback(() => {
    localStorage.removeItem(key)
    setValue(defaultValue)
  }, [key, defaultValue])

  return [value, set, remove] as const
}
