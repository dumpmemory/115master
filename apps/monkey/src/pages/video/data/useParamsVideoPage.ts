import { ref } from 'vue'

/**
 * 视频页面参数
 */
export function useParamsVideoPage() {
  const pickCode = ref<string>()
  const cid = ref<string>()

  const getParams = () => {
    const params = new URLSearchParams(window.location.search)
    pickCode.value = params.get('pick_code') ?? undefined
  }

  getParams()

  return {
    cid,
    pickCode,
    getParams,
  }
}
