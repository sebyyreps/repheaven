import Papa from 'papaparse';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?output=csv';

const debug = async () => {
    try {
        const uniqueUrl = CSV_URL + '&t=' + Date.now();
        console.log("Fetching CSV with cache bust...");
        // Direct fetch in node
        const res = await fetch(uniqueUrl);
        const text = await res.text();

        const results = Papa.parse(text, {
            header: false,
            skipEmptyLines: true,
        });

        const rawData = results.data;
        const headerRowIndex = rawData.findIndex(row =>
            Array.isArray(row) && row.some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('raw link'))
        );

        if (headerRowIndex === -1) {
            console.log("Header not found!");
            return;
        }

        // Index 7 is raw link based on previous knowledge
        // Let's verify
        const headers = rawData[headerRowIndex];
        const rawLinkIdx = headers.findIndex(h => h.toLowerCase().includes('raw link'));
        console.log(`Raw Link Index: ${rawLinkIdx}`);

        const products = rawData.slice(headerRowIndex + 1);

        let validLinks = 0;
        let emptyLinks = 0;
        let weirdLinks = 0;

        products.forEach((row, i) => {
            if (!row[4]) return; // Skip empty names

            const link = row[rawLinkIdx];
            if (!link || link.trim() === '') {
                emptyLinks++;
                if (i < 5) console.log(`Empty Link at Row ${i}: ${row[4]}`);
            } else if (link.startsWith('http')) {
                validLinks++;
            } else {
                weirdLinks++;
                console.log(`Weird Link at Row ${i} (${row[4]}): ${link}`);
            }
        });

        console.log(`\nResults:`);
        console.log(`Valid Links: ${validLinks}`);
        console.log(`Empty Links: ${emptyLinks}`);
        console.log(`Weird Links: ${weirdLinks}`);
        console.log(`Total Products checked: ${validLinks + emptyLinks + weirdLinks}`);

    } catch (error) {
        console.error(error);
    }
};

debug();
