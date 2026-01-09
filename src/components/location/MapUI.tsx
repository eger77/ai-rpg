'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { Location } from '@/types';
import {
  X,
  MapPin,
  Clock,
  Lock,
  Unlock,
  Users,
  Home,
  Coffee,
  TreePine,
  Wine,
  ShoppingBag,
  Utensils,
  BookOpen,
  Dumbbell,
  Building,
  Search,
} from 'lucide-react';

interface MapUIProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
  onTravelTo: (location: Location) => void;
}

const LOCATION_ICONS: Record<string, React.ElementType> = {
  home: Home,
  cafe: Coffee,
  park: TreePine,
  bar: Wine,
  shop: ShoppingBag,
  restaurant: Utensils,
  library: BookOpen,
  gym: Dumbbell,
  office: Building,
  club: Wine,
  gallery: Building,
  theater: Building,
  apartment: Home,
  hotel: Building,
  venue: Building,
  beach: TreePine,
};

const LOCATION_COLORS: Record<string, string> = {
  home: 'from-blue-500 to-blue-600',
  cafe: 'from-amber-500 to-orange-600',
  park: 'from-green-500 to-emerald-600',
  bar: 'from-purple-500 to-violet-600',
  shop: 'from-pink-500 to-rose-600',
  restaurant: 'from-red-500 to-rose-600',
  library: 'from-indigo-500 to-blue-600',
  gym: 'from-orange-500 to-red-600',
  office: 'from-gray-500 to-slate-600',
  club: 'from-violet-500 to-purple-600',
  gallery: 'from-teal-500 to-cyan-600',
  theater: 'from-rose-500 to-pink-600',
  apartment: 'from-blue-500 to-indigo-600',
  hotel: 'from-yellow-500 to-amber-600',
  venue: 'from-cyan-500 to-blue-600',
  beach: 'from-sky-500 to-blue-600',
};

export function MapUI({ isOpen, onClose, onSelectLocation, onTravelTo }: MapUIProps) {
  const { player, locations, gameTime, getNPCsAtLocation, worldSettings } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | 'all'>('all');

  if (!isOpen || !player) return null;

  const allLocations = Array.from(locations.values());

  const filteredLocations = allLocations.filter((loc) => {
    const matchesSearch =
      searchQuery === '' ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || loc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const unlockedLocations = filteredLocations.filter(
    (loc) => loc.unlocked || player.unlockedLocations.includes(loc.id)
  );
  const lockedLocations = filteredLocations.filter(
    (loc) => !loc.unlocked && !player.unlockedLocations.includes(loc.id)
  );

  const locationTypes = [...new Set(allLocations.map((l) => l.type))];

  const isLocationOpen = (location: Location) => {
    if (location.openHours === 'always') return true;
    if (location.closedDays.includes(gameTime.dayOfWeek)) return false;
    return gameTime.hour >= location.openHours.open && gameTime.hour < location.openHours.close;
  };

  const formatHours = (location: Location) => {
    if (location.openHours === 'always') return 'Always Open';
    return `${location.openHours.open}:00 - ${location.openHours.close}:00`;
  };

  const currentLocation = locations.get(player.currentLocationId);

  const getTravelTime = (targetLocation: Location): number | null => {
    if (!currentLocation) return null;
    const connection = currentLocation.connectedLocations.find(
      (c) => c.locationId === targetLocation.id
    );
    return connection?.travelTime || null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {worldSettings?.cityName || 'City'} Map
              </h2>
              {worldSettings?.cityStyle && (
                <p className="text-xs text-blue-100 capitalize">{worldSettings.cityStyle} city</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Current Location Banner */}
        {currentLocation && (
          <div className="px-6 py-3 bg-blue-900/30 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Location</p>
                <p className="text-white font-medium">{currentLocation.name}</p>
              </div>
            </div>
            <button
              onClick={() => onSelectLocation(currentLocation)}
              className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 rounded-lg text-blue-300 text-sm transition-colors"
            >
              View Details
            </button>
          </div>
        )}

        {/* Search & Filter */}
        <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {locationTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Unlocked Locations */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-green-400" />
              Available Locations ({unlockedLocations.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlockedLocations.map((location) => {
                const Icon = LOCATION_ICONS[location.type] || Building;
                const colorClass = LOCATION_COLORS[location.type] || 'from-gray-500 to-gray-600';
                const open = isLocationOpen(location);
                const npcsHere = getNPCsAtLocation(location.id);
                const isCurrentLocation = player.currentLocationId === location.id;
                const travelTime = getTravelTime(location);

                return (
                  <div
                    key={location.id}
                    className={`bg-gray-800/50 rounded-xl overflow-hidden border-2 transition-all ${
                      isCurrentLocation ? 'border-blue-500' : 'border-transparent hover:border-gray-600'
                    }`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${colorClass}`} />
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{location.name}</h4>
                            {isCurrentLocation && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                You are here
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 capitalize">{location.type}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {open ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatHours(location)}</span>
                        </div>
                        {npcsHere.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-400">{npcsHere.length} here</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => onSelectLocation(location)}
                          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                        >
                          Details
                        </button>
                        {!isCurrentLocation && open && (
                          <button
                            onClick={() => onTravelTo(location)}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-1"
                          >
                            Travel
                            {travelTime && (
                              <span className="text-blue-200">({travelTime}m)</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Locked Locations */}
          {lockedLocations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Locked Locations ({lockedLocations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lockedLocations.map((location) => {
                  const Icon = LOCATION_ICONS[location.type] || Building;

                  return (
                    <div
                      key={location.id}
                      className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700 opacity-60"
                    >
                      <div className="h-2 bg-gray-600" />
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-gray-700">
                            <Icon className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-300">{location.name}</h4>
                            <p className="text-sm text-gray-500 capitalize">{location.type}</p>
                          </div>
                          <Lock className="w-5 h-5 text-red-400" />
                        </div>

                        {location.unlockRequirements.length > 0 && (
                          <div className="mt-3 p-2 bg-gray-700/30 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Requirements:</p>
                            <ul className="space-y-1">
                              {location.unlockRequirements.slice(0, 2).map((req, i) => (
                                <li
                                  key={i}
                                  className={`text-xs flex items-center gap-1 ${
                                    req.met ? 'text-green-400' : 'text-gray-500'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-400' : 'bg-gray-500'}`} />
                                  {req.type}: {String(req.value)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredLocations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No locations found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
