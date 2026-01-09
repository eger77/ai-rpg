// Image generation removed (simplified build).

export interface MapGenerationParams {
  cityName: string;
  cityStyle: string; // modern, medieval, futuristic, etc.
  climate: string; // tropical, temperate, arctic, etc.
  size: 'small' | 'medium' | 'large';
}

export interface LocationImageParams {
  locationName: string;
  locationType: string;
  cityStyle: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather: string;
}

export interface CharacterPortraitParams {
  gender: string;
  age: number;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  skinTone: string;
  style: string; // anime, realistic, cartoon
  expression?: string;
}

// Generate a city map overview
export async function generateCityMap(params: MapGenerationParams): Promise<string | null> {
  void params;
  return null;
}

// Generate a location background image
export async function generateLocationImage(params: LocationImageParams): Promise<string | null> {
  void params;
  return null;
}

// Generate a character portrait
export async function generateCharacterPortrait(params: CharacterPortraitParams): Promise<string | null> {
  void params;
  return null;
}

// Generate multiple location thumbnails for the map
export async function generateLocationThumbnail(
  locationName: string,
  locationType: string
): Promise<string | null> {
  void locationName;
  void locationType;
  return null;
}

// Placeholder gradient generator when API is not available
export function getPlaceholderGradient(seed: string): string {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-yellow-500 to-orange-500',
    'from-teal-500 to-blue-500',
  ];

  // Simple hash function to get consistent gradient for same seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }

  return gradients[Math.abs(hash) % gradients.length];
}

const imageService = {
  generateCityMap,
  generateLocationImage,
  generateCharacterPortrait,
  generateLocationThumbnail,
  getPlaceholderGradient,
};

export default imageService;
