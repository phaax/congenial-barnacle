import { ITEM_TYPE, SLOT } from './constants.js';

// Item definitions - extend this array to add new items
export const ITEMS = [
  // ─── Weapons ────────────────────────────────────────────────────────────────
  { id:'pitchfork',     name:'Pitchfork',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:5,   weight:3, dmg:[2,5], symbol:'/', fg:6,  desc:'A farming tool pressed into service.', tier:1 },
  { id:'walking_stick', name:'Walking Stick',  type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:3,   weight:2, dmg:[1,4], symbol:'/', fg:6,  desc:'Better than nothing.', tier:1 },
  { id:'dagger',        name:'Dagger',         type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:15,  weight:1, dmg:[2,6], symbol:'†', fg:7,  desc:'A short blade, quick to draw.', tier:1, prop:'fast' },
  { id:'hunting_knife', name:'Hunting Knife',  type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:12,  weight:1, dmg:[2,5], symbol:'†', fg:6,  desc:'Good for field dressing and self-defense.', tier:1 },
  { id:'short_sword',   name:'Short Sword',    type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:30,  weight:3, dmg:[3,8], symbol:'†', fg:7,  desc:'A reliable blade for any fighter.', tier:1 },
  { id:'crude_dagger',  name:'Crude Dagger',   type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:5,   weight:1, dmg:[1,4], symbol:'†', fg:8,  desc:'Roughly fashioned from scrap iron.', tier:1 },
  { id:'staff',         name:'Staff',          type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:20,  weight:4, dmg:[2,6], symbol:'|', fg:6,  desc:'A sturdy staff good for magic channeling.', tier:1, prop:'arcane' },
  { id:'short_bow',     name:'Short Bow',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:25,  weight:2, dmg:[3,7], symbol:')', fg:6,  desc:'A nimble bow for hunting and skirmishing.', tier:1, prop:'ranged' },
  { id:'iron_axe',      name:'Iron Axe',       type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:35,  weight:5, dmg:[4,10],symbol:'P', fg:7,  desc:'Heavy but devastating.', tier:2 },
  { id:'long_sword',    name:'Long Sword',     type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:60,  weight:4, dmg:[4,10],symbol:'†', fg:7,  desc:'The weapon of knights and heroes.', tier:2 },
  { id:'ogre_club',     name:'Ogre Club',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:40,  weight:8, dmg:[6,14],symbol:'!', fg:6,  desc:'A massive club torn from an old oak.', tier:2 },
  { id:'dark_elf_blade',name:'Dark Elf Blade', type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:80,  weight:2, dmg:[4,10],symbol:'†', fg:5,  desc:'Enchanted with shadow magic.', tier:3, prop:'shadow' },
  { id:'necro_staff',   name:'Necromancer\'s Staff',type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:200, weight:3, dmg:[5,12],symbol:'|', fg:13, desc:'Pulses with dark energy.', tier:4, prop:'arcane' },
  { id:'hellfire_blade',name:'Hellfire Blade', type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:500, weight:4, dmg:[8,18],symbol:'†', fg:12, desc:'Wreathed in eternal flames.', tier:5, prop:'fire' },

  // ─── Armor ──────────────────────────────────────────────────────────────────
  { id:'rough_clothes', name:'Rough Clothes',  type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:2,   weight:1, def:0, symbol:']', fg:6,  desc:'Little more than work clothes.', tier:1 },
  { id:'padded_armor',  name:'Padded Armor',   type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:10,  weight:2, def:1, symbol:']', fg:6,  desc:'Thick cloth layers provide some protection.', tier:1 },
  { id:'leather_armor', name:'Leather Armor',  type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:25,  weight:3, def:2, symbol:']', fg:6,  desc:'Cured leather shaped into protective gear.', tier:1 },
  { id:'robe',          name:'Mage\'s Robe',   type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:20,  weight:1, def:1, symbol:']', fg:9,  desc:'Light robe stitched with arcane sigils.', tier:1, prop:'arcane' },
  { id:'chain_mail',    name:'Chain Mail',     type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:60,  weight:6, def:4, symbol:']', fg:7,  desc:'Interlocking rings of iron.', tier:2 },
  { id:'plate_armor',   name:'Plate Armor',    type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:150, weight:9, def:7, symbol:']', fg:7,  desc:'Full plate of forged steel.', tier:3 },
  { id:'troll_hide',    name:'Troll Hide',     type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:80,  weight:5, def:5, symbol:']', fg:2,  desc:'Cured troll hide with minor regenerative properties.', tier:2, prop:'regenerate1' },
  { id:'dragon_scale',  name:'Dragon Scale Armor',type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:400, weight:6, def:10, symbol:']', fg:12, desc:'Scales from a dragon, virtually indestructible.', tier:4, prop:'fire_resist' },
  { id:'epic_scale_armor',name:'Ancient Scale Mail',type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:800, weight:5, def:13, symbol:']', fg:14, desc:'Scales from an ancient dragon, shimmering with power.', tier:5, prop:'fire_resist' },

  // ─── Accessories ────────────────────────────────────────────────────────────
  { id:'cursed_amulet', name:'Cursed Amulet',  type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:50, weight:0, symbol:'♦', fg:5, desc:'Dangerous power thrums within.', tier:2, cursed:true, effect:'curse_str' },
  { id:'amulet_of_vigor',name:'Amulet of Vigor',type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:100, weight:0, symbol:'♦', fg:14, desc:'+10 max HP.', tier:2, effect:'hp10' },
  { id:'ring_of_magic', name:'Ring of Magic',  type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:120, weight:0, symbol:'o', fg:9, desc:'+8 max MP.', tier:2, effect:'mp8' },

  // ─── Consumables ────────────────────────────────────────────────────────────
  { id:'healing_potion', name:'Healing Potion', type:ITEM_TYPE.CONSUMABLE, value:30, weight:0, symbol:'!', fg:12, desc:'Restore 20 HP.', heal:20, tier:1 },
  { id:'mana_potion',    name:'Mana Potion',    type:ITEM_TYPE.CONSUMABLE, value:25, weight:0, symbol:'!', fg:9,  desc:'Restore 15 MP.', mp:15, tier:1 },
  { id:'healing_herb',   name:'Healing Herb',   type:ITEM_TYPE.CONSUMABLE, value:8,  weight:0, symbol:'¿', fg:10, desc:'Restore 8 HP.', heal:8, tier:1 },
  { id:'antidote',       name:'Antidote',       type:ITEM_TYPE.CONSUMABLE, value:20, weight:0, symbol:'!', fg:10, desc:'Cures poison.', cure:'poison', tier:1 },
  { id:'bread',          name:'Bread',          type:ITEM_TYPE.CONSUMABLE, value:2,  weight:1, symbol:'%', fg:14, desc:'Restore 4 HP.', heal:4, tier:1 },
  { id:'smoke_bomb',     name:'Smoke Bomb',     type:ITEM_TYPE.CONSUMABLE, value:15, weight:0, symbol:'*', fg:8, desc:'Flee combat with 90% success.', flee:true, tier:1 },
  { id:'scroll_fire',    name:'Scroll of Fireball', type:ITEM_TYPE.CONSUMABLE, value:40, weight:0, symbol:'~', fg:12, desc:'Deal 3d6 fire damage.', dmg:[3,6,'fire'], tier:2 },
  { id:'greater_heal',   name:'Greater Healing', type:ITEM_TYPE.CONSUMABLE, value:80, weight:0, symbol:'!', fg:12, desc:'Restore 50 HP.', heal:50, tier:2 },
  { id:'elixir',         name:'Elixir of Life',  type:ITEM_TYPE.CONSUMABLE, value:200,weight:0, symbol:'!', fg:13, desc:'Restore full HP and MP.', fullHeal:true, tier:3 },

  // ─── Quest / Misc ───────────────────────────────────────────────────────────
  { id:'lockpick',       name:'Lockpick',       type:ITEM_TYPE.MISC, value:5, weight:0, symbol:'-', fg:7, desc:'For opening stubborn locks.', tier:1 },
  { id:'travel_rations', name:'Travel Rations', type:ITEM_TYPE.MISC, value:3, weight:1, symbol:'%', fg:6, desc:'Dried food for the road.', tier:1 },
  { id:'trade_goods',    name:'Trade Goods',    type:ITEM_TYPE.MISC, value:20, weight:3, symbol:'$', fg:14, desc:'Various merchant wares.', tier:1 },
  { id:'arrow',          name:'Arrow',          type:ITEM_TYPE.MISC, value:1, weight:0, symbol:'/', fg:6, desc:'Ammunition for a bow.', tier:1, stackable:true },
  { id:'rat_tail',       name:'Rat Tail',       type:ITEM_TYPE.MISC, value:2, weight:0, symbol:'~', fg:6, desc:'Foul-smelling.', tier:1 },
  { id:'wolf_pelt',      name:'Wolf Pelt',      type:ITEM_TYPE.MISC, value:15, weight:3, symbol:'%', fg:7, desc:'Thick grey fur.', tier:1 },
  { id:'wolf_fang',      name:'Wolf Fang',      type:ITEM_TYPE.MISC, value:8, weight:0, symbol:'^', fg:7, desc:'Sharp canine tooth.', tier:1 },
  { id:'bear_pelt',      name:'Bear Pelt',      type:ITEM_TYPE.MISC, value:30, weight:5, symbol:'%', fg:6, desc:'Large, thick pelt.', tier:2 },
  { id:'bear_claw',      name:'Bear Claw',      type:ITEM_TYPE.MISC, value:12, weight:0, symbol:'^', fg:6, desc:'A fearsome curved claw.', tier:1 },
  { id:'spider_silk',    name:'Spider Silk',    type:ITEM_TYPE.MISC, value:10, weight:0, symbol:'~', fg:7, desc:'Incredibly strong and light.', tier:1 },
  { id:'venom_sac',      name:'Venom Sac',      type:ITEM_TYPE.MISC, value:12, weight:0, symbol:'o', fg:10, desc:'Poison venom, still potent.', tier:1 },
  { id:'slime_jelly',    name:'Slime Jelly',    type:ITEM_TYPE.MISC, value:5, weight:0, symbol:'o', fg:10, desc:'Viscous and smelly.', tier:1 },
  { id:'dragon_tooth',   name:'Dragon Tooth',   type:ITEM_TYPE.MISC, value:80, weight:1, symbol:'^', fg:12, desc:'A razor-sharp tooth.', tier:3 },
  { id:'dragon_heart',   name:'Dragon Heart',   type:ITEM_TYPE.QUEST, value:0, weight:2, symbol:'♥', fg:12, desc:'Still beating faintly.', tier:5 },
  { id:'phylactery',     name:'Phylactery',     type:ITEM_TYPE.QUEST, value:0, weight:1, symbol:'*', fg:13, desc:'The source of the Lich\'s immortality.', tier:5 },
  { id:'demon_core',     name:'Demon Core',     type:ITEM_TYPE.QUEST, value:0, weight:2, symbol:'*', fg:12, desc:'The imprisoned essence of a demon lord.', tier:5 },
  { id:'ectoplasm',      name:'Ectoplasm',      type:ITEM_TYPE.MISC, value:8, weight:0, symbol:'o', fg:11, desc:'Ghostly residue.', tier:2 },
  { id:'large_gem',      name:'Large Gem',      type:ITEM_TYPE.MISC, value:100, weight:1, symbol:'♦', fg:14, desc:'A flawless gemstone.', tier:3 },
  { id:'stolen_coin',    name:'Stolen Coin',    type:ITEM_TYPE.MISC, value:3, weight:0, symbol:'$', fg:14, desc:'Poorly minted.', tier:1 },
];

// Shop inventory tiers by town level
export const SHOP_TIERS = {
  1: ['dagger', 'short_sword', 'leather_armor', 'padded_armor', 'healing_potion', 'healing_herb', 'antidote', 'bread', 'lockpick', 'arrow'],
  2: ['long_sword', 'chain_mail', 'short_bow', 'mana_potion', 'scroll_fire', 'smoke_bomb', 'amulet_of_vigor'],
  3: ['plate_armor', 'greater_heal', 'ring_of_magic', 'dark_elf_blade', 'elixir'],
};

export function getItem(id) {
  return ITEMS.find(i => i.id === id);
}

export function getShopInventory(tier) {
  const ids = [];
  for (let t = 1; t <= Math.min(tier, 3); t++) {
    ids.push(...(SHOP_TIERS[t] || []));
  }
  return ids.map(id => getItem(id)).filter(Boolean);
}
