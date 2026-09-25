<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SancionController;
use App\Http\Controllers\ClubController;
use App\Http\Controllers\JugadorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TorneoController;
use App\Http\Controllers\NotaDisciplinaController;
use App\Http\Controllers\ConfiguracionAsociacionController;
use App\Http\Controllers\EticaController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Administración de Usuarios y Roles (Solo Super Admin)
    Route::middleware(['role:Super admin|Super Admin'])->group(function () {
        Route::get('/users', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index');
        Route::post('/users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy');

        Route::get('/roles', [\App\Http\Controllers\RoleController::class, 'index'])->name('roles.index');
        Route::post('/roles', [\App\Http\Controllers\RoleController::class, 'store'])->name('roles.store');
        Route::put('/roles/{id}', [\App\Http\Controllers\RoleController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{id}', [\App\Http\Controllers\RoleController::class, 'destroy'])->name('roles.destroy');

        Route::get('/permissions', [\App\Http\Controllers\PermissionController::class, 'index'])->name('permissions.index');
        Route::post('/permissions', [\App\Http\Controllers\PermissionController::class, 'store'])->name('permissions.store');
        Route::put('/permissions/{id}', [\App\Http\Controllers\PermissionController::class, 'update'])->name('permissions.update');
        Route::delete('/permissions/{id}', [\App\Http\Controllers\PermissionController::class, 'destroy'])->name('permissions.destroy');
    });

    // Auditoría (Super Admin y Admin)
    Route::middleware(['role:Super admin|Super Admin|Administrador|Admin'])->group(function () {
        Route::get('/auditoria', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('auditoria.index');
        Route::post('/auditoria/marcar-todas-leidas', [\App\Http\Controllers\AuditLogController::class, 'markAllAsRead'])->name('auditoria.mark-all-read');
        Route::post('/auditoria/{auditLog}/marcar-leido', [\App\Http\Controllers\AuditLogController::class, 'markAsRead'])->name('auditoria.mark-read');
        Route::delete('/auditoria/{auditLog}', [\App\Http\Controllers\AuditLogController::class, 'destroy'])->name('auditoria.destroy');
    });

    // Configuración de la Asociación y Firmantes
    Route::middleware(['role:Super admin|Presidente|Secretario|Comite disciplina'])->group(function () {
        Route::get('/configuracion/asociacion', [ConfiguracionAsociacionController::class, 'index'])->name('configuracion.asociacion');
        Route::post('/configuracion/asociacion', [ConfiguracionAsociacionController::class, 'update'])->name('configuracion.asociacion.update');
    });

    // Módulos ABM (View)
    Route::middleware(['permission:ver clubes'])->group(function () {
        Route::get('clubes', [ClubController::class, 'index'])->name('clubes.index');
    });

    Route::middleware(['permission:ver jugadores'])->group(function () {
        Route::get('jugadores', [JugadorController::class, 'index'])->name('jugadores.index');
    });

    Route::middleware(['permission:ver torneos'])->group(function () {
        Route::resource('torneos', TorneoController::class)->only(['index', 'show']);
        Route::get('torneos/{torneo}/fases/{fase}', [TorneoController::class, 'showFase'])->name('fases.show');
    });

    Route::middleware(['permission:ver fondos'])->group(function () {
        Route::get('fondos-solidarios', [\App\Http\Controllers\FondoSolidarioController::class, 'index'])->name('fondos.index');
    });

    Route::middleware(['permission:gestionar clubes'])->group(function () {
        Route::post('clubes', [ClubController::class, 'store'])->name('clubes.store');
        Route::put('clubes/{club}', [ClubController::class, 'update'])->name('clubes.update');
        Route::delete('clubes/{club}', [ClubController::class, 'destroy'])->name('clubes.destroy');
    });

    Route::middleware(['permission:gestionar jugadores'])->group(function () {
        Route::post('jugadores', [JugadorController::class, 'store'])->name('jugadores.store');
        Route::put('jugadores/{jugador}', [JugadorController::class, 'update'])->name('jugadores.update');
        Route::delete('jugadores/{jugador}', [JugadorController::class, 'destroy'])->name('jugadores.destroy');
    });

    Route::middleware(['permission:gestionar torneos'])->group(function () {
        Route::resource('torneos', TorneoController::class)->except(['index', 'show']);
        Route::post('torneos/campeonatos', [TorneoController::class, 'storeCampeonato'])->name('torneos.campeonato.store');
        Route::put('torneos/campeonatos/{campeonato}', [TorneoController::class, 'updateCampeonato'])->name('torneos.campeonato.update');
        Route::post('torneos/fases', [TorneoController::class, 'storeFase'])->name('torneos.fase.store');
        Route::put('torneos/fases/{fase}', [TorneoController::class, 'updateFase'])->name('torneos.fase.update');
        Route::delete('torneos/{torneo}/fases/{fase}', [TorneoController::class, 'destroyFase'])->name('fases.destroy');
    });

    Route::middleware(['permission:gestionar fondos'])->group(function () {
        Route::post('fondos-solidarios', [\App\Http\Controllers\FondoSolidarioController::class, 'store'])->name('fondos.store');
        Route::put('fondos-solidarios/{fondo}', [\App\Http\Controllers\FondoSolidarioController::class, 'update'])->name('fondos.update');
        Route::delete('fondos-solidarios/{fondo}', [\App\Http\Controllers\FondoSolidarioController::class, 'destroy'])->name('fondos.destroy');
    });

    // Tribunal de Disciplina - rutas con prefijo tribunal.*
    Route::prefix('tribunal')->middleware(['permission:ver tribunal'])->group(function () {
        Route::get('/', [SancionController::class, 'index'])->name('tribunal.index');

        // Sanciones - crear y editar
        Route::middleware(['permission:gestionar sanciones'])->group(function () {
            Route::post('/sanciones', [SancionController::class, 'store'])->name('tribunal.sanciones.store');
            Route::put('/sanciones/{sancion}', [SancionController::class, 'update'])->name('tribunal.sanciones.update');
        });

        // Notas - crear y editar
        Route::middleware(['permission:gestionar notas'])->group(function () {
            Route::post('/notas', [NotaDisciplinaController::class, 'store'])->name('tribunal.notas.store');
            Route::put('/notas/{nota}', [NotaDisciplinaController::class, 'update'])->name('tribunal.notas.update');
        });

        // PDFs - accesibles para todos los que pueden ver el tribunal
        Route::get('/sanciones/{id}/oficio', [SancionController::class, 'emitirOficio'])->name('tribunal.sanciones.oficio');
        Route::get('/acta', [SancionController::class, 'emitirActaFecha'])->name('tribunal.acta');
    });

    // Comité de Ética - rutas con prefijo etica.*
    Route::prefix('etica')->middleware(['permission:ver etica'])->group(function () {
        Route::get('/', [EticaController::class, 'index'])->name('etica.index');
        Route::get('/{id}/oficio/{tipo}', [EticaController::class, 'emitirOficio'])->name('etica.oficio');

        Route::middleware(['permission:gestionar etica'])->group(function () {
            Route::post('/', [EticaController::class, 'store'])->name('etica.store');
            Route::put('/{id}', [EticaController::class, 'update'])->name('etica.update');
            Route::delete('/{id}', [EticaController::class, 'destroy'])->name('etica.destroy');
        });
    });
    // Referencias de Oficios Dinámicas
    Route::middleware(['permission:gestionar sanciones|gestionar notas|gestionar etica'])->group(function () {
        Route::post('/referencias-oficio', [\App\Http\Controllers\ReferenciaOficioController::class, 'store'])->name('referencias-oficio.store');
        Route::delete('/referencias-oficio/{id}', [\App\Http\Controllers\ReferenciaOficioController::class, 'destroy'])->name('referencias-oficio.destroy');
    });
});

require __DIR__.'/auth.php';
