import Papa from 'papaparse';

// CORS Proxy - Needed for live Google Sheets fetch
const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

// LIVE Google Sheet URL - Corrected Sheet ID (GID)
const LIVE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTawBQy6cnTnEYHarniXRqn5DGBQiRLzlgQZR9S-8yGRIdwuL8JrtoD3r-sOFgAAQsi2kMQHgZvkGh0/pub?gid=1993840151&single=true&output=csv';

// Use local relative path as CSV_URL since we snapshot it to /public
const LOCAL_CSV_URL = '/data_snapshot.csv';

// Helper to categorize based on name (Restored & Enhanced)
const getCategoryInfo = (name) => {
    if (!name) return { main: 'Other', sub: null };
    const n = name.toLowerCase();

    // SHOES & BRAND DETECTION
    if (n.includes('jordan') || n.includes('dunk') || n.includes('yeezy') || n.includes('runner') || n.includes('trainer') || n.includes('slide') || n.includes('shoe') || n.includes('boot') || n.includes('track') || n.includes('sneaker') || n.includes('croc') || n.includes('asics') || n.includes('new balance') || n.includes('timberland') || n.includes('vuitton skate') || n.includes('shox') || n.includes('foamposite') || n.includes('uptempo')) {
        let sub = null;
        if (n.includes('jordan')) sub = 'Jordan';
        else if (n.includes('yeezy')) sub = 'Yeezy';
        else if (n.includes('dunk')) sub = 'Dunk';
        else if (n.includes('asics')) sub = 'Asics';
        else if (n.includes('new balance')) sub = 'New Balance';
        else if (n.includes('slide')) sub = 'Slides/Crocs';
        else if (n.includes('croc')) sub = 'Slides/Crocs';

        return { main: 'Shoes', sub };
    }

    // CLOTHING
    if (n.includes('hoodie') || n.includes('jacket') || n.includes('vest') || n.includes('sweater') || n.includes('crewneck') || n.includes('fleece') || n.includes('coat') || n.includes('zip up') || n.includes('cardigan') || n.includes('windbreaker')) {
        let sub = null;
        if (n.includes('trapstar')) sub = 'Trapstar';
        else if (n.includes('syna')) sub = 'Syna World';
        else if (n.includes('corteiz') || n.includes('crtz')) sub = 'Corteiz';
        return { main: 'Hoodies/Jackets', sub };
    }

    if (n.includes('t-shirt') || n.includes('tee') || n.includes('shirt') || n.includes('polo') || n.includes('jersey') || n.includes('top') || n.includes('longsleeve')) {
        return { main: 'T-Shirts/Tops', sub: null };
    }

    if (n.includes('pant') || n.includes('short') || n.includes('jean') || n.includes('trouser') || n.includes('jogger') || n.includes('sweatpant') || n.includes('legging') || n.includes('jort') || n.includes('denim') || n.includes('bottom')) {
        return { main: 'Pants/Shorts', sub: null };
    }

    if (n.includes('bag') || n.includes('backpack') || n.includes('duffle')) return { main: 'Accessories', sub: 'Bags' };
    if (n.includes('beanie')) return { main: 'Accessories', sub: 'Beanies' };
    if (n.includes('hat') || n.includes('cap')) return { main: 'Accessories', sub: 'Headwear' };
    if (n.includes('belt') || n.includes('buckle') || n.includes('waist') || n.includes('strap') || n.includes('ferragamo') || n.includes('hermes') || n.includes('gucci')) return { main: 'Accessories', sub: 'Belts' };
    if (n.includes('wallet') || n.includes('cardholder')) return { main: 'Accessories', sub: 'Wallets' };
    if (n.includes('sock')) return { main: 'Accessories', sub: 'Socks' };
    if (n.includes('scarf')) return { main: 'Accessories', sub: 'Scarves' };
    if (n.includes('glass')) return { main: 'Accessories', sub: 'Glasses' };
    if (n.includes('jewel') || n.includes('ring') || n.includes('chain') || n.includes('necklace') || n.includes('bracelet')) return { main: 'Accessories', sub: 'Jewelry' };

    if (n.includes('accessory') || n.includes('mask') || n.includes('glove') || n.includes('phone') || n.includes('watch') || n.includes('case') || n.includes('rug') || n.includes('pillow')) {
        return { main: 'Accessories', sub: 'Misc' };
    }

    return { main: 'Other', sub: null };
};

// Helper to parse CSV text into product objects
const parseProducts = (csvText, source) => {
    try {
        console.log(`Parsing data from: ${source}...`);

        if (!csvText || csvText.length < 100) {
            throw new Error("Invalid CSV content received");
        }

        const results = Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true
        });

        const rawData = results.data;
        if (!rawData || rawData.length === 0) {
            console.warn("Parsed CSV is empty.");
            return FALLBACK_PRODUCTS;
        }

        console.log(`Raw CSV Rows (${source}):`, rawData.length);

        const headerRowIndex = -100; // Force bypass
        const imageIdx = 3;
        const nameIdx = 4;
        const rawLinkIdx = 2; // Column C
        const priceUSDIdx = 8;
        const priceCNYIdx = 9;
        const qcIdx = 10;

        let currentCategory = null;
        let currentSubcategory = null;
        let sectionCount = 0;

        const products = rawData.map((row, index) => {
            if (index <= headerRowIndex) return null; // Skip metadata rows
            if (!Array.isArray(row) || row.length < 5) return null;

            // SECTION HEADER DETECTION
            const col3 = (imageIdx !== -1 && row[imageIdx]) ? row[imageIdx].trim() : '';
            const col4 = (nameIdx !== -1 && row[nameIdx]) ? row[nameIdx].trim() : '';

            // Check for data in other columns to clarify if it's a product
            const hasLink = (rawLinkIdx !== -1 && row[rawLinkIdx] && row[rawLinkIdx].trim() !== '' && row[rawLinkIdx] !== 'LINK' && row[rawLinkIdx] !== '#');
            const hasPrice = (priceUSDIdx !== -1 && row[priceUSDIdx] && row[priceUSDIdx].trim() !== '') || (priceCNYIdx !== -1 && row[priceCNYIdx] && row[priceCNYIdx].trim() !== '');

            // It's a header IF: No Image AND Name exists AND No Link AND No Price
            if (col3 === '' && col4 !== '' && col4.length > 2 && !hasLink && !hasPrice) {
                if (col4.includes('My Tiktok') || col4.includes('Click here') || col4 === 'Name') return null;

                if (col4.includes('Best sellers') || col4.toLowerCase().includes('quick link') || col4.toLowerCase().includes('repheaven')) {
                    currentCategory = null;
                    currentSubcategory = null;
                    return null;
                }

                const catInfo = getCategoryInfo(col4);

                if (col4.toLowerCase().includes('bag') || col4.toLowerCase().includes('handbag')) {
                    currentCategory = 'Accessories';
                    currentSubcategory = 'Bags';
                } else if (catInfo.main !== 'Other') {
                    currentCategory = catInfo.main;
                    currentSubcategory = col4.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                } else {
                    currentCategory = 'Other';
                    currentSubcategory = col4.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                }

                sectionCount++;
                return null;
            }

            // PRODUCT PARSING
            const name = col4;
            if (!name || name.trim() === '' || name.includes('Item name') || name.includes('---')) return null;

            let link = row[rawLinkIdx] ? row[rawLinkIdx].trim() : null;
            if (link && (link === 'LINK' || link === '#' || link.toLowerCase().includes('click here'))) link = null;

            let priceUSD = (priceUSDIdx !== -1) ? row[priceUSDIdx] : null;
            if (priceUSD) priceUSD = priceUSD.replace(/[$,]/g, '').trim();

            let priceCNY = (priceCNYIdx !== -1) ? row[priceCNYIdx] : null;
            if (priceCNY) priceCNY = priceCNY.replace(/[¥,]/g, '').trim();

            let finalImage = col3;
            if ((!finalImage || finalImage === '') && qcIdx !== -1) {
                if (row[qcIdx] && row[qcIdx].trim() !== '') {
                    finalImage = row[qcIdx].trim();
                }
            }

            if (!finalImage || (!finalImage.includes('http') && !finalImage.includes('drive.google.com'))) return null;

            let category = currentCategory;
            let subcategory = currentSubcategory;

            if (!category) {
                const detected = getCategoryInfo(name);
                category = detected.main;
                subcategory = detected.sub;
            } else if (!subcategory) {
                const detected = getCategoryInfo(name);
                subcategory = detected.sub;
            }

            // FORCE OVERRIDES based on Name (Exceptions to the rule)
            const nLower = name.toLowerCase();
            if (nLower.includes('glass')) {
                category = 'Accessories';
                subcategory = 'Glasses';
            } else if (nLower.includes('beanie')) {
                category = 'Accessories';
                subcategory = 'Beanies';
            } else if (nLower.includes('wallet') || nLower.includes('cardholder')) {
                category = 'Accessories';
                subcategory = 'Wallets';
            }

            // EXCEPTION: Manual Overrides
            if (index === 21 || index === 32) {
                category = 'Hoodies/Jackets';
                if (!subcategory) subcategory = 'Other';
            }
            if ((index >= 11 && index <= 16) || (index >= 33 && index <= 37) || index === 72) {
                category = 'Shoes';
            }

            if (finalImage && finalImage.includes('drive.google.com')) {
                let id = null;
                const idMatch = finalImage.match(/id=([^&/]+)/) || finalImage.match(/\/d\/([^&/]+)/);
                if (idMatch) {
                    id = idMatch[1];
                    const driveUrl = `https://drive.google.com/uc?id=${id}`;
                    if (category === 'Shoes') {
                        finalImage = `https://wsrv.nl/?url=${encodeURIComponent(driveUrl)}&w=800`;
                    } else {
                        finalImage = `https://wsrv.nl/?url=${encodeURIComponent(driveUrl)}&w=800&h=800&fit=cover&a=top`;
                    }
                }
            }

            return {
                Name: name.trim().replace(/\n/g, ' '),
                image: finalImage,
                link: link,
                'price USD': priceUSD,
                'price CNY': priceCNY,
                'Qc photo': (qcIdx !== -1) ? row[qcIdx] : null,
                category: category,
                subcategory: subcategory
            };
        }).filter(p => p !== null);

        console.log(`✅ Loaded ${products.length} products from ${sectionCount} sections.`);
        return products.length > 0 ? products : FALLBACK_PRODUCTS;

    } catch (error) {
        console.error("Error parsing products:", error);
        return FALLBACK_PRODUCTS;
    }
};

// FALLBACK DATA (Emergency Set) - Used if fetch completely fails
const FALLBACK_PRODUCTS = [
    { Name: "Jordan 4 Black Cat", "price USD": "45", image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80", link: "#", category: "Shoes", subcategory: "Jordan" },
    { Name: "Nike Dunk Low Panda", "price USD": "35", image: "https://images.unsplash.com/photo-1628149455676-90f77d337a77?auto=format&fit=crop&w=800&q=80", link: "#", category: "Shoes", subcategory: "Dunk" },
    { Name: "Essentials Hoodie", "price USD": "25", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80", link: "#", category: "Hoodies/Jackets", subcategory: "Other" },
    { Name: "Travis Scott J1", "price USD": "55", image: "https://images.unsplash.com/photo-1586525198428-225f6f12cff5?auto=format&fit=crop&w=800&q=80", link: "#", category: "Shoes", subcategory: "Jordan" },
    { Name: "Yeezy Slide", "price USD": "15", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80", link: "#", category: "Shoes", subcategory: "Slides/Crocs" },
    { Name: "Corteiz T-Shirt", "price USD": "20", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80", link: "#", category: "T-Shirts/Tops", subcategory: "Corteiz" },
    { Name: "Gallery Dept Tee", "price USD": "22", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80", link: "#", category: "T-Shirts/Tops", subcategory: "Gallery Dept" },
    { Name: "Rick Owens Ramones", "price USD": "60", image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80", link: "#", category: "Shoes", subcategory: "Rick Owens" }
];

// FETCH STRATEGY: 
// 1. Try Live Fetch.
// 2. If > 1s, trigger Fallback immediately but keep trying Live.
// 3. If Live eventually succeeds, update data.
export const fetchProducts = (onDataLoaded) => {
    let fallbackTriggered = false;
    let liveLoaded = false;

    // 1. Start Fallback Timer (1s)
    const fallbackTimer = setTimeout(async () => {
        if (!liveLoaded) {
            console.warn("⏳ Live fetch taking > 1s. Loading Backup...");
            fallbackTriggered = true;
            try {
                const response = await fetch(LOCAL_CSV_URL);
                if (!response.ok) throw new Error("Local snapshot missing");
                const text = await response.text();
                const products = parseProducts(text, "Local Snapshot (Backup)");
                onDataLoaded(products);
            } catch (err) {
                console.error("Backup load failed:", err);
                onDataLoaded(FALLBACK_PRODUCTS);
            }
        }
    }, 1000);

    // 2. Attempt Live Fetch
    const attemptLiveFetch = async () => {
        try {
            console.log("Attempting LIVE fetch...");
            const cacheBuster = `&t=${Date.now()}`;
            // Removed AbortController to allow it to finish even if late
            const response = await fetch(`${CORS_PROXY}${encodeURIComponent(LIVE_CSV_URL + cacheBuster)}`);

            if (response.ok) {
                const text = await response.text();
                if (text.length > 100) {
                    liveLoaded = true;
                    clearTimeout(fallbackTimer); // Cancel fallback if it hasn't fired
                    console.log("✅ LIVE Data fetched!");

                    const products = parseProducts(text, "Live Google Sheet");
                    onDataLoaded(products);

                    if (fallbackTriggered) {
                        console.log("🔄 Replaced Backup data with Live data.");
                    }
                    return;
                }
            }
            throw new Error(`Status ${response.status}`);
        } catch (error) {
            console.warn("Live fetch failed:", error);
            // If fallback hasn't triggered yet and live failed quickly (<1s), trigger fallback now
            if (!fallbackTriggered && !liveLoaded) {
                clearTimeout(fallbackTimer);
                console.warn("Live failed quickly. Loading Backup immediately.");
                try {
                    const response = await fetch(LOCAL_CSV_URL);
                    const text = await response.text();
                    onDataLoaded(parseProducts(text, "Local Snapshot (Immediate Fallback)"));
                } catch (e) {
                    onDataLoaded(FALLBACK_PRODUCTS);
                }
            }
        }
    };

    attemptLiveFetch();
};


