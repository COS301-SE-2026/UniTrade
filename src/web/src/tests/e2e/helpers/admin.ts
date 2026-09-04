import {Page, expect} from '@playwright/test';

const API_URL = 'http://localhost:8080/api';

interface CaseSummaryLike {
    caseId: string;
    submittedAt: string;
}

interface CaseDetailLike extends CaseSummaryLike {
    evidence?: {email?: string};
}

export async function findPendingVerificationCaseId(
    adminPage: Page,
    studentEmail: string,
    {retries = 10, delayMs = 100} : { retries?: number; delayMs?:number} = {},
) : Promise<string> {
    for (let attempt = 0; attempt < retries; attempt++ ) {
    const listRes = await adminPage.request.get(
        `${API_URL}/admin/cases?type=verification&status=under_review&limit=50`,
    );
    expect(listRes.ok(), `Failed to list verification cases: ${listRes.status()}`).toBeTruthy();

    const listBody = await listRes.json();
    const cases: CaseSummaryLike[] = Array.isArray(listBody) ? listBody : (listBody.cases ?? []);

    for (const c of cases) {
        const detailRes = await adminPage.request.get(`${API_URL}/admin/cases/${c.caseId}`);
        if(!detailRes.ok()) continue;
        const detail: CaseDetailLike = await detailRes.json();
        if(detail.evidence?.email === studentEmail) {
            return c.caseId;
        }
    }
    await adminPage.waitForTimeout(delayMs);

    }
    throw new Error(`No pending verification case found for email: ${studentEmail}`);
}

export async function approveVerificationCase(adminPage: Page, caseId: string): Promise<void> {
    await adminPage.goto(`/admin/verifications/${caseId}`);
    await expect(adminPage.getByRole('button', {name: 'Approve', exact: true})).toBeVisible();


    const decisionResponse = adminPage.waitForResponse(
        (res) => res.url().includes(`/admin/cases/${caseId}/decision`) && res.request().method() === 'POST',
    );

    await adminPage.getByRole('button', {name: 'Approve', exact: true}).click();

    const res = await decisionResponse;
    expect(res.ok(), `Decision request failed: ${res.status()}`).toBeTruthy();

    await expect(adminPage.getByText('Decision submitted successfully')).toBeVisible();
    await adminPage.waitForURL(/\/admin\/verifications$/);



}