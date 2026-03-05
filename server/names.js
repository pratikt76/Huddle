const adjectives = [
  'Red', 'Blue', 'Green', 'Purple', 'Golden',
  'Silver', 'Cosmic', 'Neon', 'Swift', 'Brave',
  'Calm', 'Dark', 'Bright', 'Wild', 'Cool',
  'Crimson', 'Azure', 'Amber', 'Jade', 'Coral',
  'Mystic', 'Lunar', 'Solar', 'Frost', 'Storm',
  'Gentle', 'Bold', 'Silent', 'Lucky', 'Vivid'
];

const animals = [
  'Fox', 'Panda', 'Wolf', 'Hawk', 'Tiger',
  'Bear', 'Eagle', 'Lynx', 'Otter', 'Raven',
  'Falcon', 'Dolphin', 'Owl', 'Phoenix', 'Cobra',
  'Jaguar', 'Heron', 'Viper', 'Stag', 'Crane',
  'Badger', 'Bison', 'Gecko', 'Koala', 'Mantis',
  'Oriole', 'Quail', 'Shark', 'Toucan', 'Wombat'
];

function generateName(existingNames = []) {
  const maxAttempts = 100;
  for (let i = 0; i < maxAttempts; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const name = `${adj} ${animal}`;
    if (!existingNames.includes(name)) {
      return name;
    }
  }
  // Fallback: append a number
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj} ${animal} ${Math.floor(Math.random() * 1000)}`;
}

module.exports = { generateName };
