const fs = require('fs');
const path = require('path');

try {
    // 1. Fix gouverneur/page.tsx (z-index and notifications)
    const pagePath = path.join(__dirname, 'app', '[locale]', 'gouverneur', 'page.tsx');
    if (fs.existsSync(pagePath)) {
        let content = fs.readFileSync(pagePath, 'utf8');
        // Fix z-index for the sidebar wrapper: <div className="relative z-10">\n      {/* Mobile Backdrop */}
        content = content.replace(/<div className="relative z-10">\s*\{\/\* Mobile Backdrop \*\/\}/g, '<div className="relative z-[3000]">\n      {/* Mobile Backdrop */}');
        // If not found above, try a looser match just before MODERN SIDEBAR
        content = content.replace(/\{\/\* 🏛️ MODERN SIDEBAR \/ NAVIGATION \*\/\}\s*<div className="relative z-10">/g, '{/* 🏛️ MODERN SIDEBAR / NAVIGATION */}\n      <div className="relative z-[3000]">');
        
        // Reset unread count when clicking notifications
        content = content.replace(/onClick=\{\(\) => setIsNotifOpen\(\!isNotifOpen\)\}/g, 'onClick={() => { setIsNotifOpen(!isNotifOpen); setUnreadCount(0); }}');
        
        fs.writeFileSync(pagePath, content);
        console.log('Fixed page.tsx');
    }

    // 2. Fix EvenementsTab.tsx (report redirection)
    const evTabPath = path.join(__dirname, 'app', '[locale]', 'gouverneur', 'components', 'EvenementsTab.tsx');
    if (fs.existsSync(evTabPath)) {
        let content = fs.readFileSync(evTabPath, 'utf8');
        // Fix router.push to use window.location.href or valid route for bilan
        content = content.replace(/router\.push\(`\/\$\{typeContenu\}\/\$\{selectedItem\.id\}`\);/g, "window.location.href = `/${locale}/gouverneur/bilans?id=${selectedItem.id}`;");
        content = content.replace(/window\.open\(`\/\$\{locale\}\/\$\{typeContenu\}\/\$\{selectedItem\.id\}`,\s*'_blank'\);/g, "window.location.href = `/${locale}/gouverneur/bilans?id=${selectedItem.id}`;");
        fs.writeFileSync(evTabPath, content);
        console.log('Fixed EvenementsTab.tsx');
    }

    // 3. Fix ReclamationsTab.tsx (grid.png 404 and contrast)
    const recTabPath = path.join(__dirname, 'app', '[locale]', 'gouverneur', 'components', 'ReclamationsTab.tsx');
    if (fs.existsSync(recTabPath)) {
        let content = fs.readFileSync(recTabPath, 'utf8');
        // Remove the grid.png
        content = content.replace(/bg-\[url\('\/patterns\/grid\.png'\)\]/g, "bg-slate-800/10");
        // Contrast fix - there is a block for TIT MELLIL / Area Admin. Typically "Zone Administrative" or similar
        // We look for text-slate-400 or text-white/40 inside dark backgrounds and bump them.
        content = content.replace(/text-slate-400/g, 'text-slate-300');
        content = content.replace(/text-white\/40/g, 'text-white/80');
        content = content.replace(/text-white\/20/g, 'text-white/70');
        fs.writeFileSync(recTabPath, content);
        console.log('Fixed ReclamationsTab.tsx');
    }

} catch (e) {
    console.error(e);
}
