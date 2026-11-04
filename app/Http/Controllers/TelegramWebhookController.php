<?php

namespace App\Http\Controllers;

use App\Services\Telegram\TelegramBot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    public function __invoke(Request $request, TelegramBot $bot)
    {
        $secreto = config('services.telegram.webhook_secret');
        if (!$secreto || !hash_equals($secreto, (string) $request->header('X-Telegram-Bot-Api-Secret-Token'))) {
            abort(403);
        }

        try {
            $bot->atender($request->all());
        } catch (\Throwable $e) {
            // Responder 200 igual: si no, Telegram reintenta el mismo mensaje una y otra vez
            Log::error('Telegram webhook: ' . $e->getMessage(), ['exception' => $e]);
        }

        return response()->json(['ok' => true]);
    }
}
