import * as XLSX from 'xlsx';
import * as fs from 'fs';

const debug = async () => {
    try {
        console.log("Reading local 'test.xlsx'...");
        const buf = fs.readFileSync('test.xlsx');

        const workbook = XLSX.read(buf, { type: 'buffer', cellLinks: true });
        const sheetName = workbook.SheetNames[0];
        console.log(`Reading sheet: ${sheetName}`);

        const sheet = workbook.Sheets[sheetName];
        // Check ref range
        if (!sheet['!ref']) {
            console.log("Sheet has no ref range!");
            return;
        }
        const range = XLSX.utils.decode_range(sheet['!ref']);

        console.log(`Range: ${sheet['!ref']}`);

        // Let's look for "LINK" cells and see if they have hyperlinks
        // We'll scan a few rows around row 6 (where headers are) + data rows

        // Scan first 20 rows
        for (let R = 5; R <= 25; ++R) {
            for (let C = 0; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                const cell = sheet[cellRef];
                if (!cell) continue;

                // Check if cell has text "LINK"
                if (cell.v === 'LINK' || (typeof cell.v === 'string' && cell.v.includes('LINK'))) {
                    console.log(`Found LINK at ${cellRef}:`, cell.v);
                    if (cell.l) {
                        console.log(`   -> Hyperlink Target:`, cell.l.Target);
                    } else {
                        console.log(`   -> No hyperlink found object.`);
                    }
                }
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
};

debug();
