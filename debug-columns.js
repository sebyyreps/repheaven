import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?output=csv';

const debug = async () => {
    try {
        console.log("Fetching CSV (Direct)...");
        const res = await fetch(CSV_URL);
        const text = await res.text();

        const results = Papa.parse(text, {
            header: false,
            skipEmptyLines: true,
        });

        const rawData = results.data;

        // Print first 30 rows to visually identify the headers
        console.log("Scanning first 25 rows for 'Name', 'raw link' etc...");

        rawData.slice(0, 25).forEach((row, rowIndex) => {
            // Convert row to a simple string representation for easy scanning
            // We are looking for columns E (index 4) onwards
            const rowPreview = row.map((cell, idx) => {
                if (idx < 20) return `[${idx}]=${cell}`; // Only show first 20 cols
                return null;
            }).filter(Boolean).join(" | ");

            console.log(`Row ${rowIndex}: ${rowPreview.substring(0, 200)}...`);

            // Check specifically for "raw link"
            if (row.some(c => c && c.toLowerCase().includes('raw link'))) {
                console.log(`>>> POSSIBLE HEADER FOUND at Row ${rowIndex} <<<`);
            }
        });

    } catch (error) {
        console.error(error);
    }
};

debug();
