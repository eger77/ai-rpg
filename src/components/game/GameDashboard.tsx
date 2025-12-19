'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { NarrativeWindow } from './NarrativeWindow';
import type { NPC, Location } from '@/types';
import {
  User,
  MapPin,
  Clock,
  Zap,
  Heart,
  Brain,
  Droplets,
  Smile,
  DollarSign,
  Briefcase,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Users,
  MessageSquare,
  Calendar,
  ChevronRight,
  Menu,
  Smartphone,
  ShoppingBag,
  Shirt,
  Target,
  Star,
  Play,
  Pause,
  FastForward,
  Settings,
  RotateCcw,
  X,
} from 'lucide-react';

interface GameDashboardProps {
  onOpenPhone: () => void;
  onOpenMap: () => void;
  onOpenInventory: () => void;
  onOpenWardrobe: () => void;
  onOpenFinances: () => void;
  onOpenQuests: () => void;
  onViewNPC: (npc: NPC) => void;
  onViewLocation: (location: Location) => void;
}

const WEATHER_ICONS = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudRain,
  snowy: Snowflake,
  foggy: Cloud,
};

export function GameDashboard({
  onOpenPhone,
  onOpenMap,
  onOpenInventory,
  onOpenWardrobe,
  onOpenFinances,
  onOpenQuests,
  onViewNPC,
  onViewLocation,
}: GameDashboardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const {
    player,
    gameTime,
    phone,
    npcs,
    locations,
    quests,
    paused,
    gameSpeed,
    pauseGame,
    resumeGame,
    setGameSpeed,
    advanceTime,
    getNPCsAtLocation,
    resetGame,
  } = useGameStore();

  if (!player) return null;

  const currentLocation = locations.get(player.currentLocationId);
  const npcsHere = getNPCsAtLocation(player.currentLocationId);
  const unreadMessages = phone?.conversations.reduce((sum, c) => sum + c.unreadCount, 0) || 0;
  const activeQuests = Array.from(quests.values()).filter((q) => q.status === 'active');

  const formatTime = () => {
    const hour = gameTime.hour % 12 || 12;
    const ampm = gameTime.hour >= 12 ? 'PM' : 'AM';
    return `${hour}:${gameTime.minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const getTimeOfDay = () => {
    if (gameTime.hour >= 5 && gameTime.hour < 12) return 'Morning';
    if (gameTime.hour >= 12 && gameTime.hour < 17) return 'Afternoon';
    if (gameTime.hour >= 17 && gameTime.hour < 21) return 'Evening';
    return 'Night';
  };

  const WeatherIcon = WEATHER_ICONS[gameTime.weather];

  const StatBar = ({ value, color, label, icon: Icon }: { value: number; color: string; label: string; icon: React.ElementType }) => (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{label}</span>
          <span className="text-white">{Math.round(value)}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              color.includes('green')
                ? 'bg-green-500'
                : color.includes('yellow')
                ? 'bg-yellow-500'
                : color.includes('blue')
                ? 'bg-blue-500'
                : color.includes('pink')
                ? 'bg-pink-500'
                : color.includes('red')
                ? 'bg-red-500'
                : 'bg-purple-500'
            }`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Bar */}
      <div className="bg-gray-800/80 backdrop-blur border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Time & Weather */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-white font-bold">{formatTime()}</p>
                <p className="text-xs text-gray-400">
                  {gameTime.dayOfWeek.charAt(0).toUpperCase() + gameTime.dayOfWeek.slice(1)}, Day {gameTime.day}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <WeatherIcon className="w-5 h-5" />
              <span className="text-sm capitalize">{gameTime.weather}</span>
            </div>
            <div className="text-sm text-gray-400">{getTimeOfDay()}</div>
          </div>

          {/* Game Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => (paused ? resumeGame() : pauseGame())}
              className={`p-2 rounded-lg ${paused ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {paused ? <Play className="w-4 h-4 text-white" /> : <Pause className="w-4 h-4 text-white" />}
            </button>
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              {[0.5, 1, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setGameSpeed(speed)}
                  className={`px-2 py-1 text-xs rounded ${
                    gameSpeed === speed ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
            <button
              onClick={() => advanceTime(30)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              title="Skip 30 minutes"
            >
              <FastForward className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              title="Menu"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-400">
              <DollarSign className="w-5 h-5" />
              <span className="font-bold">${player.finances.balance.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1" title="Energy">
                <Zap className={`w-4 h-4 ${player.energy > 30 ? 'text-yellow-400' : 'text-red-400'}`} />
                <span className="text-sm text-white">{Math.round(player.energy)}%</span>
              </div>
              <div className="flex items-center gap-1" title="Mood">
                <Smile className={`w-4 h-4 ${player.mood > 50 ? 'text-pink-400' : 'text-gray-400'}`} />
                <span className="text-sm text-white">{Math.round(player.mood)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-gray-800/50 border-r border-gray-700 flex flex-col">
          {/* Player Card */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                {player.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{player.name}</h2>
                <p className="text-sm text-gray-400">{player.career.position}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <StatBar value={player.energy} color="text-yellow-400" label="Energy" icon={Zap} />
              <StatBar value={player.mood} color="text-pink-400" label="Mood" icon={Smile} />
              <StatBar value={player.hygiene} color="text-blue-400" label="Hygiene" icon={Droplets} />
              <StatBar value={100 - player.stress} color="text-green-400" label="Calm" icon={Brain} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-700">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onOpenPhone}
                className="relative flex flex-col items-center gap-1 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
              >
                <Smartphone className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-300">Phone</span>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </button>
              <button
                onClick={onOpenMap}
                className="flex flex-col items-center gap-1 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
              >
                <MapPin className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-300">Map</span>
              </button>
              <button
                onClick={onOpenInventory}
                className="flex flex-col items-center gap-1 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-orange-400" />
                <span className="text-xs text-gray-300">Items</span>
              </button>
              <button
                onClick={onOpenWardrobe}
                className="flex flex-col items-center gap-1 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
              >
                <Shirt className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-gray-300">Outfit</span>
              </button>
              <button
                onClick={onOpenFinances}
                className="flex flex-col items-center gap-1 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
              >
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-300">Money</span>
              </button>
              <button
                onClick={onOpenQuests}
                className="flex flex-col items-center gap-1 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
              >
                <Target className="w-5 h-5 text-red-400" />
                <span className="text-xs text-gray-300">Quests</span>
              </button>
            </div>
          </div>

          {/* Active Quests */}
          {activeQuests.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Active Objectives
              </h3>
              <div className="space-y-2">
                {activeQuests.slice(0, 3).map((quest) => (
                  <div key={quest.id} className="p-2 bg-gray-700/30 rounded-lg">
                    <p className="text-sm text-white font-medium">{quest.title}</p>
                    <div className="mt-1">
                      {quest.objectives.filter((o) => !o.completed).slice(0, 2).map((obj) => (
                        <p key={obj.id} className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-500 rounded-full" />
                          {obj.description}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Known NPCs */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              People You Know
            </h3>
            <div className="space-y-2">
              {Array.from(npcs.values())
                .filter((npc) => npc.relationship.friendship > 0 || npc.relationship.totalInteractions > 0)
                .sort((a, b) => b.relationship.romance + b.relationship.friendship - (a.relationship.romance + a.relationship.friendship))
                .slice(0, 8)
                .map((npc) => (
                  <button
                    key={npc.id}
                    onClick={() => onViewNPC(npc)}
                    className="w-full flex items-center gap-3 p-2 bg-gray-700/30 hover:bg-gray-600/30 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {npc.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm text-white font-medium">{npc.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-400" />
                          <span className="text-xs text-gray-400">{npc.relationship.romance}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-gray-400">{npc.relationship.friendship}%</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Main Area - Narrative Window */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <NarrativeWindow onViewNPC={onViewNPC} onOpenMap={onOpenMap} />
        </div>
      </div>

      {/* Game Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Game Menu</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium text-left flex items-center gap-3 transition-colors"
              >
                <Play className="w-5 h-5" />
                Resume Game
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowRestartConfirm(true);
                }}
                className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 rounded-xl text-red-400 font-medium text-left flex items-center gap-3 transition-colors border border-red-600/30"
              >
                <RotateCcw className="w-5 h-5" />
                Restart Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restart Confirmation Dialog */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700 mx-4">
            <h3 className="text-xl font-bold text-white mb-2">Restart Game?</h3>
            <p className="text-gray-300 mb-4">
              This will permanently delete your current game as <strong>{player.name}</strong>.
              All progress, relationships, and stats will be lost.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetGame();
                  window.location.reload();
                }}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors"
              >
                Delete & Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
