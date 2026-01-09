import Papa from 'papaparse';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?output=csv';

const debug = async () => {
    try {
        const uniqueUrl = CSV_URL + '&t=' + Date.now();
        console.log("Fetching CSV with cache bust...");
        const res = await fetch(uniqueUrl);
        const text = await res.text();

        const results = Papa.parse(text, { header: false, skipEmptyLines: true });
        const rawData = results.data;

        // Find Header Row (Row 10)
        const headerRowIndex = rawData.findIndex(row =>
            Array.isArray(row) && row.some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('raw link'))
        );

        if (headerRowIndex === -1) { console.log("Header not found"); return; }

        const headers = rawData[headerRowIndex];
        console.log(`Headers at Row ${headerRowIndex}:`);
        headers.forEach((h, i) => console.log(`[${i}] = "${h}"`));

        console.log(`\nChecking Data in Column D (Index 3) for first 5 products:`);
        const products = rawData.slice(headerRowIndex + 1, headerRowIndex + 6);
        products.forEach((row, i) => {
            console.log(`Row ${i} (Name: ${row[4]}): Col D (Index 3) = "${row[3]}"`);
        });

    } catch (error) {
        console.error(error);
    }
};

debug();
