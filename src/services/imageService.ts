import OpenAI from 'openai';

// DALL-E client for image generation
const getDalleClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set. Image generation will use placeholders.');
    return null;
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
};

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
  const client = getDalleClient();
  if (!client) return null;

  const prompt = `A beautiful illustrated top-down city map of ${params.cityName}, a ${params.size} ${params.cityStyle} city with ${params.climate} climate. The map shows various districts, streets, parks, and landmarks in a stylized illustrated map style like a video game world map. Colorful, detailed, no text or labels.`;

  try {
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data?.[0]?.url || null;
  } catch (error) {
    console.error('Error generating city map:', error);
    return null;
  }
}

// Generate a location background image
export async function generateLocationImage(params: LocationImageParams): Promise<string | null> {
  const client = getDalleClient();
  if (!client) return null;

  const timeDescriptions: Record<string, string> = {
    morning: 'soft morning light, sunrise colors',
    afternoon: 'bright daylight, clear skies',
    evening: 'golden hour, warm sunset lighting',
    night: 'nighttime, city lights, moonlight',
  };

  const prompt = `Interior/exterior view of a ${params.locationType} called "${params.locationName}" in a ${params.cityStyle} city. ${timeDescriptions[params.timeOfDay]}, ${params.weather} weather. Atmospheric, detailed, cozy environment, perfect for a life simulation game. No people, no text.`;

  try {
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
    });

    return response.data?.[0]?.url || null;
  } catch (error) {
    console.error('Error generating location image:', error);
    return null;
  }
}

// Generate a character portrait
export async function generateCharacterPortrait(params: CharacterPortraitParams): Promise<string | null> {
  const client = getDalleClient();
  if (!client) return null;

  const styleDescriptions: Record<string, string> = {
    anime: 'anime art style, soft shading, expressive eyes',
    realistic: 'realistic digital portrait, detailed features',
    cartoon: 'stylized cartoon portrait, vibrant colors',
    painterly: 'oil painting style portrait, artistic brushstrokes',
  };

  const prompt = `Portrait of a ${params.age} year old ${params.gender} with ${params.hairColor} ${params.hairStyle} hair, ${params.eyeColor} eyes, ${params.skinTone} skin. ${params.expression || 'neutral expression'}. ${styleDescriptions[params.style] || styleDescriptions.anime}. Shoulders up, facing slightly to the side, soft background. High quality character portrait for a romance simulation game.`;

  try {
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data?.[0]?.url || null;
  } catch (error) {
    console.error('Error generating character portrait:', error);
    return null;
  }
}

// Generate multiple location thumbnails for the map
export async function generateLocationThumbnail(
  locationName: string,
  locationType: string
): Promise<string | null> {
  const client = getDalleClient();
  if (!client) return null;

  const prompt = `Small icon/thumbnail of a ${locationType} (${locationName}). Simple, clear, iconic representation suitable for a map marker. Stylized, colorful, no text.`;

  try {
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data?.[0]?.url || null;
  } catch (error) {
    console.error('Error generating location thumbnail:', error);
    return null;
  }
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

export default {
  generateCityMap,
  generateLocationImage,
  generateCharacterPortrait,
  generateLocationThumbnail,
  getPlaceholderGradient,
};
