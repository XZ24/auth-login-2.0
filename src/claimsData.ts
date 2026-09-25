import { fetchClaimDetail, fetchClaimsList, type SortMode } from './api'
import type { Claim } from './data/mockClaims'
import { mapClaimFromApi, mapClaimStub } from './mappers'

// Enabled by Vite only during local development without the optional dataset.
export const useMockClaims = import.meta.env.VITE_USE_MOCK_CLAIMS === true

async function sampleClaims(): Promise<Claim[]> {
  const { mockClaims } = await import('./data/mockClaims')
  return mockClaims.map(claim => {
    const latest = [...claim.communications].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
    return { ...claim, lastReplyIsEtiqa: latest ? latest.direction === 'outbound' : null }
  })
}

export async function getClaimsPage(limit: number, offset: number, search?: string, sort: SortMode = 'newest', lastReplyIsEtiqa?: boolean): Promise<Claim[]> {
  if (!useMockClaims) {
    return (await fetchClaimsList(limit, offset, search, sort, lastReplyIsEtiqa)).map(mapClaimStub)
  }
  let claims = await sampleClaims()
  const term = search?.trim().toLowerCase()
  if (term) claims = claims.filter(claim => [
    claim.claimNumber, claim.claimCoreSystemClaimId, claim.policyNo, claim.insuredName,
    claim.claimant.email, ...claim.communications.flatMap(email => [
      email.from, email.to, email.subject, email.body,
      ...(email.attachments ?? []).map(attachment => attachment.filename),
    ]),
  ].some(value => value?.toLowerCase().includes(term)))
  if (lastReplyIsEtiqa !== undefined) claims = claims.filter(claim => claim.lastReplyIsEtiqa === lastReplyIsEtiqa)
  claims.sort((a, b) => sort === 'claim'
    ? a.claimNumber.localeCompare(b.claimNumber)
    : (sort === 'oldest' ? 1 : -1) * a.claimSubmissionDate.localeCompare(b.claimSubmissionDate))
  return claims.slice(offset, offset + limit)
}

export async function getClaimDetail(claimNumber: string): Promise<Claim> {
  if (!useMockClaims) return mapClaimFromApi(await fetchClaimDetail(claimNumber))
  const claim = (await sampleClaims()).find(claim => claim.claimNumber === claimNumber)
  if (!claim) throw new Error(`Claim ${claimNumber} not found`)
  return claim
}
