import Papa from 'papaparse';

// CORS Proxy
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?output=csv';

const fetchProducts = async () => {
    try {
        console.log("Fetching products v3 (Force Refresh)...");

        // In Node we can fetch directly, but let's try to mimic the flow if possible.
        // However, `api.allorigins.win` might block non-browser origins or behave differently?
        // Let's try direct first to verify LOGIC.
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const csvText = await response.text();

        const results = Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true
        });

        const rawData = results.data;
        if (!rawData || rawData.length === 0) {
            console.log("Empty data");
            return [];
        }

        console.log(`Total Rows: ${rawData.length}`);

        // Find the Header Row (Row 10, index 10)
        // We look for 'raw link' to be sure
        const headerRowIndex = rawData.findIndex(row =>
            Array.isArray(row) && row.some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('raw link'))
        );

        if (headerRowIndex === -1) {
            console.warn("Could not find header row (looking for 'raw link').");
            // Check if we can find ANY header
            const anyHeader = rawData.findIndex(row =>
                Array.isArray(row) && row.some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('item name'))
            );
            console.log(`Fallback 'item name' check: ${anyHeader}`);
            return [];
        }

        console.log(`Header row found at index ${headerRowIndex}`);

        const headers = rawData[headerRowIndex];

        const findCol = (terms) => headers.findIndex(h =>
            h && typeof h === 'string' && terms.some(t => h.toLowerCase().includes(t))
        );

        const nameIdx = findCol(['name']);
        const imageIdx = findCol(['image']);
        const rawLinkIdx = findCol(['raw link']); // This is the gold mine
        const priceUSDIdx = findCol(['price ($)', 'price usd']);
        const priceCNYIdx = findCol(['price (¥)', 'price cny']);
        const qcIdx = findCol(['qc', 'qc photo']);

        console.log(`Indices: Name=${nameIdx}, Img=${imageIdx}, Link=${rawLinkIdx}, USD=${priceUSDIdx}`);

        const products = rawData.slice(headerRowIndex + 1).map(row => {
            if (!Array.isArray(row)) return null;

            const name = (nameIdx !== -1) ? row[nameIdx] : null;
            if (!name || name.trim() === '' || name.includes('Item name')) return null;

            // Prefer Raw Link (Index 7)
            let link = (rawLinkIdx !== -1) ? row[rawLinkIdx] : null;

            // Cleanup
            if (link && link.trim() === 'LINK') link = null;

            let priceUSD = (priceUSDIdx !== -1) ? row[priceUSDIdx] : null;
            if (priceUSD) priceUSD = priceUSD.replace(/[$,]/g, '').trim();

            let priceCNY = (priceCNYIdx !== -1) ? row[priceCNYIdx] : null;
            if (priceCNY) priceCNY = priceCNY.replace(/[¥,]/g, '').trim();

            return {
                Name: name,
                image: (imageIdx !== -1) ? row[imageIdx] : null,
                link: link,
                'price USD': priceUSD,
                'price CNY': priceCNY,
                'Qc photo': (qcIdx !== -1) ? row[qcIdx] : null
            };
        }).filter(p => p !== null);

        console.log(`Loaded ${products.length} products.`);
        if (products.length > 0) console.log("Sample:", products[0]);

        return products;

    } catch (error) {
        console.error("Error loading products:", error);
        return [];
    }
};

fetchProducts();
