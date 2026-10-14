/** Provider boundary. A concrete CCA-recognized ESP must supply verified API and callback behavior. */
export type ProviderSigningRequest = {
  agreementId: string;
  documentId: string;
  documentSha256: string;
  signerId: string;
  signerLegalName: string;
  callbackUrl: string;
};
export type ProviderSigningSession = { providerReference: string; redirectUrl: string; expiresAt: string };
export type ProviderVerification = { verified: boolean; documentSha256: string; certificateReference: string; signedPdf: Uint8Array };
export interface SigningProvider {
  begin(request: ProviderSigningRequest): Promise<ProviderSigningSession>;
  verifyCallback(rawBody: Uint8Array, headers: Headers): Promise<{ providerReference: string; status: 'verified'|'failed' }>;
  fetchAndVerify(reference: string, expectedSha256: string): Promise<ProviderVerification>;
}

export class ProviderNotConfigured extends Error {
  constructor() { super('A CCA-recognized eSign provider, credentials and callback verification are not configured. No signature was created.'); }
}

export const signingProvider = (): SigningProvider => ({
  begin: async () => { throw new ProviderNotConfigured(); },
  verifyCallback: async () => { throw new ProviderNotConfigured(); },
  fetchAndVerify: async () => { throw new ProviderNotConfigured(); },
});
