import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppSelector } from '../store/index'
import { selectAccessToken } from '../store/slices/authSlice'

let socketInstance: Socket | null = null

export function useSocket() {
  const token = useAppSelector(selectAccessToken)
  const ref = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return

    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      })
    }

    ref.current = socketInstance

    return () => {
      // Ne pas déconnecter ici — socket partagé entre composants
    }
  }, [token])

  return ref.current
}

export function disconnectSocket() {
  socketInstance?.disconnect()
  socketInstance = null
}
