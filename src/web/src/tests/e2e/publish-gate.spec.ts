import {test, expect} from '@playwright/test';
import {signupAndLogin, loginAsAdmin, uniqueEmail} from './helpers/auth';
import {findPendingVerificationCaseId, approveVerificationCase} from './helpers/admin';
import {createSellerListing} from './helpers/reservation';

const API_URL = "http://localhost:8080/api";


test ('publish is blocked for an unveriried seller and then unlocks when the admin verifies them ', async ({browser, request}) => {
    test.setTimeout(90000);

    const studentContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    const adminPage = await adminContext.newPage();

    const studentEmail = uniqueEmail('student');
    await signupAndLogin(studentPage, request, {email: studentEmail});

    await studentPage.getByText('Switch', {exact: true}).click();
    await studentPage.waitForURL(/\/seller\/listings/);
    const {listingId} = await createSellerListing(studentPage);

    const blockedRes = await studentPage.request.post(`${API_URL}/listings/${listingId}/publish`);
    expect(blockedRes.status()).toBe(403);
    const blockedBody = await blockedRes.json().catch(() => null);
    expect(blockedBody?.error).toBe('SELLER_NOT_VERIFIED');

    await loginAsAdmin(adminPage, request);
    const caseId = await findPendingVerificationCaseId(adminPage, studentEmail);
    await approveVerificationCase(adminPage, caseId);

    const publishRes = await studentPage.request.post(`${API_URL}/listings/${listingId}/publish`);
    expect(publishRes.ok(), `Publish failed after approval: ${publishRes.status()}`).toBeTruthy();

    await studentContext.close();
    await adminContext.close();
});