// @ts-nocheck
import { ITEM_TYPE, SLOT } from './constants';

// Item definitions - extend this array to add new items
export const ITEMS = [
  // ─── Weapons: Tier 1 ────────────────────────────────────────────────────────
  { id:'pitchfork',      name:'Pitchfork',       type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:5,   weight:3, dmg:[2,5],  symbol:'/', fg:6,  desc:'A farming tool pressed into service.', tier:1 },
  { id:'walking_stick',  name:'Walking Stick',   type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:3,   weight:2, dmg:[1,4],  symbol:'/', fg:6,  desc:'Better than nothing.', tier:1 },
  { id:'dagger',         name:'Dagger',          type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:15,  weight:1, dmg:[2,6],  symbol:'†', fg:7,  desc:'A short blade, quick to draw.', tier:1, prop:'fast' },
  { id:'crude_dagger',   name:'Crude Dagger',    type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:5,   weight:1, dmg:[1,4],  symbol:'†', fg:8,  desc:'Roughly fashioned from scrap iron.', tier:1 },
  { id:'hunting_knife',  name:'Hunting Knife',   type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:12,  weight:1, dmg:[2,5],  symbol:'†', fg:6,  desc:'Good for field dressing and self-defense.', tier:1 },
  { id:'short_sword',    name:'Short Sword',     type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:30,  weight:3, dmg:[3,8],  symbol:'†', fg:7,  desc:'A reliable blade for any fighter.', tier:1 },
  { id:'club',           name:'Club',            type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:4,   weight:4, dmg:[2,7],  symbol:'!', fg:6,  desc:'Heavy wood. Crude but effective.', tier:1 },
  { id:'hand_axe',       name:'Hand Axe',        type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:14,  weight:2, dmg:[3,7],  symbol:'P', fg:6,  desc:'A light axe quick enough for two-handed throwing.', tier:1, prop:'fast' },
  { id:'spear',          name:'Spear',           type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:18,  weight:3, dmg:[3,8],  symbol:'/', fg:7,  desc:'A wooden shaft tipped with iron. Good reach.', tier:1, prop:'reach' },
  { id:'staff',          name:'Staff',           type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:20,  weight:4, dmg:[2,6],  symbol:'|', fg:6,  desc:'A sturdy staff good for magic channeling.', tier:1, prop:'arcane' },
  { id:'short_bow',      name:'Short Bow',       type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:25,  weight:2, dmg:[3,7],  symbol:')', fg:6,  desc:'A nimble bow for hunting and skirmishing.', tier:1, prop:'ranged' },
  { id:'sling',          name:'Sling',           type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:8,   weight:1, dmg:[2,5],  symbol:')', fg:6,  desc:'A leather sling that hurls stones at speed.', tier:1, prop:'ranged' },
  { id:'bone_knife',     name:'Bone Knife',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:6,   weight:1, dmg:[1,4],  symbol:'†', fg:8,  desc:'Carved from the femur of something large. Unsettling.', tier:1, region:'swamp' },
  { id:'fisherman_hook', name:'Fishing Hook',    type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:4,   weight:1, dmg:[1,3],  symbol:'†', fg:6,  desc:'Repurposed from the docks. Hooked and cruel.', tier:1, region:'coastal' },

  // ─── Weapons: Tier 2 ────────────────────────────────────────────────────────
  { id:'iron_axe',       name:'Iron Axe',        type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:35,  weight:5, dmg:[4,10], symbol:'P', fg:7,  desc:'Heavy but devastating.', tier:2 },
  { id:'long_sword',     name:'Long Sword',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:60,  weight:4, dmg:[4,10], symbol:'†', fg:7,  desc:'The weapon of knights and heroes.', tier:2 },
  { id:'ogre_club',      name:'Ogre Club',       type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:40,  weight:8, dmg:[6,14], symbol:'!', fg:6,  desc:'A massive club torn from an old oak.', tier:2 },
  { id:'war_hammer',     name:'War Hammer',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:55,  weight:6, dmg:[5,12], symbol:'!', fg:7,  desc:'A heavy hammer that caves in armor and bone alike.', tier:2 },
  { id:'battle_axe',     name:'Battle Axe',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:58,  weight:6, dmg:[5,13], symbol:'P', fg:7,  desc:'Double-headed axe favored by warriors.', tier:2 },
  { id:'morning_star',   name:'Morning Star',    type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:50,  weight:5, dmg:[4,11], symbol:'!', fg:7,  desc:'A spiked ball on a chain. Brutal and effective.', tier:2 },
  { id:'rapier',         name:'Rapier',          type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:65,  weight:2, dmg:[4,9],  symbol:'†', fg:7,  desc:'A slender thrusting blade favored by duelists.', tier:2, prop:'fast' },
  { id:'crossbow',       name:'Crossbow',        type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:70,  weight:4, dmg:[5,10], symbol:')', fg:7,  desc:'A mechanical bow with terrifying stopping power.', tier:2, prop:'ranged' },
  { id:'scimitar',       name:'Scimitar',        type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:55,  weight:3, dmg:[4,10], symbol:'†', fg:14, desc:'A curved blade honed for the desert. Light and swift.', tier:2, region:'desert' },
  { id:'bone_staff',     name:'Bone Staff',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:45,  weight:3, dmg:[3,9],  symbol:'|', fg:5,  desc:'Carved from the bones of the undead. Hums with necrotic energy.', tier:2, prop:'arcane', region:'swamp' },

  // ─── Weapons: Tier 3 ────────────────────────────────────────────────────────
  { id:'dark_elf_blade', name:'Dark Elf Blade',  type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:80,  weight:2, dmg:[4,10], symbol:'†', fg:5,  desc:'Enchanted with shadow magic.', tier:3, prop:'shadow' },
  { id:'great_sword',    name:'Great Sword',     type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:110, weight:7, dmg:[7,16], symbol:'†', fg:7,  desc:'A massive two-handed blade that cleaves through armor.', tier:3 },
  { id:'halberd',        name:'Halberd',         type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:95,  weight:7, dmg:[6,14], symbol:'/', fg:7,  desc:'A pole-axe combining spear, axe, and hook.', tier:3, prop:'reach' },
  { id:'elven_longbow',  name:'Elven Longbow',   type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:130, weight:2, dmg:[6,13], symbol:')', fg:10, desc:'Carved from living wood and strung with spider silk. Unerringly accurate.', tier:3, prop:'ranged', region:'forest' },
  { id:'dwarven_war_axe',name:'Dwarven War Axe', type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:120, weight:6, dmg:[7,15], symbol:'P', fg:7,  desc:'Forged in the deep holds. Runes of strength line the blade.', tier:3, region:'mountain' },
  { id:'obsidian_blade', name:'Obsidian Blade',  type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:100, weight:2, dmg:[5,12], symbol:'†', fg:8,  desc:'Razor-sharp volcanic glass. Shatters after a brutal blow, but lethal until then.', tier:3, region:'desert' },
  { id:'frost_spear',    name:'Frost Spear',     type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:115, weight:4, dmg:[6,13], symbol:'/', fg:11, desc:'A spear tipped with enchanted ice that never melts.', tier:3, prop:'ice', region:'arctic' },

  // ─── Weapons: Tier 4 ────────────────────────────────────────────────────────
  { id:'necro_staff',    name:'Necromancer\'s Staff', type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:200, weight:3, dmg:[5,12], symbol:'|', fg:13, desc:'Pulses with dark energy.', tier:4, prop:'arcane' },
  { id:'runic_blade',    name:'Runic Blade',     type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:220, weight:3, dmg:[8,16], symbol:'†', fg:9,  desc:'Ancient runes glow along its edge, amplifying magic.', tier:4, prop:'arcane' },
  { id:'death_bow',      name:'Death Bow',       type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:250, weight:3, dmg:[7,15], symbol:')', fg:5,  desc:'Strung with sinew of the undead. Arrows fired from it drain life.', tier:4, prop:'ranged' },
  { id:'storm_hammer',   name:'Storm Hammer',    type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:240, weight:7, dmg:[9,18], symbol:'!', fg:11, desc:'A hammer wreathed in crackling lightning.', tier:4, prop:'lightning' },

  // ─── Weapons: Tier 5 ────────────────────────────────────────────────────────
  { id:'hellfire_blade', name:'Hellfire Blade',  type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:500, weight:4, dmg:[8,18], symbol:'†', fg:12, desc:'Wreathed in eternal flames.', tier:5, prop:'fire' },
  { id:'sunblade',       name:'Sunblade',        type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:600, weight:3, dmg:[10,22],symbol:'†', fg:14, desc:'Forged in the heart of the sun. Sears corruption from the world.', tier:5, prop:'holy' },
  { id:'void_sickle',    name:'Void Sickle',     type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, value:550, weight:2, dmg:[9,20], symbol:')', fg:5,  desc:'A curved blade that cuts through the fabric of reality.', tier:5, prop:'arcane' },

  // ─── Armor: Tier 1 ──────────────────────────────────────────────────────────
  { id:'rough_clothes',  name:'Rough Clothes',   type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:2,   weight:1, def:0,  symbol:']', fg:6,  desc:'Little more than work clothes.', tier:1 },
  { id:'padded_armor',   name:'Padded Armor',    type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:10,  weight:2, def:1,  symbol:']', fg:6,  desc:'Thick cloth layers provide some protection.', tier:1 },
  { id:'hide_armor',     name:'Hide Armor',      type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:12,  weight:2, def:1,  symbol:']', fg:6,  desc:'Layered animal hides stitched together crudely.', tier:1 },
  { id:'leather_armor',  name:'Leather Armor',   type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:25,  weight:3, def:2,  symbol:']', fg:6,  desc:'Cured leather shaped into protective gear.', tier:1 },
  { id:'scale_shirt',    name:'Scale Shirt',     type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:22,  weight:3, def:2,  symbol:']', fg:6,  desc:'Small metal scales sewn onto a leather backing.', tier:1 },
  { id:'robe',           name:'Mage\'s Robe',    type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:20,  weight:1, def:1,  symbol:']', fg:9,  desc:'Light robe stitched with arcane sigils.', tier:1, prop:'arcane' },

  // ─── Armor: Tier 2 ──────────────────────────────────────────────────────────
  { id:'chain_mail',     name:'Chain Mail',      type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:60,  weight:6, def:4,  symbol:']', fg:7,  desc:'Interlocking rings of iron.', tier:2 },
  { id:'breastplate',    name:'Breastplate',     type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:75,  weight:5, def:5,  symbol:']', fg:7,  desc:'A solid steel chest-piece favored by knights.', tier:2 },
  { id:'troll_hide',     name:'Troll Hide',      type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:80,  weight:5, def:5,  symbol:']', fg:2,  desc:'Cured troll hide with minor regenerative properties.', tier:2, prop:'regenerate1' },
  { id:'elven_mail',     name:'Elven Mail',      type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:90,  weight:3, def:4,  symbol:']', fg:10, desc:'Impossibly light chainmail woven by elven craftsmen. Silences movement.', tier:2, prop:'arcane', region:'forest' },
  { id:'orcish_hide',    name:'Orcish Hide',     type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:55,  weight:6, def:4,  symbol:']', fg:2,  desc:'Battle-scarred orc leather stinking of swamp mud.', tier:2, region:'swamp' },
  { id:'desert_wraps',   name:'Desert Wraps',    type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:45,  weight:2, def:3,  symbol:']', fg:14, desc:'Light linen wraps treated against heat and sand. Barely adequate but cool.', tier:2, region:'desert' },

  // ─── Armor: Tier 3 ──────────────────────────────────────────────────────────
  { id:'plate_armor',    name:'Plate Armor',     type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:150, weight:9, def:7,  symbol:']', fg:7,  desc:'Full plate of forged steel.', tier:3 },
  { id:'dwarven_plate',  name:'Dwarven Plate',   type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:200, weight:9, def:9,  symbol:']', fg:7,  desc:'Master-forged dwarven plate. The runes embossed on it blunt enemy blades.', tier:3, region:'mountain' },
  { id:'shadow_leather', name:'Shadow Leather',  type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:180, weight:3, def:6,  symbol:']', fg:5,  desc:'Black leather cured in shadow essence. Makes you harder to see in darkness.', tier:3, prop:'shadow' },

  // ─── Armor: Tier 4 ──────────────────────────────────────────────────────────
  { id:'dragon_scale',   name:'Dragon Scale Armor', type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:400, weight:6, def:10, symbol:']', fg:12, desc:'Scales from a dragon, virtually indestructible.', tier:4, prop:'fire_resist' },

  // ─── Armor: Tier 5 ──────────────────────────────────────────────────────────
  { id:'epic_scale_armor',name:'Ancient Scale Mail', type:ITEM_TYPE.ARMOR, slot:SLOT.ARMOR, value:800, weight:5, def:13, symbol:']', fg:14, desc:'Scales from an ancient dragon, shimmering with power.', tier:5, prop:'fire_resist' },

  // ─── Helmets ────────────────────────────────────────────────────────────────
  { id:'leather_cap',    name:'Leather Cap',     type:ITEM_TYPE.HELMET, slot:SLOT.HELMET, value:8,   weight:1, def:1,  symbol:'^', fg:6,  desc:'A simple cap of hardened leather.', tier:1 },
  { id:'iron_cap',       name:'Iron Cap',        type:ITEM_TYPE.HELMET, slot:SLOT.HELMET, value:18,  weight:2, def:2,  symbol:'^', fg:7,  desc:'A plain iron skullcap.', tier:1 },
  { id:'chainmail_coif', name:'Chainmail Coif',  type:ITEM_TYPE.HELMET, slot:SLOT.HELMET, value:45,  weight:2, def:3,  symbol:'^', fg:7,  desc:'A hood of interlocked iron rings.', tier:2 },
  { id:'horned_helm',    name:'Horned Helm',     type:ITEM_TYPE.HELMET, slot:SLOT.HELMET, value:55,  weight:3, def:3,  symbol:'^', fg:6,  desc:'A battered iron helm with crude horns. Intimidating.', tier:2 },
  { id:'dwarven_helm',   name:'Dwarven Helm',    type:ITEM_TYPE.HELMET, slot:SLOT.HELMET, value:120, weight:3, def:5,  symbol:'^', fg:7,  desc:'A deep-steel helm wrought in the forges under the mountain.', tier:3, region:'mountain' },
  { id:'elven_crown',    name:'Elven Crown',     type:ITEM_TYPE.HELMET, slot:SLOT.HELMET, value:130, weight:1, def:3,  symbol:'^', fg:10, desc:'A circlet of woven branches and silver thread. Enhances focus.', tier:3, prop:'arcane', region:'forest' },
  { id:'dragon_helm',    name:'Dragon Helm',     type:ITEM_TYPE.HELMET, slot:SLOT.HELMET, value:280, weight:4, def:6,  symbol:'^', fg:12, desc:'A helm crafted from dragon skull. Offers exceptional fire resistance.', tier:4, prop:'fire_resist' },
  { id:'death_mask',     name:'Death Mask',      type:ITEM_TYPE.HELMET, slot:SLOT.HELMET, value:240, weight:2, def:4,  symbol:'^', fg:5,  desc:'A porcelain mask taken from a tomb. Dread emanates from it.', tier:4, prop:'shadow' },

  // ─── Shields (Offhand) ──────────────────────────────────────────────────────
  { id:'buckler',        name:'Buckler',         type:ITEM_TYPE.OFFHAND, slot:SLOT.OFFHAND, value:15,  weight:2, def:2,  symbol:'O', fg:7,  desc:'A small round shield, quick to block with.', tier:1 },
  { id:'kite_shield',    name:'Kite Shield',     type:ITEM_TYPE.OFFHAND, slot:SLOT.OFFHAND, value:50,  weight:5, def:4,  symbol:'O', fg:7,  desc:'A sturdy iron-banded shield covering arm to shoulder.', tier:2 },
  { id:'tower_shield',   name:'Tower Shield',    type:ITEM_TYPE.OFFHAND, slot:SLOT.OFFHAND, value:130, weight:9, def:7,  symbol:'O', fg:7,  desc:'A massive shield that covers most of the body.', tier:3 },

  // ─── Accessories ────────────────────────────────────────────────────────────
  { id:'lucky_charm',       name:'Lucky Charm',        type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:25,  weight:0, symbol:'♦', fg:14, desc:'A small trinket that seems to attract fortune.', tier:1, effect:'luck5' },
  { id:'cursed_amulet',     name:'Cursed Amulet',      type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:50,  weight:0, symbol:'♦', fg:5,  desc:'Dangerous power thrums within.', tier:2, cursed:true, effect:'curse_str' },
  { id:'cursed_ring',       name:'Cursed Ring',        type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:30,  weight:0, symbol:'o', fg:5,  desc:'Slips onto the finger with suspicious ease.', tier:2, cursed:true, effect:'curse_dex' },
  { id:'amulet_of_vigor',   name:'Amulet of Vigor',    type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:100, weight:0, symbol:'♦', fg:14, desc:'+10 max HP.', tier:2, effect:'hp10' },
  { id:'ring_of_magic',     name:'Ring of Magic',      type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:120, weight:0, symbol:'o', fg:9,  desc:'+8 max MP.', tier:2, effect:'mp8' },
  { id:'ring_of_strength',  name:'Ring of Strength',   type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:110, weight:0, symbol:'o', fg:7,  desc:'+2 Strength.', tier:2, effect:'str2' },
  { id:'ring_of_protection',name:'Ring of Protection', type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:105, weight:0, symbol:'o', fg:7,  desc:'+2 Defense.', tier:2, effect:'def2' },
  { id:'swiftness_necklace',name:'Swiftness Necklace', type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:115, weight:0, symbol:'♦', fg:11, desc:'+2 Dexterity.', tier:2, effect:'dex2' },
  { id:'elven_talisman',    name:'Elven Talisman',     type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:160, weight:0, symbol:'♦', fg:10, desc:'+15 max MP. Attuned to the deep forest.', tier:3, effect:'mp15', region:'forest' },
  { id:'dwarven_rune_stone',name:'Dwarven Rune Stone', type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:160, weight:1, symbol:'♦', fg:7,  desc:'+15 max HP. Carved with ancient mountain runes.', tier:3, effect:'hp15', region:'mountain' },
  { id:'ring_of_fire',      name:'Ring of Fire',       type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:175, weight:0, symbol:'o', fg:12, desc:'Fire damage bonus on attacks.', tier:3, effect:'fire_dmg', prop:'fire' },
  { id:'amulet_of_power',   name:'Amulet of Power',    type:ITEM_TYPE.ACCESSORY, slot:SLOT.ACCESSORY, value:300, weight:0, symbol:'♦', fg:12, desc:'+4 Strength. For those who demand more.', tier:4, effect:'str4' },

  // ─── Consumables ────────────────────────────────────────────────────────────
  { id:'bandage',          name:'Bandage',           type:ITEM_TYPE.CONSUMABLE, value:5,   weight:0, symbol:'!', fg:7,  desc:'Restore 6 HP.', heal:6, tier:1 },
  { id:'healing_herb',     name:'Healing Herb',      type:ITEM_TYPE.CONSUMABLE, value:8,   weight:0, symbol:'¿', fg:10, desc:'Restore 8 HP.', heal:8, tier:1 },
  { id:'healing_potion',   name:'Healing Potion',    type:ITEM_TYPE.CONSUMABLE, value:30,  weight:0, symbol:'!', fg:12, desc:'Restore 20 HP.', heal:20, tier:1 },
  { id:'mana_potion',      name:'Mana Potion',       type:ITEM_TYPE.CONSUMABLE, value:25,  weight:0, symbol:'!', fg:9,  desc:'Restore 15 MP.', mp:15, tier:1 },
  { id:'antidote',         name:'Antidote',          type:ITEM_TYPE.CONSUMABLE, value:20,  weight:0, symbol:'!', fg:10, desc:'Cures poison.', cure:'poison', tier:1 },
  { id:'bread',            name:'Bread',             type:ITEM_TYPE.CONSUMABLE, value:2,   weight:1, symbol:'%', fg:14, desc:'Restore 4 HP.', heal:4, tier:1 },
  { id:'smoke_bomb',       name:'Smoke Bomb',        type:ITEM_TYPE.CONSUMABLE, value:15,  weight:0, symbol:'*', fg:8,  desc:'Flee combat with 90% success.', flee:true, tier:1 },
  { id:'stamina_draught',  name:'Stamina Draught',   type:ITEM_TYPE.CONSUMABLE, value:18,  weight:0, symbol:'!', fg:14, desc:'Restore 12 HP.', heal:12, tier:1 },
  { id:'strength_potion',  name:'Strength Potion',   type:ITEM_TYPE.CONSUMABLE, value:55,  weight:0, symbol:'!', fg:12, desc:'Temporarily boosts Strength by 2 for 5 turns.', effect:'str_boost', tier:2 },
  { id:'scroll_fire',      name:'Scroll of Fireball',type:ITEM_TYPE.CONSUMABLE, value:40,  weight:0, symbol:'~', fg:12, desc:'Deal 3d6 fire damage.', dmg:[3,6,'fire'], tier:2 },
  { id:'scroll_lightning', name:'Scroll of Lightning',type:ITEM_TYPE.CONSUMABLE, value:50, weight:0, symbol:'~', fg:11, desc:'Deal 3d8 lightning damage.', dmg:[3,8,'lightning'], tier:2 },
  { id:'greater_heal',     name:'Greater Healing',   type:ITEM_TYPE.CONSUMABLE, value:80,  weight:0, symbol:'!', fg:12, desc:'Restore 50 HP.', heal:50, tier:2 },
  { id:'scroll_ice',       name:'Scroll of Ice Storm',type:ITEM_TYPE.CONSUMABLE, value:70, weight:0, symbol:'~', fg:9,  desc:'Deal 2d8 ice damage and freeze the enemy.', dmg:[2,8,'ice'], tier:3 },
  { id:'elixir',           name:'Elixir of Life',    type:ITEM_TYPE.CONSUMABLE, value:200, weight:0, symbol:'!', fg:13, desc:'Restore full HP and MP.', fullHeal:true, tier:3 },

  // ─── Quest / Misc ───────────────────────────────────────────────────────────
  { id:'lockpick',       name:'Lockpick',       type:ITEM_TYPE.MISC, value:5,   weight:0, symbol:'-', fg:7,  desc:'For opening stubborn locks.', tier:1 },
  { id:'travel_rations', name:'Travel Rations', type:ITEM_TYPE.MISC, value:3,   weight:1, symbol:'%', fg:6,  desc:'Dried food for the road.', tier:1 },
  { id:'trade_goods',    name:'Trade Goods',    type:ITEM_TYPE.MISC, value:20,  weight:3, symbol:'$', fg:14, desc:'Various merchant wares.', tier:1 },
  { id:'rat_tail',       name:'Rat Tail',       type:ITEM_TYPE.MISC, value:2,   weight:0, symbol:'~', fg:6,  desc:'Foul-smelling.', tier:1 },
  { id:'wolf_pelt',      name:'Wolf Pelt',      type:ITEM_TYPE.MISC, value:15,  weight:3, symbol:'%', fg:7,  desc:'Thick grey fur.', tier:1 },
  { id:'wolf_fang',      name:'Wolf Fang',      type:ITEM_TYPE.MISC, value:8,   weight:0, symbol:'^', fg:7,  desc:'Sharp canine tooth.', tier:1 },
  { id:'bear_pelt',      name:'Bear Pelt',      type:ITEM_TYPE.MISC, value:30,  weight:5, symbol:'%', fg:6,  desc:'Large, thick pelt.', tier:2 },
  { id:'bear_claw',      name:'Bear Claw',      type:ITEM_TYPE.MISC, value:12,  weight:0, symbol:'^', fg:6,  desc:'A fearsome curved claw.', tier:1 },
  { id:'spider_silk',    name:'Spider Silk',    type:ITEM_TYPE.MISC, value:10,  weight:0, symbol:'~', fg:7,  desc:'Incredibly strong and light.', tier:1 },
  { id:'venom_sac',      name:'Venom Sac',      type:ITEM_TYPE.MISC, value:12,  weight:0, symbol:'o', fg:10, desc:'Poison venom, still potent.', tier:1 },
  { id:'slime_jelly',    name:'Slime Jelly',    type:ITEM_TYPE.MISC, value:5,   weight:0, symbol:'o', fg:10, desc:'Viscous and smelly.', tier:1 },
  { id:'dragon_tooth',   name:'Dragon Tooth',   type:ITEM_TYPE.MISC, value:80,  weight:1, symbol:'^', fg:12, desc:'A razor-sharp tooth.', tier:3 },
  { id:'dragon_heart',   name:'Dragon Heart',   type:ITEM_TYPE.QUEST, value:0,  weight:2, symbol:'♥', fg:12, desc:'Still beating faintly.', tier:5 },
  { id:'phylactery',     name:'Phylactery',     type:ITEM_TYPE.QUEST, value:0,  weight:1, symbol:'*', fg:13, desc:'The source of the Lich\'s immortality.', tier:5 },
  { id:'demon_core',     name:'Demon Core',     type:ITEM_TYPE.QUEST, value:0,  weight:2, symbol:'*', fg:12, desc:'The imprisoned essence of a demon lord.', tier:5 },
  { id:'letter',         name:'Sealed Letter',  type:ITEM_TYPE.QUEST, value:0,  weight:0, symbol:'≡', fg:7,  desc:'A sealed letter entrusted to you for delivery.', tier:1 },
  { id:'ectoplasm',      name:'Ectoplasm',      type:ITEM_TYPE.MISC, value:8,   weight:0, symbol:'o', fg:11, desc:'Ghostly residue.', tier:2 },
  { id:'large_gem',      name:'Large Gem',      type:ITEM_TYPE.MISC, value:100, weight:1, symbol:'♦', fg:14, desc:'A flawless gemstone.', tier:3 },
  { id:'stolen_coin',    name:'Stolen Coin',    type:ITEM_TYPE.MISC, value:3,   weight:0, symbol:'$', fg:14, desc:'Poorly minted.', tier:1 },
  { id:'local_map',      name:'Local Map',      type:ITEM_TYPE.MISC, value:50,  weight:0, symbol:'?', fg:14, desc:'A hand-drawn map of the surrounding region. Reveals nearby terrain when purchased.', tier:1 },
];

// ─── Shop Inventories by Role ─────────────────────────────────────────────────
// Each role has strictly separated inventory — no cross-role overlap.

// General Store: everyday survival gear, basic tools, light weapons/armor
export const GENERAL_STORE_TIERS = {
  1: ['rough_clothes', 'padded_armor', 'hide_armor', 'walking_stick', 'dagger', 'club',
      'bread', 'travel_rations', 'lockpick', 'local_map', 'bandage', 'lucky_charm'],
  2: ['leather_armor', 'short_sword', 'hunting_knife', 'hand_axe', 'leather_cap',
      'smoke_bomb', 'stamina_draught'],
  3: ['scale_shirt', 'spear', 'iron_cap', 'ring_of_protection'],
};

// Blacksmith: weapons, armor, shields, and helmets only — zero consumables
export const BLACKSMITH_TIERS = {
  1: ['crude_dagger', 'pitchfork', 'short_sword', 'hand_axe', 'club', 'spear',
      'buckler', 'padded_armor', 'leather_armor', 'iron_cap', 'leather_cap'],
  2: ['iron_axe', 'war_hammer', 'battle_axe', 'morning_star', 'rapier', 'crossbow',
      'chain_mail', 'breastplate', 'kite_shield', 'chainmail_coif', 'horned_helm'],
  3: ['long_sword', 'great_sword', 'halberd', 'plate_armor', 'tower_shield',
      'shadow_leather', 'dwarven_plate', 'dwarven_helm', 'dwarven_war_axe'],
};

// Healer / Temple: healing potions, herbs, magical restoration — no food, no weapons
export const HEALER_TIERS = {
  1: ['healing_potion', 'healing_herb', 'antidote', 'mana_potion', 'bandage', 'stamina_draught'],
  2: ['greater_heal', 'strength_potion', 'scroll_fire', 'amulet_of_vigor', 'ring_of_magic',
      'swiftness_necklace', 'elven_talisman', 'dwarven_rune_stone'],
  3: ['elixir', 'scroll_lightning', 'scroll_ice', 'amulet_of_power', 'ring_of_fire'],
};

// Tavern: food and drink only — minimal inventory by design
export const TAVERN_TIERS = {
  1: ['bread', 'travel_rations', 'healing_herb'],
  2: ['smoke_bomb', 'stamina_draught'],
  3: [],
};

const ROLE_TIERS = {
  general:    GENERAL_STORE_TIERS,
  blacksmith: BLACKSMITH_TIERS,
  healer:     HEALER_TIERS,
  tavern:     TAVERN_TIERS,
};

// Legacy alias kept for any code that imports SHOP_TIERS directly
export const SHOP_TIERS = GENERAL_STORE_TIERS;

export function getItem(id) {
  return ITEMS.find(i => i.id === id);
}

export function getShopInventory(tier) {
  return getShopInventoryByRole('general', tier);
}

export function getShopInventoryByRole(role, tier, region = null) {
  const tiers = ROLE_TIERS[role] || GENERAL_STORE_TIERS;
  const ids = [];
  for (let t = 1; t <= Math.min(tier, 3); t++) {
    ids.push(...(tiers[t] || []));
  }
  return ids.map(id => getItem(id)).filter(item => {
    if (!item) return false;
    // Region-tagged items only appear in matching regions
    if (item.region && region && item.region !== region) return false;
    return true;
  });
}

// Add an item to the player's inventory, stacking if the item is stackable.
// Consumables and items with stackable:true always merge with existing stacks.
// Equipment and unique items always get their own slot.
export function addToInventory(player, itemId, qty = 1) {
  const item = getItem(itemId);
  const isStackable = item?.stackable || item?.type === 'consumable';
  if (isStackable) {
    const existing = player.inventory.find(i => i.id === itemId);
    if (existing) { existing.qty += qty; return; }
  }
  if (player.inventory.length < 20) {
    player.inventory.push({ id: itemId, qty });
  }
}
