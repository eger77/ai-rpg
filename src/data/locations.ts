import type { Location } from '@/types';

// =====================================================
// STARTER LOCATIONS
// =====================================================

export const createHomeLocation = (): Location => ({
  id: 'home',
  name: 'Your Apartment',
  type: 'home',
  description: 'Your modest but comfortable one-bedroom apartment. It\'s not much, but it\'s home.',

  unlocked: true,
  unlockRequirements: [],

  openHours: 'always',
  closedDays: [],

  noiseLevel: 'quiet',
  crowdLevel: 'empty',
  ambiance: 'The soft hum of the refrigerator and distant city sounds create a peaceful atmosphere.',

  availableActivities: [
    {
      id: 'sleep',
      name: 'Sleep',
      description: 'Get some rest to recover energy',
      duration: 480,
      energyCost: -100,
      moneyCost: 0,
      moodChange: 10,
      stressChange: -20,
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'nap',
      name: 'Take a Nap',
      description: 'A quick power nap',
      duration: 60,
      energyCost: -30,
      moneyCost: 0,
      moodChange: 5,
      stressChange: -10,
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'shower',
      name: 'Take a Shower',
      description: 'Freshen up and improve hygiene',
      duration: 30,
      energyCost: 5,
      moneyCost: 0,
      moodChange: 10,
      stressChange: -5,
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'cook',
      name: 'Cook a Meal',
      description: 'Prepare a home-cooked meal',
      duration: 60,
      energyCost: 10,
      moneyCost: 15,
      moodChange: 15,
      stressChange: 5,
      requiresSkillLevel: { skill: 'cooking', level: 10 },
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'watch_tv',
      name: 'Watch TV',
      description: 'Relax with some entertainment',
      duration: 60,
      energyCost: -5,
      moneyCost: 0,
      moodChange: 10,
      stressChange: -15,
      canInviteNPC: true,
      romanticPotential: false,
    },
    {
      id: 'work_from_home',
      name: 'Work from Home',
      description: 'Get some work done remotely',
      duration: 120,
      energyCost: 25,
      moneyCost: 0,
      moodChange: -5,
      stressChange: 15,
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'exercise_home',
      name: 'Home Workout',
      description: 'Do some exercises at home',
      duration: 45,
      energyCost: 20,
      moneyCost: 0,
      moodChange: 15,
      stressChange: -20,
      statChanges: { fitness: 1 },
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'change_clothes',
      name: 'Change Outfit',
      description: 'Change into different clothes',
      duration: 10,
      energyCost: 0,
      moneyCost: 0,
      canInviteNPC: false,
      romanticPotential: false,
    },
  ],

  interactionPoints: [
    { id: 'bedroom', name: 'Bedroom', description: 'Your private sleeping quarters', privateLevel: 100 },
    { id: 'living_room', name: 'Living Room', description: 'Cozy space with a couch and TV', privateLevel: 70 },
    { id: 'kitchen', name: 'Kitchen', description: 'Small but functional cooking space', privateLevel: 60 },
  ],

  discoveryZones: [],

  regularNPCs: [],
  staffNPCs: [],

  connectedLocations: [
    { locationId: 'downtown_cafe', travelTime: 15 },
    { locationId: 'city_park', travelTime: 10 },
    { locationId: 'grocery_store', travelTime: 10 },
    { locationId: 'the_corner_bar', travelTime: 20 },
  ],
});

export const createDowntownCafe = (): Location => ({
  id: 'downtown_cafe',
  name: 'The Cozy Bean',
  type: 'cafe',
  description: 'A popular café known for its excellent coffee and warm atmosphere. Freelancers and creatives often work here.',

  unlocked: true,
  unlockRequirements: [],

  openHours: { open: 6, close: 22 },
  closedDays: [],

  noiseLevel: 'moderate',
  crowdLevel: 'moderate',
  ambiance: 'The rich aroma of espresso fills the air. Indie music plays softly under the gentle murmur of conversation. Afternoon light streams through large windows.',

  availableActivities: [
    {
      id: 'order_coffee',
      name: 'Order Coffee',
      description: 'Get your caffeine fix',
      duration: 15,
      energyCost: -10,
      moneyCost: 5,
      moodChange: 10,
      stressChange: -5,
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'order_meal',
      name: 'Order Food',
      description: 'Grab a bite to eat',
      duration: 45,
      energyCost: -5,
      moneyCost: 15,
      moodChange: 15,
      stressChange: -5,
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'work_laptop',
      name: 'Work on Laptop',
      description: 'Get some work done',
      duration: 120,
      energyCost: 20,
      moneyCost: 5,
      moodChange: 0,
      stressChange: 10,
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'read_book',
      name: 'Read a Book',
      description: 'Enjoy some quiet reading time',
      duration: 60,
      energyCost: 5,
      moneyCost: 5,
      moodChange: 15,
      stressChange: -15,
      statChanges: { intelligence: 1 },
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'people_watch',
      name: 'People Watch',
      description: 'Observe the café patrons',
      duration: 30,
      energyCost: 0,
      moneyCost: 5,
      moodChange: 5,
      stressChange: -10,
      canInviteNPC: false,
      romanticPotential: false,
    },
  ],

  interactionPoints: [
    { id: 'counter', name: 'Counter', description: 'The main ordering counter where Emma works', privateLevel: 10 },
    { id: 'corner_table', name: 'Corner Table', description: 'A cozy corner table, Sarah\'s usual spot', privateLevel: 50 },
    { id: 'window_seat', name: 'Window Seat', description: 'Seats by the large window with a city view', privateLevel: 30 },
    { id: 'outdoor_patio', name: 'Outdoor Patio', description: 'A small patio area for nice weather', privateLevel: 20 },
  ],

  discoveryZones: [
    {
      id: 'secret_menu',
      name: 'Secret Menu',
      description: 'The café has a secret menu for regulars',
      discovered: false,
      requirements: { type: 'relationship', target: 'emma_davis', value: 30 },
      unlocksContent: ['secret_menu_items'],
    },
  ],

  regularNPCs: ['sarah_martinez', 'emma_davis'],
  staffNPCs: ['emma_davis'],

  connectedLocations: [
    { locationId: 'home', travelTime: 15 },
    { locationId: 'city_park', travelTime: 5 },
    { locationId: 'bookstore', travelTime: 8 },
    { locationId: 'the_corner_bar', travelTime: 10 },
  ],
});

export const createCityPark = (): Location => ({
  id: 'city_park',
  name: 'Riverside Park',
  type: 'park',
  description: 'A beautiful urban park with walking paths, a small lake, and plenty of benches. Popular for joggers, dog walkers, and couples.',

  unlocked: true,
  unlockRequirements: [],

  openHours: { open: 5, close: 23 },
  closedDays: [],

  noiseLevel: 'quiet',
  crowdLevel: 'moderate',
  ambiance: 'Birds chirping, leaves rustling in the breeze, and the distant sound of children playing create a peaceful natural retreat in the city.',

  availableActivities: [
    {
      id: 'walk',
      name: 'Take a Walk',
      description: 'Enjoy a peaceful stroll',
      duration: 30,
      energyCost: 5,
      moneyCost: 0,
      moodChange: 15,
      stressChange: -20,
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'jog',
      name: 'Go for a Jog',
      description: 'Get some exercise',
      duration: 45,
      energyCost: 25,
      moneyCost: 0,
      moodChange: 10,
      stressChange: -15,
      statChanges: { fitness: 2 },
      canInviteNPC: true,
      romanticPotential: false,
    },
    {
      id: 'sit_bench',
      name: 'Sit on a Bench',
      description: 'Relax and enjoy the scenery',
      duration: 30,
      energyCost: -10,
      moneyCost: 0,
      moodChange: 10,
      stressChange: -15,
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'picnic',
      name: 'Have a Picnic',
      description: 'Enjoy food outdoors',
      duration: 90,
      energyCost: 5,
      moneyCost: 20,
      moodChange: 25,
      stressChange: -25,
      requiresItem: 'picnic_basket',
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'feed_ducks',
      name: 'Feed the Ducks',
      description: 'A simple pleasure by the lake',
      duration: 20,
      energyCost: 0,
      moneyCost: 2,
      moodChange: 10,
      stressChange: -10,
      canInviteNPC: true,
      romanticPotential: true,
    },
  ],

  interactionPoints: [
    { id: 'main_path', name: 'Main Walking Path', description: 'The central path through the park', privateLevel: 10 },
    { id: 'lake_bench', name: 'Lake Benches', description: 'Benches overlooking the small lake', privateLevel: 40 },
    { id: 'hidden_garden', name: 'Hidden Garden', description: 'A secluded flower garden', privateLevel: 80 },
    { id: 'basketball_court', name: 'Basketball Court', description: 'Outdoor courts where locals play', privateLevel: 5 },
  ],

  discoveryZones: [
    {
      id: 'secret_gazebo',
      name: 'Hidden Gazebo',
      description: 'A romantic gazebo hidden behind willow trees',
      discovered: false,
      requirements: { type: 'random', chance: 0.1 },
      unlocksContent: ['romantic_spot'],
    },
  ],

  regularNPCs: ['marcus_johnson'],
  staffNPCs: [],

  connectedLocations: [
    { locationId: 'home', travelTime: 10 },
    { locationId: 'downtown_cafe', travelTime: 5 },
    { locationId: 'farmers_market', travelTime: 10 },
  ],
});

export const createTheCornerBar = (): Location => ({
  id: 'the_corner_bar',
  name: 'The Corner Bar',
  type: 'bar',
  description: 'A neighborhood bar owned by Marcus. It has character, good drinks, and regular live music nights. The kind of place where everybody knows your name.',

  unlocked: true,
  unlockRequirements: [],

  openHours: { open: 17, close: 2 },
  closedDays: ['sunday'],

  noiseLevel: 'loud',
  crowdLevel: 'moderate',
  ambiance: 'Warm lighting, exposed brick, and the clink of glasses. A mix of regulars and newcomers create a lively but welcoming atmosphere. Music from the jukebox fills any silence.',

  dressCode: 'casual',
  minFormalityLevel: 1,

  availableActivities: [
    {
      id: 'order_drink',
      name: 'Order a Drink',
      description: 'Get something from the bar',
      duration: 15,
      energyCost: 0,
      moneyCost: 10,
      moodChange: 10,
      stressChange: -10,
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'sit_at_bar',
      name: 'Sit at the Bar',
      description: 'Chat with Marcus while he works',
      duration: 60,
      energyCost: 5,
      moneyCost: 15,
      moodChange: 15,
      stressChange: -15,
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'play_pool',
      name: 'Play Pool',
      description: 'Challenge someone to a game',
      duration: 45,
      energyCost: 10,
      moneyCost: 5,
      moodChange: 15,
      stressChange: -10,
      canInviteNPC: true,
      romanticPotential: false,
    },
    {
      id: 'play_darts',
      name: 'Play Darts',
      description: 'Test your aim',
      duration: 30,
      energyCost: 5,
      moneyCost: 0,
      moodChange: 10,
      stressChange: -10,
      canInviteNPC: true,
      romanticPotential: false,
    },
    {
      id: 'watch_live_music',
      name: 'Watch Live Music',
      description: 'Enjoy the local talent',
      duration: 90,
      energyCost: 10,
      moneyCost: 20,
      moodChange: 25,
      stressChange: -20,
      canInviteNPC: true,
      romanticPotential: true,
    },
  ],

  interactionPoints: [
    { id: 'bar_counter', name: 'Bar Counter', description: 'Where Marcus mixes drinks', privateLevel: 20 },
    { id: 'booth', name: 'Back Booth', description: 'A semi-private booth', privateLevel: 60 },
    { id: 'pool_table', name: 'Pool Table', description: 'The main pool table', privateLevel: 15 },
    { id: 'stage', name: 'Small Stage', description: 'Where live music happens', privateLevel: 5 },
  ],

  discoveryZones: [
    {
      id: 'vip_lounge',
      name: 'VIP Lounge',
      description: 'A private back room for VIP guests',
      discovered: false,
      requirements: { type: 'relationship', target: 'marcus_johnson', value: 60 },
      unlocksContent: ['vip_access'],
    },
  ],

  regularNPCs: ['marcus_johnson', 'emma_davis'],
  staffNPCs: ['marcus_johnson'],

  connectedLocations: [
    { locationId: 'home', travelTime: 20 },
    { locationId: 'downtown_cafe', travelTime: 10 },
    { locationId: 'upscale_restaurant', travelTime: 15 },
  ],
});

export const createGroceryStore = (): Location => ({
  id: 'grocery_store',
  name: 'Fresh Market',
  type: 'shop',
  description: 'A well-stocked grocery store with fresh produce and everyday essentials.',

  unlocked: true,
  unlockRequirements: [],

  openHours: { open: 7, close: 22 },
  closedDays: [],

  noiseLevel: 'moderate',
  crowdLevel: 'moderate',
  ambiance: 'Fluorescent lights, the beeping of registers, and muzak playing overhead. The produce section smells of fresh fruits and vegetables.',

  availableActivities: [
    {
      id: 'buy_groceries',
      name: 'Buy Groceries',
      description: 'Stock up on food and essentials',
      duration: 30,
      energyCost: 10,
      moneyCost: 50,
      moodChange: 0,
      stressChange: 5,
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'buy_flowers',
      name: 'Buy Flowers',
      description: 'Pick up a bouquet',
      duration: 10,
      energyCost: 0,
      moneyCost: 15,
      moodChange: 5,
      stressChange: 0,
      canInviteNPC: false,
      romanticPotential: false,
    },
    {
      id: 'buy_wine',
      name: 'Buy Wine',
      description: 'Select a bottle of wine',
      duration: 10,
      energyCost: 0,
      moneyCost: 20,
      moodChange: 0,
      stressChange: 0,
      canInviteNPC: false,
      romanticPotential: false,
    },
  ],

  interactionPoints: [
    { id: 'produce', name: 'Produce Section', description: 'Fresh fruits and vegetables', privateLevel: 5 },
    { id: 'checkout', name: 'Checkout', description: 'The register lines', privateLevel: 5 },
  ],

  discoveryZones: [],

  regularNPCs: [],
  staffNPCs: [],

  connectedLocations: [
    { locationId: 'home', travelTime: 10 },
    { locationId: 'downtown_cafe', travelTime: 12 },
  ],
});

export const createUpscaleRestaurant = (): Location => ({
  id: 'upscale_restaurant',
  name: 'La Bella Notte',
  type: 'restaurant',
  description: 'An elegant Italian restaurant known for its romantic atmosphere and exquisite cuisine. Reservations recommended.',

  unlocked: false,
  unlockRequirements: [
    { type: 'money', target: 'balance', value: 500, met: false },
    { type: 'clothing', target: 'formalityLevel', value: 3, met: false },
  ],

  openHours: { open: 17, close: 23 },
  closedDays: ['monday'],

  noiseLevel: 'quiet',
  crowdLevel: 'sparse',
  ambiance: 'Candlelit tables, soft Italian music, and the subtle clink of fine china. White tablecloths and fresh flowers on every table create an atmosphere of refined elegance.',

  dressCode: 'formal',
  minFormalityLevel: 3,
  admissionCost: 0,

  availableActivities: [
    {
      id: 'romantic_dinner',
      name: 'Romantic Dinner',
      description: 'Enjoy a fine dining experience',
      duration: 120,
      energyCost: 10,
      moneyCost: 150,
      moodChange: 30,
      stressChange: -20,
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'wine_tasting',
      name: 'Wine Tasting',
      description: 'Sample the restaurant\'s wine selection',
      duration: 60,
      energyCost: 5,
      moneyCost: 50,
      moodChange: 15,
      stressChange: -10,
      canInviteNPC: true,
      romanticPotential: true,
    },
  ],

  interactionPoints: [
    { id: 'private_table', name: 'Private Table', description: 'A secluded corner table', privateLevel: 80 },
    { id: 'bar_area', name: 'Bar Area', description: 'The elegant bar for pre-dinner drinks', privateLevel: 40 },
  ],

  discoveryZones: [],

  regularNPCs: [],
  staffNPCs: [],

  connectedLocations: [
    { locationId: 'the_corner_bar', travelTime: 15 },
    { locationId: 'home', travelTime: 25 },
  ],
});

export const createBookstore = (): Location => ({
  id: 'bookstore',
  name: 'Page Turner Books',
  type: 'shop',
  description: 'A cozy independent bookstore with creaky wooden floors and ceiling-high shelves. The smell of old paper and coffee fills the air.',

  unlocked: true,
  unlockRequirements: [],

  openHours: { open: 9, close: 21 },
  closedDays: [],

  noiseLevel: 'quiet',
  crowdLevel: 'sparse',
  ambiance: 'Quiet and contemplative. The rustle of pages, hushed conversations, and occasional recommendations from the owner create a haven for book lovers.',

  availableActivities: [
    {
      id: 'browse_books',
      name: 'Browse Books',
      description: 'Explore the shelves',
      duration: 45,
      energyCost: 5,
      moneyCost: 0,
      moodChange: 15,
      stressChange: -15,
      statChanges: { intelligence: 1 },
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'buy_book',
      name: 'Buy a Book',
      description: 'Purchase something to read',
      duration: 15,
      energyCost: 0,
      moneyCost: 20,
      moodChange: 10,
      stressChange: 0,
      canInviteNPC: true,
      romanticPotential: false,
    },
    {
      id: 'reading_nook',
      name: 'Read in the Nook',
      description: 'Settle into the cozy reading corner',
      duration: 60,
      energyCost: 5,
      moneyCost: 0,
      moodChange: 20,
      stressChange: -20,
      statChanges: { intelligence: 2 },
      canInviteNPC: true,
      romanticPotential: true,
    },
  ],

  interactionPoints: [
    { id: 'reading_nook', name: 'Reading Nook', description: 'A cozy corner with armchairs', privateLevel: 60 },
    { id: 'poetry_section', name: 'Poetry Section', description: 'Where Emma often browses', privateLevel: 40 },
    { id: 'front_desk', name: 'Front Desk', description: 'The checkout counter', privateLevel: 10 },
  ],

  discoveryZones: [
    {
      id: 'rare_books',
      name: 'Rare Books Section',
      description: 'A locked case with valuable first editions',
      discovered: false,
      requirements: { type: 'relationship', target: 'emma_davis', value: 50 },
      unlocksContent: ['rare_gift_options'],
    },
  ],

  regularNPCs: ['emma_davis'],
  staffNPCs: [],

  connectedLocations: [
    { locationId: 'downtown_cafe', travelTime: 8 },
    { locationId: 'city_park', travelTime: 10 },
  ],
});

export const createYogaStudio = (): Location => ({
  id: 'yoga_studio',
  name: 'Serenity Yoga',
  type: 'gym',
  description: 'A peaceful yoga studio with bamboo floors, large mirrors, and a calming aesthetic.',

  unlocked: false,
  unlockRequirements: [
    { type: 'membership', target: 'yoga_membership', value: true, met: false },
  ],

  openHours: { open: 6, close: 21 },
  closedDays: [],

  noiseLevel: 'quiet',
  crowdLevel: 'moderate',
  ambiance: 'Incense burning, soft instrumental music, and the quiet breathing of focused practitioners. Natural light floods through skylights.',

  membershipRequired: true,

  availableActivities: [
    {
      id: 'yoga_class',
      name: 'Attend Yoga Class',
      description: 'Join a group yoga session',
      duration: 60,
      energyCost: 15,
      moneyCost: 0,
      moodChange: 25,
      stressChange: -30,
      statChanges: { fitness: 1 },
      canInviteNPC: true,
      romanticPotential: false,
    },
  ],

  interactionPoints: [
    { id: 'studio_floor', name: 'Main Studio', description: 'Where classes are held', privateLevel: 10 },
    { id: 'lobby', name: 'Lobby', description: 'Social area before/after class', privateLevel: 30 },
  ],

  discoveryZones: [],

  regularNPCs: ['sarah_martinez'],
  staffNPCs: [],

  connectedLocations: [
    { locationId: 'home', travelTime: 15 },
    { locationId: 'downtown_cafe', travelTime: 10 },
  ],
});

export const createFarmersMarket = (): Location => ({
  id: 'farmers_market',
  name: 'Saturday Farmers Market',
  type: 'shop',
  description: 'A vibrant outdoor market with local produce, artisan goods, and food vendors. Only open on weekends.',

  unlocked: true,
  unlockRequirements: [],

  openHours: { open: 8, close: 14 },
  closedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],

  noiseLevel: 'moderate',
  crowdLevel: 'crowded',
  ambiance: 'The buzz of vendors calling out, the smell of fresh bread and flowers, and the energy of weekend shoppers creates a lively community atmosphere.',

  availableActivities: [
    {
      id: 'browse_vendors',
      name: 'Browse the Stalls',
      description: 'Explore what vendors have to offer',
      duration: 45,
      energyCost: 10,
      moneyCost: 0,
      moodChange: 15,
      stressChange: -10,
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'buy_flowers',
      name: 'Buy Fresh Flowers',
      description: 'Get a beautiful bouquet',
      duration: 15,
      energyCost: 0,
      moneyCost: 20,
      moodChange: 10,
      stressChange: 0,
      canInviteNPC: true,
      romanticPotential: true,
    },
    {
      id: 'buy_produce',
      name: 'Buy Fresh Produce',
      description: 'Stock up on fruits and vegetables',
      duration: 30,
      energyCost: 5,
      moneyCost: 30,
      moodChange: 10,
      stressChange: 0,
      canInviteNPC: true,
      romanticPotential: false,
    },
    {
      id: 'try_samples',
      name: 'Try Food Samples',
      description: 'Taste your way through the market',
      duration: 30,
      energyCost: 5,
      moneyCost: 0,
      moodChange: 15,
      stressChange: -10,
      canInviteNPC: true,
      romanticPotential: true,
    },
  ],

  interactionPoints: [
    { id: 'flower_stall', name: 'Flower Stall', description: 'Beautiful bouquets and potted plants', privateLevel: 20 },
    { id: 'food_court', name: 'Food Court', description: 'Picnic tables between food vendors', privateLevel: 30 },
  ],

  discoveryZones: [
    {
      id: 'artisan_sunflowers',
      name: 'Sunflower Vendor',
      description: 'A vendor specializing in Sarah\'s favorite flowers',
      discovered: false,
      requirements: { type: 'random', chance: 0.3 },
      unlocksContent: ['perfect_gift_sarah'],
    },
  ],

  regularNPCs: ['sarah_martinez', 'emma_davis'],
  staffNPCs: [],

  connectedLocations: [
    { locationId: 'city_park', travelTime: 10 },
    { locationId: 'downtown_cafe', travelTime: 12 },
  ],
});

// Factory function to get all starter locations
export const getStarterLocations = (): Location[] => [
  createHomeLocation(),
  createDowntownCafe(),
  createCityPark(),
  createTheCornerBar(),
  createGroceryStore(),
  createUpscaleRestaurant(),
  createBookstore(),
  createYogaStudio(),
  createFarmersMarket(),
];
