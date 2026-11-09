// Membuat sepasang kunci VAPID untuk push notification.
// Jalankan sekali:  node scripts/generate-vapid.mjs
// Salin hasilnya ke .env.local (dan ke pengaturan environment di hosting). Jangan dibagikan: kunci privat bersifat rahasia.
import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });

const publicKeyB64 = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(pub.x, "base64url"),
  Buffer.from(pub.y, "base64url"),
]).toString("base64url");

console.log("");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKeyB64}`);
console.log(`VAPID_PRIVATE_KEY=${priv.d}`);
console.log("VAPID_SUBJECT=mailto:admin@loomrapos.com   # ganti dengan email kamu");
console.log("");
