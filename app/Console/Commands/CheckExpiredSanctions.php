<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Sancion;
use Carbon\Carbon;

class CheckExpiredSanctions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-expired-sanctions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for expired time-based sanctions and update their status to CUMPLIDO';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::now()->toDateString();

        $updatedCount = Sancion::where('tipo_sancion', 'TIEMPO')
            ->where('estado', 'ACTIVO')
            ->whereNotNull('fecha_termino_cronologica')
            ->whereDate('fecha_termino_cronologica', '<=', $today)
            ->update(['estado' => 'CUMPLIDO']);

        $this->info("Updated {$updatedCount} expired sanctions to CUMPLIDO.");
    }
}
