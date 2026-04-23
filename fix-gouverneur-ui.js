const fs = require('fs');
const path = require('path');

const applyFixes = () => {
  // 1. Gouverneur Page
  const pagePath = path.join(__dirname, 'app', '[locale]', 'gouverneur', 'page.tsx');
  let pageContent = fs.readFileSync(pagePath, 'utf8');
  pageContent = pageContent.replace('z-[1900]', 'z-[2045]');
  fs.writeFileSync(pagePath, pageContent);
  console.log('Fixed page.tsx');

  // 2. EvenementsTab
  const eventsTabPath = path.join(__dirname, 'app', '[locale]', 'gouverneur', 'components', 'EvenementsTab.tsx');
  let eventsTabContent = fs.readFileSync(eventsTabPath, 'utf8');
  eventsTabContent = eventsTabContent.replace(/router\.push\(`\/\$\{typeContenu\}\/\$\{selectedItem\.id\}`\);/g, "window.open(`/${locale}/${typeContenu}/${selectedItem.id}`, '_blank');");
  eventsTabContent = eventsTabContent.replace(/text-white\/20/g, 'text-white/70');
  eventsTabContent = eventsTabContent.replace('opacity-30 mix-blend-overlay blur-[2px]', 'opacity-40 mix-blend-overlay blur-[1px]');
  fs.writeFileSync(eventsTabPath, eventsTabContent);
  console.log('Fixed EvenementsTab.tsx');

  // 3. DecisionCenterModal
  const decisionModalPath = path.join(__dirname, 'app', '[locale]', 'gouverneur', 'components', 'DecisionCenterModal.tsx');
  let decisionModalContent = fs.readFileSync(decisionModalPath, 'utf8');
  decisionModalContent = decisionModalContent.replace('z-[2000]', 'z-[3000]');
  fs.writeFileSync(decisionModalPath, decisionModalContent);
  console.log('Fixed DecisionCenterModal.tsx');
};

applyFixes();
