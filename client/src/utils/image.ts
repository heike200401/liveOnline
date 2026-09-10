const MAX_BYTES = 5 * 1024 * 1024

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片读取失败'))
    img.src = src
  })
}

function canvasToBlob(img: HTMLImageElement, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片压缩失败'))),
      'image/jpeg',
      quality,
    )
  })
}

/** 超过 5MB 的图片用 canvas 逐级压缩为 JPEG；GIF 会丢失动画，超限直接报错 */
export async function prepareImage(file: File): Promise<File> {
  if (file.size <= MAX_BYTES) return file
  if (file.type === 'image/gif') throw new Error('GIF 图片超过 5MB，请压缩后再上传')
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    for (const maxEdge of [4096, 2048, 1536, 1024]) {
      for (const quality of [0.9, 0.75, 0.6]) {
        const blob = await canvasToBlob(img, maxEdge, quality)
        if (blob.size <= MAX_BYTES) {
          const name = file.name.replace(/\.[^.]+$/, '') + '-compressed.jpg'
          return new File([blob], name, { type: 'image/jpeg' })
        }
      }
    }
    throw new Error('图片过大，压缩后仍超过 5MB')
  } finally {
    URL.revokeObjectURL(url)
  }
}
