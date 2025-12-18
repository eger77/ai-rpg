'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { InventoryItem, ClothingItem, ItemType } from '@/types';
import {
  X,
  Package,
  Gift,
  Utensils,
  Key,
  Ticket,
  Shirt,
  Sparkles,
  Heart,
  DollarSign,
  Calendar,
  Filter,
  Search,
} from 'lucide-react';

interface InventoryUIProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEM_TYPE_ICONS: Record<ItemType, React.ElementType> = {
  gift: Gift,
  food: Utensils,
  drink: Utensils,
  key_item: Key,
  tool: Package,
  entertainment: Sparkles,
  crafting: Package,
  memento: Heart,
  ticket: Ticket,
  medicine: Package,
};

const ITEM_TYPE_COLORS: Record<ItemType, string> = {
  gift: 'text-pink-400',
  food: 'text-orange-400',
  drink: 'text-blue-400',
  key_item: 'text-yellow-400',
  tool: 'text-gray-400',
  entertainment: 'text-purple-400',
  crafting: 'text-green-400',
  memento: 'text-red-400',
  ticket: 'text-teal-400',
  medicine: 'text-emerald-400',
};

export function InventoryUI({ isOpen, onClose }: InventoryUIProps) {
  const { player, npcs, gameTime } = useGameStore();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [filter, setFilter] = useState<ItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !player) return null;

  const filteredItems = player.inventory.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<ItemType, InventoryItem[]>);

  const getMemorableNPCName = (npcId: string) => {
    const npc = npcs.get(npcId);
    return npc?.name || 'Someone special';
  };

  const isExpired = (item: InventoryItem) => {
    return item.expiresOnDay !== undefined && item.expiresOnDay <= gameTime.day;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Inventory</h2>
            <span className="px-2 py-1 bg-white/20 rounded text-sm text-white">
              {player.inventory.length} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ItemType | 'all')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Items</option>
              <option value="gift">Gifts</option>
              <option value="food">Food</option>
              <option value="drink">Drinks</option>
              <option value="key_item">Key Items</option>
              <option value="ticket">Tickets</option>
              <option value="memento">Mementos</option>
              <option value="tool">Tools</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6">
            {player.inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Package className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Your inventory is empty</p>
                <p className="text-sm">Visit shops to buy items or receive gifts from NPCs</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Search className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No items found</p>
                <p className="text-sm">Try a different search or filter</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(Object.entries(groupedItems) as [ItemType, InventoryItem[]][]).map(([type, items]) => {
                  const Icon = ITEM_TYPE_ICONS[type];
                  const color = ITEM_TYPE_COLORS[type];

                  return (
                    <div key={type}>
                      <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${color}`}>
                        <Icon className="w-4 h-4" />
                        {type.replace('_', ' ').toUpperCase()}
                        <span className="text-gray-500">({items.length})</span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {items.map((item) => {
                          const ItemIcon = ITEM_TYPE_ICONS[item.type];
                          const expired = isExpired(item);

                          return (
                            <button
                              key={item.id}
                              onClick={() => setSelectedItem(item)}
                              className={`p-4 rounded-xl text-left transition-all ${
                                selectedItem?.id === item.id
                                  ? 'bg-orange-600/20 border-2 border-orange-500'
                                  : 'bg-gray-800/50 hover:bg-gray-700/50 border-2 border-transparent'
                              } ${expired ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg bg-gray-700/50 ${ITEM_TYPE_COLORS[item.type]}`}>
                                  <ItemIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{item.name}</p>
                                  {item.quantity > 1 && (
                                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                                  )}
                                  {expired && (
                                    <span className="text-xs text-red-400 block">Expired</span>
                                  )}
                                  {item.memorableWith && (
                                    <span className="text-xs text-pink-400 block flex items-center gap-1">
                                      <Heart className="w-3 h-3" />
                                      {getMemorableNPCName(item.memorableWith)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Item Details */}
          {selectedItem && (
            <div className="w-80 bg-gray-800/50 border-l border-gray-700 p-6 overflow-y-auto">
              <div className={`w-16 h-16 rounded-xl bg-gray-700/50 flex items-center justify-center mb-4 ${ITEM_TYPE_COLORS[selectedItem.type]}`}>
                {(() => {
                  const Icon = ITEM_TYPE_ICONS[selectedItem.type];
                  return <Icon className="w-8 h-8" />;
                })()}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{selectedItem.name}</h3>
              <p className="text-sm text-gray-400 capitalize mb-4">{selectedItem.type.replace('_', ' ')}</p>

              <p className="text-gray-300 mb-6">{selectedItem.description}</p>

              <div className="space-y-3">
                {selectedItem.quantity > 1 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Quantity</span>
                    <span className="text-white">{selectedItem.quantity}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Sell Value</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {selectedItem.sellValue}
                  </span>
                </div>

                {selectedItem.giftValue && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Gift Value</span>
                    <span className="text-pink-400 flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      {selectedItem.giftValue}
                    </span>
                  </div>
                )}

                {selectedItem.expiresOnDay && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Expires</span>
                    <span className={`flex items-center gap-1 ${isExpired(selectedItem) ? 'text-red-400' : 'text-yellow-400'}`}>
                      <Calendar className="w-4 h-4" />
                      Day {selectedItem.expiresOnDay}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Obtained</span>
                  <span className="text-gray-300 capitalize">{selectedItem.obtainedMethod.replace('_', ' ')}</span>
                </div>

                {selectedItem.memorableWith && (
                  <div className="mt-4 p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-pink-400 mb-1">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm font-medium">Sentimental Value</span>
                    </div>
                    <p className="text-sm text-gray-300">{selectedItem.memoryDescription || `Connected to ${getMemorableNPCName(selectedItem.memorableWith)}`}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                {selectedItem.type === 'gift' && (
                  <button className="w-full py-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-white font-medium transition-colors">
                    Give as Gift
                  </button>
                )}
                {(selectedItem.type === 'food' || selectedItem.type === 'drink') && selectedItem.consumable && (
                  <button className="w-full py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-colors">
                    Consume
                  </button>
                )}
                <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors">
                  Sell for ${selectedItem.sellValue}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
