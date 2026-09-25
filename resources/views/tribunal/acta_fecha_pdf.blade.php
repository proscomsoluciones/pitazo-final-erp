<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Acta de Comité de Disciplina - Fecha {{ $numero_fecha }}</title>
    <style>
        @page {
            margin: 10mm 20mm 20mm 20mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9.5pt;
            color: #1e293b;
            background-color: #ffffff;
            line-height: 1.4;
        }

        /* ── MARCA DE AGUA ── */
        .watermark {
            position: fixed;
            top: 220px;
            left: 0;
            width: 100%;
            text-align: center;
            z-index: -1;
        }

        .watermark img {
            width: 280px;
            height: 280px;
            opacity: 0.05;
        }

        /* ── CABECERA INSTITUCIONAL (SIN BORDES EXTRA) ── */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
        }

        .header-table td {
            border: none !important;
            padding: 0;
            vertical-align: middle;
        }

        .logo-cell {
            width: 115px;
            padding-right: 8px !important;
        }

        .logo-frame {
            width: 110px;
            text-align: left;
        }

        .logo-frame-empty {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8pt;
            color: #94a3b8;
            font-weight: bold;
            padding: 30px 0;
            text-align: center;
            border: 1px dashed #cbd5e1;
            border-radius: 6px;
        }

        .logo-img {
            max-width: 108px;
            max-height: 95px;
            width: 105px;
            height: auto;
            display: block;
        }

        .assoc-cell {
            text-align: center;
            vertical-align: middle;
        }

        .assoc-name {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0px;
            white-space: nowrap;
            text-align: center;
            line-height: 1.2;
            margin-bottom: 2px;
        }

        .header-right {
            font-family: 'Helvetica', 'Arial', sans-serif;
            text-align: right;
            vertical-align: middle;
            width: 185px;
            padding-left: 6px !important;
        }

        .city-date {
            font-size: 8.5pt;
            color: #334155;
            font-weight: bold;
            margin-bottom: 4px;
            white-space: nowrap;
        }

        .oficio-num-box {
            display: inline-block;
            border: 1.5px solid #1e3a8a;
            border-radius: 4px;
            padding: 5px 10px;
        }

        .oficio-num-label {
            font-size: 6.5pt;
            font-weight: bold;
            color: #64748b;
            letter-spacing: 0.6px;
            margin-bottom: 1px;
        }

        .oficio-num {
            font-size: 10.5pt;
            font-weight: bold;
            color: #1e3a8a;
            letter-spacing: 0.2px;
            white-space: nowrap;
        }

        .header-bar-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
            margin-bottom: 20px;
        }

        .header-bar-table td {
            border: none !important;
            padding: 0;
            height: 5px;
            line-height: 5px;
            font-size: 1px;
        }

        .header-bar-navy {
            width: 85%;
            background-color: #1e3a8a;
        }

        .header-bar-red {
            width: 15%;
            background-color: #dc2626;
        }

        /* ── BANNER METADATOS DE LA FECHA ── */
        .meta-banner {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 14px;
            margin-bottom: 10px;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }

        .meta-table td {
            border: none !important;
            padding: 2px 4px;
            font-size: 9.5pt;
            color: #334155;
        }

        .meta-label {
            font-weight: bold;
            color: #0f172a;
        }

        /* ── TABLA PRINCIPAL DE SANCIONES ── */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-bottom: 12px;
        }

        .data-table th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8.5pt;
            letter-spacing: 0.4px;
            padding: 8px 6px;
            border: 1px solid #1e3a8a;
            text-align: left;
        }

        .data-table td {
            border: 1px solid #cbd5e1;
            padding: 5px 6px;
            vertical-align: top;
        }

        .data-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .badge-sancion {
            font-weight: bold;
            color: #dc2626;
            background-color: #fef2f2;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #fecaca;
            display: inline-block;
            text-align: center;
        }

        .cumple-nota {
            font-size: 7pt;
            color: #64748b;
            margin-top: 2px;
            font-style: italic;
        }

        .empty-row {
            text-align: center;
            color: #64748b;
            font-style: italic;
            padding: 16px !important;
        }

        /* ── SECCIÓN DE NOTAS / MULTAS ── */
        .section-header {
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
            border-left: 4px solid #1e3a8a;
            padding-left: 8px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .notes-list {
            list-style: none;
            padding: 0;
            margin: 0 0 10px 0;
        }

        .notes-list li {
            position: relative;
            padding-left: 18px;
            margin-bottom: 5px;
            font-size: 9.5pt;
            color: #334155;
            line-height: 1.3;
        }

        .notes-list li::before {
            content: "•";
            position: absolute;
            left: 4px;
            top: -1px;
            color: #059669;
            font-size: 14pt;
            font-weight: bold;
        }

        .monto-tag {
            font-weight: bold;
            color: #ffffff;
            background-color: #047857;
            padding: 2px 8px;
            border-radius: 3px;
            border: 1px solid #047857;
            margin-left: 4px;
            display: inline-block;
        }

        .monto-tag.aporte-tag {
            background-color: #1d4ed8;
            border-color: #1d4ed8;
        }

        /* ── FIRMAS INSTITUCIONALES ── */
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 100px;
        }

        .signature-table td {
            border: none !important;
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 35px;
        }

        .signature-line {
            border-top: 1.5px solid #0f172a;
            margin: 0 auto 6px auto;
            width: 100%;
        }

        .signature-name {
            font-size: 9.5pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
        }

        .signature-role {
            font-size: 8.5pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }

        /* ── PIE DE PÁGINA ── */
        .pdf-footer {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 8pt;
            color: #94a3b8;
        }

        .confidencial-note {
            margin-top: 8px;
            padding: 5px 10px;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            text-align: center;
            font-size: 7pt;
            font-style: italic;
            color: #64748b;
        }
    </style>
</head>

<body>

    @php
        $logoPath = null;
        if (isset($asoc) && $asoc->logo_abs_path) {
            $logoPath = $asoc->logo_abs_path;
        } elseif (file_exists(public_path('img/logo_pdf.png'))) {
            $logoPath = public_path('img/logo_pdf.png');
        } elseif (file_exists(public_path('img/logo.png'))) {
            $logoPath = public_path('img/logo.png');
        }
        $logoBase64 = null;
        if ($logoPath) {
            $mime = match (strtolower(pathinfo($logoPath, PATHINFO_EXTENSION))) {
                'jpg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                'svg' => 'image/svg+xml',
                default => 'image/png',
            };
            $logoBase64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($logoPath));
        }
    @endphp

    @if($logoBase64)
        <div class="watermark">
            <img src="{{ $logoBase64 }}" alt="">
        </div>
    @endif

    {{-- ENCABEZADO INSTITUCIONAL --}}
    <table class="header-table">
        <tr>
            <td class="logo-cell">
                @if($logoBase64)
                    <div class="logo-frame">
                        <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo Asociación">
                    </div>
                @else
                    <div class="logo-frame logo-frame-empty">SIN<br>LOGO</div>
                @endif
            </td>
            <td class="assoc-cell">
                <div class="assoc-name">{{ Str::upper($asoc->nombre ?? 'ASOCIACIÓN DE FÚTBOL CATEMU') }}</div>
            </td>
            <td class="header-right">
                <div class="city-date">{{ $asoc->ciudad ?? 'Catemu' }}, {{ \Carbon\Carbon::parse($fecha_emision)->translatedFormat('j \d\e F \d\e Y') }}</div>
                <div class="oficio-num-box">
                    <div class="oficio-num-label">ACTA N°</div>
                    <div class="oficio-num">{{ $numero_fecha }}-{{ \Carbon\Carbon::parse($fecha_emision)->format('Y') }}
                    </div>
                </div>
            </td>
        </tr>
    </table>
    <table class="header-bar-table">
        <tr>
            <td class="header-bar-navy"></td>
            <td class="header-bar-red"></td>
        </tr>
    </table>

    {{-- BANNER DE METADATOS DE LA FECHA --}}
    <div class="meta-banner">
        <table class="meta-table">
            <tr>
                <td width="45%">
                    <span class="meta-label">Campeonato:</span> {{ $campeonato->nombre }}
                </td>
                <td width="30%">
                    <span class="meta-label">Fase:</span> {{ $fase->nombre }}
                </td>
                <td width="25%" style="text-align: right;">
                    <span class="meta-label">Fecha Jugada:</span> N° {{ $numero_fecha }}
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <span class="meta-label">Emisión de Acta:</span>
                    {{ \Carbon\Carbon::parse($fecha_emision)->translatedFormat('d \d\e F \d\e Y') }}
                </td>
                <td style="text-align: right;">
                    <span class="meta-label">Acta de Sanciones</span>
                </td>
            </tr>
        </table>
    </div>

    {{-- TABLA DE SANCIONES APLICADAS --}}
    <table class="data-table">
        <thead>
            <tr>
                <th width="16%">Club</th>
                <th width="22%">Jugador / Involucrado</th>
                <th width="11%">Artículo</th>
                <th width="11%" style="text-align: center;">Sanción</th>
            </tr>
        </thead>
        <tbody>
            @forelse($sanciones as $sancion)
                @php
                    $esReincidente = $sancion->observacion && str_contains($sancion->observacion, 'Reincidencia');
                @endphp
                <tr>
                    <td><strong>{{ $sancion->club->name }}</strong></td>
                    <td>{{ $sancion->jugador ? $sancion->jugador->nombre : 'Sanción Aplicada al Club' }}</td>
                    <td><strong>{{ $sancion->articulo_reglamento }}</strong></td>
                    <td style="text-align: center;">
                        <span class="badge-sancion">
                            @if($esReincidente && $sancion->cantidad_sancion > 1)
                                {{ $sancion->cantidad_sancion - 1 }}+1 {{ $sancion->unidad_tiempo_texto }} (R)
                            @else
                                {{ $sancion->cantidad_sancion }} {{ $sancion->unidad_tiempo_texto }}
                            @endif
                        </span>
                        @if($sancion->tipo_sancion === 'TIEMPO' && $sancion->fecha_termino_cronologica)
                            <div class="cumple-nota">Cumple: {{ $sancion->fecha_termino_cronologica->format('d/m/Y') }}</div>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="empty-row">
                        No se registraron sanciones disciplinarias en la presente fecha jugada.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- NOTAS Y OBSERVACIONES GENERALES --}}
    @if($notas->count() > 0)
        <div style="margin-top: 10px;">
            <div class="section-header">Notas</div>
            <ul class="notes-list">
                @foreach($notas as $nota)
                    @php
                        $esAporte = str_starts_with($nota->nota, 'Fondo Solidario');
                    @endphp
                    <li>
                        @if($nota->club)
                            <strong>{{ $nota->club->name }}:</strong>
                        @endif
                        {{ $nota->nota }}
                        @if($nota->monto)
                            <span class="monto-tag {{ $esAporte ? 'aporte-tag' : '' }}">{{ $esAporte ? 'Aporte' : 'Multa' }}: ${{ number_format($nota->monto, 0, ',', '.') }}.-</span>
                        @endif
                    </li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- FONDOS SOLIDARIOS --}}
    @if($fondos->count() > 0)
        <div style="margin-top: 10px;">
            <div class="section-header">Fondos Solidarios</div>
            <ul class="notes-list">
                @foreach($fondos as $fondo)
                    <li>
                        {{ $fondo->numero_fondo ? 'Fondo N°' . $fondo->numero_fondo . ' - ' : '' }}{{ $fondo->jugador_nombre }} ({{ $fondo->club->name ?? 'Club' }}){{ $fondo->diagnostico ? ' - ' . $fondo->diagnostico : '' }}
                        @if($fondo->monto_asignado)
                            <span class="monto-tag aporte-tag">Aporte{{ $fondo->tipo_beneficio ? ' ' . $fondo->tipo_beneficio : '' }}: ${{ number_format($fondo->monto_asignado, 0, ',', '.') }}.-</span>
                        @endif
                    </li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- FIRMAS INSTITUCIONALES --}}
    <table class="signature-table">
        <tr>
            <td>
                <div class="signature-line"></div>
                <div class="signature-name">{{ Str::upper($asoc->nombre_secretario ?: 'Franco Cortés O.') }}</div>
                <div class="signature-role">Secretario</div>
            </td>
            <td>
                <div class="signature-line"></div>
                <div class="signature-name">{{ Str::upper($asoc->nombre_presidente ?: 'Juan Cornejo G.') }}</div>
                <div class="signature-role">Presidente</div>
            </td>
        </tr>
    </table>

    {{-- PIE DE PÁGINA --}}
    <div class="confidencial-note">
        Este documento contiene datos personales de uso exclusivo para el destinatario indicado, conforme a la Ley N° 19.628 sobre Protección de la Vida Privada. Queda prohibida su difusión a terceros no autorizados.
    </div>

    <div class="pdf-footer">
        Documento oficial emitido automáticamente por el Sistema de Gestión Deportiva Pitazo Final &bull;
        {{ $asoc->nombre }}
    </div>

</body>

</html>