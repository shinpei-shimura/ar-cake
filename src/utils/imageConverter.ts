/**
 * 画像変換ユーティリティ（Cloudflare Workers対応）
 * Canvas APIを使用してブラウザ標準の画像変換機能を提供
 */

export interface ConversionOptions {
  quality?: number; // JPEGの品質 (0.0 - 1.0)
  maxWidth?: number; // 最大幅
  maxHeight?: number; // 最大高さ
  maintainAspectRatio?: boolean; // アスペクト比維持
}

/**
 * 画像をJPG形式に変換
 * @param imageBuffer 元の画像データ
 * @param mimeType 元のMIMEタイプ
 * @param options 変換オプション
 * @returns 変換されたJPG画像データとメタデータ
 */
export async function convertToJPG(
  imageBuffer: ArrayBuffer,
  mimeType: string,
  options: ConversionOptions = {}
): Promise<{
  buffer: ArrayBuffer;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
}> {
  const {
    quality = 0.9,
    maxWidth = 2048,
    maxHeight = 2048,
    maintainAspectRatio = true
  } = options;

  try {
    // 画像をBlobに変換
    const blob = new Blob([imageBuffer], { type: mimeType });
    
    // ImageBitmapを作成（Cloudflare Workers対応）
    const imageBitmap = await createImageBitmap(blob);
    
    let { width, height } = imageBitmap;
    const originalWidth = width;
    const originalHeight = height;
    
    // サイズ制限の適用
    if (width > maxWidth || height > maxHeight) {
      if (maintainAspectRatio) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      } else {
        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);
      }
    }
    
    // OffscreenCanvasを使用（Cloudflare Workers対応）
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    
    // 背景を白に設定（透明度対応）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // 画像を描画
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // JPGに変換
    const convertedBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: quality
    });
    
    // ArrayBufferに変換
    const convertedBuffer = await convertedBlob.arrayBuffer();
    
    // リソースのクリーンアップ
    imageBitmap.close();
    
    return {
      buffer: convertedBuffer,
      mimeType: 'image/jpeg',
      width,
      height,
      originalSize: imageBuffer.byteLength,
      convertedSize: convertedBuffer.byteLength
    };
    
  } catch (error) {
    console.error('Image conversion error:', error);
    throw new Error(`画像変換に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 画像が変換可能かチェック
 * @param mimeType MIMEタイプ
 * @returns 変換可能かどうか
 */
export function isSupportedImageFormat(mimeType: string): boolean {
  const supportedFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml'
  ];
  
  return supportedFormats.includes(mimeType.toLowerCase());
}

/**
 * ファイル拡張子からMIMEタイプを推測
 * @param filename ファイル名
 * @returns MIMEタイプ
 */
export function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

/**
 * 画像の品質を計算（ファイルサイズベース）
 * @param originalSize 元のファイルサイズ
 * @param targetSize 目標ファイルサイズ（バイト）
 * @returns 推奨品質値
 */
export function calculateOptimalQuality(originalSize: number, targetSize: number = 1024 * 1024): number {
  if (originalSize <= targetSize) {
    return 0.9; // 高品質
  }
  
  const ratio = targetSize / originalSize;
  
  if (ratio > 0.5) {
    return 0.8; // 中〜高品質
  } else if (ratio > 0.2) {
    return 0.7; // 中品質
  } else {
    return 0.6; // 低〜中品質
  }
}