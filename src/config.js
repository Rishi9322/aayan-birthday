// Everything you'd want to change lives here. No other file needs touching.
export default {
  friend: 'Aayan',
  age: 24, // also the number of candles on the cake

  colors: { pink: '#ff5fa2', purple: '#8b5cf6', teal: '#2dd4bf', amber: '#fbbf24', navy: '#0b1026' },

  // Drop a real file at public/audio/music.mp3. If it is missing, a built-in
  // synth plays a cheerful "Happy Birthday" loop instead.
  music: 'audio/music.mp3',

  intro: {
    kicker: 'a tiny world, built just for you',
    line1: 'Happy Birthday',
    ageLabel: 'LEVEL {age} UNLOCKED',
  },

  cake: { wish: 'Make a wish, {name} ✨' },

  // src = web image in public/photos (run `npm run photos` after dropping files in).
  // For a video add `video`, and use `src` as its poster frame.
  // Captions and alt text are placeholders: edit them to match each photo.
  photos: [
    { src: 'photos/photo1.jpg', alt: 'Aayan and friends, photo 1', caption: 'The sandcastle years' },
    { src: 'photos/photo2.jpg', alt: 'Aayan and friends, photo 2', caption: 'Tea was spilled here ☕' },
    { video: 'photos/video1.mp4', src: 'photos/video1.jpg', alt: 'Video clip 1', caption: 'Press play on the chaos' },
    { src: 'photos/photo3.jpg', alt: 'Aayan and friends, photo 3', caption: 'Core memory unlocked' },
    { src: 'photos/photo4.jpg', alt: 'Aayan and friends, photo 4', caption: 'Trouble, as usual' },
    { video: 'photos/video2.mp4', src: 'photos/video2.jpg', alt: 'Video clip 2', caption: 'Caught in motion' },
    { src: 'photos/photo5.jpg', alt: 'Aayan and friends, photo 5', caption: 'Look at us' },
    { src: 'photos/photo6.jpg', alt: 'Aayan and friends, photo 6', caption: 'Still standing' },
  ],

  // Memory match uses the first 6 non-video photos above; emoji are the fallback if one is missing.
  memoryEmoji: ['🏖️', '☕', '🎂', '🤫', '🎉', '🌅'],

  quiz: {
    questions: [
      { q: "Aayan's official job title in this friendship?", a: ['Vault of secrets & supplier of hot tea', 'Senior Nap Consultant', 'Chief Spreadsheet Officer', 'Part-time influencer of nobody'], ok: 0, quip: 'Rank: untouchable.' },
      { q: 'What happens to every love-life sandcastle we build?', a: ['The tide shows up right on schedule', 'It gets approved by the building committee', 'It becomes a luxury resort', 'The seagulls take it to court'], ok: 0, quip: 'Tide never misses.' },
      { q: 'A secret is told to Aayan. Where does it end up?', a: ['Locked away forever, key swallowed', 'In the group chat in 3 seconds', 'On a billboard on the highway', 'Tattooed on his arm'], ok: 0, quip: 'Fort Knox has nothing on him.' },
      { q: "Aayan's hot tea is best served…", a: ['Piping hot, with zero names', 'Lukewarm with a side of drama', 'Through a megaphone', 'Only on Tuesdays'], ok: 0, quip: 'Names stay classified.' },
      { q: "When a love life collapses, Aayan's first move is…", a: ['Show up. No questions, then all the questions', 'Send a thumbs-up and go offline', 'Post a motivational quote', 'Suggest a cruise'], ok: 0, quip: 'Always shows up.' },
      { q: 'How many sandcastles has the tide taken between us?', a: ['Too many, we stopped counting', 'Exactly 3, and it was a clean 3', 'Zero, we are perfect', 'Ask the tide'], ok: 0, quip: 'The tide has a loyalty card.' },
      { q: "Aayan's real superpower?", a: ['Being there when it matters most', 'Finding the last samosa', 'Parallel parking', 'Invisibility during bill-splitting'], ok: 0, quip: 'No cape needed.' },
      { q: 'Today is…', a: ["Aayan's 24th birthday, obviously", 'National Gossip Day', 'Tax filing deadline', 'A regular Monday'], ok: 0, quip: 'Mark the calendar.' },
    ],
    // highest `min` that the score reaches wins
    results: [
      { min: 0, title: 'Who are you again? 🕵️', text: 'We need to hang out more. Immediately.' },
      { min: 3, title: 'Casual acquaintance 👋', text: 'Nice wave. Needs more tea.' },
      { min: 5, title: 'Solid ride-or-die 🚗', text: 'Respectable. The secrets are safe with you.' },
      { min: 7, title: 'Practically family 🏠', text: 'So close. One question away from perfect.' },
      { min: 8, title: 'Certified best friend 🏆', text: 'Flawless. Hot tea for everyone.' },
    ],
  },

  // Floating notes on the wish wall. Replace with real messages from friends.
  notes: [
    { from: 'Rishi', text: 'Keep the tea hot and the secrets locked. Happy birthday, Aayan!' },
    { from: 'A friend', text: 'Another year of being the calm in everyone else’s storm. Love you, man.' },
    { from: 'Another friend', text: 'May your sandcastles be built above the tide line this year.' },
    { from: 'The group chat', text: 'You owe us a birthday dinner. No excuses. 🍰' },
    { from: 'Future you', text: 'It all worked out. Also you were right about the tea.' },
  ],

  // Quiet by design: one understated line about Gorai, nothing more. Edit freely.
  letter: [
    'Dear Aayan,',
    'Happy 24th, my friend.',
    'We have watched each other’s love lives get built up and washed away like sandcastles, again and again. Somehow you were always the one still standing on the shore afterwards, with the hottest tea and a vault where every secret of mine is still safe.',
    'Nobody gets me the way you do, and I don’t say it enough.',
    'And you know what you did for me in Gorai. I never forgot it, and I never will.',
    'Thank you for being you. Here’s to 24, and to every sandcastle after this one.',
    'Your friend,\nRishi',
  ],
};
