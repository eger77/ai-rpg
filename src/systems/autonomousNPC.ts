import type { NPC, GameTime, Player } from '@/types';

/**
 * Autonomous NPC Behavior Engine
 * Handles NPCs initiating contact, having their own lives, and reacting to world events
 */

interface NPCEvent {
  id: string;
  npcId: string;
  type: 'text_player' | 'mood_change' | 'location_change' | 'life_event' | 'schedule_conflict';
  timestamp: GameTime;
  data: any;
}

export class AutonomousNPCEngine {
  private eventQueue: NPCEvent[] = [];
  private lastCheckTime: number = 0;

  /**
   * Check if NPC should proactively text the player
   */
  shouldNPCTextPlayer(npc: NPC, player: Player, gameTime: GameTime): boolean {
    const relationship = npc.relationship;
    const hoursSinceContact = relationship.daysSinceContact * 24;

    // High relationship NPCs text more frequently
    if (relationship.romance > 60 || relationship.friendship > 70) {
      // Text every 12-24 hours if close
      return hoursSinceContact > 12 && Math.random() < 0.3;
    } else if (relationship.friendship > 40) {
      // Text every 2-3 days if friends
      return hoursSinceContact > 48 && Math.random() < 0.2;
    } else if (relationship.totalInteractions > 0) {
      // Acquaintances rarely text first
      return hoursSinceContact > 96 && Math.random() < 0.1;
    }

    return false;
  }

  /**
   * Generate proactive message from NPC based on context
   */
  generateProactiveMessage(npc: NPC, player: Player, gameTime: GameTime): string {
    const relationship = npc.relationship;
    const firstName = npc.name.split(' ')[0];
    const hour = gameTime.hour;
    const mood = npc.currentState.mood.primary;

    // Romance-focused messages
    if (relationship.romance > 60) {
      const romanticMessages = [
        `Hey ${player.name} 💕 Been thinking about you. How's your day going?`,
        `Good morning! ☀️ Hope you have an amazing day`,
        `Miss you... Want to grab dinner tonight?`,
        `Just saw something that reminded me of you 😊`,
        `Can't wait to see you again. Free this weekend?`,
      ];

      if (relationship.romance > 80) {
        romanticMessages.push(
          `I love talking to you. You make my day better ❤️`,
          `Counting down till I see you again`,
          `You've been on my mind all day...`
        );
      }

      return romanticMessages[Math.floor(Math.random() * romanticMessages.length)];
    }

    // Friendship messages
    if (relationship.friendship > 50) {
      const friendMessages = [
        `Hey! Want to hang out sometime this week?`,
        `How are you doing? Haven't heard from you in a while`,
        `So... I have some news I wanted to share with you`,
        `You up for coffee later?`,
        `Random question: [asks about your interests]`,
      ];
      return friendMessages[Math.floor(Math.random() * friendMessages.length)];
    }

    // Casual/acquaintance messages
    const casualMessages = [
      `Hey, how's it going?`,
      `Long time no see! What have you been up to?`,
      `Hope you're doing well`,
    ];
    return casualMessages[Math.floor(Math.random() * casualMessages.length)];
  }

  /**
   * Simulate NPC's day - mood changes, location changes based on schedule
   */
  simulateNPCDay(npc: NPC, gameTime: GameTime): Partial<NPC> {
    const updates: Partial<NPC> = {};
    const currentState = { ...npc.currentState };

    // Find current schedule activity
    const currentSchedule = npc.defaultSchedule.find((s) => {
      const matchesDay =
        s.dayOfWeek === 'all' ||
        s.dayOfWeek === gameTime.dayOfWeek ||
        (s.dayOfWeek === 'weekday' && !['saturday', 'sunday'].includes(gameTime.dayOfWeek)) ||
        (s.dayOfWeek === 'weekend' && ['saturday', 'sunday'].includes(gameTime.dayOfWeek));
      return matchesDay && gameTime.hour >= s.startHour && gameTime.hour < s.endHour;
    });

    // Update location and activity based on schedule
    if (currentSchedule) {
      currentState.currentLocationId = currentSchedule.locationId;
      currentState.currentActivity = currentSchedule.activity;

      // Availability based on activity
      if (currentSchedule.activity.toLowerCase().includes('work')) {
        currentState.availability = 'busy';
      } else if (currentSchedule.activity.toLowerCase().includes('sleep')) {
        currentState.availability = 'unavailable';
      } else {
        currentState.availability = 'available';
      }
    }

    // Mood fluctuations based on time and personality
    const moodShift = this.calculateMoodShift(npc, gameTime);
    if (moodShift) {
      currentState.mood.primary = moodShift;
    }

    // Energy decreases throughout day, resets after sleep
    if (gameTime.hour >= 6 && gameTime.hour < 12) {
      currentState.energy = 100; // Morning - full energy
    } else if (gameTime.hour >= 12 && gameTime.hour < 18) {
      currentState.energy = 75; // Afternoon - good energy
    } else if (gameTime.hour >= 18 && gameTime.hour < 22) {
      currentState.energy = 50; // Evening - tired
    } else {
      currentState.energy = 25; // Night - exhausted
    }

    updates.currentState = currentState;
    return updates;
  }

  /**
   * Calculate mood shift based on personality and time
   */
  private calculateMoodShift(npc: NPC, gameTime: GameTime): import('@/types').EmotionType | null {
    const hour = gameTime.hour;
    const neuroticism = npc.personality.neuroticism;

    // Morning people vs night people
    if (hour >= 6 && hour < 10) {
      return neuroticism < 40 ? 'content' : 'anxious';
    } else if (hour >= 18 && hour < 22) {
      return neuroticism < 50 ? 'content' : 'bored';
    } else if (hour >= 22 || hour < 6) {
      return neuroticism > 60 ? 'anxious' : 'bored';
    }

    // Random mood fluctuations for high neuroticism
    if (neuroticism > 60 && Math.random() < 0.3) {
      const moods: import('@/types').EmotionType[] = ['anxious', 'frustrated', 'sad'];
      return moods[Math.floor(Math.random() * moods.length)];
    }

    return null;
  }

  /**
   * Check if NPC's schedule conflicts with player request
   */
  hasScheduleConflict(npc: NPC, gameTime: GameTime, requestedActivity: string): boolean {
    const currentSchedule = npc.defaultSchedule.find((s) => {
      const matchesDay =
        s.dayOfWeek === 'all' ||
        s.dayOfWeek === gameTime.dayOfWeek ||
        (s.dayOfWeek === 'weekday' && !['saturday', 'sunday'].includes(gameTime.dayOfWeek)) ||
        (s.dayOfWeek === 'weekend' && ['saturday', 'sunday'].includes(gameTime.dayOfWeek));
      return matchesDay && gameTime.hour >= s.startHour && gameTime.hour < s.endHour;
    });

    // If busy with work or committed activity, conflict
    if (currentSchedule && (
      currentSchedule.activity.toLowerCase().includes('work') ||
      currentSchedule.activity.toLowerCase().includes('meeting') ||
      currentSchedule.activity.toLowerCase().includes('class')
    )) {
      return true;
    }

    return false;
  }

  /**
   * Generate NPC response to date/hangout invitation considering their schedule
   */
  generateScheduleResponse(npc: NPC, gameTime: GameTime, hasConflict: boolean): string {
    const firstName = npc.name.split(' ')[0];
    const relationship = npc.relationship;

    if (hasConflict) {
      const excuses = [
        `I'd love to, but I have work until ${gameTime.hour + 2}pm. How about after?`,
        `Aw, I can't right now - I have plans already. Tomorrow maybe?`,
        `I'm busy tonight, but I'm free this weekend if you want to do something then?`,
        `Rain check? I have something I can't miss tonight.`,
      ];

      if (relationship.romance > 50) {
        excuses.push(`I really want to see you, but I promised my sister I'd have dinner with her. Can we do tomorrow?`);
      }

      return excuses[Math.floor(Math.random() * excuses.length)];
    }

    // No conflict - accept based on relationship
    if (relationship.romance > 60 || relationship.friendship > 70) {
      const enthusiastic = [
        `Yes! I'd love to! 😊`,
        `Absolutely! What time?`,
        `I was hoping you'd ask! When and where?`,
      ];
      return enthusiastic[Math.floor(Math.random() * enthusiastic.length)];
    } else if (relationship.friendship > 30) {
      return `Sure, sounds good! What did you have in mind?`;
    } else {
      return `Um, okay. That could be fun I guess.`;
    }
  }

  /**
   * Simulate NPC life events that happen autonomously
   */
  generateLifeEvent(npc: NPC, gameTime: GameTime): { type: string; description: string } | null {
    // Random life events based on personality and occupation
    const random = Math.random();

    if (random < 0.1) { // 10% chance of event per day
      const events = [
        { type: 'work_stress', description: `had a stressful day at work` },
        { type: 'work_success', description: `got praised by their boss` },
        { type: 'social', description: `went out with friends` },
        { type: 'family', description: `had dinner with family` },
        { type: 'hobby', description: `spent time on their hobby` },
        { type: 'sick', description: `isn't feeling well` },
        { type: 'excited', description: `has exciting news to share` },
      ];

      return events[Math.floor(Math.random() * events.length)];
    }

    return null;
  }
}

export const autonomousNPC = new AutonomousNPCEngine();
