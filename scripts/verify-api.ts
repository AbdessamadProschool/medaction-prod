import { GET as getList } from "@/app/api/etablissements/route";
import { GET as getOne, PATCH, DELETE } from "@/app/api/etablissements/[id]/route";
import { GET as search } from "@/app/api/etablissements/search/route";
import { NextRequest } from "next/server";

// Mock NextRequest
const createRequest = (url: string, method: string = "GET", body?: any) => {
    return new NextRequest(new URL(url, "http://localhost:3000"), {
        method,
        body: body ? JSON.stringify(body) : undefined,
    });
};

async function runTests() {
    console.log("Starting API verification...");

    // 1. Test List
    console.log("\n--- Testing GET /api/etablissements ---");
    const listReq = createRequest("/api/etablissements?page=1&limit=5");
    const listRes = await getList(listReq);
    const listData = await listRes.json();
    console.log("Status:", listRes.status);
    console.log("Data count:", listData.data?.length);

    let testId = listData.data?.[0]?.id;

    // 2. Test Search
    console.log("\n--- Testing GET /api/etablissements/search ---");
    const searchReq = createRequest("/api/etablissements/search?q=ecole");
    const searchRes = await search(searchReq);
    const searchData = await searchRes.json();
    console.log("Status:", searchRes.status);
    console.log("Search results:", searchData.length);

    if (testId) {
        // 3. Test Get One
        console.log(`\n--- Testing GET /api/etablissements/${testId} ---`);
        const getOneReq = createRequest(`/api/etablissements/${testId}`);
        const getOneRes = await getOne(getOneReq, { params: Promise.resolve({ id: String(testId) }) });
        const getOneData = await getOneRes.json();
        console.log("Status:", getOneRes.status);
        console.log("Name:", getOneData.nom);

        // 4. Test PATCH
        console.log(`\n--- Testing PATCH /api/etablissements/${testId} ---`);
        const patchReq = createRequest(`/api/etablissements/${testId}`, "PATCH", {
            nom: getOneData.nom + " (Updated)",
        });
        const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: String(testId) }) });
        const patchData = await patchRes.json();
        console.log("Status:", patchRes.status);
        console.log("Updated Name:", patchData.nom);

        // Revert change
        console.log("Reverting change...");
        const revertReq = createRequest(`/api/etablissements/${testId}`, "PATCH", {
            nom: getOneData.nom,
        });
        await PATCH(revertReq, { params: Promise.resolve({ id: String(testId) }) });
    } else {
        console.log("Skipping ID tests (no data found)");
    }

    console.log("\nVerification complete.");
}

runTests().catch(console.error);
