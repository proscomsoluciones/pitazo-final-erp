<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>{{ $caso->folio }} - Oficio del Comité de Ética</title>
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

        .assoc-rut {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 7px;
            letter-spacing: 0.2px;
        }

        .doc-title {
            display: inline-block;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 8.5pt;
            font-weight: bold;
            color: #ffffff;
            background-color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 4px 10px;
            border-radius: 3px;
        }

        .header-right {
            font-family: 'Helvetica', 'Arial', sans-serif;
            text-align: right;
            vertical-align: middle;
            width: 190px;
            padding-left: 8px !important;
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
            font-size: 11pt;
            font-weight: bold;
            color: #1e3a8a;
            white-space: nowrap;
            letter-spacing: 0.2px;
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

        /* ── TITULO DEL OFICIO ── */
        .document-title {
            text-align: center;
            font-size: 12.5pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 18px;
            letter-spacing: 0.5px;
            text-decoration: underline;
            color: #0f172a;
        }

        /* ── DE / A / ASUNTO ── */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11pt;
        }

        .meta-table td {
            border: none !important;
            padding: 3px 0;
            vertical-align: top;
        }

        .meta-label {
            font-weight: bold;
            width: 1%;
            white-space: nowrap;
            padding-right: 14px !important;
            color: #0f172a;
        }

        .meta-value {
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
            line-height: 1.55;
        }

        /* ── CAJA DE HIGHLIGHT ── */
        .highlight-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 12px 16px;
            margin: 16px 0;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            border-left: 4px solid #1e3a8a;
            border-radius: 4px;
        }

        .box-title {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9.5pt;
            margin-bottom: 6px;
            color: #1e3a8a;
        }

       
        /* ── FIRMAS ── */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 160px;
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

        /* ── DISTRIBUCION ── */
        .distribucion-box {
            margin-top: 30px;
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            font-weight: bold;
            color: #475569;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
        }

        .distribucion-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
            color: #0f172a;
        }

        /* ── PIE DE PAGINA ── */
        .footer {
            margin-top: 25px;
            font-size: 8pt;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
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
                <div class="city-date">{{ $asoc->ciudad ?? 'Catemu' }}, {{ $fechaEmision }}</div>
                <div class="oficio-num-box">
                    <div class="oficio-num-label">OFICIO N°</div>
                    <div class="oficio-num">{{ str_replace(['ET-', 'CET-', 'CED-'], '', $caso->folio) }}</div>
                </div>
                <div style="font-size: 8pt; font-weight: bold; color: #334155; margin-top: 4px;">
                    REF: {{ $caso->asunto ?: 'Comunica Resolución' }}
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

    {{-- DATOS DESTINATARIO Y ASUNTO --}}
    <table class="de-a-table">
        <tr>
            <td class="de-a-label">DE:</td>
            <td class="de-a-value">Comité de Ética</td>
        </tr>
        <tr>
            <td class="de-a-label">A:</td>
            <td class="de-a-value">
                @if($caso->club)
                    {{ $caso->club->name }}
                @elseif($caso->nombre_involucrado)
                    {{ $caso->nombre_involucrado }}
                @else
                    A quien corresponda
                @endif
            </td>
        </tr>
    </table>

    {{-- CONTENIDO DE ACUERDO AL TIPO DE OFICIO --}}
    @if($tipoOficio === 'INVESTIGACION')
        <p class="body-text">
            Por medio del presente oficio, el Comité de Ética comunica formalmente la <strong>Apertura de
                Investigación</strong>
            respecto a los antecedentes y hechos puestos en conocimiento de este órgano.
        </p>

        <div class="highlight-box">
            <div class="box-title">Antecedentes de la Investigación</div>

            <p style="margin-bottom: 3px;"><strong>Materia / Asunto:</strong> {{ $caso->asunto }}</p>
            <p><strong>Detalle:</strong>
                {{ $caso->descripcion ?: 'Bajo revisión y recolección de pruebas conforme al reglamento de ética.' }}
            </p>
        </div>

        <p class="body-text">
            Se solicita a las partes involucradas remitir cualquier antecedente, informe o prueba documental necesaria
            dentro del plazo reglamentario.
        </p>

    @elseif($tipoOficio === 'CITACION')
        <p class="body-text">
            Por medio del presente oficio, el Comité de Ética cita a comparecer en sesión oficial para tratar los hechos
            investigados bajo el expediente N°
            <strong>{{ ltrim(str_replace(['ET-', 'CET-', 'CED-'], '', $caso->folio), '0') ?: $caso->id }}</strong>.
        </p>

        <div class="highlight-box">
            <div class="box-title">Datos de la Citación</div>
            <p style="margin-bottom: 3px;"><strong>Fecha y Hora:</strong>
                {{ $caso->fecha_citacion ? $caso->fecha_citacion->format('d/m/Y H:i') . ' hrs' : 'Por confirmar' }}
            </p>
            <p style="margin-bottom: 3px;"><strong>Lugar de Comparecencia:</strong>
                {{ $caso->lugar_citacion ?: 'Sede Oficial de la Asociación' }}
            </p>
            <p><strong>Motivo de Citación:</strong> {{ $caso->asunto }}</p>
        </div>

        <p class="body-text">
            La asistencia a esta citación es de carácter obligatorio. En caso de incomparecencia injustificada, se resolverá
            en rebeldía conforme a los estatutos éticos vigentes.
        </p>

    @elseif($tipoOficio === 'INHABILITACION')
        <p class="body-text">
            Por medio del presente oficio, el Comité de Ética comunica formalmente la medida de
            <strong>INHABILITACIÓN</strong> respecto a las actividades oficiales de la asociación.
        </p>

        <div class="highlight-box">
            <div class="box-title">Alcance de la Inhabilitación</div>
            <p style="margin-bottom: 3px;"><strong>Período de Inhabilitación:</strong>
                Desde
                {{ $caso->fecha_inicio_inhabilitacion ? $caso->fecha_inicio_inhabilitacion->format('d/m/Y') : 'inmediato' }}
                @if($caso->fecha_fin_inhabilitacion) hasta {{ $caso->fecha_fin_inhabilitacion->format('d/m/Y') }}@else
                (indefinida / hasta nuevo aviso)@endif
            </p>
            <p style="margin-bottom: 3px;"><strong>Causa / Fundamento:</strong> {{ $caso->asunto }}</p>
            <p><strong>Efecto:</strong> Queda suspendido el ejercicio de funciones deportivas o administrativas en
                campeonatos oficiales.</p>
        </div>

    @else {{-- RESOLUCION --}}
        <p class="body-text">
            Por medio de la presente, se notifica formalmente al
            <strong>{{ $caso->club ? $caso->club->name : ($caso->nombre_involucrado ?: 'interesado') }}</strong>
            la resolución respecto a
            <strong>{{ $caso->asunto ?: 'la materia investigada' }}</strong>@if($caso->jugador) al jugador
                <strong>{{ $caso->jugador->nombre }}</strong>, RUT:
            <strong>{{ \App\Helpers\RutHelper::format($caso->jugador->rut) }}</strong>@elseif($caso->nombre_involucrado && $caso->nombre_involucrado !== ($caso->club->name ?? ''))
                al {{ $caso->cargo_involucrado ?: 'dirigente' }}, el Señor
                <strong>{{ $caso->nombre_involucrado }}</strong>@if($caso->rut_involucrado), RUT:
            <strong>{{ \App\Helpers\RutHelper::format($caso->rut_involucrado) }}</strong>@endif @endif.
        </p>

        <p class="body-text">
            @if(Str::startsWith(trim($caso->detalles_resolucion), ['Se ', 'se ', 'SE ']))
                Al respecto, {{ $caso->detalles_resolucion }}
            @else
                Al respecto, este Comité ha resuelto
                {{ $caso->detalles_resolucion ?: 'adoptar la resolución correspondiente considerando los aspectos reglamentarios de ANFA:' }}
            @endif
        </p>

        @if($caso->articulo_reglamento)
            <div class="highlight-box">
                <p style="margin-bottom: 4px;"><strong>Fundamento Legal:</strong> Se aplica el {{ $caso->articulo_reglamento }}
                    del Reglamento ANFA vigente.</p>
            </div>
        @endif

        @if($caso->resultado === 'HABILITADO' || str_contains(strtolower($caso->detalles_resolucion), 'habilitad'))
            <div class="hab-box">
                Por lo tanto, queda HABILITADO para participar en el campeonato oficial {{ \Carbon\Carbon::now()->year }}.
            </div>
        @endif
    @endif

    <p class="closing">
        @if(($tipoOficio ?? '') === 'RESOLUCION')
            Sin otro particular, se comunica la presente resolución para su conocimiento y debido cumplimiento.
        @else
            Sin otro particular, se comunica el presente oficio para su conocimiento y fines pertinentes.
        @endif
    </p>

    <p class="atentamente">Atentamente,</p>

    @if(($tipoOficio ?? '') === 'RESOLUCION')
        {{-- RESOLUCIONES: Firma el Presidente y el Secretario de la Asociación --}}
        <p class="comite-firma">
            Asociación de Fútbol de {{ $asoc->ciudad ?? 'Catemu' }}
        </p>

        <table class="signatures-table">
            <tr>
                <td>
                    <div class="sig-line"></div>
                    <div class="sig-name">{{ Str::upper($asoc->nombre_secretario ?: 'Franco Cortés O.') }}</div>
                    <div class="sig-role">SECRETARIO GENERAL</div>
                </td>
                <td>
                    <div class="sig-line"></div>
                    <div class="sig-name">{{ Str::upper($asoc->nombre_presidente ?: 'Juan Ramón Cornejo G.') }}</div>
                    <div class="sig-role">PRESIDENTE ASOCIACIÓN</div>
                </td>
            </tr>
        </table>
    @else
        {{-- DEMÁS DOCUMENTOS: Firma la Comisión de Ética --}}
        <p class="comite-firma">
            Comisión de Ética<br>
            {{ $asoc->nombre ?? 'ASOCIACIÓN DE FÚTBOL CATEMU' }}
        </p>

        <table class="signatures-table">
            <tr>
                @if(!empty($asoc->etica_integrante_1) || !empty($asoc->etica_integrante_2) || !empty($asoc->etica_integrante_3))
                    @if(!empty($asoc->etica_integrante_1))
                        <td>
                            <div class="sig-line"></div>
                            <div class="sig-name">{{ Str::upper($asoc->etica_integrante_1) }}</div>
                            <div class="sig-role">COMISIÓN DE ÉTICA</div>
                        </td>
                    @endif
                    @if(!empty($asoc->etica_integrante_2))
                        <td>
                            <div class="sig-line"></div>
                            <div class="sig-name">{{ Str::upper($asoc->etica_integrante_2) }}</div>
                            <div class="sig-role">COMISIÓN DE ÉTICA</div>
                        </td>
                    @endif
                    @if(!empty($asoc->etica_integrante_3))
                        <td>
                            <div class="sig-line"></div>
                            <div class="sig-name">{{ Str::upper($asoc->etica_integrante_3) }}</div>
                            <div class="sig-role">COMISIÓN DE ÉTICA</div>
                        </td>
                    @endif
                @else
                    <td>
                        <div class="sig-line" style="width: 220px; margin: 0 auto 6px auto;"></div>
                        <div class="sig-name">COMISIÓN DE ÉTICA</div>
                        <div class="sig-role">COMITÉ DE ÉTICA {{ Str::upper($asoc->nombre ?? '') }}</div>
                    </td>
                @endif
            </tr>
        </table>
    @endif
<br><br>
    {{-- SECCIÓN DE DISTRIBUCIÓN --}}
    <div class="distribucion">
        <div class="dist-title">DISTRIBUCIÓN:</div>
        <div class="dist-item">&bull;
            {{ $caso->club ? $caso->club->name : ($caso->jugador ? ($caso->jugador->club->name ?? 'Club Involucrado') : ($caso->nombre_involucrado ?: 'Interesado')) }}
        </div>
        <div class="dist-item">&bull; Comité de Ética {{ $asoc->nombre ?? 'Catemu' }}</div>
        <div class="dist-item">&bull; Archivo {{ $asoc->nombre ?? 'Catemu' }}</div>
    </div>

    {{-- PIE DE PAGINA --}}
    <div class="footer">
        Documento Oficial N° {{ ltrim(str_replace(['ET-', 'CET-', 'CED-'], '', $caso->folio), '0') ?: $caso->id }}
        &bull; Emitido el {{ $fechaEmision }} &bull; Sistema Pitazo Final
    </div>

</body>

</html>