import api from "@/utils/api";

export interface ClaimStatusParams {
    status_key?: string;
    reason?: string;
}

export async function readAllPendingClaims() {
    const response = await api.get('admin/guarantees/claims')
    return response
}

export async function submitFinalDecision(claimId: string, decisionType: string, justification: string, refundAmount: number) {
    const response = await api.post(`admin/guarantees/claims/${claimId}/decision`, {
        decision_type: decisionType,
        justification: justification,
        refund_amount: refundAmount
    })
    return response
}

export async function addComment(claimId: string, comment: string, visibility: string) {
    const response = await api.post(`admin/guarantees/claims/${claimId}/comments`, {
        comment: comment,
        visibility: visibility
    })
    return response
}

export async function readClaimsByStatus(status: string) {
    const response = await api.get(`admin/guarantees/claims/status/${status}`)
    return response
}

export async function updateClaimStatus(claimId: string, params: ClaimStatusParams) {
    const response = await api.put(`admin/guarantees/claims/${claimId}/status?${new URLSearchParams(params as Record<string, string>).toString()}`, {
        status: params.status_key
    })
    return response
}