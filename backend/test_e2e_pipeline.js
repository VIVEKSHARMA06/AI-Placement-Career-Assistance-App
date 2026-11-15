/**
 * End-to-end verification script for Multilingual Resume Pipeline + ATS + SBERT Job Recommender.
 */
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const mongoose = require("mongoose");
const config = require("./src/config/env");
const Resume = require("./src/models/Resume");

const BASE_URL = `http://localhost:${config.PORT}`;

async function runE2E() {
    console.log("=== STARTING END-TO-END PIPELINE VERIFICATION ===");

    await mongoose.connect(config.MONGODB_URI);
    console.log("✓ Connected to MongoDB directly for verification");

    // 1. Authenticate / Create test user
    const testEmail = `e2e_test_${Date.now()}@example.com`;
    const testPassword = "Password123!";

    let token;
    let userId;

    try {
        const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, {
            fullName: "E2E Test User",
            email: testEmail,
            password: testPassword,
        });
        token = registerRes.data.token || registerRes.data.data?.token;
        userId = registerRes.data.user?._id || registerRes.data.user?.id || registerRes.data.data?.user?.id;
        console.log("✓ Test user registered successfully:", testEmail);
    } catch (err) {
        console.error("User registration failed:", err.response?.data || err.message);
        process.exit(1);
    }

    const authHeaders = {
        Authorization: `Bearer ${token}`,
    };

    // 2. Upload English PDF
    console.log("\n--- TEST 1: English PDF Upload ---");
    const enPdfPath = path.resolve(__dirname, "../test_pdfs/test_english.pdf");
    const enFormData = new FormData();
    enFormData.append("file", fs.createReadStream(enPdfPath), {
        filename: "test_english.pdf",
        contentType: "application/pdf",
    });

    const enUploadRes = await axios.post(`${BASE_URL}/api/resume/upload`, enFormData, {
        headers: {
            ...authHeaders,
            ...enFormData.getHeaders(),
        },
    });

    console.log("✓ English upload HTTP status:", enUploadRes.status);
    const enResumeData = enUploadRes.data.data.resume;
    const enResumeId = enResumeData.id || enResumeData._id;
    console.log("✓ English resume ID:", enResumeId);

    // Verify in MongoDB
    const enDoc = await Resume.findById(enResumeId);
    console.log("✓ DB extractedText length:", enDoc.extractedText.length);
    console.log("✓ DB translatedText length:", enDoc.translatedText.length);
    console.log("✓ DB detectedLanguage:", enDoc.detectedLanguage);
    console.log("✓ DB translationApplied:", enDoc.translationApplied);

    if (
        enDoc.detectedLanguage !== "en" ||
        enDoc.translationApplied !== false ||
        enDoc.translatedText !== enDoc.extractedText
    ) {
        throw new Error("English resume DB assertion failed!");
    }
    console.log("✓ English DB assertions PASSED (en, translationApplied=false, translatedText===extractedText)");

    // 3. Test ATS Check on English Resume
    console.log("\n--- TEST 2: ATS Check on English Resume ---");
    const atsRes = await axios.post(
        `${BASE_URL}/api/ats/check`,
        {
            resumeId: enResumeId,
            jobDescription: "Looking for a Software Engineer proficient in Python, FastAPI, SQL, React, and Docker.",
        },
        { headers: authHeaders }
    );

    console.log("✓ ATS Check HTTP status:", atsRes.status);
    console.log("✓ ATS Score:", atsRes.data.atsScore);
    console.log("✓ ATS Matched Skills:", atsRes.data.breakdown?.matchedSkills);
    if (typeof atsRes.data.atsScore !== "number") {
        throw new Error("ATS score missing or not a number!");
    }
    console.log("✓ English ATS scoring PASSED");

    // 4. Test SBERT Job Recommendations on English Resume
    console.log("\n--- TEST 3: SBERT Job Recommendations on English Resume ---");
    const recRes = await axios.get(
        `${BASE_URL}/api/recommendations/jobs?resumeId=${enResumeId}`,
        { headers: authHeaders }
    );

    console.log("✓ Job recommendations HTTP status:", recRes.status);
    console.log("✓ Number of recommendations returned:", recRes.data.recommendations.length);
    const topRec = recRes.data.recommendations[0];
    console.log("✓ Top Recommendation:", {
        roleId: topRec.roleId,
        title: topRec.title,
        category: topRec.category,
        similarityScore: topRec.similarityScore,
        matchedSkills: topRec.matchedSkills,
        missingSkills: topRec.missingSkills,
        explanation: topRec.explanation,
    });
    if (!recRes.data.recommendations.length || !topRec.similarityScore) {
        throw new Error("Job recommendations assertion failed!");
    }
    console.log("✓ English Job Recommendations PASSED");

    // 5. Upload Hindi PDF
    console.log("\n--- TEST 4: Hindi PDF Upload & Translation ---");
    const hiPdfPath = path.resolve(__dirname, "../test_pdfs/test_hindi.pdf");
    const hiFormData = new FormData();
    hiFormData.append("file", fs.createReadStream(hiPdfPath), {
        filename: "test_hindi.pdf",
        contentType: "application/pdf",
    });

    const hiUploadRes = await axios.post(`${BASE_URL}/api/resume/upload`, hiFormData, {
        headers: {
            ...authHeaders,
            ...hiFormData.getHeaders(),
        },
    });

    console.log("✓ Hindi upload HTTP status:", hiUploadRes.status);
    const hiResumeData = hiUploadRes.data.data.resume;
    const hiResumeId = hiResumeData.id || hiResumeData._id;
    console.log("✓ Hindi resume ID:", hiResumeId);

    // Verify in MongoDB
    const hiDoc = await Resume.findById(hiResumeId);
    console.log("✓ DB extractedText preview (Hindi Unicode):", hiDoc.extractedText.substring(0, 60));
    console.log("✓ DB translatedText preview (English):", hiDoc.translatedText.substring(0, 60));
    console.log("✓ DB detectedLanguage:", hiDoc.detectedLanguage);
    console.log("✓ DB translationApplied:", hiDoc.translationApplied);

    if (
        hiDoc.detectedLanguage !== "hi" ||
        hiDoc.translationApplied !== true ||
        !/[\u0900-\u097F]/.test(hiDoc.extractedText) ||
        /[\u0900-\u097F]/.test(hiDoc.translatedText)
    ) {
        throw new Error("Hindi resume DB assertion failed!");
    }
    console.log("✓ Hindi DB assertions PASSED (hi, translationApplied=true, original text preserved, translatedText in English)");

    // 6. Test ATS Check on Hindi Resume (runs on translated English text)
    console.log("\n--- TEST 5: ATS Check on Hindi Resume (using translated text) ---");
    const hiAtsRes = await axios.post(
        `${BASE_URL}/api/ats/check`,
        {
            resumeId: hiResumeId,
            jobDescription: "Looking for a Software Engineer proficient in Python, FastAPI, SQL, React, and MongoDB.",
        },
        { headers: authHeaders }
    );

    console.log("✓ Hindi ATS Check HTTP status:", hiAtsRes.status);
    console.log("✓ Hindi ATS Score:", hiAtsRes.data.atsScore);
    console.log("✓ Hindi ATS Matched Skills:", hiAtsRes.data.breakdown?.matchedSkills);
    if (typeof hiAtsRes.data.atsScore !== "number") {
        throw new Error("Hindi ATS score missing or not a number!");
    }
    console.log("✓ Hindi ATS scoring on translated English text PASSED");

    // 7. Test SBERT Job Recommendations on Hindi Resume (runs on translated English text)
    console.log("\n--- TEST 6: SBERT Job Recommendations on Hindi Resume ---");
    const hiRecRes = await axios.get(
        `${BASE_URL}/api/recommendations/jobs?resumeId=${hiResumeId}`,
        { headers: authHeaders }
    );

    console.log("✓ Hindi Job recommendations HTTP status:", hiRecRes.status);
    console.log("✓ Number of recommendations returned:", hiRecRes.data.recommendations.length);
    const hiTopRec = hiRecRes.data.recommendations[0];
    console.log("✓ Hindi Top Recommendation:", {
        roleId: hiTopRec.roleId,
        title: hiTopRec.title,
        category: hiTopRec.category,
        similarityScore: hiTopRec.similarityScore,
        matchedSkills: hiTopRec.matchedSkills,
        missingSkills: hiTopRec.missingSkills,
        explanation: hiTopRec.explanation,
    });
    if (!hiRecRes.data.recommendations.length || !hiTopRec.similarityScore) {
        throw new Error("Hindi job recommendations assertion failed!");
    }
    console.log("✓ Hindi Job Recommendations on translated text PASSED");

    // Clean up test data
    await Resume.deleteMany({ _id: { $in: [enResumeId, hiResumeId] } });
    console.log("\n✓ Cleaned up test resumes from MongoDB");

    await mongoose.disconnect();
    console.log("\n=== ALL END-TO-END TESTS COMPLETED SUCCESSFULLY ===");
}

runE2E().catch((err) => {
    console.error("E2E Test Failure:", err);
    process.exit(1);
});
