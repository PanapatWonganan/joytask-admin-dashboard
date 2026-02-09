<?php

namespace Database\Seeders;

use App\Models\Sound;
use Illuminate\Database\Seeder;

class SoundSeeder extends Seeder
{
    public function run(): void
    {
        $sounds = [
            // ══════════════════════════════════
            // AMBIENT SOUNDS
            // ══════════════════════════════════

            // Nature
            ['key' => 'rain', 'name' => 'เสียงฝน', 'name_en' => 'Rain', 'type' => 'ambient', 'category' => 'nature', 'file_path' => 'sounds/ambient/rain.mp3', 'sort_order' => 1],
            ['key' => 'forest', 'name' => 'ป่า', 'name_en' => 'Forest', 'type' => 'ambient', 'category' => 'nature', 'file_path' => 'sounds/ambient/forest.mp3', 'sort_order' => 2],
            ['key' => 'ocean', 'name' => 'คลื่นทะเล', 'name_en' => 'Ocean Waves', 'type' => 'ambient', 'category' => 'nature', 'file_path' => 'sounds/ambient/ocean.mp3', 'sort_order' => 3],
            ['key' => 'river', 'name' => 'ลำธาร', 'name_en' => 'River Stream', 'type' => 'ambient', 'category' => 'nature', 'file_path' => 'sounds/ambient/river.mp3', 'sort_order' => 4],
            ['key' => 'birds', 'name' => 'นกร้อง', 'name_en' => 'Birds Chirping', 'type' => 'ambient', 'category' => 'nature', 'file_path' => 'sounds/ambient/birds.mp3', 'sort_order' => 5],
            ['key' => 'crickets', 'name' => 'จิ้งหรีด', 'name_en' => 'Night Crickets', 'type' => 'ambient', 'category' => 'nature', 'file_path' => 'sounds/ambient/crickets.mp3', 'sort_order' => 6],

            // Weather
            ['key' => 'thunderstorm', 'name' => 'พายุฝน', 'name_en' => 'Thunderstorm', 'type' => 'ambient', 'category' => 'weather', 'file_path' => 'sounds/ambient/thunderstorm.mp3', 'sort_order' => 7],
            ['key' => 'wind', 'name' => 'ลมพัด', 'name_en' => 'Wind', 'type' => 'ambient', 'category' => 'weather', 'file_path' => 'sounds/ambient/wind.mp3', 'sort_order' => 8],

            // Environment
            ['key' => 'fireplace', 'name' => 'กองไฟ', 'name_en' => 'Fireplace', 'type' => 'ambient', 'category' => 'environment', 'file_path' => 'sounds/ambient/fireplace.mp3', 'sort_order' => 9],
            ['key' => 'cafe', 'name' => 'ร้านกาแฟ', 'name_en' => 'Coffee Shop', 'type' => 'ambient', 'category' => 'environment', 'file_path' => 'sounds/ambient/cafe.mp3', 'sort_order' => 10],
            ['key' => 'library', 'name' => 'ห้องสมุด', 'name_en' => 'Library', 'type' => 'ambient', 'category' => 'environment', 'file_path' => 'sounds/ambient/library.mp3', 'sort_order' => 11],
            ['key' => 'white_noise', 'name' => 'White Noise', 'name_en' => 'White Noise', 'type' => 'ambient', 'category' => 'environment', 'file_path' => 'sounds/ambient/white_noise.mp3', 'sort_order' => 12],
            ['key' => 'brown_noise', 'name' => 'Brown Noise', 'name_en' => 'Brown Noise', 'type' => 'ambient', 'category' => 'environment', 'file_path' => 'sounds/ambient/brown_noise.mp3', 'sort_order' => 13],

            // Music
            ['key' => 'piano', 'name' => 'เปียโน', 'name_en' => 'Soft Piano', 'type' => 'ambient', 'category' => 'music', 'file_path' => 'sounds/ambient/piano.mp3', 'sort_order' => 14],
            ['key' => 'lofi', 'name' => 'Lo-Fi Beats', 'name_en' => 'Lo-Fi Beats', 'type' => 'ambient', 'category' => 'music', 'file_path' => 'sounds/ambient/lofi.mp3', 'is_premium' => true, 'sort_order' => 15],

            // ══════════════════════════════════
            // SOUND EFFECTS
            // ══════════════════════════════════

            // Task
            ['key' => 'task_complete', 'name' => 'Task Complete', 'name_en' => 'Task Complete', 'type' => 'effect', 'category' => 'task', 'file_path' => 'sounds/effects/task_complete.mp3', 'sort_order' => 1],
            ['key' => 'task_delete', 'name' => 'Task Delete', 'name_en' => 'Task Delete', 'type' => 'effect', 'category' => 'task', 'file_path' => 'sounds/effects/task_delete.mp3', 'sort_order' => 2],
            ['key' => 'checkbox_tap', 'name' => 'Checkbox Tap', 'name_en' => 'Checkbox Tap', 'type' => 'effect', 'category' => 'task', 'file_path' => 'sounds/effects/checkbox_tap.mp3', 'sort_order' => 3],

            // Achievement
            ['key' => 'achievement_unlocked', 'name' => 'Achievement Unlocked', 'name_en' => 'Achievement Unlocked', 'type' => 'effect', 'category' => 'achievement', 'file_path' => 'sounds/effects/achievement_unlocked.mp3', 'sort_order' => 4],
            ['key' => 'level_up', 'name' => 'Level Up', 'name_en' => 'Level Up', 'type' => 'effect', 'category' => 'achievement', 'file_path' => 'sounds/effects/level_up.mp3', 'sort_order' => 5],
            ['key' => 'streak_milestone', 'name' => 'Streak Milestone', 'name_en' => 'Streak Milestone', 'type' => 'effect', 'category' => 'achievement', 'file_path' => 'sounds/effects/streak_milestone.mp3', 'sort_order' => 6],
            ['key' => 'coin_earned', 'name' => 'Coin Earned', 'name_en' => 'Coin Earned', 'type' => 'effect', 'category' => 'achievement', 'file_path' => 'sounds/effects/coin_earned.mp3', 'sort_order' => 7],

            // Timer
            ['key' => 'pomodoro_complete', 'name' => 'Pomodoro Complete', 'name_en' => 'Pomodoro Complete', 'type' => 'effect', 'category' => 'timer', 'file_path' => 'sounds/effects/pomodoro_complete.mp3', 'sort_order' => 8],
            ['key' => 'break_start', 'name' => 'Break Start', 'name_en' => 'Break Start', 'type' => 'effect', 'category' => 'timer', 'file_path' => 'sounds/effects/break_start.mp3', 'sort_order' => 9],
            ['key' => 'timer_warning', 'name' => 'Timer Warning', 'name_en' => 'Timer Warning', 'type' => 'effect', 'category' => 'timer', 'file_path' => 'sounds/effects/timer_warning.mp3', 'sort_order' => 10],
            ['key' => 'timer_tick', 'name' => 'Timer Tick', 'name_en' => 'Timer Tick', 'type' => 'effect', 'category' => 'timer', 'file_path' => 'sounds/effects/timer_tick.mp3', 'sort_order' => 11],

            // UI
            ['key' => 'button_tap', 'name' => 'Button Tap', 'name_en' => 'Button Tap', 'type' => 'effect', 'category' => 'ui', 'file_path' => 'sounds/effects/button_tap.mp3', 'sort_order' => 12],
            ['key' => 'page_transition', 'name' => 'Page Transition', 'name_en' => 'Page Transition', 'type' => 'effect', 'category' => 'ui', 'file_path' => 'sounds/effects/page_transition.mp3', 'sort_order' => 13],
            ['key' => 'modal_open', 'name' => 'Modal Open', 'name_en' => 'Modal Open', 'type' => 'effect', 'category' => 'ui', 'file_path' => 'sounds/effects/modal_open.mp3', 'sort_order' => 14],
            ['key' => 'modal_close', 'name' => 'Modal Close', 'name_en' => 'Modal Close', 'type' => 'effect', 'category' => 'ui', 'file_path' => 'sounds/effects/modal_close.mp3', 'sort_order' => 15],
            ['key' => 'error', 'name' => 'Error', 'name_en' => 'Error', 'type' => 'effect', 'category' => 'ui', 'file_path' => 'sounds/effects/error.mp3', 'sort_order' => 16],
            ['key' => 'success', 'name' => 'Success', 'name_en' => 'Success', 'type' => 'effect', 'category' => 'ui', 'file_path' => 'sounds/effects/success.mp3', 'sort_order' => 17],

            // Mascot
            ['key' => 'mascot_tap', 'name' => 'Mascot Tap', 'name_en' => 'Mascot Tap', 'type' => 'effect', 'category' => 'mascot', 'file_path' => 'sounds/effects/mascot_tap.mp3', 'sort_order' => 18],
            ['key' => 'mascot_happy', 'name' => 'Mascot Happy', 'name_en' => 'Mascot Happy', 'type' => 'effect', 'category' => 'mascot', 'file_path' => 'sounds/effects/mascot_happy.mp3', 'sort_order' => 19],
            ['key' => 'mascot_sad', 'name' => 'Mascot Sad', 'name_en' => 'Mascot Sad', 'type' => 'effect', 'category' => 'mascot', 'file_path' => 'sounds/effects/mascot_sad.mp3', 'sort_order' => 20],
            ['key' => 'mascot_celebrate', 'name' => 'Mascot Celebrate', 'name_en' => 'Mascot Celebrate', 'type' => 'effect', 'category' => 'mascot', 'file_path' => 'sounds/effects/mascot_celebrate.mp3', 'sort_order' => 21],

            // Wardrobe
            ['key' => 'item_equipped', 'name' => 'Item Equipped', 'name_en' => 'Item Equipped', 'type' => 'effect', 'category' => 'wardrobe', 'file_path' => 'sounds/effects/item_equipped.mp3', 'sort_order' => 22],
            ['key' => 'item_unlocked', 'name' => 'Item Unlocked', 'name_en' => 'Item Unlocked', 'type' => 'effect', 'category' => 'wardrobe', 'file_path' => 'sounds/effects/item_unlocked.mp3', 'sort_order' => 23],

            // Notification
            ['key' => 'notification', 'name' => 'Notification', 'name_en' => 'Notification', 'type' => 'effect', 'category' => 'notification', 'file_path' => 'sounds/effects/notification.mp3', 'sort_order' => 24],
            ['key' => 'reminder', 'name' => 'Reminder', 'name_en' => 'Reminder', 'type' => 'effect', 'category' => 'notification', 'file_path' => 'sounds/effects/reminder.mp3', 'sort_order' => 25],
        ];

        foreach ($sounds as $soundData) {
            Sound::updateOrCreate(
                ['key' => $soundData['key']],
                $soundData
            );
        }
    }
}
