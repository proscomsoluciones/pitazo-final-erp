<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications' => fn () => ($user && ($user->hasRole('Super admin') || $user->hasRole('Super Admin') || $user->hasRole('Administrador') || $user->hasRole('Admin')))
                ? \App\Models\AuditLog::latest()->take(20)->get()->map(function ($log) {
                    return [
                        'id'          => $log->id,
                        'user_name'   => $log->user_name,
                        'user_role'   => $log->user_role,
                        'action'      => $log->action,
                        'modulo'      => $log->modulo,
                        'description' => $log->description,
                        'is_read'     => !is_null($log->read_at),
                        'fecha_hora'  => $log->created_at->format('d/m/Y H:i:s'),
                        'hace_tiempo' => $log->created_at->diffForHumans(),
                    ];
                })
                : [],
        ];
    }
}
