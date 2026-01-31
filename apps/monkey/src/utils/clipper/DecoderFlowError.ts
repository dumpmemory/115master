/**
 * DecoderFlow 错误类型
 */
export class DecoderFlowError extends Error {
  /** 超时错误 */
  static Timeout = class extends DecoderFlowError {
    constructor(
      readonly targetTime: number,
      readonly segmentUrl: string,
      readonly timeoutMs: number,
    ) {
      super(`DecoderFlow waitForFrame timeout, targetTime: ${targetTime}, segmentUrl: ${segmentUrl}, timeoutMs: ${timeoutMs}ms`)
      this.name = 'DecoderFlowTimeout'
    }
  }

  /** 解码器配置错误 */
  static DecoderConfiguration = class extends DecoderFlowError {
    constructor(
      readonly codec: string,
      readonly originalError: unknown,
    ) {
      super(`Decoder configuration failed, codec: ${codec}`)
      this.name = 'DecoderFlowDecoderConfiguration'
    }
  }

  /** 解码器运行时错误 */
  static DecoderRuntime = class extends DecoderFlowError {
    constructor(
      readonly originalError: unknown,
    ) {
      super('Decoder runtime error')
      this.name = 'DecoderFlowDecoderRuntime'
    }
  }

  /** 数据读取错误 */
  static DataRead = class extends DecoderFlowError {
    constructor(
      readonly segmentUrl: string,
      readonly originalError: unknown,
    ) {
      super(`Data read failed, segmentUrl: ${segmentUrl}`)
      this.name = 'DecoderFlowDataRead'
    }
  }

  /** 未初始化错误 */
  static NotInitialized = class extends DecoderFlowError {
    constructor(readonly component: 'videoDecoder' | 'demuxer' | 'reader') {
      super(`DecoderFlow component not initialized: ${component}`)
      this.name = 'DecoderFlowNotInitialized'
    }
  }

  /** 解码失败错误 */
  static DecodeFailed = class extends DecoderFlowError {
    constructor(
      readonly pts: number | undefined,
      readonly keyframe: boolean | undefined,
      readonly timestamp: number | undefined,
      readonly decoderState: string | undefined,
      readonly originalError: unknown,
    ) {
      super('Decode failed')
      this.name = 'DecoderFlowDecodeFailed'
    }
  }
}
