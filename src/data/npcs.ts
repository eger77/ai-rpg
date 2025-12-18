import type { NPC } from '@/types';

// =====================================================
// STARTER NPCs
// =====================================================

export const createSarahMartinez = (): NPC => ({
  id: 'sarah_martinez',
  name: 'Sarah Martinez',
  age: 28,
  gender: 'female',
  occupation: 'Architect',

  appearance: {
    hairStyle: 'long wavy',
    hairColor: 'dark brown',
    eyeColor: 'hazel',
    height: '5\'6"',
    bodyType: 'athletic',
    distinguishingFeatures: ['warm smile', 'expressive eyes', 'small birthmark on left cheek'],
    usualStyle: 'business',
  },

  personality: {
    openness: 80,
    conscientiousness: 75,
    extraversion: 55,
    agreeableness: 70,
    neuroticism: 45,

    verbosity: 60,
    formality: 50,
    humorStyle: 'dry',
    conflictStyle: 'communicative',

    flirtingStyle: 'subtle',
    attachmentStyle: 'secure',

    values: ['creativity', 'ambition', 'authenticity', 'family'],
    interests: ['architecture', 'art', 'yoga', 'coffee', 'travel', 'design'],
    dealbreakers: ['dishonesty', 'lack of ambition', 'cruelty'],

    quirks: ['touches her hair when nervous', 'always carries a sketchbook', 'hums while working'],
    petPeeves: ['lateness', 'generic gifts', 'people who don\'t listen'],
  },

  currentState: {
    currentLocationId: 'downtown_cafe',
    currentActivity: 'Working on laptop',
    mood: {
      primary: 'content',
      intensity: 60,
      duration: 120,
    },
    energy: 70,
    stress: 40,
    availability: 'available',
    currentThoughts: ['I need to finish this design by tomorrow', 'I wonder if I should try that new yoga class'],
  },

  defaultSchedule: [
    { dayOfWeek: 'weekday', startHour: 6, endHour: 8, locationId: 'sarah_apartment', activity: 'Morning routine', interruptible: false },
    { dayOfWeek: 'weekday', startHour: 8, endHour: 12, locationId: 'sarah_apartment', activity: 'Working from home', interruptible: true },
    { dayOfWeek: 'weekday', startHour: 12, endHour: 15, locationId: 'downtown_cafe', activity: 'Working at café', interruptible: true },
    { dayOfWeek: 'weekday', startHour: 15, endHour: 18, locationId: 'architecture_firm', activity: 'Office work', interruptible: false },
    { dayOfWeek: 'weekday', startHour: 19, endHour: 20, locationId: 'yoga_studio', activity: 'Yoga class', interruptible: false },
    { dayOfWeek: 'weekday', startHour: 20, endHour: 23, locationId: 'sarah_apartment', activity: 'Relaxing at home', interruptible: true },
    { dayOfWeek: 'weekend', startHour: 9, endHour: 12, locationId: 'sarah_apartment', activity: 'Sleeping in', interruptible: false },
    { dayOfWeek: 'weekend', startHour: 12, endHour: 15, locationId: 'farmers_market', activity: 'Shopping', interruptible: true },
    { dayOfWeek: 'weekend', startHour: 15, endHour: 18, locationId: 'art_gallery', activity: 'Visiting galleries', interruptible: true },
    { dayOfWeek: 'weekend', startHour: 19, endHour: 23, locationId: 'sarah_apartment', activity: 'Home', interruptible: true },
  ],
  scheduleOverrides: [],

  relationship: {
    friendship: 0,
    romance: 0,
    trust: 0,
    respect: 0,

    attraction: {
      physical: 0,
      intellectual: 0,
      emotional: 0,
      spiritual: 0,
    },

    status: 'stranger',
    stage: 'unknown',

    milestonesCompleted: [],
    milestonesAvailable: [
      {
        id: 'first_conversation',
        name: 'First Conversation',
        description: 'Have your first real conversation with Sarah',
        type: 'friendship',
        requirements: [
          { type: 'stat', target: 'friendship', value: 5, met: false },
        ],
        unlocksContent: ['sarah_basic_topics'],
        unlocksLocations: [],
        unlocksTopics: ['work', 'interests'],
        completed: false,
      },
      {
        id: 'coffee_regulars',
        name: 'Coffee Regulars',
        description: 'Become a familiar face at her usual café',
        type: 'friendship',
        requirements: [
          { type: 'stat', target: 'friendship', value: 20, met: false },
          { type: 'flag', target: 'met_sarah_at_cafe_3_times', value: true, met: false },
        ],
        unlocksContent: ['sarah_personal_topics'],
        unlocksLocations: [],
        unlocksTopics: ['family', 'dreams'],
        completed: false,
      },
      {
        id: 'first_date',
        name: 'First Date',
        description: 'Go on an official date with Sarah',
        type: 'romance',
        requirements: [
          { type: 'stat', target: 'romance', value: 30, met: false },
          { type: 'stat', target: 'trust', value: 25, met: false },
        ],
        unlocksContent: ['sarah_romantic_topics'],
        unlocksLocations: [],
        unlocksTopics: ['past_relationships', 'future'],
        completed: false,
      },
      {
        id: 'first_kiss',
        name: 'First Kiss',
        description: 'Share your first kiss with Sarah',
        type: 'romance',
        requirements: [
          { type: 'stat', target: 'romance', value: 50, met: false },
          { type: 'stat', target: 'trust', value: 40, met: false },
          { type: 'quest', target: 'romantic_dinner_date', value: true, met: false },
        ],
        unlocksContent: ['sarah_intimate_topics'],
        unlocksLocations: [],
        unlocksTopics: ['vulnerabilities', 'fears'],
        completed: false,
      },
      {
        id: 'meet_rebecca',
        name: 'Meet the Sister',
        description: 'Meet Sarah\'s sister Rebecca',
        type: 'trust',
        requirements: [
          { type: 'stat', target: 'trust', value: 60, met: false },
          { type: 'stat', target: 'romance', value: 55, met: false },
        ],
        unlocksContent: ['sarah_family_content'],
        unlocksLocations: ['sarah_apartment'],
        unlocksTopics: ['childhood', 'family_secrets'],
        completed: false,
      },
      {
        id: 'apartment_access',
        name: 'Her Place',
        description: 'Get invited to Sarah\'s apartment',
        type: 'intimacy',
        requirements: [
          { type: 'stat', target: 'romance', value: 70, met: false },
          { type: 'stat', target: 'trust', value: 65, met: false },
        ],
        unlocksContent: ['sarah_apartment_scenes'],
        unlocksLocations: ['sarah_apartment'],
        unlocksTopics: ['deep_secrets'],
        completed: false,
      },
    ],

    lastInteraction: null,
    totalInteractions: 0,
    positiveInteractions: 0,
    negativeInteractions: 0,

    daysSinceContact: 0,
    neglectWarning: false,

    hasConfessedFeelings: false,
    isExclusive: false,
    hasMetFamily: false,
    hasSharedSecret: false,
    firstKissDate: null,

    currentTension: 0,
    jealousyLevel: 0,
    jealousyTargets: [],
  },

  knownFacts: [],
  memories: [],

  secrets: [
    {
      id: 'sarah_trust_issues',
      content: 'Sarah has trust issues from a past relationship where her ex cheated on her',
      severity: 'significant',
      trustThresholdToReveal: 60,
      revealed: false,
    },
    {
      id: 'sarah_father',
      content: 'Sarah\'s father left when she was young and she hasn\'t spoken to him in years',
      severity: 'major',
      trustThresholdToReveal: 75,
      revealed: false,
    },
    {
      id: 'sarah_dream',
      content: 'Sarah secretly dreams of opening her own architecture firm but is scared of failure',
      severity: 'significant',
      trustThresholdToReveal: 50,
      revealed: false,
    },
  ],

  hiddenMotives: [
    'Looking for someone genuine after past disappointments',
    'Wants to be supported in her career ambitions',
    'Needs someone patient who earns her trust',
  ],

  internalMonologue: [],

  connections: [
    {
      npcId: 'rebecca_martinez',
      relationshipType: 'family',
      specificRole: 'younger sister',
      closeness: 90,
      opinion: 85,
      sharesInfoAboutPlayer: true,
      influencesOpinionOfPlayer: true,
    },
    {
      npcId: 'jake_thompson',
      relationshipType: 'ex',
      specificRole: 'ex-boyfriend',
      closeness: 10,
      opinion: -30,
      sharesInfoAboutPlayer: false,
      influencesOpinionOfPlayer: false,
    },
    {
      npcId: 'jessica_chen',
      relationshipType: 'friend',
      specificRole: 'yoga friend',
      closeness: 50,
      opinion: 70,
      sharesInfoAboutPlayer: true,
      influencesOpinionOfPlayer: true,
    },
  ],

  questChain: {
    id: 'sarah_main_questline',
    name: 'Win Sarah\'s Heart',
    currentStage: 0,
    stages: [
      {
        id: 'sarah_stage_1',
        description: 'Get to know Sarah',
        objectives: [
          { id: 'talk_sarah_3', description: 'Have 3 conversations with Sarah', type: 'talk', target: 'sarah_martinez', targetValue: 3, currentValue: 0, completed: false },
          { id: 'learn_coffee', description: 'Learn her coffee order', type: 'custom', target: 'sarah_coffee_preference', completed: false },
        ],
        rewards: [
          { type: 'relationship', target: 'sarah_martinez', value: 10 },
          { type: 'unlock_content', target: 'sarah_phone_number', value: 'true' },
        ],
        completed: false,
      },
      {
        id: 'sarah_stage_2',
        description: 'Build a connection',
        objectives: [
          { id: 'sarah_help', description: 'Help Sarah with something', type: 'complete_activity', target: 'help_sarah', completed: false },
          { id: 'sarah_gift', description: 'Give her a thoughtful gift', type: 'give_item', target: 'sarah_liked_gift', completed: false },
        ],
        deadline: undefined,
        rewards: [
          { type: 'relationship', target: 'sarah_martinez', value: 15 },
        ],
        completed: false,
      },
      {
        id: 'sarah_stage_3',
        description: 'First Date',
        objectives: [
          { id: 'ask_date', description: 'Ask Sarah on a date', type: 'custom', target: 'asked_sarah_date', completed: false },
          { id: 'complete_date', description: 'Complete the date successfully', type: 'complete_activity', target: 'first_date_sarah', completed: false },
        ],
        rewards: [
          { type: 'relationship', target: 'sarah_martinez', value: 20 },
          { type: 'achievement', target: 'first_date_achievement', value: 'true' },
        ],
        completed: false,
      },
    ],
    completed: false,
    failed: false,
  },

  unlockedContent: [],

  preferences: {
    lovedGifts: ['sunflowers', 'architecture_books', 'artisan_coffee', 'sketch_supplies'],
    likedGifts: ['flowers', 'books', 'wine', 'chocolates'],
    dislikedGifts: ['generic_flowers', 'cheap_jewelry'],
    hatedGifts: ['gas_station_flowers', 'energy_drinks'],

    favoriteActivities: ['coffee_dates', 'art_gallery_visits', 'walks_in_park', 'cooking_together'],
    dislikedActivities: ['loud_clubs', 'sports_bars', 'fast_food'],

    preferredDateTypes: ['intellectual', 'romantic', 'creative'],

    favoriteTopics: ['architecture', 'travel', 'art', 'dreams', 'design'],
    avoidTopics: ['her_father', 'her_ex_initially'],

    favoriteFoods: ['sushi', 'italian', 'brunch', 'farm_to_table'],
    allergies: ['shellfish'],
    dietaryRestrictions: [],
    favoriteDrinks: ['oat_milk_latte', 'natural_wine', 'herbal_tea'],

    favoriteColor: 'sage green',
    favoriteFlower: 'sunflower',
    birthday: { month: 3, day: 15 },
  },

  conversationTopicsUnlocked: ['casual', 'weather', 'work_general'],
  conversationTopicsExhausted: [],
});

export const createMarcusJohnson = (): NPC => ({
  id: 'marcus_johnson',
  name: 'Marcus Johnson',
  age: 32,
  gender: 'male',
  occupation: 'Bartender / Bar Owner',

  appearance: {
    hairStyle: 'short fade',
    hairColor: 'black',
    eyeColor: 'brown',
    height: '6\'1"',
    bodyType: 'athletic',
    distinguishingFeatures: ['friendly smile', 'sleeve tattoos', 'always well-groomed'],
    usualStyle: 'casual',
  },

  personality: {
    openness: 70,
    conscientiousness: 65,
    extraversion: 85,
    agreeableness: 80,
    neuroticism: 30,

    verbosity: 70,
    formality: 30,
    humorStyle: 'silly',
    conflictStyle: 'communicative',

    flirtingStyle: 'playful',
    attachmentStyle: 'secure',

    values: ['loyalty', 'community', 'hard_work', 'fun'],
    interests: ['mixology', 'music', 'sports', 'community_events'],
    dealbreakers: ['disloyalty', 'arrogance', 'rudeness_to_staff'],

    quirks: ['always remembers drink orders', 'gives everyone nicknames', 'tells the same jokes'],
    petPeeves: ['bad tippers', 'people who snap to get attention', 'drink snobbery'],
  },

  currentState: {
    currentLocationId: 'the_corner_bar',
    currentActivity: 'Bartending',
    mood: {
      primary: 'happy',
      intensity: 70,
      duration: 180,
    },
    energy: 80,
    stress: 35,
    availability: 'busy',
    currentThoughts: ['Need to find an investor for the bar', 'Hope the weekend crowd is good'],
  },

  defaultSchedule: [
    { dayOfWeek: 'weekday', startHour: 10, endHour: 14, locationId: 'marcus_apartment', activity: 'Morning/Personal time', interruptible: true },
    { dayOfWeek: 'weekday', startHour: 14, endHour: 16, locationId: 'downtown_cafe', activity: 'Coffee break', interruptible: true },
    { dayOfWeek: 'weekday', startHour: 17, endHour: 2, locationId: 'the_corner_bar', activity: 'Working at bar', interruptible: true },
    { dayOfWeek: 'weekend', startHour: 12, endHour: 16, locationId: 'city_park', activity: 'Playing basketball', interruptible: true },
    { dayOfWeek: 'weekend', startHour: 18, endHour: 3, locationId: 'the_corner_bar', activity: 'Working busy shift', interruptible: true },
  ],
  scheduleOverrides: [],

  relationship: {
    friendship: 0,
    romance: 0,
    trust: 0,
    respect: 0,

    attraction: {
      physical: 0,
      intellectual: 0,
      emotional: 0,
      spiritual: 0,
    },

    status: 'stranger',
    stage: 'unknown',

    milestonesCompleted: [],
    milestonesAvailable: [
      {
        id: 'first_drink',
        name: 'First Round',
        description: 'Get to know Marcus over drinks',
        type: 'friendship',
        requirements: [
          { type: 'stat', target: 'friendship', value: 10, met: false },
        ],
        unlocksContent: ['marcus_bar_stories'],
        unlocksLocations: [],
        unlocksTopics: ['bar_life', 'regulars'],
        completed: false,
      },
      {
        id: 'bar_regular',
        name: 'Bar Regular',
        description: 'Become a trusted regular at Marcus\'s bar',
        type: 'friendship',
        requirements: [
          { type: 'stat', target: 'friendship', value: 40, met: false },
          { type: 'flag', target: 'visited_bar_10_times', value: true, met: false },
        ],
        unlocksContent: ['marcus_personal_stories'],
        unlocksLocations: [],
        unlocksTopics: ['dreams', 'struggles'],
        completed: false,
      },
    ],

    lastInteraction: null,
    totalInteractions: 0,
    positiveInteractions: 0,
    negativeInteractions: 0,

    daysSinceContact: 0,
    neglectWarning: false,

    hasConfessedFeelings: false,
    isExclusive: false,
    hasMetFamily: false,
    hasSharedSecret: false,
    firstKissDate: null,

    currentTension: 0,
    jealousyLevel: 0,
    jealousyTargets: [],
  },

  knownFacts: [],
  memories: [],

  secrets: [
    {
      id: 'marcus_bar_trouble',
      content: 'The bar is in financial trouble and Marcus might lose it without an investor',
      severity: 'major',
      trustThresholdToReveal: 30,
      revealed: false,
    },
  ],

  hiddenMotives: [
    'Desperately trying to save his bar',
    'Looking for genuine friends, not just customers',
    'Wants to prove his family wrong about the bar being a bad investment',
  ],

  internalMonologue: [],

  connections: [
    {
      npcId: 'emma_davis',
      relationshipType: 'friend',
      specificRole: 'regular customer and friend',
      closeness: 65,
      opinion: 75,
      sharesInfoAboutPlayer: true,
      influencesOpinionOfPlayer: false,
    },
  ],

  questChain: {
    id: 'marcus_bar_crisis',
    name: 'Help Marcus Save His Bar',
    currentStage: 0,
    stages: [
      {
        id: 'marcus_stage_1',
        description: 'Become friends with Marcus',
        objectives: [
          { id: 'chat_marcus', description: 'Chat with Marcus during slow shifts', type: 'talk', target: 'marcus_johnson', targetValue: 3, currentValue: 0, completed: false },
        ],
        rewards: [
          { type: 'relationship', target: 'marcus_johnson', value: 15 },
          { type: 'unlock_content', target: 'free_drinks_week', value: 'true' },
        ],
        completed: false,
      },
      {
        id: 'marcus_stage_2',
        description: 'Help find an investor',
        objectives: [
          { id: 'find_investor', description: 'Find potential investors', type: 'find_npc', target: 'wealthy_npcs', targetValue: 3, currentValue: 0, completed: false },
          { id: 'bring_investor', description: 'Bring an investor to meet Marcus', type: 'complete_activity', target: 'investor_meeting', completed: false },
        ],
        deadline: undefined,
        rewards: [
          { type: 'relationship', target: 'marcus_johnson', value: 30 },
          { type: 'unlock_location', target: 'vip_lounge', value: 'true' },
        ],
        completed: false,
      },
    ],
    completed: false,
    failed: false,
    failureConsequence: 'Marcus loses the bar and moves away',
  },

  unlockedContent: [],

  preferences: {
    lovedGifts: ['craft_beer', 'whiskey', 'sports_memorabilia'],
    likedGifts: ['coffee', 'snacks', 'music'],
    dislikedGifts: ['cheap_alcohol'],
    hatedGifts: [],

    favoriteActivities: ['watching_sports', 'trying_new_bars', 'basketball'],
    dislikedActivities: ['formal_events', 'quiet_activities'],

    preferredDateTypes: [],

    favoriteTopics: ['sports', 'music', 'bar_stories', 'community'],
    avoidTopics: ['finances_initially'],

    favoriteFoods: ['burgers', 'wings', 'bbq'],
    allergies: [],
    dietaryRestrictions: [],
    favoriteDrinks: ['craft_beer', 'bourbon'],

    favoriteColor: 'navy blue',
    favoriteFlower: 'none',
    birthday: { month: 7, day: 22 },
  },

  conversationTopicsUnlocked: ['casual', 'drinks', 'sports'],
  conversationTopicsExhausted: [],
});

export const createEmma = (): NPC => ({
  id: 'emma_davis',
  name: 'Emma Davis',
  age: 26,
  gender: 'female',
  occupation: 'Barista / Aspiring Writer',

  appearance: {
    hairStyle: 'pixie cut',
    hairColor: 'auburn',
    eyeColor: 'green',
    height: '5\'4"',
    bodyType: 'petite',
    distinguishingFeatures: ['freckles', 'bright smile', 'always has a book'],
    usualStyle: 'artistic',
  },

  personality: {
    openness: 90,
    conscientiousness: 55,
    extraversion: 65,
    agreeableness: 85,
    neuroticism: 50,

    verbosity: 75,
    formality: 25,
    humorStyle: 'wholesome',
    conflictStyle: 'avoider',

    flirtingStyle: 'playful',
    attachmentStyle: 'anxious',

    values: ['creativity', 'kindness', 'authenticity', 'adventure'],
    interests: ['writing', 'poetry', 'indie_music', 'coffee', 'books', 'nature'],
    dealbreakers: ['meanness', 'closed_mindedness', 'dishonesty'],

    quirks: ['writes observations in a notebook', 'quotes books', 'nervous laughter'],
    petPeeves: ['book spoilers', 'dismissive attitudes', 'being ignored'],
  },

  currentState: {
    currentLocationId: 'downtown_cafe',
    currentActivity: 'Working behind counter',
    mood: {
      primary: 'content',
      intensity: 65,
      duration: 180,
    },
    energy: 75,
    stress: 25,
    availability: 'busy',
    currentThoughts: ['I should work on my novel after shift', 'That customer seems interesting'],
  },

  defaultSchedule: [
    { dayOfWeek: 'weekday', startHour: 6, endHour: 14, locationId: 'downtown_cafe', activity: 'Working shift', interruptible: true },
    { dayOfWeek: 'weekday', startHour: 15, endHour: 18, locationId: 'city_park', activity: 'Writing in park', interruptible: true },
    { dayOfWeek: 'weekday', startHour: 19, endHour: 22, locationId: 'emma_apartment', activity: 'Working on novel', interruptible: true },
    { dayOfWeek: 'saturday', startHour: 10, endHour: 14, locationId: 'bookstore', activity: 'Browsing books', interruptible: true },
    { dayOfWeek: 'saturday', startHour: 20, endHour: 23, locationId: 'the_corner_bar', activity: 'Open mic night', interruptible: true },
    { dayOfWeek: 'sunday', startHour: 10, endHour: 15, locationId: 'farmers_market', activity: 'Farmers market', interruptible: true },
  ],
  scheduleOverrides: [],

  relationship: {
    friendship: 0,
    romance: 0,
    trust: 0,
    respect: 0,

    attraction: {
      physical: 0,
      intellectual: 0,
      emotional: 0,
      spiritual: 0,
    },

    status: 'stranger',
    stage: 'unknown',

    milestonesCompleted: [],
    milestonesAvailable: [
      {
        id: 'coffee_chat',
        name: 'Coffee Chat',
        description: 'Have a real conversation with Emma beyond ordering coffee',
        type: 'friendship',
        requirements: [
          { type: 'stat', target: 'friendship', value: 10, met: false },
        ],
        unlocksContent: ['emma_writing_interest'],
        unlocksLocations: [],
        unlocksTopics: ['books', 'writing'],
        completed: false,
      },
    ],

    lastInteraction: null,
    totalInteractions: 0,
    positiveInteractions: 0,
    negativeInteractions: 0,

    daysSinceContact: 0,
    neglectWarning: false,

    hasConfessedFeelings: false,
    isExclusive: false,
    hasMetFamily: false,
    hasSharedSecret: false,
    firstKissDate: null,

    currentTension: 0,
    jealousyLevel: 0,
    jealousyTargets: [],
  },

  knownFacts: [],
  memories: [],

  secrets: [
    {
      id: 'emma_novel',
      content: 'Emma has been working on a novel for 3 years but is too scared to show anyone',
      severity: 'minor',
      trustThresholdToReveal: 40,
      revealed: false,
    },
  ],

  hiddenMotives: [
    'Seeking validation for her writing',
    'Looking for someone who takes her seriously',
    'Wants adventure but is scared to take risks',
  ],

  internalMonologue: [],

  connections: [
    {
      npcId: 'marcus_johnson',
      relationshipType: 'friend',
      specificRole: 'friend from open mic nights',
      closeness: 60,
      opinion: 80,
      sharesInfoAboutPlayer: true,
      influencesOpinionOfPlayer: false,
    },
  ],

  questChain: null,

  unlockedContent: [],

  preferences: {
    lovedGifts: ['rare_books', 'vintage_journals', 'poetry_collections'],
    likedGifts: ['books', 'tea', 'flowers', 'stationery'],
    dislikedGifts: ['generic_gifts', 'impersonal_items'],
    hatedGifts: ['e-readers'],

    favoriteActivities: ['bookstore_dates', 'poetry_readings', 'picnics', 'coffee_tasting'],
    dislikedActivities: ['loud_clubs', 'sports_events'],

    preferredDateTypes: ['intellectual', 'creative', 'cozy'],

    favoriteTopics: ['books', 'writing', 'dreams', 'philosophy', 'nature'],
    avoidTopics: ['her_novel_pressure'],

    favoriteFoods: ['pastries', 'salads', 'comfort_food'],
    allergies: ['peanuts'],
    dietaryRestrictions: ['vegetarian'],
    favoriteDrinks: ['chamomile_tea', 'pour_over_coffee', 'hot_chocolate'],

    favoriteColor: 'forest green',
    favoriteFlower: 'wildflowers',
    birthday: { month: 9, day: 3 },
  },

  conversationTopicsUnlocked: ['casual', 'coffee', 'weather'],
  conversationTopicsExhausted: [],
});

// Factory function to get all starter NPCs
export const getStarterNPCs = (): NPC[] => [
  createSarahMartinez(),
  createMarcusJohnson(),
  createEmma(),
];
