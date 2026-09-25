<?php

namespace App\Http\Controllers;

use App\Models\ConfiguracionAsociacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ConfiguracionAsociacionController extends Controller
{
    public function index()
    {
        $config = ConfiguracionAsociacion::instancia();

        return Inertia::render('Configuracion/Asociacion', [
            'config' => array_merge($config->toArray(), [
                'logo_url' => $config->logo_url,
            ]),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'nombre'            => 'required|string|max:255',
            'rut'               => 'nullable|string|max:50',
            'ciudad'            => 'nullable|string|max:255',
            'direccion'         => 'nullable|string|max:255',
            'telefono'          => 'nullable|string|max:50',
            'correo'            => 'nullable|email|max:255',
            'sitio_web'         => 'nullable|url|max:255',
            'nombre_presidente'     => 'nullable|string|max:255',
            'nombre_secretario'     => 'nullable|string|max:255',
            'etica_integrante_1'    => 'nullable|string|max:255',
            'etica_integrante_2'    => 'nullable|string|max:255',
            'etica_integrante_3'    => 'nullable|string|max:255',
            'disciplina_presidente' => 'nullable|string|max:255',
            'disciplina_secretario' => 'nullable|string|max:255',
            'disciplina_integrante_3'=> 'nullable|string|max:255',
            'descripcion'           => 'nullable|string|max:500',
            'logo'                  => 'nullable|image|mimes:png,jpg,jpeg,svg|max:2048',
        ]);

        $config = ConfiguracionAsociacion::instancia();

        // Manejar subida del logo
        if ($request->hasFile('logo')) {
            // Eliminar logo anterior
            if ($config->logo_path) {
                Storage::disk('public')->delete($config->logo_path);
                // Eliminar también la versión PDF si existe
                Storage::disk('public')->delete(str_replace('logos/', 'logos/pdf_', $config->logo_path));
            }

            $file = $request->file('logo');
            $path = $file->store('logos', 'public');
            $data['logo_path'] = $path;

            // Crear versión optimizada para PDF (120x120)
            $this->crearLogoPdf(storage_path('app/public/' . $path));
        }

        unset($data['logo']); // quitar el campo del Request, no es columna
        $config->update($data);

        // Actualizar también logo_pdf.png en public/img/ para el template blade
        if (isset($data['logo_path'])) {
            $srcPath = storage_path('app/public/' . $data['logo_path']);
            $this->copiarLogoParaPdf($srcPath);
        }

        \App\Support\Auditor::log('EDITAR', 'CONFIGURACION', 'Actualizó la configuración de la asociación.');

        return redirect()->back()->with('success', 'Configuración de la asociación actualizada correctamente.');
    }

    /**
     * Crea una versión reducida 120x120 del logo para uso en PDFs.
     */
    private function crearLogoPdf(string $srcPath): void
    {
        try {
            $destPath = public_path('img/logo_pdf.png');
            $ext = strtolower(pathinfo($srcPath, PATHINFO_EXTENSION));

            $orig = match($ext) {
                'jpg', 'jpeg' => imagecreatefromjpeg($srcPath),
                'png'         => imagecreatefrompng($srcPath),
                default       => null,
            };

            if (!$orig) return;

            [$w, $h] = getimagesize($srcPath);
            $size = 120;
            $resized = imagecreatetruecolor($size, $size);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
            imagefill($resized, 0, 0, $transparent);
            imagecopyresampled($resized, $orig, 0, 0, 0, 0, $size, $size, $w, $h);
            imagepng($resized, $destPath, 7);

            imagedestroy($orig);
            imagedestroy($resized);
        } catch (\Exception $e) {
            // Ignorar errores de procesamiento de imagen
        }
    }

    /**
     * Copia el logo original a public/img/ para respaldo.
     */
    private function copiarLogoParaPdf(string $srcPath): void
    {
        try {
            $destPath = public_path('img/logo.png');
            if (file_exists($srcPath)) {
                copy($srcPath, $destPath);
            }
            $this->crearLogoPdf($srcPath);
        } catch (\Exception $e) {
            // Ignorar
        }
    }
}
