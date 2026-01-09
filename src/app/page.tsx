'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { CharacterCreation } from '@/components/game/CharacterCreation';
import { GameDashboard } from '@/components/game/GameDashboard';
import { PhoneUI } from '@/components/phone/PhoneUI';
import { NPCProfile } from '@/components/npc/NPCProfile';
import { LocationView } from '@/components/location/LocationView';
import { MapUI } from '@/components/location/MapUI';
import { InventoryUI } from '@/components/inventory/InventoryUI';
import { WardrobeUI } from '@/components/inventory/WardrobeUI';
import { FinanceUI } from '@/components/finance/FinanceUI';
import { ChatUI } from '@/components/dialogue/ChatUI';
import { QuestsUI } from '@/components/game/QuestsUI';
import type { NPC, Location } from '@/types';
import { Sparkles, Heart } from 'lucide-react';
import { getStarterLocations } from '@/data/locations';
import { generateInitialNPCs } from '@/systems/npcGenerator';

type GameScreen = 'loading' | 'title' | 'character_creation' | 'game';

export default function Home() {
  const { initialized, player, advanceTime, moveToLocation, locations, npcs, addLocation, addNPC, paused, gameSpeed } = useGameStore();
  const [screen, setScreen] = useState<GameScreen>('loading');
  const tickAccumulatorRef = useRef(0);

  // UI State
  const [showPhone, setShowPhone] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showFinances, setShowFinances] = useState(false);
  const [showQuests, setShowQuests] = useState(false);

  // NPC/Location viewing
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [chattingNPC, setChattingNPC] = useState<NPC | null>(null);

  // Initialize screen based on game state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialized && player) {
        setScreen('game');
      } else {
        setScreen('title');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [initialized, player]);

  // Ensure locations and NPCs exist when game loads
  useEffect(() => {
    if (initialized && player && locations.size === 0) {
      console.log('No locations found, adding starter locations...');
      const starterLocations = getStarterLocations();
      starterLocations.forEach((location) => addLocation(location));
    }
    if (initialized && player && npcs.size === 0) {
      console.log('No NPCs found, generating initial NPCs...');
      const initialNPCs = generateInitialNPCs(5);
      initialNPCs.forEach((npc) => addNPC(npc));
    }
  }, [initialized, player, locations.size, npcs.size, addLocation, addNPC]);

  // Game time tick (advance time periodically)
  useEffect(() => {
    if (screen !== 'game' || !initialized || paused) return;

    const interval = setInterval(() => {
      // Advance game time based on gameSpeed while keeping gameTime as integer minutes.
      tickAccumulatorRef.current += gameSpeed;
      const wholeMinutes = Math.floor(tickAccumulatorRef.current);
      if (wholeMinutes >= 1) {
        tickAccumulatorRef.current -= wholeMinutes;
        advanceTime(wholeMinutes);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [screen, initialized, advanceTime, paused, gameSpeed]);

  // Loading Screen
  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Title Screen
  if (screen === 'title') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-12 h-12 text-pink-500" />
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 text-transparent bg-clip-text">
              Life Simulator
            </span>
          </h1>
          <p className="text-gray-400 mb-8 max-w-md">
            Build relationships, pursue your dreams, and live your story in this immersive life simulation RPG.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setScreen('character_creation')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
            >
              New Game
            </button>
            {initialized && player && (
              <button
                onClick={() => setScreen('game')}
                className="block w-full px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
              >
                Continue as {player.name}
              </button>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-8">
            A roleplay experience with dynamic characters, meaningful choices, and emergent stories.
          </p>
        </div>
      </div>
    );
  }

  // Character Creation
  if (screen === 'character_creation') {
    return (
      <CharacterCreation
        onComplete={() => setScreen('game')}
      />
    );
  }

  // Main Game
  if (screen === 'game' && player) {
    const handleViewNPC = (npc: NPC) => {
      setSelectedNPC(npc);
    };

    const handleCloseNPCProfile = () => {
      setSelectedNPC(null);
    };

    const handleStartChat = () => {
      if (selectedNPC) {
        setChattingNPC(selectedNPC);
        setSelectedNPC(null);
      }
    };

    const handleViewLocation = (location: Location) => {
      setSelectedLocation(location);
      setShowMap(false);
    };

    const handleTravelTo = (location: Location) => {
      // Calculate travel time from current location
      const currentLoc = useGameStore.getState().locations.get(player.currentLocationId);
      const connection = currentLoc?.connectedLocations.find(c => c.locationId === location.id);
      let travelTime = connection?.travelTime || 15;

      // Weather can slow travel a bit (simple seasonal effect)
      const weather = useGameStore.getState().gameTime.weather;
      if (weather === 'snowy') travelTime += 5;
      if (weather === 'stormy') travelTime += 3;

      // Advance time and move
      advanceTime(travelTime);
      moveToLocation(location.id);

      // Close modals
      setSelectedLocation(null);
      setShowMap(false);
    };

    return (
      <>
        <GameDashboard
          onOpenPhone={() => setShowPhone(true)}
          onOpenMap={() => setShowMap(true)}
          onOpenInventory={() => setShowInventory(true)}
          onOpenWardrobe={() => setShowWardrobe(true)}
          onOpenFinances={() => setShowFinances(true)}
          onOpenQuests={() => setShowQuests(true)}
          onViewNPC={handleViewNPC}
          onViewLocation={handleViewLocation}
        />

        {/* Phone UI */}
        <PhoneUI
          isOpen={showPhone}
          onClose={() => setShowPhone(false)}
        />

        {/* Map UI */}
        <MapUI
          isOpen={showMap}
          onClose={() => setShowMap(false)}
          onSelectLocation={handleViewLocation}
          onTravelTo={handleTravelTo}
        />

        {/* Inventory UI */}
        <InventoryUI
          isOpen={showInventory}
          onClose={() => setShowInventory(false)}
        />

        {/* Wardrobe UI */}
        <WardrobeUI
          isOpen={showWardrobe}
          onClose={() => setShowWardrobe(false)}
        />

        {/* Finance UI */}
        <FinanceUI
          isOpen={showFinances}
          onClose={() => setShowFinances(false)}
        />

        {/* Quests UI */}
        <QuestsUI
          isOpen={showQuests}
          onClose={() => setShowQuests(false)}
        />

        {/* NPC Profile */}
        {selectedNPC && (
          <NPCProfile
            npc={selectedNPC}
            isOpen={true}
            onClose={handleCloseNPCProfile}
            onStartChat={handleStartChat}
          />
        )}

        {/* Location View */}
        {selectedLocation && (
          <LocationView
            location={selectedLocation}
            isOpen={true}
            onClose={() => setSelectedLocation(null)}
            onTravelTo={() => handleTravelTo(selectedLocation)}
            onViewNPC={handleViewNPC}
          />
        )}

        {/* Chat UI */}
        {chattingNPC && (
          <ChatUI
            npc={chattingNPC}
            isOpen={true}
            onClose={() => setChattingNPC(null)}
          />
        )}
      </>
    );
  }

  // Fallback
  return null;
}
