import Papa from 'papaparse';

// Use the SAME proxy as the app to verify if that's the point of failure
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?output=csv';

const debug = async () => {
    try {
        console.log("Fetching CSV via Proxy...");
        const res = await fetch(CORS_PROXY + encodeURIComponent(CSV_URL));
        const text = await res.text();

        console.log("First 100 chars of response:", text.substring(0, 100));

        // Parse without headers
        const results = Papa.parse(text, {
            header: false,
            skipEmptyLines: true,
        });

        const rawData = results.data;
        console.log(`Total Rows: ${rawData.length} `);

        const headerRowIndex = rawData.findIndex(row =>
            Array.isArray(row) && row.some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('item name'))
        );

        console.log(`Header Row Index: ${headerRowIndex} `);

        if (headerRowIndex === -1) return;

        const headers = rawData[headerRowIndex];

        let priceUSDIdx = headers.findIndex(h => h && typeof h === 'string' && h.toLowerCase().includes('price ($)'));
        if (priceUSDIdx === -1) {
            priceUSDIdx = headers.findIndex(h => h && typeof h === 'string' && h.toLowerCase().includes('price'));
        }

        // CNY is usually the next column
        const priceCNYIdx = priceUSDIdx + 1;

        console.log(`Price USD Index: ${priceUSDIdx}, Price CNY Index: ${priceCNYIdx} `);

        const cleanData = rawData.slice(headerRowIndex + 1).map((row, i) => {
            if (!Array.isArray(row)) return null;
            const nameIdx = 17; // Hardcoded from previous debug for quick test
            const name = row[nameIdx];

            if (i < 5) {
                console.log(`Row ${i} Price USD: "${row[priceUSDIdx]}" | Price CNY: "${row[priceCNYIdx]}"`);
            }

            if (!name || name.includes('Item name')) return null;

            return {
                'Name': name,
                'price USD': row[priceUSDIdx],
                'price CNY': row[priceCNYIdx]
            };
        }).filter(p => p !== null);

        console.log(`Valid Items: ${cleanData.length} `);

    } catch (e) {
        console.error(e);
    }
};

debug();
