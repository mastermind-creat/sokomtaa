const fs = require('fs');

function showContext(file, lineStr) {
    try {
        const lines = fs.readFileSync(file, 'utf8').split('\n');
        const lineVal = parseInt(lineStr, 10);
        console.log(`\n=== Context for ${file}:${lineStr} ===`);
        const start = Math.max(0, lineVal - 10);
        const end = Math.min(lines.length, lineVal + 10);
        for (let i = start; i < end; i++) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
    } catch (e) {
        console.log(`Failed to read ${file}`);
    }
}

showContext('app/trader/apply-stall/page.tsx', '203');
showContext('app/admin/applications/page.tsx', '229');
showContext('app/trader/complaints/page.tsx', '242');
showContext('app/trader/products/[id]/edit/page.tsx', '220');
showContext('app/trader/reservations/[id]/page.tsx', '121');
showContext('app/admin/stalls/page.tsx', '355');
showContext('app/trader/fees/page.tsx', '251');
showContext('app/trader/settings/page.tsx', '166');
showContext('app/admin/fees/page.tsx', '28');

