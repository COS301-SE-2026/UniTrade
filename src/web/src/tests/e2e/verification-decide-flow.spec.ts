import {test, expect} from '@playwright/test';
import {signupAndLogin, uniqueEmail, loginAsAdmin} from './helpers/auth';
import {findPendingVerificationCaseId, approveVerificationCase} from './helpers/admin';    
import {createSellerListing} from './helpers/reservation';


const API_URL = 'http://localhost:8080/api';

test('admin can approve a pending verification annd the student can then upload a listing', async ({browser, request}) => {
    test.setTimeout(90000);

    const studentContext = await browser.newContext();
    const adminContext = await browser.newContext();
    
    const studentPage = await studentContext.newPage();
    const adminPage = await adminContext.newPage();

    const studentEmail = uniqueEmail('student');
    await signupAndLogin(studentPage, request, {email: studentEmail});

    await loginAsAdmin(adminPage, request);
    const caseId = await findPendingVerificationCaseId(adminPage, studentEmail);
    await approveVerificationCase(adminPage, caseId);

    const stillPendingRes = await adminPage.request.get(
        `${API_URL}/admin/cases?type=verification&status=pending&limit=50`,

    );
    expect(stillPendingRes.ok()).toBeTruthy();
    const stillPendingBody = await stillPendingRes.json();
    const stillPendingCases: {caseId: string}[] = Array.isArray(stillPendingBody)
    ? stillPendingBody
    : (stillPendingBody.cases ?? []);
    expect(stillPendingCases.some((c) => c.caseId === caseId)).toBe(false);

    await studentPage.getByText('Switch', {exact: true}).click();
    await studentPage.waitForURL(/\/seller\/listings/);
    const {listingId} = await createSellerListing(studentPage);

    const publishRes = await studentPage.request.post(`${API_URL}/listings/${listingId}/publish`);
    expect(publishRes.ok(), `Publish failed after approval: ${publishRes.status()}`).toBeTruthy();

    await studentContext.close();
    await adminContext.close();

});

