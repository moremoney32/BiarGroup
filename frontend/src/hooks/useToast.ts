import { showToast } from '../components/common/Toast'

export function useToast() {
  return {
    success: (message: string) => showToast.success(message),
    error: (message: string) => showToast.error(message),
    warning: (message: string) => showToast.warning(message),
    info: (message: string) => showToast.info(message),
  }
}
