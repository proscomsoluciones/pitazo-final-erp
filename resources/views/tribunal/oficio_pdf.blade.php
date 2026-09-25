<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $oficio->folio }} - Oficio Disciplinario</title>
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
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.45;
        }

        /* ── MARCA DE AGUA ── */
        .watermark {
            position: fixed;
            top: 260px;
            left: 0;
            width: 100%;
            text-align: center;
            z-index: -1;
        }
        .watermark img {
            width: 320px;
            height: 320px;
            opacity: 0.05;
        }

        /* ── ENCABEZADO INSTITUCIONAL ── */
        .header-table {
            width: 100%;
            table-layout: fixed;
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
        .doc-title {
            display: inline-block;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8pt;
            font-weight: bold;
            color: #ffffff;
            background-color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 3px 8px;
            border-radius: 3px;
            text-align: center;
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
            color: #64748b;
            font-weight: bold;
            margin-bottom: 6px;
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

        /* ── DE / A ── */
        .de-a-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11pt;
        }
        .de-a-table td {
            border: none !important;
            padding: 3px 0;
            vertical-align: top;
        }
        .de-a-label {
            font-weight: bold;
            width: 45px;
            color: #0f172a;
        }
        .de-a-value {
            font-weight: bold;
            color: #1e293b;
        }

        /* ── CUERPO ── */
        .saludo {
            font-weight: bold;
            margin-bottom: 12px;
            color: #0f172a;
        }
        .body-text {
            text-align: justify;
            margin-bottom: 12px;
            font-size: 11pt;
            line-height: 1.55;
        }
        .body-text strong {
            font-weight: bold;
            color: #0f172a;
        }

        /* Bloque de sanción aplicada */
        .sancion-box {
            background-color: #fcf2f2;
            border-left: 4px solid #dc2626;
            border-top: 1px solid #fecaca;
            border-right: 1px solid #fecaca;
            border-bottom: 1px solid #fecaca;
            padding: 12px 16px;
            margin: 16px 0;
            border-radius: 4px;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            page-break-inside: avoid;
        }
        .sancion-box .sancion-title {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9.5pt;
            color: #dc2626;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .sancion-detail-table {
            width: 100%;
            border-collapse: collapse;
        }
        .sancion-detail-table td {
            border: none !important;
            padding: 3px 0;
            vertical-align: top;
        }
        .sancion-lbl {
            font-weight: bold;
            width: 150px;
            color: #334155;
        }
        .sancion-val {
            color: #0f172a;
        }

        /* Bloque habilitación */
        .hab-box {
            background-color: #ecfdf5;
            border-left: 4px solid #059669;
            border-top: 1px solid #a7f3d0;
            border-right: 1px solid #a7f3d0;
            border-bottom: 1px solid #a7f3d0;
            padding: 12px 16px;
            margin: 16px 0;
            border-radius: 4px;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10.5pt;
            font-weight: bold;
            color: #047857;
            page-break-inside: avoid;
        }

        /* ── CIERRE ── */
        .closing {
            margin-top: 18px;
            font-size: 11pt;
        }
        .atentamente {
            margin-top: 25px;
            font-weight: bold;
            font-size: 11pt;
        }
        .comite-firma {
            margin-top: 2px;
            font-size: 10.5pt;
            margin-bottom: 10px;
            color: #334155;
        }

        /* ── FIRMAS ── */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 55px;
            page-break-inside: avoid;
        }
        .signatures-table td {
            border: none !important;
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 35px;
        }
        .sig-line {
            border-top: 1.5px solid #0f172a;
            margin: 0 auto 5px auto;
            width: 100%;
        }
        .sig-name {
            font-weight: bold;
            font-size: 10pt;
            text-transform: uppercase;
            color: #0f172a;
        }
        .sig-role {
            font-size: 8.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
        }

        /* ── DISTRIBUCIÓN ── */
        .distribucion {
            margin-top: 30px;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            color: #475569;
            page-break-inside: avoid;
        }
        .dist-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
            color: #0f172a;
        }
        .dist-item {
            padding-left: 12px;
            margin-bottom: 2px;
        }

        /* ── PIE ── */
        .footer {
            margin-top: 20px;
            font-size: 8pt;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            font-family: 'Helvetica', 'Arial', sans-serif;
        }

        .confidencial-note {
            margin-top: 18px;
            padding: 6px 10px;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            text-align: center;
            font-size: 7pt;
            font-style: italic;
            color: #64748b;
            font-family: 'Helvetica', 'Arial', sans-serif;
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
                <div class="city-date">{{ $asoc->ciudad ?? 'Catemu' }}, {{ \Carbon\Carbon::parse($oficio->fecha_emision)->translatedFormat('j \d\e F \d\e Y') }}</div>
                <div class="oficio-num-box">
                    <div class="oficio-num-label">OFICIO N°</div>
                    <div class="oficio-num">{{ str_replace('CED-', '', $oficio->numero_secuencial ?: $oficio->folio) }}</div>
                </div>
                <div style="font-size: 8pt; font-weight: bold; color: #334155; margin-top: 4px;">
                    REF: {{ $sancion->estado === 'ACTIVO' ? 'Notificación de Sanción' : 'Comunica Resolución' }}
                </div>
            </td>
        </tr>
    </table>
    <table class="header-bar-table"><tr>
        <td class="header-bar-navy"></td><td class="header-bar-red"></td>
    </tr></table>

    {{-- DE / A --}}
    <table class="de-a-table">
        <tr>
            <td class="de-a-label">DE:</td>
            <td class="de-a-value">Comité de Disciplina</td>
        </tr>
        <tr>
            <td class="de-a-label">A:</td>
            <td class="de-a-value">
                {{ $sancion->club->name ?? '' }}
            </td>
        </tr>
    </table>

    {{-- CUERPO --}}
    <p class="saludo">Estimados señores:</p>

    @if($sancion->estado === 'ACTIVO')
        {{-- OFICIO DE SANCIÓN --}}
        <p class="body-text">
            Junto con saludar, el Comité de Disciplina informa que, en reunión celebrada con fecha
            <strong>{{ \Carbon\Carbon::parse($sancion->fecha_resolucion)->translatedFormat('j \d\e F \d\e Y') }}</strong>,
            se ha resuelto sancionar al
            @if($sancion->jugador)
                jugador <strong>{{ $sancion->jugador->nombre }}</strong>,
                con RUT <strong>{{ \App\Helpers\RutHelper::format($sancion->jugador->rut) }}</strong>,
                perteneciente al  <strong>{{ $sancion->club->name }}</strong>,
            @else
                club <strong>{{ $sancion->club->name }}</strong>,
            @endif
            conforme a lo establecido en el
            <strong>{{ $sancion->articulo_reglamento }}</strong>
            del Reglamento ANFA vigente, aplicándose la siguiente sanción:
        </p>

        <div class="sancion-box">
            <div class="sancion-title">RESOLUCIÓN &mdash; SANCIÓN APLICADA</div>
            <table class="sancion-detail-table">
                <tr>
                    <td class="sancion-lbl">Tipo de infracción:</td>
                    <td class="sancion-val">{{ $sancion->tipo_infraccion ?? 'Infracción reglamentaria' }}</td>
                </tr>
                <tr>
                    <td class="sancion-lbl">Sanción impuesta:</td>
                    <td class="sancion-val">
                        <strong>{{ $sancion->sancion_texto }}</strong>
                    </td>
                </tr>
                @if($sancion->tipo_sancion === 'TIEMPO' && $sancion->fecha_termino_cronologica)
                    <tr>
                        <td class="sancion-lbl">Cumple la sanción el:</td>
                        <td class="sancion-val">
                            <strong>{{ $sancion->fecha_termino_cronologica->translatedFormat('j \d\e F \d\e Y') }}</strong>
                        </td>
                    </tr>
                @endif
                @if($sancion->campeonato)
                    <tr>
                        <td class="sancion-lbl">Campeonato:</td>
                        <td class="sancion-val">
                            {{ $sancion->campeonato->nombre }}@if($sancion->fase) &mdash; {{ $sancion->fase->nombre }}@endif @if($sancion->numero_fecha), Fecha {{ $sancion->numero_fecha }}@endif
                        </td>
                    </tr>
                @endif
                @if($sancion->observaciones)
                    <tr>
                        <td class="sancion-lbl">Observaciones:</td>
                        <td class="sancion-val">{{ $sancion->observaciones }}</td>
                    </tr>
                @endif
            </table>
        </div>

        <p class="body-text">
            Por tanto, el jugador o dirigente queda <strong>SUSPENDIDO</strong> y no podrá participar en competiciones oficiales durante el período indicado.
        </p>

    @else
        {{-- OFICIO DE HABILITACIÓN --}}
        <p class="body-text">
            Por medio de la presente, se notifica formalmente al
            <strong>{{ $sancion->club ? $sancion->club->name : 'club' }}</strong>
            la resolución respecto a la sanción aplicada al
            @if($sancion->jugador)
                jugador <strong>{{ $sancion->jugador->nombre }}</strong>,
                RUT: <strong>{{ \App\Helpers\RutHelper::format($sancion->jugador->rut) }}</strong>,
            @else
                club <strong>{{ $sancion->club ? $sancion->club->name : '' }}</strong>,
            @endif
            conforme a lo establecido en el
            <strong>{{ $sancion->articulo_reglamento }}</strong>
            del Reglamento vigente.
        </p>

        <p class="body-text">
            Este Comité ha resuelto que la sanción de
            <strong>{{ $sancion->sancion_texto }}</strong>
            ha sido <strong>cumplida en su totalidad</strong> a la fecha de emisión del presente oficio.
        </p>

        <div class="hab-box">
            Por lo tanto, el jugador queda HABILITADO para participar en el campeonato oficial.
        </div>
    @endif

    <p class="closing">
        @if(isset($tipoOficio) && $tipoOficio !== 'RESOLUCION')
            Sin otro particular, se comunica el presente oficio para su conocimiento y fines pertinentes.
        @else
            Sin otro particular, se comunica la presente resolución para su conocimiento y debido cumplimiento.
        @endif
    </p>

    <p class="atentamente">Atentamente,</p>

    @if(!isset($tipoOficio) || $tipoOficio === 'RESOLUCION')
        {{-- RESOLUCIONES: Firma el Presidente y el Secretario de la Asociación --}}
        <p class="comite-firma">
            Asociación de Fútbol de {{ $asoc->ciudad ?? 'Catemu' }}
        </p>

        <table class="signatures-table">
            <tr>
                <td>
                    <div class="sig-line"></div>
                    <div class="sig-name">{{ $secretario_nombre }}</div>
                    <div class="sig-role">SECRETARIO</div>
                </td>
                <td>
                    <div class="sig-line"></div>
                    <div class="sig-name">{{ $presidente_nombre }}</div>
                    <div class="sig-role">PRESIDENTE ASOCIACIÓN</div>
                </td>
            </tr>
        </table>
    @else
        {{-- DEMÁS DOCUMENTOS: Firma la Comisión de Disciplina --}}
        <p class="comite-firma">
            Comisión de Disciplina<br>
            {{ $asoc->nombre }}
        </p>

        <table class="signatures-table">
            <tr>
                @if(!empty($asoc->disciplina_presidente) || !empty($asoc->disciplina_secretario) || !empty($asoc->disciplina_integrante_3))
                    @if(!empty($asoc->disciplina_secretario))
                        <td>
                            <div class="sig-line"></div>
                            <div class="sig-name">{{ Str::upper($asoc->disciplina_secretario) }}</div>
                            <div class="sig-role">SECRETARIO COMISIÓN</div>
                        </td>
                    @endif
                    @if(!empty($asoc->disciplina_presidente))
                        <td>
                            <div class="sig-line"></div>
                            <div class="sig-name">{{ Str::upper($asoc->disciplina_presidente) }}</div>
                            <div class="sig-role">PRESIDENTE COMISIÓN</div>
                        </td>
                    @endif
                    @if(!empty($asoc->disciplina_integrante_3))
                        <td>
                            <div class="sig-line"></div>
                            <div class="sig-name">{{ Str::upper($asoc->disciplina_integrante_3) }}</div>
                            <div class="sig-role">COMISIÓN DE DISCIPLINA</div>
                        </td>
                    @endif
                @else
                    <td>
                        <div class="sig-line" style="width: 220px; margin: 0 auto 6px auto;"></div>
                        <div class="sig-name">COMISIÓN DE DISCIPLINA</div>
                        <div class="sig-role">COMITÉ DE DISCIPLINA {{ Str::upper($asoc->nombre ?? '') }}</div>
                    </td>
                @endif
            </tr>
        </table>
    @endif

    {{-- DISTRIBUCIÓN --}}
    <div class="distribucion">
        <div class="dist-title">DISTRIBUCIÓN:</div>
        @if($sancion->club)
            <div class="dist-item">&bull; {{ $sancion->club->name }}</div>
        @endif
        <div class="dist-item">&bull; Comité de Disciplina {{ $asoc->nombre }}</div>
        <div class="dist-item">&bull; Archivo {{ $asoc->nombre }}</div>
    </div>

    {{-- PIE --}}
    <div class="confidencial-note">
        Este documento contiene datos personales de uso exclusivo para el destinatario indicado, conforme a la Ley N° 19.628 sobre Protección de la Vida Privada. Queda prohibida su difusión a terceros no autorizados.
    </div>

    <div class="footer">
        Documento oficial N° {{ str_replace('CED-', '', $oficio->folio) }} &bull; Generado el {{ \Carbon\Carbon::now()->translatedFormat('j \d\e F \d\e Y') }} &bull; Sistema Pitazo Final
    </div>

</body>
</html>
