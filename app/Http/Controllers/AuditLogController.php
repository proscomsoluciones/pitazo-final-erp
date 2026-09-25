<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Check if user is Admin / Super admin
        $isSuperAdmin = $user && ($user->hasRole('Super admin') || $user->hasRole('Super Admin') || $user->hasRole('Administrador') || $user->hasRole('Admin'));

        if (!$isSuperAdmin) {
            abort(403, 'No tienes permisos para acceder al Módulo de Auditoría.');
        }

        $logs = AuditLog::with('user')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id'          => $log->id,
                    'user_id'     => $log->user_id,
                    'user_name'   => $log->user_name,
                    'user_role'   => $log->user_role,
                    'action'      => $log->action,
                    'modulo'      => $log->modulo,
                    'description' => $log->description,
                    'ip_address'  => $log->ip_address,
                    'fecha_hora'  => $log->created_at->format('d/m/Y H:i:s'),
                    'hace_tiempo' => $log->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('AuditLog/Index', [
            'logs' => $logs,
        ]);
    }

    public function markAsRead(Request $request, AuditLog $auditLog)
    {
        $this->authorizeAdmin($request->user());
        $auditLog->update(['read_at' => now()]);
        return back();
    }

    public function destroy(Request $request, AuditLog $auditLog)
    {
        $this->authorizeAdmin($request->user());
        $auditLog->delete();
        return back();
    }

    public function markAllAsRead(Request $request)
    {
        $this->authorizeAdmin($request->user());
        AuditLog::whereNull('read_at')->update(['read_at' => now()]);
        return back();
    }

    private function authorizeAdmin($user)
    {
        $isAdmin = $user && ($user->hasRole('Super admin') || $user->hasRole('Super Admin') || $user->hasRole('Administrador') || $user->hasRole('Admin'));
        if (!$isAdmin) {
            abort(403, 'No tienes permisos.');
        }
    }
}
