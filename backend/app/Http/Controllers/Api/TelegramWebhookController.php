<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\Request;

class TelegramWebhookController extends Controller
{
    public function __invoke(Request $request, TelegramService $telegram)
    {
        $message = $request->input('message');
        $text = $message['text'] ?? '';
        $chatId = $message['chat']['id'] ?? null;

        if ($chatId && str_starts_with($text, '/start')) {
            $token = trim(str_replace('/start', '', $text));

            $user = User::where('telegram_link_token', $token)->first();

            if ($user) {
                $user->update([
                    'telegram_chat_id' => $chatId,
                    'telegram_link_token' => null,
                ]);

                $telegram->sendMessage($chatId, "Akun Telegram kamu berhasil terhubung ke sistem reimbursement sebagai <b>{$user->name}</b>.");
            }
        }

        return response()->json(['ok' => true]);
    }
}