# Chronicles of the Realm

A retro dungeon crawler RPG with a DOS-inspired terminal aesthetic, built in TypeScript and rendered on an HTML canvas. Explore a procedurally generated world, complete quests, fight turn-based battles, and defeat one of three world-ending bosses.

## Features

- **Procedural world generation** — 120×80 tile world with 7 biomes, towns, dungeons, caves, ruins, and shrines
- **Character creation** — 5 races, 5 backgrounds, and 10 skills across combat, magic, rogue, and exploration categories
- **Turn-based combat** — Skill abilities, spells, status effects, multi-enemy encounters, and boss phase 2 enrage
- **Quest system** — Procedurally generated slay, fetch, deliver, and investigate quests with gold/XP rewards
- **Three story goals** — Destroy the Lich, slay the Ancient Dragon, or banish the Demon Lord
- **Equipment system** — Weapons, armor, helmets, shields, and accessories with real stat bonuses
- **Lockpicking** — Locked chests in dungeons can be opened with a lockpick or the lockpicking skill
- **OPL2/OPL3 music** — Context-aware chiptune soundtrack via webAdPlug
- **Save/load** — Browser localStorage save with full world state persistence
- **Progressive Web App** — Installable, works offline

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build

```bash
npm run build     # type-check and bundle
npm run preview   # preview the production build
```

## Testing

```bash
npm run test:unit  # unit tests (vitest)
npm test           # end-to-end tests (playwright)
```

## Races

| Race | Strengths | Notable Traits |
|------|-----------|----------------|
| Human | Balanced, extra skill slot | +10% XP, random stat per level |
| Elf | High INT/DEX, strong magic | Spells cost 1 less MP, +10% dodge |
| Dwarf | High STR/CON | Potions heal 25% more, reduce all incoming damage by 1 |
| Halfling | High DEX/CHA, lucky | +15% dodge, 10% shop discount |
| Half-Orc | Highest STR/CON | Survive at 1 HP once per combat, +20% crit damage |

## Skills

**Combat:** Swordsmanship, Archery, Fortitude  
**Magic:** Arcane Magic, Healing Arts  
**Rogue:** Stealth, Lockpicking  
**Social:** Bargaining  
**Exploration:** Tracking, Herbalism

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move |
| `I` | Inventory |
| `Q` | Quest log |
| `M` | Mute music |
| `J` | Jukebox |
| `Tab` | World map |
| `Escape` | Back / close |

## Project Structure

```
js/
  audio/        Music manager and OPL playback
  data/         Game data: items, monsters, races, skills, quests, backgrounds
  engine/       Core loop, renderer, input, RNG
  systems/      Combat logic, quest logic, dialog
  ui/screens/   All game screens (world map, location, combat, inventory, …)
  world/        World, town, and dungeon generation
  types.ts      Shared TypeScript interfaces
```

## Credits

Music by VOID (Robert Muller) and Shayde / Reality Productions, played via [webAdPlug](https://www.wothke.ch/webAdPlug/) by Juergen Wothke. See [CREDITS.md](CREDITS.md) for full attribution.

## License

MIT — see [LICENSE](LICENSE).
