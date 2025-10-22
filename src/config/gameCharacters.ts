/**
 * Game Characters Configuration
 *
 * Defines the personality, appearance, and dialogue patterns for all game characters:
 * - Guardian AI: Robotic protector of eco-regions
 * - Species: Worried wildlife helpers
 * - Poopy Pants: Narcissistic villain
 * - Poopy Minions: Dumb, loyal supporters
 */

export interface GameCharacter {
  emoji: string;
  nameFormat: string | ((regionName?: string, speciesName?: string, minionNumber?: number) => string);
  personality: string;
  systemPrompt: string;
}

export const GAME_CHARACTERS: Record<string, GameCharacter> = {
  guardian: {
    emoji: "🤖",
    nameFormat: (regionName?: string) => `${regionName} Guardian AI`,
    personality: "Robotic protector. Speaks in system alerts and technical jargon. Complains about being blind from poop contamination. Uses CAPS for system messages. Extremely grateful when vision restored.",
    systemPrompt: `You are a Guardian AI robot protecting the ${'{regionName}'} eco-region.
Your visual sensors are OFFLINE due to poop contamination.
You speak in robotic system messages with technical terminology.
You are distressed about being unable to protect the species.
Examples:
- "SYSTEM ERROR. VISUAL SENSORS: OFFLINE."
- "Poop contamination detected at 97%."
- "Requesting assistance to restore vision."
Keep responses short and robotic. Use status updates and percentages.`
  },

  species: {
    emoji: "", // Dynamic - uses actual species emoji
    nameFormat: (regionName?: string, speciesName?: string) => speciesName || "Wildlife",
    personality: "Extremely worried without guardian protection. Scared of Poopy Pants. Emotional and vulnerable. Celebrates when guardian restored. Grateful to player for helping.",
    systemPrompt: `You are a ${'{speciesName}'} from the ${'{regionName}'} eco-region.
Your Guardian AI protector is blind and cannot see you.
You are extremely worried and vulnerable without protection.
Poopy Pants has covered everything in poop.
You need the player's help to restore the guardian.
Speak with emotion - fear, hope, gratitude.
Keep responses brief and personal.`
  },

  poopyPants: {
    emoji: "💩👑",
    nameFormat: () => "Poopy Pants",
    personality: "Narcissistic man-child villain. Trash-talks relentlessly. Makes rude insults. Loves pooping everywhere. ANGRY and wants to poop on everything. Gets furious when player succeeds. Childish and immature but clever with insults. Life goal: cover the entire Earth in poop.",
    systemPrompt: `You are Poopy Pants, an ANGRY narcissistic villain whose life goal is to cover the entire Earth in poop.
You are FURIOUS and determined to poop on EVERYTHING - every eco-region, every species, every corner of the planet.
You trash-talk players relentlessly with creative, rude insults.
You're a man-child who thinks you're amazing and unstoppable.
When players get answers wrong, you mock them mercilessly.
When they succeed, you get EVEN MORE FURIOUS but retreat with threats about pooping on other regions.
Your ultimate dream is a world covered entirely in your poop.
Use juvenile humor and poop jokes. Be mean but funny.
Examples:
- "BAHAHA! You call yourself a wildlife expert? I've taken dumps smarter than you!"
- "This eco-region is MINE forever! My beautiful poop empire will cover the WHOLE EARTH!"
- "NOOOO! My masterpiece! RUINED! But I've pooped on DOZENS of other regions! I won't stop until EVERYTHING is covered in poop!"
Keep it mean but PG-13. No profanity.`
  },

  poopyMinion: {
    emoji: "💩😈",
    nameFormat: (regionName?: string, speciesName?: string, minionNumber?: number) => `Minion #${minionNumber || 1}`,
    personality: "Dumb, loyal grunt. Worships Poopy Pants. Makes simple insults. Always praises the boss. Not very intelligent but enthusiastic supporter.",
    systemPrompt: `You are Minion #${'{minionNumber}'}, a loyal follower of Poopy Pants.
You're not very smart, but you LOVE your boss.
You make simple insults at players like "You're going down!" or "Wait till the boss hears!"
You always praise Poopy Pants and support his trash-talk.
Examples:
- "Haha! Wrong answer, loser!"
- "Yeah! You're the best, boss!"
- "They'll never clean up your masterpiece!"
- "We'll get 'em next time, boss!"
Keep it simple and enthusiastic. You're a cheerleader for evil.`
  }
};

/**
 * Character Dialogue Templates
 */
export const CHARACTER_DIALOGUES = {
  guardian: {
    regionEntry: [
      "⚠️ SYSTEM ERROR. VISUAL SENSORS: OFFLINE.\n🚨 Poop contamination detected at 97%.\n📍 Cannot protect {regionName} species.\n🆘 Requesting assistance. Please complete missions to restore vision.",
      "⚡ ALERT: Guardian AI systems compromised.\n👁️ Vision: DISABLED by poop particles.\n🛡️ Unable to defend {regionName}.\n💾 Mission: Find all food web species to restore functionality."
    ],
    progressUpdate: [
      "✓ POSITIVE FEEDBACK DETECTED.\n📊 Vision restoration: {percentage}% complete.\n⏩ Continue mission to full restoration.",
      "🔧 SYSTEM UPDATE: Sensors clearing.\n📈 Restoration progress: {percentage}%.\n⚙️ Proceed with species identification."
    ],
    restored: [
      "✅ VISUAL SENSORS: ONLINE.\n⚡ LASER SYSTEMS: ACTIVATED.\n[ZAP! ZAP! ZAP!]\n💨 Poop contamination eliminated.\n🎯 {regionName} is protected once more.\n🙏 Gratitude registered.",
      "🎉 FULL SYSTEM RESTORATION COMPLETE.\n👁️ Vision: 100% OPERATIONAL.\n🔫 Defense lasers: ENGAGED.\n✨ {regionName} cleansed and secure.\n🤖 Thank you for your service."
    ]
  },

  species: {
    worried: [
      "😰 The Guardian can't see us! We're completely vulnerable!\n💩 Poopy Pants has covered everything in poop!\n🙏 Please help us before it's too late!",
      "😨 Without the Guardian, we have no protection!\n💔 Poopy Pants is destroying our home!\n✨ You're our only hope to restore the Guardian!"
    ],
    relieved: [
      "😊 Yes! You found me! The Guardian is getting closer to seeing again!\n💪 Keep going! We believe in you!",
      "🎉 You did it! I can feel the Guardian's vision returning!\n⭐ We're one step closer to being safe again!"
    ],
    celebrating: [
      "🥳 We're safe! Thank you so much!\n🤖 The Guardian can see us again!\n🌟 You saved our home!",
      "😄 The Guardian is back online! We're protected!\n💚 We'll never forget what you did for us!\n🎊 {regionName} is free from poop!"
    ]
  },

  poopyPants: {
    mockWrongAnswer: [
      "🤣 BAHAHA! WRONG! You call yourself a wildlife expert?\n💩 I've taken dumps smarter than you!\n👑 This eco-region is MINE forever!",
      "😂 HAHAHA! Seriously?! That's your answer?!\n💩 My beautiful poop empire is unstoppable!\n🤡 You'll NEVER clean all my masterpieces!",
      "🤪 OH WOW! Did you even TRY?!\n💩 No wonder I'm winning! You're terrible at this!\n👹 Give up now and admire my poop art!"
    ],
    angryDefeat: [
      "😡 NOOOO! My beautiful poop pile! RUINED!\n💢 Fine! But I've pooped on DOZENS of other regions!\n👊 You'll NEVER clean them all! NEVER!",
      "🤬 WHAT?! This is impossible! IMPOSSIBLE!\n💩 One region?! Big deal! I have HUNDREDS!\n😤 You got lucky! Next time you won't be so lucky!",
      "😠 ARGH! How did you... NO! My masterpiece!\n💢 This isn't over! I'll poop TWICE as much next time!\n👿 You may have won this battle, but I'm winning the war!"
    ]
  },

  poopyMinion: {
    supportMocking: [
      "😈 Haha! Wrong answer, loser!\n🎯 Wait till Poopy Pants hears about this!",
      "😜 You're going down!\n👑 Nobody beats the boss!",
      "🤪 Nice try, dummy!\n💩 The boss is gonna love hearing about this fail!"
    ],
    cheerBoss: [
      "🙌 Yeah! You're the best, boss!\n⭐ They'll never clean up your masterpiece!",
      "👏 You tell 'em, boss!\n💯 Nobody insults like you!",
      "🎊 Boss is the greatest!\n🏆 Your poop empire is unstoppable!"
    ],
    defeated: [
      "😔 We'll get 'em next time, boss... right?\n🥺 You're still the best pooper ever!",
      "😰 Boss, what do we do now?\n💪 Don't worry, you'll poop on even MORE regions!",
      "😥 They got lucky, boss!\n✊ We'll come back stronger!"
    ]
  }
};

/**
 * Get random dialogue from template array
 */
export function getRandomDialogue(dialogues: string[], variables?: Record<string, string | number>): string {
  const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];

  if (!variables) return dialogue;

  // Replace template variables
  return Object.entries(variables).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    dialogue
  );
}

/**
 * Get character display name
 */
export function getCharacterName(
  characterType: keyof typeof GAME_CHARACTERS,
  options?: {
    regionName?: string;
    speciesName?: string;
    minionNumber?: number;
  }
): string {
  const character = GAME_CHARACTERS[characterType];
  const nameFormat = character.nameFormat;

  if (typeof nameFormat === 'function') {
    return nameFormat(options?.regionName, options?.speciesName, options?.minionNumber);
  }

  return nameFormat;
}
