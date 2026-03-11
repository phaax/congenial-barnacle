// @ts-nocheck
// Dialog pools for different NPC archetypes
// Tags: {name} = player name, {town} = current town name, {location} = nearby location
// Character pools determine which lines an NPC can say

export const DIALOG_POOLS = {

  // ─── INNKEEPER ──────────────────────────────────────────────────────────────
  innkeeper: {
    greet: [
      'Welcome to the {inn}, {name}! Rest your weary bones.',
      'Ah, another traveller. You look like you could use a good night\'s sleep, {name}.',
      'Come in, come in! The beds are warm and the ale is cold.',
      'Welcome, friend! What can I do for you this fine evening?',
    ],
    rest: [
      'A good night\'s rest will do you a world of good.',
      'Sleep well. The road ahead is long.',
      'I\'ll have a hot meal ready when you wake.',
      'Our beds are the finest in {town}. You\'ll sleep like the dead.',
    ],
    farewell: [
      'Safe travels, {name}. Don\'t be a stranger!',
      'The road is dangerous. Watch yourself out there.',
      'Come back anytime. You\'re always welcome at the {inn}.',
      'May fortune favour you, adventurer.',
    ],
    rumour: [
      'I heard travellers speaking of strange lights near {location}. Best avoid it at night.',
      'A merchant came through last week, scared out of his wits. Said he saw shadows moving in {location}.',
      'The town guard has been doubled of late. Something\'s stirring in the dark.',
      'Word is there\'s good coin to be made helping the folk around here.',
    ],
  },

  // ─── BARKEEP ────────────────────────────────────────────────────────────────
  barkeep: {
    greet: [
      'What\'ll it be, {name}? We\'ve got ale, mead, and something the brewer calls "mystery spirit."',
      'Sit down, sit down. You look like someone who\'s had a rough day.',
      'First drink\'s not free, but I\'ll pour it generous. What do you want?',
      'Evening, stranger. Don\'t cause trouble and we\'ll get along fine.',
    ],
    rumour: [
      'Don\'t go east after dark. The wolves have been bold lately.',
      'Some of the farmers\'ve been finding their livestock slaughtered. Not by wolves—something worse.',
      'Old man Aldric says he saw torchlight in the ruins north of here. Nobody goes there.',
      'There\'s a reward posted at the town board. Something about clearing out bandits on the road.',
      'A hooded figure has been asking questions around town. Buying drinks and listening. Watch yourself.',
      'The mine hasn\'t shipped ore in two weeks. Owner\'s not talking about why.',
    ],
    farewell: [
      'Watch your coin purse out there.',
      'Don\'t drink on an empty stomach. Actually, don\'t drink at all—just more for me.',
      'Come back soon. Business is always welcome.',
    ],
  },

  // ─── QUEST GIVER ────────────────────────────────────────────────────────────
  quest_giver: {
    greet: [
      'Thank the gods, an adventurer! I\'ve been waiting for someone capable.',
      'You look like you know how to handle yourself. I have a proposition, {name}.',
      'I\'ve heard of you, {name}. I need someone with your skills.',
      'Are you for hire? I have coin and a desperate need.',
    ],
    quest_intro: [
      'Here\'s the situation. My {need} has gone missing, and I think {location} is involved.',
      'I\'ll get straight to the point. I need {task}, and I\'ll pay handsomely.',
      'This is embarrassing to admit, but I\'m in trouble and I need help.',
    ],
    quest_accept: [
      'Bless you! I knew I could count on you.',
      'Excellent. Please hurry—every moment matters.',
      'Thank you. I\'ll double your reward if you return quickly.',
      'I can\'t thank you enough. Please be careful.',
    ],
    quest_complete: [
      'You did it! I can\'t believe it—you actually did it!',
      'Here is your reward, and more besides. You\'ve earned it.',
      'I knew I chose the right person. Thank you, truly.',
      'The people of {town} owe you a great debt, {name}.',
    ],
  },

  // ─── SHOPKEEPER ─────────────────────────────────────────────────────────────
  shopkeeper: {
    greet: [
      'Welcome to my shop! Take a look around—everything you see is for sale.',
      'Ah, a customer! Looking to buy or sell? Either way, you\'ve come to the right place.',
      'Good day! I have the finest wares in all of {town}. Perhaps even the region.',
      'Come in, come in! Don\'t be shy—my prices are fair.',
    ],
    buy: [
      'A fine choice. That\'ll serve you well on the road.',
      'Good eye! That\'s one of my best pieces.',
      'Pleasure doing business with you, {name}.',
    ],
    sell: [
      'Hmm, I can give you {price} for that. Take it or leave it.',
      'I\'ve got enough of those, but I\'ll make room. {price} gold.',
      'Not bad quality. I\'ll give you {price}.',
    ],
    farewell: [
      'Come back anytime! My door is always open.',
      'Safe travels, friend. And watch your coin.',
      'Good luck out there. You\'ll need good equipment!',
    ],
    haggle: [
      'This is already my best price!',
      'You drive a hard bargain. Fine—{price} and not a copper less.',
      'My family would starve if I agreed to that.',
    ],
  },

  // ─── GUARD ──────────────────────────────────────────────────────────────────
  guard: {
    greet: [
      'State your business in {town}, traveller.',
      'Move along. This is a respectable town.',
      '{name}. Keep your weapons sheathed and we\'ll have no problems.',
      'The roads are dangerous. Glad you made it in one piece.',
    ],
    warning: [
      'Don\'t start any trouble in here. The captain doesn\'t like paperwork.',
      'We\'ve had enough drama for one week. Keep it peaceful.',
      'Any funny business and you\'ll spend the night in a cell.',
    ],
    rumour: [
      'We\'ve had reports of monster activity north of town. Travel at your own risk.',
      'The captain has extra patrols out. Something\'s got everyone on edge.',
      'Two merchants went missing on the eastern road. We\'re looking into it.',
    ],
    farewell: [
      'On your way.',
      'Keep moving.',
      'Safe travels. Watch the road.',
    ],
  },

  // ─── VILLAGER ───────────────────────────────────────────────────────────────
  villager: {
    greet: [
      'Oh! Hello there. Not many strangers come through {town}.',
      'Good day, {name}. Fine weather we\'re having.',
      'You\'re new here, aren\'t you? Where are you from?',
      'An adventurer! How exciting!',
    ],
    rumour: [
      'My cousin saw something terrible in the forest. He won\'t talk about it.',
      'The crops have been bad this season. We think something\'s poisoning the soil.',
      'Widow Maela says she hears crying at night from the old graveyard.',
      'They say the old dungeon to the east is full of riches. And danger.',
      'I hope someone deals with those goblins. They keep raiding the farms.',
    ],
    farewell: [
      'Goodbye! Stay safe!',
      'Good luck with your travels!',
      'Do come back sometime!',
    ],
  },

  // ─── HEALER ─────────────────────────────────────────────────────────────────
  healer: {
    greet: [
      'Welcome, {name}. I can see you\'ve been through hardship. Let me help.',
      'The gods grant healing to all who seek it. What ails you?',
      'Come in, come in. I have herbs, poultices, and prayers to spare.',
    ],
    heal: [
      'There now. The body can heal remarkable things with the right help.',
      'Rest and let my medicines work. You\'ll feel better soon.',
      'A word of caution—whatever caused these wounds, face it more carefully next time.',
    ],
    farewell: [
      'May the gods protect you.',
      'Come back if you need me. I pray you won\'t.',
      'Take care of yourself. You\'re no use to anyone dead.',
    ],
  },

  // ─── STORY CHARACTER (has specific story-guided lines) ───────────────────────
  story: {
    greet: [
      'I\'ve been expecting someone like you, {name}. The signs have been pointing to this moment.',
      '{name}! Thank the fates. I feared no one would come in time.',
      'You must be the adventurer I\'ve heard about. We need to talk—privately.',
    ],
    hint: [
      'The {goal_item} you seek lies within {location}. But beware the guardian.',
      'I\'ve studied the ancient texts. To defeat {boss}, you must first find {key_item}.',
      'The path leads through {location}. Speak to the innkeeper there—they know more.',
      'Three {items} are needed to break the seal. I know where two of them are.',
    ],
    urgent: [
      'There\'s no time to waste! {boss} grows stronger with each passing day.',
      'The realm hangs by a thread, {name}. You are our only hope.',
      'Every moment we delay, more innocent people suffer. Please—hurry.',
    ],
    farewell: [
      'The realm is counting on you, {name}. I know you will not fail.',
      'Go now. And may the light guide your path.',
      'Be careful. We cannot afford to lose you.',
    ],
  },
};

// Helper to replace tags in dialog strings
export function processDialog(text, tags = {}) {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return tags[key] !== undefined ? tags[key] : match;
  });
}

// Get a random line from a pool
export function getLine(poolName, category, tags = {}) {
  const pool = DIALOG_POOLS[poolName];
  if (!pool) return '...';
  const lines = pool[category];
  if (!lines || lines.length === 0) return '...';
  const line = lines[Math.floor(Math.random() * lines.length)];
  return processDialog(line, tags);
}

// NPC name pools by type
export const NPC_NAMES = {
  innkeeper: ['Marta', 'Bolen', 'Sirel', 'Hadwick', 'Prynn', 'Durvin'],
  barkeep:   ['Grog', 'Tilda', 'Renwick', 'Sasha', 'Bram', 'Cora'],
  shopkeeper:['Aldric', 'Fenna', 'Torven', 'Isa', 'Caspian', 'Meri'],
  guard:     ['Sergeant Halvik', 'Guard Thom', 'Guard Sera', 'Captain Drev'],
  villager:  ['Jessa', 'Tomlin', 'Cwen', 'Aldred', 'Mirel', 'Peta', 'Burk', 'Nyla'],
  quest_giver:['Lord Valen', 'Lady Mireth', 'Farmer Hodge', 'Scholar Elra', 'Widow Kess'],
  healer:    ['Sister Amara', 'Herbalist Grenn', 'Brother Aldric', 'Shaman Voss'],
  story:     ['Sage Orenthia', 'Elder Kith', 'The Prophet', 'Archivist Solen'],
};

export const INN_NAMES = [
  'The Sleeping Dragon',
  'The Wanderer\'s Rest',
  'The Golden Flagon',
  'The Roadside Inn',
  'The Broken Axe',
  'The Crowing Cock',
  'The Silver Moon',
  'The Last Hearth',
  'The Pilgrim\'s Rest',
  'The Merry Traveller',
];
