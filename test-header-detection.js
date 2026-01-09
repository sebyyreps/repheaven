import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?output=csv';

// Helper to detect if a row is a section header
const isSectionHeader = (row) => {
    if (!Array.isArray(row) || row.length === 0) return null;

    // Check ALL cells in the row for section headers (they can be in any column)
    for (const cell of row) {
        if (!cell || typeof cell !== 'string' || cell.trim() === '') continue;

        const text = cell.trim();

        // Pattern 1: Rows with fire emojis like "🔥🔥 Best sellers 🔥🔥"
        if (text.includes('🔥🔥')) {
            // Extract the category name between the emojis
            const match = text.match(/🔥🔥\s*(.+?)\s*🔥🔥/);
            if (match) return match[1].trim();
            return text.replace(/🔥/g, '').trim();
        }

        // Pattern 2: Known category names
        const knownCategories = [
            'Best sellers',
            'Hoodies/Jackets',
            'Pants/Shorts',
            'Tees/Shirts',
            'T-Shirts/Tops',
            'Accessories',
            'Shoes',
            'Footwear'
        ];

        // Check if this cell contains a category name
        const normalized = text.toLowerCase();
        for (const cat of knownCategories) {
            if (normalized === cat.toLowerCase() || (normalized.includes(cat.toLowerCase()) && text.length < 50)) {
                // Make sure it's not just a product that happens to contain the word
                // Header rows are typically short and don't have URLs or prices
                const hasUrl = row.some(cell => cell && typeof cell === 'string' && cell.includes('http'));
                const hasPrice = row.some(cell => cell && typeof cell === 'string' && /[\$¥]\d+/.test(cell));

                if (!hasUrl && !hasPrice) {
                    return cat;
                }
            }
        }
    }

    return null;
};

(async () => {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();

    const results = Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true
    });

    console.log('Total rows:', results.data.length);
    console.log('\nChecking first 30 rows for headers:');

    for (let i = 0; i < Math.min(30, results.data.length); i++) {
        const row = results.data[i];
        const header = isSectionHeader(row);

        if (header) {
            console.log(`✅ Row ${i}: HEADER DETECTED: "${header}"`);
            console.log(`   Row content:`, row.map(c => c?.substring(0, 30)).filter(c => c));
        } else if (row.some(cell => cell && cell.includes && (cell.includes('🔥') || cell.includes('Best') || cell.includes('Hoodie')))) {
            console.log(`❌ Row ${i}: NOT DETECTED AS HEADER`);
            console.log(`   Row content:`, row.map(c => c?.substring(0, 30)).filter(c => c));
            console.log(`   Raw row:`, row);
        }
    }
})();
