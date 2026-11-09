import { createCipheriv, createECDH, createHmac, createPrivateKey, randomBytes, sign } from "node:crypto";

/** base64url tanpa padding, sesuai format kunci Web Push. */
export const b64u = {
  enc: (b: Uint8Array) => Buffer.from(b).toString("base64url"),
  dec: (s: string) => Buffer.from(s, "base64url"),
};

function hkdfExtract(salt: Buffer, ikm: Buffer) {
  return createHmac("sha256", salt).update(ikm).digest();
}

/** HKDF-Expand untuk satu blok (cukup, karena semua keluaran <= 32 byte). */
function hkdfExpand(prk: Buffer, info: Buffer, length: number) {
  return createHmac("sha256", prk)
    .update(Buffer.concat([info, Buffer.from([1])]))
    .digest()
    .subarray(0, length);
}

type EncryptOptions = { salt?: Buffer; senderPrivate?: Buffer };

/** Turunan kunci menurut RFC 8291 bagian 3.4 (diekspos supaya bisa diuji dengan vektor RFC). */
export function deriveKeys(
  uaPublic: Buffer,
  authSecret: Buffer,
  opts: EncryptOptions = {},
) {
  const ecdh = createECDH("prime256v1");
  if (opts.senderPrivate) {
    ecdh.setPrivateKey(opts.senderPrivate);
  } else {
    ecdh.generateKeys();
  }
  const asPublic = ecdh.getPublicKey(); // titik tidak terkompresi, 65 byte
  const ecdhSecret = ecdh.computeSecret(uaPublic);
  const salt = opts.salt ?? randomBytes(16);

  const prkKey = hkdfExtract(authSecret, ecdhSecret);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic]);
  const ikm = hkdfExpand(prkKey, keyInfo, 32);

  const prk = hkdfExtract(salt, ikm);
  const cek = hkdfExpand(prk, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = hkdfExpand(prk, Buffer.from("Content-Encoding: nonce\0"), 12);

  return { asPublic, salt, ecdhSecret, ikm, cek, nonce };
}

/** Enkripsi isi notifikasi (aes128gcm, satu record) untuk satu langganan. */
export function encryptPayload(
  plaintext: Buffer,
  uaPublic: Buffer,
  authSecret: Buffer,
  opts: EncryptOptions = {},
): Buffer {
  const { asPublic, salt, cek, nonce } = deriveKeys(uaPublic, authSecret, opts);

  const padded = Buffer.concat([plaintext, Buffer.from([2])]); // 0x02 = penanda record terakhir
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final(), cipher.getAuthTag()]);

  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(4096, 16); // ukuran record
  header.writeUInt8(asPublic.length, 20); // panjang keyid
  return Buffer.concat([header, asPublic, encrypted]);
}

/** Header Authorization VAPID (JWT ES256) untuk satu push service. */
export function vapidAuthHeader(
  endpoint: string,
  publicKey: string,
  privateKey: string,
  subject: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): string {
  const header = b64u.enc(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64u.enc(
    Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: nowSec + 12 * 3600, sub: subject })),
  );
  const data = `${header}.${payload}`;

  const pub = b64u.dec(publicKey);
  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: privateKey,
      x: b64u.enc(pub.subarray(1, 33)),
      y: b64u.enc(pub.subarray(33, 65)),
    },
    format: "jwk",
  });
  const signature = sign("sha256", Buffer.from(data), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${data}.${b64u.enc(signature)}, k=${publicKey}`;
}
