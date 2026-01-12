import {
  exportJWK,
  generateKeyPair,
} from "jose";

export async function createNewKeyPair() {
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    extractable: true,
  });

  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);

  publicJwk.alg = "RS256";
  privateJwk.alg = "RS256";
  publicJwk.use = "sig";
  privateJwk.use = "sig";

  const jwkBundle = {
    public: publicJwk,
    private: privateJwk,
  };
  const blob = new Blob([JSON.stringify(jwkBundle, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rsa-jwk.json";
  a.click();
  URL.revokeObjectURL(url);

}