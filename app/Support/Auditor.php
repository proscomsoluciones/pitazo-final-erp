<?php

namespace App\Support;

use App\Models\AuditLog;

class Auditor
{
    /**
     * Registra una entrada en el Módulo de Auditoría.
     */
    public static function log(string $action, string $modulo, string $description): void
    {
        $user = auth()->user();

        AuditLog::create([
            'user_id'     => $user?->id,
            'user_name'   => $user?->name ?? 'Sistema',
            'user_role'   => $user?->getRoleNames()->first() ?? 'Usuario',
            'action'      => $action,
            'modulo'      => $modulo,
            'description' => $description,
            'ip_address'  => request()->ip(),
        ]);
    }
}
