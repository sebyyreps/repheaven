import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?output=csv';

const debug = async () => {
    try {
        console.log("Fetching CSV...");
        const res = await fetch(CSV_URL);
        const text = await res.text();

        const results = Papa.parse(text, {
            header: false,
            skipEmptyLines: true,
        });

        const rawData = results.data;

        // LOGIC FROM googleSheets.js

        const headerRowIndex = rawData.findIndex(row =>
            Array.isArray(row) && row.some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('raw link'))
        );

        console.log(`Header Row Index: ${headerRowIndex}`);
        if (headerRowIndex === -1) return;

        const headers = rawData[headerRowIndex];
        console.log('Headers:', headers);

        const findCol = (terms) => headers.findIndex(h =>
            h && typeof h === 'string' && terms.some(t => h.toLowerCase().includes(t))
        );

        const nameIdx = findCol(['name']);
        const imageIdx = findCol(['image']);
        const linkIdx = findCol(['raw link', 'product link']);
        const priceUSDIdx = findCol(['price ($)', 'price usd']);

        console.log(`Indices - Name:${nameIdx} Img:${imageIdx} Link:${linkIdx} USD:${priceUSDIdx}`);

        // Check first 5 items
        const items = rawData.slice(headerRowIndex + 1, headerRowIndex + 6).map(row => {
            return {
                Name: row[nameIdx],
                Image: row[imageIdx],
                Link: row[linkIdx],
                Price: row[priceUSDIdx]
            };
        });

        console.log("First 5 extracted items:", items);

    } catch (error) {
        console.error(error);
    }
};

debug();
