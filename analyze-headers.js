import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?output=csv';

(async () => {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();

    const results = Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true
    });

    console.log('Total rows:', results.data.length);
    console.log('Scanning for potential headers (Col 3 empty, Col 4 has text)...');

    let potentialHeaders = [];

    results.data.forEach((row, index) => {
        // Assuming 0-based index:
        // Col 3 (Index 3): Image URL (Should be empty for header)
        // Col 4 (Index 4): Name/Header Text (Should be present)

        // Safety check for row length
        if (row.length < 5) return;

        const col3 = row[3] ? row[3].trim() : '';
        const col4 = row[4] ? row[4].trim() : '';

        if (col3 === '' && col4 !== '' && col4.length > 2) {
            // Exclude likely column headers or garbage
            if (col4 === 'Name' || col4 === 'Item name' || col4.includes('Click here') || col4.includes('My Tiktok')) return;

            console.log(`Row ${index + 1}: [${col4}]`);
            potentialHeaders.push({ row: index + 1, text: col4 });
        }
    });

    console.log(`\nFound ${potentialHeaders.length} potential headers.`);
})();
