import { ChunkReader } from './ChunkIO'

/**
 * FetchIO 类 - 负责从URL获取指定范围的视频数据
 * 处理数据块的读取和管理，支持缓存和请求去重
 */
export class FetchIO {
  /**
   * 创建分块读取器
   * @param url 目标URL
   * @param start 起始位置
   * @param limit 限制大小
   * @returns 分块读取器
   */
  createChunkReader(url: string, start: number, limit: number = ChunkReader.DEFAULT_LIMIT): ChunkReader {
    return new ChunkReader(url, this, start, limit)
  }

  /**
   * 从URL获取指定范围的ArrayBuffer
   * @param url 目标URL
   * @param start 起始字节
   * @param end 结束字节
   * @returns 获取到的Response
   */
  async fetchBufferRange(
    url: string,
    start: number,
    end?: number,
  ): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        Range: `bytes=${start}-${end ?? ''}`,
      },
    })
    return response
  }
}
