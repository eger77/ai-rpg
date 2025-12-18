'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { generateNPCResponse } from '@/services/aiService';
import type { Email } from '@/types';
import {
  Smartphone,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Wallet,
  Bell,
  X,
  Send,
  ArrowLeft,
  User,
  Heart,
  Clock,
  ChevronRight,
  Reply,
  Trash2,
  Star,
} from 'lucide-react';

type PhoneScreen = 'home' | 'messages' | 'conversation' | 'calls' | 'email' | 'emailView' | 'notifications' | 'contacts';

interface PhoneUIProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhoneUI({ isOpen, onClose }: PhoneUIProps) {
  const [screen, setScreen] = useState<PhoneScreen>('home');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [emailReplyText, setEmailReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    phone,
    emailState,
    npcs,
    gameTime,
    sendTextMessage,
    markMessageRead,
    markNotificationRead,
    markEmailRead,
    replyToEmail,
    deleteEmail,
    addNotification,
  } = useGameStore();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phone?.conversations]);

  if (!phone || !isOpen) return null;

  const unreadMessages = phone.conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const unreadNotifications = phone.notifications.filter((n) => !n.read).length;
  const unreadEmails = emailState?.unreadCount || 0;
  const emails = emailState?.emails || [];

  const formatTime = (time: typeof gameTime) => {
    const hour = time.hour % 12 || 12;
    const ampm = time.hour >= 12 ? 'PM' : 'AM';
    return `${hour}:${time.minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const getNPCName = (npcId: string) => {
    const npc = npcs.get(npcId);
    return npc?.name || 'Unknown';
  };

  const selectedConversation = phone.conversations.find((c) => c.id === selectedConversationId);
  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const playerMessage = messageInput.trim();
    sendTextMessage(selectedConversation.npcId, playerMessage);
    setMessageInput('');

    const npc = npcs.get(selectedConversation.npcId);
    const { player, gameTime, receiveMessage, updateNPCRelationship, addNPCMemory, setConversationTyping } = useGameStore.getState();

    // Show typing indicator
    setConversationTyping(selectedConversation.npcId, true);

    if (!npc || !player) {
      setConversationTyping(selectedConversation.npcId, false);
      return;
    }

    // Build conversation history from messages
    const conversationHistory = selectedConversation.messages.map((msg) => ({
      speaker: msg.senderId === 'player' ? 'player' as const : 'npc' as const,
      content: msg.content,
    }));

    try {
      // Generate AI response using Grok
      const aiResult = await generateNPCResponse(
        playerMessage,
        npc,
        player,
        gameTime,
        conversationHistory
      );

      // Turn off typing indicator and receive the AI-generated message
      setConversationTyping(selectedConversation.npcId, false);
      receiveMessage(selectedConversation.npcId, aiResult.response);

      // Apply relationship changes
      if (Object.keys(aiResult.relationshipChanges).length > 0) {
        updateNPCRelationship(npc.id, aiResult.relationshipChanges);
      }

      // Add memory of this text conversation
      const emotionImpactMap: Record<string, number> = {
        happy: 60, excited: 70, flirty: 50, content: 30,
        sad: -40, frustrated: -50, angry: -70, anxious: -30,
        bored: -10, lonely: -20, embarrassed: 10, jealous: -40,
        grateful: 50, nostalgic: 20, hopeful: 40, confused: 0,
      };
      const emotionalImpactValue = emotionImpactMap[aiResult.detectedEmotion] || 0;
      const significance: 'forgettable' | 'notable' | 'important' | 'pivotal' | 'defining' =
        Math.abs(emotionalImpactValue) > 60 ? 'important' :
        Math.abs(emotionalImpactValue) > 30 ? 'notable' : 'forgettable';

      addNPCMemory(npc.id, {
        description: `Texted with ${player.name}: "${playerMessage.slice(0, 40)}${playerMessage.length > 40 ? '...' : ''}"`,
        day: gameTime.day,
        emotionalImpact: emotionalImpactValue,
        significance,
        tags: ['text_message', aiResult.detectedEmotion],
        referenceWeight: 40,
        timesReferenced: 0,
        involvedNPCs: [],
        locationId: undefined,
      });

      // Show notification
      addNotification({
        type: 'message',
        title: npc.name,
        body: aiResult.response.slice(0, 50) + (aiResult.response.length > 50 ? '...' : ''),
        read: false,
        urgent: false,
      });
    } catch (error) {
      console.error('Error generating AI response for text:', error);
      // Turn off typing and send fallback response
      setConversationTyping(selectedConversation.npcId, false);
      const fallbackResponse = "Hey! Sorry, got a bit distracted. What's up?";
      receiveMessage(selectedConversation.npcId, fallbackResponse);

      addNotification({
        type: 'message',
        title: npc.name,
        body: fallbackResponse,
        read: false,
        urgent: false,
      });
    }
  };

  const openConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setScreen('conversation');

    // Mark all messages as read
    const conv = phone.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.messages.forEach((msg) => {
        if (!msg.read) {
          markMessageRead(conversationId, msg.id);
        }
      });
    }
  };

  const openEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
    setScreen('emailView');
    setShowReplyBox(false);
    setEmailReplyText('');

    // Mark email as read
    markEmailRead(emailId);
  };

  const handleReplyEmail = () => {
    if (!emailReplyText.trim() || !selectedEmailId) return;
    replyToEmail(selectedEmailId, emailReplyText.trim());
    setEmailReplyText('');
    setShowReplyBox(false);

    // Show confirmation
    addNotification({
      type: 'email',
      title: 'Email Sent',
      body: 'Your reply has been sent',
      read: false,
      urgent: false,
    });
  };

  const handleDeleteEmail = () => {
    if (!selectedEmailId) return;
    deleteEmail(selectedEmailId);
    setScreen('email');
    setSelectedEmailId(null);
  };

  const goBack = () => {
    if (screen === 'conversation') {
      setScreen('messages');
      setSelectedConversationId(null);
    } else if (screen === 'emailView') {
      setScreen('email');
      setSelectedEmailId(null);
      setShowReplyBox(false);
    } else {
      setScreen('home');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Phone Frame */}
      <div className="relative w-[380px] h-[700px] bg-gray-900 rounded-[3rem] border-4 border-gray-700 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-20 p-2 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Screen Content */}
        <div className="h-full pt-8 pb-4 flex flex-col bg-gradient-to-b from-gray-800 to-gray-900">
          {/* Status Bar */}
          <div className="px-6 py-2 flex justify-between items-center text-xs text-gray-400">
            <span>{formatTime(gameTime)}</span>
            <div className="flex items-center gap-2">
              <span>Day {gameTime.day}</span>
              <span>{phone.battery}%</span>
            </div>
          </div>

          {/* Home Screen */}
          {screen === 'home' && (
            <div className="flex-1 p-4">
              <div className="text-center mb-8 pt-4">
                <p className="text-5xl font-light text-white">{formatTime(gameTime)}</p>
                <p className="text-gray-400 capitalize mt-2">
                  {gameTime.dayOfWeek}, Day {gameTime.day}
                </p>
              </div>

              {/* App Grid */}
              <div className="grid grid-cols-4 gap-4 mt-8">
                {/* Messages */}
                <button
                  onClick={() => setScreen('messages')}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="relative w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-white" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        {unreadMessages}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">Messages</span>
                </button>

                {/* Calls */}
                <button
                  onClick={() => setScreen('calls')}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">Calls</span>
                </button>

                {/* Email */}
                <button
                  onClick={() => setScreen('email')}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="relative w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center">
                    <Mail className="w-7 h-7 text-white" />
                    {unreadEmails > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs text-white flex items-center justify-center">
                        {unreadEmails}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">Email</span>
                </button>

                {/* Contacts */}
                <button
                  onClick={() => setScreen('contacts')}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">Contacts</span>
                </button>

                {/* Notifications */}
                <button
                  onClick={() => setScreen('notifications')}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="relative w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center">
                    <Bell className="w-7 h-7 text-white" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">Alerts</span>
                </button>

                {/* Map placeholder */}
                <button className="flex flex-col items-center gap-1 opacity-50">
                  <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">Map</span>
                </button>

                {/* Wallet placeholder */}
                <button className="flex flex-col items-center gap-1 opacity-50">
                  <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">Wallet</span>
                </button>
              </div>

              {/* Recent Notifications */}
              {phone.notifications.length > 0 && (
                <div className="mt-8 space-y-2">
                  <p className="text-xs text-gray-500 px-2">Recent</p>
                  {phone.notifications.slice(0, 2).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.type === 'message') setScreen('messages');
                        else if (notif.type === 'email') setScreen('email');
                      }}
                      className={`p-3 rounded-xl cursor-pointer ${notif.read ? 'bg-gray-800/50' : 'bg-gray-700/50'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center">
                          {notif.type === 'message' ? (
                            <MessageSquare className="w-4 h-4 text-green-400" />
                          ) : notif.type === 'email' ? (
                            <Mail className="w-4 h-4 text-red-400" />
                          ) : (
                            <Bell className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{notif.title}</p>
                          <p className="text-xs text-gray-400 truncate">{notif.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages List */}
          {screen === 'messages' && (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
                <button onClick={goBack}>
                  <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <h2 className="text-lg font-semibold text-white">Messages</h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {phone.conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare className="w-12 h-12 mb-2" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Meet people to start chatting!</p>
                  </div>
                ) : (
                  phone.conversations.map((conv) => {
                    const npc = npcs.get(conv.npcId);
                    const lastMessage = conv.messages[conv.messages.length - 1];

                    return (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv.id)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {npc?.name.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">{npc?.name || 'Unknown'}</span>
                            {lastMessage && (
                              <span className="text-xs text-gray-500">
                                {formatTime(lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-400 truncate">
                              {lastMessage?.content || 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="w-5 h-5 bg-green-500 rounded-full text-xs text-white flex items-center justify-center flex-shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Conversation View */}
          {screen === 'conversation' && selectedConversation && (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
                <button onClick={goBack}>
                  <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {getNPCName(selectedConversation.npcId).charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-white">{getNPCName(selectedConversation.npcId)}</h2>
                  <p className="text-xs text-gray-400">
                    {npcs.get(selectedConversation.npcId)?.currentState.availability === 'available'
                      ? 'Online'
                      : 'Away'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedConversation.messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Start the conversation!</p>
                  </div>
                ) : (
                  selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === 'player' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          msg.senderId === 'player'
                            ? 'bg-purple-600 text-white rounded-br-sm'
                            : 'bg-gray-700 text-white rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-60 mt-1">{formatTime(msg.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
                {selectedConversation.typing && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2 rounded-2xl bg-gray-700 text-gray-400 rounded-bl-sm">
                      <span className="animate-pulse">typing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-2 bg-purple-600 rounded-full text-white disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email List */}
          {screen === 'email' && (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
                <button onClick={goBack}>
                  <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <h2 className="text-lg font-semibold text-white">Email</h2>
                {unreadEmails > 0 && (
                  <span className="text-xs text-gray-400">({unreadEmails} unread)</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {emails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Mail className="w-12 h-12 mb-2" />
                    <p>No emails</p>
                  </div>
                ) : (
                  emails.map((email) => (
                    <button
                      key={email.id}
                      onClick={() => openEmail(email.id)}
                      className={`w-full px-4 py-3 border-b border-gray-800 text-left transition-colors hover:bg-gray-800/50 ${
                        email.read ? 'bg-transparent' : 'bg-purple-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-medium text-sm ${email.read ? 'text-gray-400' : 'text-white'}`}>
                          {email.from}
                        </p>
                        <span className="text-xs text-gray-500">{formatTime(email.timestamp)}</span>
                      </div>
                      <p className={`${email.read ? 'text-gray-500' : 'text-gray-300'} font-medium`}>
                        {email.subject}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{email.body}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Email View */}
          {screen === 'emailView' && selectedEmail && (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
                <button onClick={goBack}>
                  <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <h2 className="text-lg font-semibold text-white flex-1 truncate">{selectedEmail.subject}</h2>
                <button onClick={handleDeleteEmail} className="p-2 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* Email Header */}
                <div className="mb-4 pb-4 border-b border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {selectedEmail.from.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{selectedEmail.from}</p>
                      <p className="text-xs text-gray-400">{selectedEmail.fromAddress}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatTime(selectedEmail.timestamp)} • Day {selectedEmail.timestamp.day}
                  </p>
                </div>

                {/* Email Body */}
                <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedEmail.body}
                </div>

                {/* Reply Section */}
                {showReplyBox && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Reply to {selectedEmail.from}:</p>
                    <textarea
                      value={emailReplyText}
                      onChange={(e) => setEmailReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setShowReplyBox(false)}
                        className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReplyEmail}
                        disabled={!emailReplyText.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white text-sm flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!showReplyBox && (
                <div className="p-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowReplyBox(true)}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white flex items-center justify-center gap-2"
                  >
                    <Reply className="w-5 h-5" />
                    Reply
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {screen === 'notifications' && (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
                <button onClick={goBack}>
                  <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {phone.notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Bell className="w-12 h-12 mb-2" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  phone.notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`px-4 py-3 border-b border-gray-800 cursor-pointer ${
                        notif.read ? 'bg-transparent' : 'bg-purple-900/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            notif.type === 'message'
                              ? 'bg-green-500/30'
                              : notif.type === 'email'
                              ? 'bg-red-500/30'
                              : notif.type === 'bill'
                              ? 'bg-yellow-500/30'
                              : 'bg-purple-500/30'
                          }`}
                        >
                          {notif.type === 'message' ? (
                            <MessageSquare className="w-5 h-5 text-green-400" />
                          ) : notif.type === 'email' ? (
                            <Mail className="w-5 h-5 text-red-400" />
                          ) : notif.type === 'bill' ? (
                            <Wallet className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Bell className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-white">{notif.title}</p>
                            <span className="text-xs text-gray-500">{formatTime(notif.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-400">{notif.body}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Contacts */}
          {screen === 'contacts' && (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
                <button onClick={goBack}>
                  <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <h2 className="text-lg font-semibold text-white">Contacts</h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {phone.contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <User className="w-12 h-12 mb-2" />
                    <p>No contacts yet</p>
                    <p className="text-sm">Meet people to add them here!</p>
                  </div>
                ) : (
                  phone.contacts.map((contact) => {
                    const npc = npcs.get(contact.npcId);
                    if (!npc) return null;

                    return (
                      <div
                        key={contact.id}
                        className="px-4 py-3 flex items-center gap-3 border-b border-gray-800"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {npc.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{npc.name}</p>
                          <p className="text-sm text-gray-400">{npc.occupation}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {npc.relationship.romance > 30 && (
                            <Heart className="w-4 h-4 text-pink-400" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Calls */}
          {screen === 'calls' && (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
                <button onClick={goBack}>
                  <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <h2 className="text-lg font-semibold text-white">Call History</h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {phone.callLog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Phone className="w-12 h-12 mb-2" />
                    <p>No call history</p>
                  </div>
                ) : (
                  phone.callLog.map((call) => (
                    <div key={call.id} className="px-4 py-3 flex items-center gap-3 border-b border-gray-800">
                      <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{getNPCName(call.npcId)}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className={call.type === 'missed' ? 'text-red-400' : ''}>{call.type}</span>
                          <span>•</span>
                          <span>{formatTime(call.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Home Button */}
          <div className="flex justify-center py-2">
            <button
              onClick={() => setScreen('home')}
              className="w-32 h-1 bg-gray-600 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
