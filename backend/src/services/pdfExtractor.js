const path = require("path");

const standardFontDataUrl = `${path.dirname(
    require.resolve("pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf"),
)}${path.sep}`;

const extractTextFromPDF = async (data) => {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const bytes = Buffer.isBuffer(data)
        ? new Uint8Array(data)
        : data instanceof ArrayBuffer
            ? new Uint8Array(data)
            : data;
    const document = await pdfjsLib.getDocument({
        data: bytes,
        standardFontDataUrl,
    }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const items = content.items
            .filter((item) => typeof item.str === "string" && item.str.trim())
            .map((item) => ({
                x: Array.isArray(item.transform) ? item.transform[4] : 0,
                y: Array.isArray(item.transform) ? item.transform[5] : 0,
                text: item.str,
            }))
            .sort((left, right) => right.y - left.y || left.x - right.x);

        pages.push(items.map((item) => item.text).join(" "));
    }

    return pages.join("\n").trim();
};

module.exports = { extractTextFromPDF };