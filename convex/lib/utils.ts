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
