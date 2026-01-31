/**
 * 删除文件扩展名
 * @param filename 文件名
 * @returns 删除扩展名后的文件名
 * @expample
 * ```ts
 *  removeFileExtension('example.txt') // 'example'
 *  removeFileExtension('archive.tar.gz') // 'archive.tar'
 * ```
 */
export function removeFileExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, '')
}

/**
 * 分割单词
 * @param text 文本
 * @returns 分割后的单词
 */
export function splitWords(text: string) {
  return text.split(/\b/).map(word => word.trim()).filter(word => word !== '')
}
