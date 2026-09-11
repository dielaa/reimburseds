<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class TelegramService
{
    protected string $token;

    public function __construct()
    {
        $this->token = config('services.telegram.bot_token');
    }

    public function sendMessage(string $chatId, string $text, ?string $buttonUrl = null, string $buttonLabel = 'Buka aplikasi'): void
    {
        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
        ];

        if ($buttonUrl) {
            $payload['reply_markup'] = json_encode([
                'inline_keyboard' => [[
                    ['text' => $buttonLabel, 'url' => $buttonUrl],
                ]],
            ]);
        }

        Http::post("https://api.telegram.org/bot{$this->token}/sendMessage", $payload);
    }

    public function notifyUser(User $user, string $text, ?string $buttonUrl = null): void
    {
        if ($user->telegram_chat_id) {
            $this->sendMessage($user->telegram_chat_id, $text, $buttonUrl);
        }
    }

    public function notifyRole(string $role, string $text, ?string $buttonUrl = null): void
    {
        User::where('role', $role)
            ->whereNotNull('telegram_chat_id')
            ->get()
            ->each(fn (User $u) => $this->sendMessage($u->telegram_chat_id, $text, $buttonUrl));
    }

    public function generateLinkToken(User $user): string
    {
        $token = Str::random(24);
        $user->update(['telegram_link_token' => $token]);

        return "https://t.me/" . config('services.telegram.bot_username') . "?start={$token}";
    }
}