import type { WebhookEvent } from '@clerk/nextjs/server';
import { Webhook } from 'svix';

/**
 * SHA-256ハッシュを計算する関数 (Web Crypto API互換)。
 * Convex環境で使用することを想定。
 * @param text ハッシュ化する文字列
 * @returns SHA-256ハッシュの文字列
 */
export async function sha256(text: string): Promise<string> {
  // 文字列をUint8Arrayに変換
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(text);

  // SHA-256ハッシュを計算
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // ハッシュを16進数文字列に変換
  // Array.from()でUint8Arrayを配列に変換し、map()で各バイトを2桁の16進数に変換して結合
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hexHash;
}

export async function validateRequest(
  req: Request,
): Promise<WebhookEvent | undefined> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  const payloadString = await req.text();
  const svixHeaders = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  const wh = new Webhook(webhookSecret);
  try {
    const event = wh.verify(payloadString, svixHeaders) as WebhookEvent;
    return event;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return undefined;
  }
}

/**
 * 指定された長さのランダムな英数字の文字列を生成する
 * @param length 生成する文字列の長さ (デフォルトは8)
 * @returns ランダムな文字列
 */
export function generateShortId(length: number = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
