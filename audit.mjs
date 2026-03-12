import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

await mkdir('/tmp/ss', { recursive: true });

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell'
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto('http://localhost:5174');
await page.waitForSelector('#loading-overlay', { state: 'hidden', timeout: 10000 });
await page.waitForTimeout(500);

let idx = 0;
async function shot(label) {
  const name = `/tmp/ss/${String(++idx).padStart(2,'0')}_${label}.png`;
  await page.screenshot({ path: name });
  console.log(`Shot: ${name}`);
}
async function key(k, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(k);
    await page.waitForTimeout(100);
  }
}
async function getState() {
  return page.evaluate(() => window.game?.currentState || 'unknown');
}
async function changeState(stateName, data) {
  await page.evaluate(({ stateName, data }) => {
    window.game?.changeState(stateName, data || {});
  }, { stateName, data: data || {} });
  await page.waitForTimeout(200);
}
async function backToLocation() {
  for (let i = 0; i < 5; i++) {
    const st = await getState();
    if (st === 'LOCATION') break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(100);
}
async function getDialogSession(npc) {
  return page.evaluate((npc) => {
    try {
      const fn = window.game?.getDialogSession;
      if (fn) return fn.call(window.game, npc);
    } catch(e) {}
    return { lines: [{ text: npc.dialog || 'Greetings, traveler.' }] };
  }, npc);
}

// ── CHAR CREATION ──────────────────────────────────────────────────────────
await key('n'); await page.waitForTimeout(300);
await page.keyboard.type('Hero'); await page.waitForTimeout(150);
await key('Enter'); await page.waitForTimeout(300);
await key('Enter'); await page.waitForTimeout(300);
await key('Enter'); await page.waitForTimeout(300);
await key('Enter'); await page.waitForTimeout(300);
await key('Space'); await key('ArrowDown');
await key('Space'); await key('ArrowDown');
await key('Space');
await key('Enter'); await page.waitForTimeout(300);
await key('Enter'); await page.waitForTimeout(1000); // BEGIN

await shot('01_location_start');
console.log('State:', await getState());

const npcs = await page.evaluate(() =>
  window.game?.currentLayout?.npcs?.map(n => ({
    x: n.x, y: n.y, name: n.name, type: n.type,
    dialog: n.dialog, innName: n.innName,
    shopRole: n.shopRole, shopTier: n.shopTier,
    questIds: n.questIds, isQuestGiver: n.isQuestGiver,
  })) || []
);
console.log('NPCs:', npcs.map(n => `${n.name}(${n.type})@(${n.x},${n.y})`).join(', '));

// ── INVENTORY ─────────────────────────────────────────────────────────────
await key('i'); await page.waitForTimeout(300);
await shot('02_inventory');
await key('ArrowDown'); await page.waitForTimeout(100);
await shot('03_inventory_nav');
await key('Escape'); await page.waitForTimeout(200);

// ── QUEST LOG (empty) ─────────────────────────────────────────────────────
await key('q'); await page.waitForTimeout(300);
await shot('04_questlog_empty');
await key('2'); await page.waitForTimeout(150);
await shot('05_questlog_available');
await key('Escape'); await page.waitForTimeout(200);

// ── MESSAGE LOG GHOSTING CHECK ────────────────────────────────────────────
await key('Space'); await page.waitForTimeout(150);
await key('Space'); await page.waitForTimeout(150);
await key('Space'); await page.waitForTimeout(150);
await shot('06_msg_log_check');

// ── DIALOG SCREEN (villager) ──────────────────────────────────────────────
const villager = npcs.find(n => n.type === 'villager');
if (villager) {
  const session = await getDialogSession(villager);
  await changeState('DIALOG', { npc: villager, session, prevState: 'LOCATION' });
  await page.waitForTimeout(600);
  await shot('07_villager_dialog');
  await key('Space'); await page.waitForTimeout(300);
  await shot('08_villager_dialog_p2');
  await backToLocation();
} else {
  console.log('No villager NPC found');
  await shot('07_villager_dialog_SKIPPED');
  await shot('08_villager_dialog_p2_SKIPPED');
}

// ── DIALOG SCREEN (quest giver) ──────────────────────────────────────────
const questGiver = npcs.find(n => n.type === 'quest_giver');
if (questGiver) {
  const session = await getDialogSession(questGiver);
  await changeState('DIALOG', { npc: questGiver, session, prevState: 'LOCATION' });
  await page.waitForTimeout(600);
  await shot('09_quest_giver_dialog');
  await key('Space'); await page.waitForTimeout(300);
  await key('Space'); await page.waitForTimeout(300);
  await shot('10_quest_giver_p2');
  await backToLocation();
} else {
  console.log('No quest_giver NPC found');
  await shot('09_quest_giver_dialog_SKIPPED');
  await shot('10_quest_giver_p2_SKIPPED');
}

// ── INN SCREEN ────────────────────────────────────────────────────────────
const innkeeper = npcs.find(n => n.type === 'innkeeper');
if (innkeeper) {
  await changeState('INN', { npc: innkeeper });
  await shot('11_inn_screen');
  await key('ArrowDown'); await page.waitForTimeout(100);
  await shot('12_inn_nav');
  await key('Escape'); await page.waitForTimeout(300);
  await backToLocation();
} else {
  console.log('No innkeeper NPC found');
  await shot('11_inn_screen_SKIPPED');
  await shot('12_inn_nav_SKIPPED');
}

// ── SHOP SCREEN ───────────────────────────────────────────────────────────
const shopkeeper = npcs.find(n => n.type === 'shopkeeper');
if (shopkeeper) {
  await changeState('SHOP', { npc: shopkeeper });
  await shot('13_shop_open');
  await key('ArrowDown'); await page.waitForTimeout(100);
  await shot('14_shop_nav');
  await key('s'); await page.waitForTimeout(150);
  await shot('15_shop_sell');
  await key('b'); await page.waitForTimeout(150);
  await key('Enter'); await page.waitForTimeout(200);
  await shot('16_shop_confirm');
  await key('Escape'); await page.waitForTimeout(200);
  await key('Escape'); await page.waitForTimeout(300);
  await backToLocation();
} else {
  console.log('No shopkeeper NPC found');
  await shot('13_shop_open_SKIPPED');
}

// ── HEALER DIALOG ─────────────────────────────────────────────────────────
const healer = npcs.find(n => n.type === 'healer');
if (healer) {
  const session = await getDialogSession(healer);
  await changeState('DIALOG', { npc: healer, session, prevState: 'LOCATION' });
  await page.waitForTimeout(600);
  await shot('17_healer_dialog');
  await key('Space'); await page.waitForTimeout(300);
  await shot('18_healer_p2');
  await backToLocation();
} else {
  console.log('No healer NPC found');
}

// ── QUESTLOG WITH ACCEPTED QUEST ──────────────────────────────────────────
await page.evaluate(() => {
  const quests = window.game?.quests;
  const avail = quests?.find(q => q.status === 'available');
  if (avail && window.game?.player) avail.status = 'active';
});
await key('q'); await page.waitForTimeout(300);
await shot('19_questlog_active_quest');
await key('1'); await page.waitForTimeout(150);
await key('ArrowDown'); await page.waitForTimeout(100);
await shot('20_questlog_quest_details');
await key('Escape'); await page.waitForTimeout(200);

// ── LOCATION VIEW ─────────────────────────────────────────────────────────
await shot('21_location_view');

// ── PAUSE MENU ────────────────────────────────────────────────────────────
await key('Escape'); await page.waitForTimeout(300);
await shot('22_pause_menu');
await key('r'); await page.waitForTimeout(700);

// ── WORLD MAP ─────────────────────────────────────────────────────────────
await shot('23_world_map');
await key('ArrowRight'); await page.waitForTimeout(200);
await shot('24_world_map_cursor');
await key('ArrowLeft'); await page.waitForTimeout(200);
await key('ArrowDown'); await page.waitForTimeout(200);
await shot('25_world_map_other');

// ── SETTINGS SCREEN ──────────────────────────────────────────────────────
await changeState('SETTINGS');
await shot('26_settings');
await key('Escape'); await page.waitForTimeout(200);

// ── JUKEBOX SCREEN ────────────────────────────────────────────────────────
await changeState('JUKEBOX');
await shot('27_jukebox');
await key('Escape'); await page.waitForTimeout(200);

await browser.close();
console.log('\nDone. Screenshots in /tmp/ss/');
