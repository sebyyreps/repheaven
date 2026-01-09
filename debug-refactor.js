import Papa from 'papaparse';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?output=csv';

const debug = async () => {
    try {
        console.log("Starting fetch...");
        const csvPromise = new Promise((resolve, reject) => {
            // Note: In Node we don't strictly *need* the proxy, but using it matches browser behavior.
            // However, standard `fetch` in Node might not like the Proxy URL construction if not handled right?
            // Actually, `api.allorigins.win` should work fine.
            fetch(CORS_PROXY + encodeURIComponent(CSV_URL))
                .then(res => res.text())
                .then(text => {
                    console.log("Fetch complete. Length:", text.length);
                    Papa.parse(text, {
                        header: false,
                        skipEmptyLines: true,
                        complete: (results) => resolve(results.data),
                        error: (err) => reject(err)
                    });
                })
                .catch(err => reject(err));
        });

        const rawData = await csvPromise;
        console.log("Rows:", rawData.length);

        // Find the row that looks like a header (contains "Item name")
        const headerRowIndex = rawData.findIndex(row =>
            Array.isArray(row) && row.some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('item name'))
        );

        console.log("Header Index:", headerRowIndex);

        if (headerRowIndex === -1) {
            console.warn("Could not find header row in CSV");
            return;
        }

        const headers = rawData[headerRowIndex];
        console.log("Headers:", headers);

        // fuzzy matching helpers
        const findCol = (terms) => headers.findIndex(h =>
            h && typeof h === 'string' && terms.some(t => h.toLowerCase().includes(t))
        );

        const nameIdx = findCol(['item name', 'name']);
        const imageIdx = findCol(['image', 'photo', 'img', 'pic']);
        const linkIdx = findCol(['link', 'url', 'w2c', 'buy']);
        const priceUSDIdx = findCol(['price ($)', 'price usd', 'usd']);
        const priceGenericIdx = findCol(['price']);
        const qcIdx = findCol(['qc', 'qc photo']);

        // Fallback for price if specific USD one isn't found
        const finalPriceIdx = (priceUSDIdx !== -1) ? priceUSDIdx : priceGenericIdx;
        // CNY is typically next to Price if found
        const priceCNYIdx = (finalPriceIdx !== -1) ? finalPriceIdx + 1 : -1;

        console.log(`Indices - Name:${nameIdx} Img:${imageIdx} Link:${linkIdx} Price:${finalPriceIdx}`);

        const products = rawData.slice(headerRowIndex + 1).map((row, i) => {
            if (!Array.isArray(row)) return null;

            const name = (nameIdx !== -1) ? row[nameIdx] : null;

            if (i < 5) console.log(`Row ${i} Name Check: ${name}`);

            if (!name || name.includes('Item name') || name.includes('Free $200')) return null;

            let link = (linkIdx !== -1) ? row[linkIdx] : null;
            if (link && link.trim() === 'LINK') link = null;

            let priceUSD = (finalPriceIdx !== -1) ? row[finalPriceIdx] : null;

            return {
                Name: name,
            };
        }).filter(p => p !== null);

        console.log("Final Products Count:", products.length);

    } catch (error) {
        console.error("Error loading products:", error);
    }
};

debug();
