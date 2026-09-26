/* =====================================================================
   Plantillas de cartas por cadena · Suckot S.A.C.
   ---------------------------------------------------------------------
   Cada cadena (TOTTUS, SAGA, OECHSLE, PLAZA VEA, METRO, WONG) define la
   lista de documentos que se imprimen por cada tienda asignada.
   Para cambiar un texto, edita la función del documento correspondiente.
   Para agregar una cadena nueva, agrégala en CADENAS (al final).
   Los PDF se arman con pdfmake (https://pdfmake.github.io).
   ===================================================================== */
(function () {
  'use strict';

  // ---------- Fuentes (equivalentes libres de Calibri, Times y Arial) ----------
  const CDN = 'https://cdn.jsdelivr.net/npm/';
  const FUENTES_URL = {
    'Carlito-R.ttf': CDN + '@expo-google-fonts/carlito@0.4.1/400Regular/Carlito_400Regular.ttf',
    'Carlito-B.ttf': CDN + '@expo-google-fonts/carlito@0.4.1/700Bold/Carlito_700Bold.ttf',
    'Tinos-R.ttf': CDN + '@expo-google-fonts/tinos@0.4.2/400Regular/Tinos_400Regular.ttf',
    'Tinos-B.ttf': CDN + '@expo-google-fonts/tinos@0.4.2/700Bold/Tinos_700Bold.ttf',
    'Arimo-R.ttf': CDN + '@expo-google-fonts/arimo@0.4.3/400Regular/Arimo_400Regular.ttf',
    'Arimo-B.ttf': CDN + '@expo-google-fonts/arimo@0.4.3/700Bold/Arimo_700Bold.ttf'
  };
  const FUENTES = {
    Calibri: { normal: 'Carlito-R.ttf', bold: 'Carlito-B.ttf', italics: 'Carlito-R.ttf', bolditalics: 'Carlito-B.ttf' },
    Times: { normal: 'Tinos-R.ttf', bold: 'Tinos-B.ttf', italics: 'Tinos-R.ttf', bolditalics: 'Tinos-B.ttf' },
    Arial: { normal: 'Arimo-R.ttf', bold: 'Arimo-B.ttf', italics: 'Arimo-R.ttf', bolditalics: 'Arimo-B.ttf' }
  };

  let vfsPromesa = null;
  function cargarFuentes() {
    if (!vfsPromesa) {
      vfsPromesa = Promise.all(Object.entries(FUENTES_URL).map(async ([nombre, url]) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error('No se pudo descargar la fuente ' + nombre);
        return [nombre, bufferABase64(await r.arrayBuffer())];
      })).then(Object.fromEntries).catch((e) => { vfsPromesa = null; throw e; });
    }
    return vfsPromesa;
  }
  function bufferABase64(buf) {
    const b = new Uint8Array(buf); let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }

  // Marca de agua: el logo aclarado (se genera una sola vez)
  let marcaPromesa = null;
  function marcaDeAgua() {
    if (!marcaPromesa) {
      marcaPromesa = new Promise((ok, mal) => {
        const img = new Image();
        img.onload = () => {
          const w = 1000, h = Math.round(w * img.height / img.width);
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          const g = cv.getContext('2d');
          g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
          g.globalAlpha = 0.15; g.drawImage(img, 0, 0, w, h);
          ok(cv.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = mal;
        img.src = window.LOGO_SUCKOT;
      });
    }
    return marcaPromesa;
  }

  // ---------- Fechas ----------
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
  const dos = (n) => String(n).padStart(2, '0');
  function aFecha(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    let m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    return null;
  }
  const fCorta = (v) => { const d = aFecha(v); return d ? `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}` : '____/____/______'; };
  const fLarga = (v) => { const d = aFecha(v); return d ? `${dos(d.getDate())} de ${MESES[d.getMonth()]} del ${d.getFullYear()}` : '____ de __________ del ____'; };

  // ---------- Contexto de cada carta ----------
  function contexto(carta, datos) {
    const c = datos.cfg, m = carta.mercaderista, t = carta.tienda;
    const fem = m.sexo !== 'M';
    const sup = carta.supervisor || {};
    const nombre = `${m.nombres || ''} ${m.apellidos || ''}`.replace(/\s+/g, ' ').trim();
    return {
      c, m, t, fem,
      nombre, NOMBRE: nombre.toUpperCase(),
      art: fem ? 'la' : 'el', trat: fem ? 'Srta.' : 'Sr.', o: fem ? 'a' : 'o',
      desde: fCorta(carta.desde), hasta: fCorta(carta.hasta),
      fecha: `${c.CIUDAD || 'Lima'}, ${fLarga(datos.fechaCarta)}`,
      tiendaCarta: (t.nombre_carta || `${t.cadena} ${t.tienda}`).toUpperCase(),
      supNombre: sup.nombre || c.SUPERVISOR_NOMBRE || '',
      supCelular: sup.celular || c.SUPERVISOR_CELULAR || '',
      tiendasCadena: carta.tiendasCadena || [t],
      hayFirma: !!c.FIRMA
    };
  }

  // ---------- Bloques reutilizables ----------
  const par = (text, extra) => Object.assign({ text, margin: [0, 0, 0, 7] }, extra);
  const jus = (text, extra) => Object.assign({ text, alignment: 'justify', margin: [0, 0, 0, 8] }, extra);
  const neg = (text, extra) => Object.assign({ text, bold: true }, extra);

  function firma(x, saludo, margenIzq) {
    const pila = [];
    if (saludo) pila.push({ text: saludo, margin: [0, 10, 0, 2] });
    pila.push(x.hayFirma
      ? { image: 'firma', width: 165, margin: [margenIzq == null ? 110 : margenIzq, 2, 0, 0] }
      : { text: '(Falta cargar la firma en Configuración)', color: '#C00000', italics: true, margin: [margenIzq == null ? 110 : margenIzq, 40, 0, 40] });
    return { stack: pila, unbreakable: true };
  }

  function tablaDatos(filas, opts) {
    opts = opts || {};
    return {
      table: {
        widths: opts.widths || [175, '*'],
        body: filas.map(([k, v]) => [
          { text: k, bold: !!opts.etiquetaNegrita },
          { text: v == null || v === '' ? '—' : String(v) }
        ])
      },
      layout: opts.bordes ? {
        hLineWidth: () => 0.7, vLineWidth: () => 0.7,
        paddingTop: () => 1.5, paddingBottom: () => 1.5
      } : {
        hLineWidth: () => 0, vLineWidth: () => 0,
        paddingLeft: () => 0, paddingTop: () => 0.6, paddingBottom: () => 0.6
      },
      margin: opts.margin || [0, 2, 0, 12]
    };
  }

  const temasBase = [
    'Sistema de gestión, salud y seguridad en el trabajo.',
    'Prevención de riesgos laborales.',
    'Accidentes y enfermedades en el trabajo.',
    'Planes y brigadas de emergencia.',
    'Uso de equipos de protección personal.'
  ];
  const temaHostigamiento = 'Capacitación contra el hostigamiento sexual.';

  // =====================================================================
  //  DOCUMENTOS COMUNES
  // =====================================================================

  // Carta de compromiso (todas las cadenas)
  function compromiso(x, destinatarios, estiloTimes) {
    const c = x.c;
    return [
      { text: 'CARTA DE COMPROMISO', alignment: 'center', bold: true,
        font: estiloTimes ? 'Times' : 'Calibri', fontSize: estiloTimes ? 18 : 14, margin: [0, 4, 0, 22] },
      { text: x.fecha, font: 'Times', bold: true, margin: [0, 0, 0, 12] },
      neg('Señores'),
      ...destinatarios.map((d) => neg(d)),
      neg('Presente-', { margin: [0, 10, 0, 0] }),
      par('Sr. Jefe de Prevención de Pérdidas.'),
      jus('La presente tiene por finalidad hacer de su conocimiento que para cualquier emergencia que pudiera suscitarse con nuestro personal, en las instalaciones de sus tiendas, sírvase comunicarse con:', { margin: [0, 4, 0, 12] }),
      { text: `${c.RRHH_TRATAMIENTO || ''} ${c.RRHH_NOMBRE || ''}`.trim(), margin: [0, 0, 0, 2] },
      { text: ['A los teléfonos:   ', neg(`CELULAR: ${c.RRHH_CELULAR || ''}`)], margin: [0, 0, 0, 2] },
      par('A fin de que se realicen las acciones pertinentes.'),
      neg('DATOS DEL PERSONAL', { margin: [0, 12, 0, 8] }),
      { text: [neg('Nombres y apellidos: '), neg(x.nombre)] },
      { text: [neg('DNI: '), x.m.dni] },
      { text: [neg('Fecha de trabajo: '), neg(`${x.desde} hasta ${x.hasta}`)], margin: [0, 0, 0, 14] },
      jus(`Nota. - La empresa se hace responsable y asume los gastos en su totalidad si el personal sufriera algún accidente durante el periodo de trabajo señalado. Para cualquier accidente trasladar a los siguientes nosocomios: ${c.NOSOCOMIO || ''}`, { bold: true, margin: [0, 0, 0, 12] }),
      par('Sin otro particular y a la espera de sus prontas y gratas noticias quedamos, de ustedes'),
      firma(x, 'Atentamente:')
    ];
  }

  // Carta de presentación (Saga, Oechsle, Metro, Wong)
  function presentacion(x) {
    const c = x.c;
    return [{
      font: 'Arial', fontSize: 10,
      stack: [
        neg(x.fecha, { margin: [0, 0, 0, 14] }),
        neg('Señores:'),
        neg(x.tiendaCarta, { margin: [0, 0, 0, 10] }),
        neg('Atención: Jefe de Prevención de Pérdidas'),
        'PTE.-',
        par('De nuestra consideración:'),
        jus('Nos dirigimos a ustedes con el fin de presentar al siguiente personal cuyos datos se detallan a continuación:', { margin: [0, 4, 0, 10] }),
        tablaDatos([
          ['NOMBRE Y APELLIDOS', x.nombre],
          ['DNI', x.m.dni],
          ['EMPLEADOR', c.EMPRESA_CORTA],
          ['RUC', c.EMPRESA_RUC],
          ['DIRECCIÓN', c.EMPRESA_DIRECCION],
          ['PRODUCTO QUE REPRESENTA', c.PRODUCTO],
          ['FECHA DE INGRESO', `${x.desde} hasta ${x.hasta}`],
          ['CARGO', c.CARGO],
          ['DÍAS', c.DIAS_HORARIO],
          ['SITUACIÓN EN TIENDA', c.SITUACION],
          ['REFRIGERIO', c.REFRIGERIO],
          ['DESCANSO', c.DESCANSO],
          ['EMP. ASEGURADORA', c.ASEGURADORA]
        ], { margin: [0, 0, 0, 16] }),
        jus(`En caso de sufrir un accidente o enfermedad súbita, la empresa se hará responsable del personal en mención, de su atención integral, así como de los costos y gastos que esta atención acarree de ser necesario, para lo cual deben comunicarse inmediatamente con la ${c.RRHH_TRATAMIENTO || ''} ${c.RRHH_NOMBRE || ''} al teléfono ${c.EMPRESA_TELEFONO || ''} cel. ${c.RRHH_CELULAR || ''} a fin de que se realicen las acciones pertinentes.`),
        par('Agradecemos la atención prestada a la presente.'),
        firma(x, 'Atentamente,')
      ]
    }];
  }

  // Carta de responsabilidad (Oechsle)
  function responsabilidad(x) {
    const c = x.c;
    const contacto = (n, cel) => `${(n || '').toUpperCase()}${cel ? ` (${cel})` : ''}`;
    return [
      { text: 'CARTA DE RESPONSABILIDAD', alignment: 'center', bold: true, fontSize: 14, margin: [0, 4, 0, 18] },
      { text: x.fecha, font: 'Times', bold: true, margin: [0, 0, 0, 12] },
      neg('Señores'),
      neg(x.tiendaCarta),
      neg('Presente-', { margin: [0, 8, 0, 0] }),
      par('Sr. Jefe de Prevención de Pérdidas.'),
      jus('La presente tiene por finalidad hacer de su conocimiento que para cualquier emergencia que pudiera suscitarse con nuestro personal, en las instalaciones de sus tiendas, sírvase comunicarse con:'),
      tablaDatos([
        [(c.EMPRESA_CORTA || 'SUCKOT').replace(/\s*S\.?A\.?C\.?$/i, ''), c.EMPRESA_DIRECCION],
        ['SUPERVISOR', contacto(x.supNombre, x.supCelular)],
        ['COORDINADOR', contacto(c.COORDINADOR_NOMBRE, c.COORDINADOR_CELULAR)],
        ['ASISTENTE SOCIAL', contacto(c.RRHH_NOMBRE, c.RRHH_CELULAR)]
      ], { widths: [110, '*'], margin: [0, 4, 0, 10] }),
      par('A fin de que se realicen las acciones pertinentes.'),
      neg('DATOS DEL PERSONAL', { margin: [0, 10, 0, 8] }),
      { text: [neg('Nombres y apellidos: '), neg(x.nombre)] },
      { text: [neg('DNI: '), neg(x.m.dni)] },
      { text: [neg('Fecha de trabajo: '), neg(`${x.desde} hasta ${x.hasta}`)], margin: [0, 0, 0, 14] },
      jus(`Nota. - La empresa se hace responsable y asume los gastos en su totalidad si el personal sufriera algún accidente durante el periodo de trabajo señalado. Para cualquier accidente trasladar a los siguientes nosocomios: ${c.NOSOCOMIO || ''}`, { bold: true, margin: [0, 0, 0, 12] }),
      par('Sin otro particular y a la espera de sus prontas y gratas noticias quedamos, de ustedes'),
      firma(x, 'Atentamente,')
    ];
  }

  // Constancia de capacitación SST (Saga, Oechsle, Metro, Wong)
  function capacitacion(x, razonSocial, temas) {
    return [
      { text: 'CONSTANCIA DE CAPACITACIÓN DE SALUD Y SEGURIDAD EN EL TRABAJO', alignment: 'center', bold: true, fontSize: 12, margin: [30, 4, 30, 22] },
      neg(razonSocial || '', { margin: [0, 0, 0, 18] }),
      jus(`La presente hace constar que ${x.art} ${x.trat} ${x.nombre} con DNI ${x.m.dni} participó en la capacitación de salud y seguridad en el trabajo el día ${fCorta(x.m.fecha_cap_sst)}, donde se trataron los siguientes temas:`, { lineHeight: 1.45, margin: [0, 0, 0, 12] }),
      { ul: temas, margin: [22, 0, 0, 14], lineHeight: 1.45 },
      par('Dicha capacitación tuvo una duración de dos horas lectivas.', { margin: [0, 0, 0, 16] }),
      par('Se expide la siguiente constancia para los fines que sean necesarios.'),
      firma(x, 'Atentamente,')
    ];
  }

  // =====================================================================
  //  TOTTUS
  // =====================================================================
  function tottusPresentacion(x) {
    const c = x.c, emp = c.TOTTUS_EMPRESA || 'HIPERMERCADOS TOTTUS', s = c.EMPRESA_CORTA || 'SUCKOT SAC';
    const contactos = {
      table: {
        widths: ['*', 120, '*'],
        body: [
          ['NOMBRE DE CONTACTO', 'TELÉFONO FIJO/CELULAR', 'CORREOS ELECTRÓNICOS'].map((t) => ({ text: t, bold: true, alignment: 'center' })),
          [c.CONTACTO2_NOMBRE, c.CONTACTO2_CELULAR, c.CONTACTO2_CORREO].map((t) => ({ text: t || '', alignment: 'center' })),
          [c.RRHH_NOMBRE, c.RRHH_CELULAR, c.RRHH_CORREO].map((t) => ({ text: t || '', alignment: 'center' }))
        ]
      },
      layout: { hLineWidth: () => 0.7, vLineWidth: () => 0.7 },
      fontSize: 9, font: 'Times', margin: [20, 2, 20, 14]
    };
    return [{
      font: 'Arial', fontSize: 9.5, lineHeight: 1.1,
      stack: [
        { text: x.fecha, font: 'Times', bold: true, fontSize: 10.5, margin: [0, 0, 0, 12] },
        par('Señores.', { margin: [0, 0, 0, 2] }),
        ...(x.t.gerente ? [neg(x.t.gerente.toUpperCase())] : []),
        neg('Gerente de Tienda'),
        neg(x.tiendaCarta, { margin: [0, 0, 0, 10] }),
        par('Presente. –'),
        jus(['Ref.: Carta de presentación de documentos obligatorios para personas externas destacadas dentro de las instalaciones de ', neg(emp)]),
        jus(`Por medio de la presente, yo ${c.RRHH_NOMBRE || ''}, en mi calidad de ${c.RRHH_CARGO || ''} en la empresa ${s}, identificada con RUC ${c.EMPRESA_RUC || ''}.`),
        jus(['Conforme a lo solicitado adjunto la documentación requerida de nuestros colaboradores destacados en sus instalaciones y que realizan la función de ', neg((c.CARGO || '').toUpperCase()), '.']),
        jus(`Asimismo, le alcanzamos el anexo 1 adjunto a la presente comunicación, en el cual se detalla la siguiente información respecto a nuestro personal desplazado en las instalaciones de ${emp}.`),
        neg('Anexo 1:', { margin: [0, 2, 0, 4] }),
        tablaDatos([
          ['NOMBRE Y APELLIDOS', x.NOMBRE],
          ['DÍAS DE TRABAJO Y FECHA', `${x.desde} hasta ${x.hasta}`],
          ['DNI', x.m.dni],
          ['FECHA DE INGRESO', fCorta(x.m.fecha_ingreso)],
          ['MODALIDAD DE CONTRATO', c.MODALIDAD_CONTRATO],
          ['CARGO', c.CARGO],
          ['DÍAS', c.DIAS],
          ['HORARIO DE TRABAJO', c.HORARIO],
          ['DESCANSO', c.DESCANSO],
          ['REFRIGERIO', c.REFRIGERIO],
          ['PRODUCTO QUE REPRESENTA', c.PRODUCTO]
        ], { widths: [165, '*'] }),
        jus(`Asimismo, adjuntamos la constancia del trabajador firmada, de haber recibido la capacitación del Reglamento Interno de Salud y Seguridad en el Trabajo de ${emp}.`),
        jus(`Por otro lado, en cumplimiento a la solicitud y de las normas vigentes en materia de seguridad y salud en el trabajo, estamos comunicando y entregando una copia digitalizada de su Reglamento Interno de Salud y Seguridad en el Trabajo de ${emp} a todo el personal destacado en sus instalaciones.`),
        jus(`Cabe mencionar que si cualquiera de los trabajadores de ${s} sufriera un accidente en las instalaciones de ${emp}, ${s}, en su condición de empleador, será responsable de brindar las atenciones médicas correspondientes y deberá asumir el costo de las atenciones derivadas del accidente a favor de sus trabajadores, siempre que ${emp} haya cumplido con dar aviso inmediato a ${s} de dicha ocurrencia. En caso el personal de ${s} no reporte a ${emp} la ocurrencia inmediata de tal accidente, ${emp} se encuentra liberada de tal obligación de resarcimiento. La referida comunicación deberá realizarse a los contactos que se detallan a continuación:`),
        contactos,
        jus(`En caso se trate de un accidente que requiera inmediata atención y/o que ponga en grave riesgo la salud y/o vida del trabajador de ${s}, ${emp} deberá brindar la atención inmediata que corresponda y ${s} asumirá los costos correspondientes.`),
        jus(`Asimismo, ${s} será responsable de las acciones que el trabajador ejecute en contra de la calidad e inocuidad de los alimentos y/o productos que manipula directamente, previa investigación que demuestre objetivamente la infracción. ${s} declara expresamente que cumple con las disposiciones relacionadas con la seguridad y salud en el trabajo contenidas en la Ley N° 29783, Ley de Seguridad y Salud en el Trabajo, el D.S. N° 005-2012-TR, Reglamento de Seguridad y Salud en el Trabajo, y sus modificatorias. Asimismo, declara que cumplirá con las indicadas normas y con los requerimientos de información que sobre materia de Seguridad y Salud en el Trabajo realice ${emp}, respecto a los trabajadores de ${s} que laboren o realicen actividades en sus instalaciones.`),
        par('Agradecemos la atención prestada a la presente.'),
        firma(x, 'Atentamente:')
      ]
    }];
  }

  function tottusTablaFirma(x) {
    return {
      table: {
        widths: ['*', 90, 150],
        heights: [14, 34],
        body: [
          ['NOMBRE Y APELLIDO', 'DNI', 'FIRMA'].map((t) => ({ text: t, bold: true })),
          [{ text: x.NOMBRE, margin: [0, 10, 0, 0] }, { text: x.m.dni, margin: [0, 10, 0, 0] }, '']
        ]
      },
      layout: { hLineWidth: () => 0.8, vLineWidth: () => 0.8 },
      font: 'Arial', fontSize: 9.5, margin: [0, 10, 0, 16]
    };
  }

  function tottusConstancia(x, titulo) {
    return [
      { text: x.fecha, font: 'Times', bold: true, margin: [0, 6, 0, 26] },
      jus(titulo, { bold: true, margin: [0, 0, 0, 26] }),
      jus('Me comprometo a poner todo de mi parte para respetar las disposiciones establecidas por la empresa en el Reglamento de Seguridad y Salud en el Trabajo y de someterme a las acciones correctivas que sean necesarias en caso de incumplimiento. Asimismo, adjunto la constancia de seguro SCTR SALUD-PENSIÓN.', { lineHeight: 1.35 }),
      tottusTablaFirma(x),
      firma(x, 'Atentamente:')
    ];
  }

  const tottusRisst = (x) => tottusConstancia(x,
    `CONSTANCIA DE LOS TRABAJADORES QUE HAN RECIBIDO EL REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO DE ${x.c.TOTTUS_EMPRESA || 'HIPERMERCADOS TOTTUS'} S.A. Y LA CAPACITACIÓN RESPECTIVA SOBRE DICHO REGLAMENTO.`);

  const tottusBpsh = (x) => tottusConstancia(x,
    `CAPACITACIÓN DE BUENAS PRÁCTICAS SOBRE SALUD E HIGIENE QUE HAN RECIBIDO EL REGLAMENTO DE ${x.c.TOTTUS_EMPRESA || 'HIPERMERCADOS TOTTUS'} S.A. Y LA CAPACITACIÓN RESPECTIVA SOBRE DICHO REGLAMENTO.`);

  function tottusRuta(x) {
    const nombreCad = (CADENAS[x.t.cadena] && CADENAS[x.t.cadena].nombre) || x.t.cadena;
    const tiendas = x.tiendasCadena.map((t) => `${nombreCad} ${t.tienda}`);
    return [
      { text: 'CONSTANCIA DE RUTA', alignment: 'center', bold: true, font: 'Times', fontSize: 18, margin: [0, 4, 0, 22] },
      { text: x.fecha, font: 'Times', bold: true, margin: [0, 0, 0, 14] },
      par('Señores', { margin: [0, 0, 0, 2] }),
      par('Presente. –'),
      par('De nuestra consideración:', { margin: [0, 6, 0, 10] }),
      jus(`Por medio del presente documento se hace de conocimiento que nuestr${x.o} mercaderista ${x.nombre}, identificad${x.o} con DNI: ${x.m.dni}, se encuentra asignad${x.o} a la cadena de tiendas ${x.t.cadena}.`, { lineHeight: 1.3 }),
      par('Por lo que hará ruta entre las tiendas mencionadas.'),
      jus(`Se brinda la presente constancia para los fines correspondientes y gestión del ingreso de nuestr${x.o} mercaderista de la empresa ${x.c.EMPRESA_CORTA || 'SUCKOT SAC'}.`, { lineHeight: 1.3 }),
      par('TIENDAS:', { margin: [0, 8, 0, 4] }),
      { ul: tiendas, margin: [22, 0, 0, 10] },
      firma(x, 'Atentamente:')
    ];
  }

  // =====================================================================
  //  PLAZA VEA
  // =====================================================================
  function veaSolicitud(x) {
    const c = x.c;
    const fila = (k, v) => [{ text: k, bold: true }, { text: v || '—' }];
    return [{
      font: 'Arial', fontSize: 9, lineHeight: 1.1,
      stack: [
        { text: x.fecha, font: 'Times', bold: true, fontSize: 10.5, margin: [0, 0, 0, 12] },
        'Señor', 'Gerente de Tienda', x.tiendaCarta,
        par('Presente.-', { margin: [0, 8, 0, 6] }),
        par('Atención:'),
        par('De nuestra consideración:'),
        jus(`Tenemos el agrado de dirigirnos a usted con el fin de solicitar el acceso a las instalaciones de ${x.tiendaCarta} al personal que se detalla a continuación, a efectos de que pueda prestar su apoyo como ${(c.CARGO || '').toUpperCase()} representante de la marca ${c.EMPRESA_RAZON || ''}`, { margin: [0, 2, 0, 10] }),
        {
          table: {
            widths: [215, '*'],
            body: [
              fila('NOMBRE Y APELLIDOS', x.nombre),
              fila('DOCUMENTO DE IDENTIDAD', x.m.dni),
              fila('FUNCIÓN', 'MERCADERISTA'),
              fila('EMPRESA VISITANTE', c.EMPRESA_RAZON),
              fila('EMPRESA EMPLEADORA', c.EMPRESA_RAZON),
              fila('VIGENCIA DE LA AUTORIZACIÓN DE INGRESO*', `${x.desde} al ${x.hasta}`),
              fila('ÁREA VISITADA', c.VEA_AREA),
              fila('MODALIDAD', c.VEA_MODALIDAD),
              fila('HORARIO DE TRABAJO', c.VEA_HORARIO),
              fila('DÍA DE DESCANSO', (c.DESCANSO || '').toUpperCase())
            ]
          },
          layout: { hLineWidth: () => 0.8, vLineWidth: () => 0.8, paddingTop: () => 1.5, paddingBottom: () => 1.5 },
          margin: [0, 0, 0, 12]
        },
        par('Información adicional:', { margin: [0, 0, 0, 4] }),
        {
          ul: [
            { text: [neg('EMPRESA ASEGURADORA: '), neg(c.VEA_ASEGURADORA || '')] },
            { text: [neg('NRO. DE CARNET SALUD: '), x.m.carnet_salud || '—'] },
            { text: [neg('CÓDIGO CARNÉ DE INDUCCIÓN SST – CFR: '), neg(x.m.codigo_cfr || '—')] },
            { text: [neg('SUPERVISOR: '), neg((x.supNombre || '').toUpperCase())] },
            { text: [neg('NÚMERO DE CONTACTO DEL SUPERVISOR: '), neg(x.supCelular || '')] }
          ],
          margin: [14, 0, 0, 12]
        },
        neg('COMPROMISO:'),
        jus(`En casos de urgencia médica trasladarlo al centro médico más cercano, y comunicarse con la ${c.RRHH_TRATAMIENTO || ''} ${c.RRHH_NOMBRE || ''} a los teléfonos ${c.EMPRESA_TELEFONO || ''} o cel: ${c.RRHH_CELULAR || ''}; o a la dirección ${c.EMPRESA_DIRECCION || ''}.`),
        { text: [neg('REPRESENTANTE LEGAL DE LA EMPRESA: '), `${c.REP_LEGAL_NOMBRE || ''}${c.REP_LEGAL_DOC ? ' con ' + c.REP_LEGAL_DOC : ''}`], margin: [0, 2, 0, 10] },
        par('Adjuntamos:', { margin: [0, 0, 0, 3] }),
        { ol: ['Original y copia del carnet de sanidad de la persona indicada.', 'Copia de la constancia de trabajo.', 'Copia simple del DNI (mayor de edad).'], margin: [14, 0, 0, 10] },
        par('Agradeciendo la atención prestada.'),
        firma(x, null, 90)
      ]
    }];
  }

  function veaConstanciaTrabajo(x) {
    const c = x.c;
    return [{
      font: 'Times', fontSize: 12, lineHeight: 1.2,
      stack: [
        { text: 'CONSTANCIA DE TRABAJO', alignment: 'center', bold: true, fontSize: 16, margin: [0, 4, 0, 26] },
        'Señor', 'Gerente de Tienda', neg(c.VEA_RAZON || ''),
        par('Presente. -', { margin: [0, 10, 0, 8] }),
        par('Atención. –'),
        par('Jefe de la Sección de Prevención de Pérdidas / Jefe de Tienda', { margin: [0, 0, 0, 16] }),
        neg('POR MEDIO DE LA PRESENTE DAMOS CONSTANCIA:', { margin: [0, 0, 0, 14] }),
        jus(`Que ${x.art} ${x.trat} ${x.NOMBRE} con DNI ${x.m.dni}, labora en nuestra empresa desde el ${fLarga(x.m.fecha_ingreso)} desempeñando el cargo de ${c.CARGO || ''} en la empresa ${c.EMPRESA_CORTA || ''}, con dirección en ${c.EMPRESA_DIRECCION || ''}, con RUC ${c.EMPRESA_RUC || ''}.`, { lineHeight: 1.35, margin: [0, 0, 0, 16] }),
        par('Esta constancia se expide a petición de la parte interesada.'),
        firma(x, null, 110)
      ]
    }];
  }

  // =====================================================================
  //  CADENAS: documentos que se imprimen por cada tienda
  // =====================================================================
  const CADENAS = {
    'TOTTUS': {
      nombre: 'Tottus',
      documentos: [
        tottusPresentacion,
        (x) => compromiso(x, [x.c.TOTTUS_RAZON || 'TOTTUS S.A'], true),
        tottusRisst,
        tottusBpsh,
        tottusRuta
      ],
      requiere: ['fecha_ingreso']
    },
    'SAGA': {
      nombre: 'Saga Falabella',
      documentos: [
        (x) => compromiso(x, [x.tiendaCarta]),
        presentacion,
        (x) => capacitacion(x, x.c.SAGA_RAZON, temasBase)
      ],
      requiere: ['fecha_cap_sst']
    },
    'OECHSLE': {
      nombre: 'Oechsle',
      documentos: [
        (x) => compromiso(x, [x.tiendaCarta]),
        presentacion,
        responsabilidad,
        (x) => capacitacion(x, x.c.OECHSLE_RAZON, [...temasBase, temaHostigamiento])
      ],
      requiere: ['fecha_cap_sst']
    },
    'PLAZA VEA': {
      nombre: 'Plaza Vea',
      documentos: [
        veaSolicitud,
        (x) => compromiso(x, [x.c.VEA_RAZON || '', x.tiendaCarta], true),
        veaConstanciaTrabajo
      ],
      requiere: ['fecha_ingreso', 'carnet_salud', 'codigo_cfr']
    },
    'METRO': {
      nombre: 'Metro',
      documentos: [
        presentacion,
        (x) => compromiso(x, [x.tiendaCarta]),
        (x) => capacitacion(x, x.c.METRO_RAZON, [...temasBase, temaHostigamiento])
      ],
      requiere: ['fecha_cap_sst']
    },
    'WONG': {
      nombre: 'Wong',
      documentos: [
        presentacion,
        (x) => compromiso(x, [x.tiendaCarta]),
        (x) => capacitacion(x, x.c.WONG_RAZON, [...temasBase, temaHostigamiento])
      ],
      requiere: ['fecha_cap_sst']
    }
  };

  const CAMPOS_REQUERIDOS = {
    fecha_ingreso: 'fecha de ingreso',
    fecha_cap_sst: 'fecha de capacitación SST',
    carnet_salud: 'N° de carnet de salud',
    codigo_cfr: 'código CFR (inducción SST)'
  };

  // ---------- Armado del PDF ----------
  function pie(c) {
    return () => ({
      margin: [28, 26, 28, 0],
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 539, y2: 0, lineWidth: 1.2, lineColor: '#E30613' }] },
        {
          margin: [0, 4, 0, 0], alignment: 'center', fontSize: 6.8, font: 'Calibri',
          text: [
            { text: (c.EMPRESA_RAZON || 'SUCKOT S.A.C.') + '  ', bold: true, color: '#E30613' },
            { text: 'Dirección: ', bold: true, color: '#2F5496' }, `${c.EMPRESA_DIRECCION || ''}, Lima – Perú   `,
            { text: 'Teléfonos: ', bold: true, color: '#2F5496' }, `${c.PIE_TELEFONOS || ''}   `,
            { text: c.PIE_WEB || '', bold: true, color: '#034990', decoration: 'underline', link: 'http://' + (c.PIE_WEB || '') }
          ]
        }
      ]
    });
  }

  async function construir(cartas, datos) {
    const [vfs, marca] = await Promise.all([cargarFuentes(), marcaDeAgua()]);
    const c = datos.cfg;
    const content = [];
    cartas.forEach((carta) => {
      const def = CADENAS[carta.tienda.cadena];
      if (!def) return;
      const x = contexto(carta, datos);
      def.documentos.forEach((doc) => {
        content.push({ stack: doc(x), pageBreak: content.length ? 'before' : undefined });
      });
    });
    const logoAncho = 440, logoAlto = logoAncho * 422 / 1172;
    return {
      vfs,
      dd: {
        pageSize: 'A4',
        pageMargins: [64, 98, 64, 70],
        info: { title: datos.titulo || 'Cartas de mercaderistas', author: c.EMPRESA_RAZON || 'Suckot S.A.C.' },
        header: () => ({ image: 'logo', width: 122, margin: [48, 28, 0, 0] }),
        footer: pie(c),
        background: (pag, tam) => ({ image: 'marca', width: logoAncho, absolutePosition: { x: (tam.width - logoAncho) / 2, y: (tam.height - logoAlto) / 2 } }),
        content,
        images: Object.assign({ logo: window.LOGO_SUCKOT, marca }, c.FIRMA ? { firma: c.FIRMA } : {}),
        defaultStyle: { font: 'Calibri', fontSize: 10.5, lineHeight: 1.12 }
      }
    };
  }

  async function generarBlob(cartas, datos) {
    const { dd, vfs } = await construir(cartas, datos);
    return new Promise((ok, mal) => {
      try { window.pdfMake.createPdf(dd, null, FUENTES, vfs).getBlob(ok); } catch (e) { mal(e); }
    });
  }

  function faltantes(mercaderista, cadena) {
    const def = CADENAS[cadena];
    if (!def) return ['cadena sin formato'];
    return (def.requiere || []).filter((k) => !mercaderista[k]).map((k) => CAMPOS_REQUERIDOS[k]);
  }

  window.Plantillas = { CADENAS, generarBlob, faltantes, aFecha, fCorta, fLarga, MESES, cargarFuentes };
})();
