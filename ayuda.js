/* =====================================================================
   Instructivo de la plataforma (pestaña Ayuda y PDF descargable)
   Para cambiar el texto, edita el arreglo DOC.
   ===================================================================== */
(function () {
  'use strict';

  // Bloques: {h}: título de sección · {p}: párrafo · {ul}/{ol}: lista · {tabla:{cab,filas}} · {nota}
  const DOC = [
    { h: '1. Para qué sirve' },
    { p: 'Genera cada mes las cartas de presentación de los mercaderistas para cada tienda, con el formato que pide cada cadena, listas para imprimir o enviar en PDF. Los datos (mercaderistas, tiendas, ruta, apoyos y configuración) están en una base compartida: lo que un usuario cambia, lo ven todos.' },

    { h: '2. Ingresar' },
    { ul: [
      'Entra con tu correo y contraseña. Los supervisores usan su correo de Suckot (ej.: czorrilla@suckot.com).',
      'Para cambiar tu contraseña: menú con tu nombre (arriba a la derecha) → Cambiar contraseña.',
      'Si olvidas tu contraseña, pide al administrador que la restablezca.',
      'Perfiles: el Administrador ve a todos y gestiona Configuración y Usuarios; el Supervisor ve por defecto a sus mercaderistas (puede elegir "Todos los supervisores" si necesita cubrir a otro).'
    ] },

    { h: '3. Generar cartas (uso mensual)' },
    { ol: [
      'Elige el Mes. Desde el día 20 aparece por defecto el mes siguiente. La vigencia de las cartas es del primer al último día del mes.',
      'Revisa la Fecha de la carta (por defecto, el día 1 del mes).',
      'Filtra por Supervisor, Cadena o busca a un mercaderista por nombre o DNI.',
      'Abre la tarjeta de cada mercaderista (clic en su nombre). Sus tiendas aparecen agrupadas por cadena: en verde las de su ruta y apoyos del mes, ya marcadas.',
      'Para no generar una tienda, desmárcala. Para agregar una tienda que no está en su ruta (solo este mes), usa el buscador "Buscar cualquier tienda…" o el botón "+ N tiendas más" y márcala: queda en amarillo como Adicional.',
      'La casilla junto al nombre marca o desmarca todas sus tiendas.',
      'Si aparece el aviso "Falta…", completa ese dato en la pestaña Mercaderistas (por ejemplo, la fecha de capacitación SST).',
      'Usa Previsualizar para revisar carta por carta, Imprimir para mandar todo a la impresora, o Guardar PDF para descargar.'
    ] },
    { p: 'Opciones de Guardar PDF:' },
    { tabla: { cab: ['Opción', 'Qué descarga'], filas: [
      ['Un PDF por tienda', 'Un ZIP con una carpeta por mercaderista y un PDF por tienda (ideal para enviar por correo a cada tienda).'],
      ['Un PDF por mercaderista', 'Un PDF con todas las cartas de cada mercaderista.'],
      ['Un PDF por cadena', 'Un PDF con todas las cartas de cada cadena (ideal para imprimir en lote).'],
      ['Todo en un solo PDF', 'Un único archivo con todas las cartas seleccionadas.']
    ] } },
    { nota: 'Los botones Ver y PDF de cada tarjeta sirven para un solo mercaderista. Las tiendas de cadenas sin formato de carta (por ahora Ripley, Tai Loy y Mass) se pueden marcar, pero todavía no generan carta.' },

    { h: '4. Documentos y datos que pide cada cadena' },
    { tabla: { cab: ['Cadena', 'Documentos por tienda', 'Datos del mercaderista necesarios'], filas: [
      ['Tottus', 'Carta de presentación con Anexo 1, Carta de compromiso, Constancia RISST, Capacitación de buenas prácticas, Constancia de ruta', 'Fecha de ingreso'],
      ['Saga Falabella', 'Carta de compromiso, Carta de presentación, Constancia de capacitación SST', 'Fecha de capacitación SST'],
      ['Oechsle', 'Carta de compromiso, Carta de presentación, Carta de responsabilidad, Constancia de capacitación SST', 'Fecha de capacitación SST'],
      ['Plaza Vea', 'Solicitud de acceso, Carta de compromiso, Constancia de trabajo', 'Fecha de ingreso, N° de carnet de salud, código CFR'],
      ['Metro y Wong', 'Carta de presentación, Carta de compromiso, Constancia de capacitación SST', 'Fecha de capacitación SST'],
      ['Ripley, Tai Loy, Mass', 'Todavía sin formato de carta', '—']
    ] } },
    { p: 'En todas las cartas se usan además: DNI, nombre, trato (Sr./Srta.), supervisor y su celular, y los datos fijos de Configuración.' },

    { h: '5. Ruta' },
    { ul: [
      'Es la lista fija de tiendas de cada mercaderista. Se usa todos los meses para marcar sus tiendas.',
      'Para cambiarla: pestaña Ruta → Editar ruta → marca o desmarca tiendas (puedes filtrar escribiendo el nombre) → Guardar ruta.',
      'Para cambios masivos usa Descargar Excel / Cargar Excel en la misma pestaña (ver punto 9).'
    ] },

    { h: '6. Mercaderistas' },
    { ul: [
      'Nuevo mercaderista: nombres, apellidos, DNI, trato (Sr./Srta.), supervisor y los datos que pida su cadena.',
      'Si alguien deja de trabajar, desmarca "Activo" en lugar de eliminarlo: así se conserva su historial.',
      'Eliminar un mercaderista borra también su ruta y sus apoyos.'
    ] },

    { h: '7. Tiendas' },
    { ul: [
      'Cada tienda tiene cadena, nombre, código (opcional) y el "Nombre en la carta" (ej.: HIPERMERCADOS TOTTUS LA FONTANA). Si lo dejas vacío se usa CADENA + TIENDA.',
      'Gerente de tienda: solo lo usa la carta de presentación de Tottus.',
      'Puedes crear tiendas de cualquier cadena, aunque todavía no tenga formato de carta.',
      'Una tienda que ya no se visita: desmarca "Activa".'
    ] },

    { h: '8. Apoyos' },
    { p: 'Un apoyo es una tienda fuera de la ruta por unas fechas (reemplazos, inventarios, campañas). Regístralo en la pestaña Apoyos con mercaderista, tienda, desde y hasta: en el mes que corresponda aparecerá marcado automáticamente y la carta llevará esas fechas. Si es solo para un mes y sin fechas especiales, basta con marcar la tienda como Adicional al generar.' },

    { h: '9. Carga masiva con Excel' },
    { p: 'Cada pestaña tiene su propio Excel: Mercaderistas, Tiendas, Ruta y Apoyos; Usuarios está en Configuración (solo administrador).' },
    { ol: [
      'En la pestaña que quieres cambiar, pulsa Descargar Excel: baja la base actual (en Mercaderistas, Ruta y Apoyos se descarga según el supervisor elegido en el filtro).',
      'Modifica o agrega filas en Excel. No cambies los títulos de las columnas.',
      'Guarda y pulsa Cargar Excel en la misma pestaña. Al terminar verás un resumen de lo cargado y de lo que no se encontró.'
    ] },
    { p: 'Para una carga inicial completa, sigue este orden: 1) Usuarios, 2) Tiendas, 3) Mercaderistas, 4) Ruta, 5) Apoyos.' },
    { tabla: { cab: ['Excel', 'Columnas', 'Cómo se carga'], filas: [
      ['Usuarios', 'EMAIL, NOMBRE, CELULAR, ROL (supervisor/admin), CONTRASEÑA', 'Crea o actualiza por correo. Si tiene CONTRASEÑA y aún no tiene acceso, se le crea para ingresar. A quien ya tiene acceso no se le cambia la contraseña.'],
      ['Tiendas', 'CODIGO, CADENA, TIENDA, NOMBRE_CARTA, GERENTE, ACTIVA (SI/NO)', 'Busca por CODIGO (o por cadena + tienda): si existe la actualiza, si no la crea.'],
      ['Mercaderistas', 'NOMBRES, APELLIDOS, DNI, SEXO (F/M), SUPERVISOR_EMAIL, FECHA_INGRESO, FECHA_CAP_SST, CARNET_SALUD, CODIGO_CFR, ACTIVO', 'Busca por DNI: si existe lo actualiza, si no lo crea.'],
      ['Ruta', 'DNI, MERCADERISTA, CODIGO, CADENA, TIENDA', 'Reemplaza la ruta completa de cada mercaderista que aparece en el Excel. Los que no aparecen no se tocan.'],
      ['Apoyos', 'DNI, MERCADERISTA, CODIGO, CADENA, TIENDA, DESDE, HASTA, NOTA', 'Agrega los apoyos nuevos (no duplica los que ya existen).']
    ] } },
    { ul: [
      'Fechas en formato dd/mm/aaaa. DNI con sus 8 dígitos (los ceros a la izquierda se completan solos).',
      'La columna MERCADERISTA del Excel de ruta es solo referencia: manda el DNI.',
      'Para dejar a un mercaderista sin ruta, deja una fila con solo su DNI.',
      'Si una columna no está en el Excel, ese dato no se modifica.'
    ] },

    { h: '10. Configuración (administrador)' },
    { ul: [
      'Datos de las cartas: empresa, contactos de emergencia, coordinador, representante legal, condiciones de trabajo y razones sociales de cada cadena. Guarda con "Guardar cambios".',
      'Firma: carga una imagen de la firma con fondo blanco; se usa en todas las cartas.',
      'Usuarios y supervisores: agrega el correo, nombre, celular (aparece en las cartas de Plaza Vea y Oechsle), rol y una contraseña para crear su acceso.'
    ] },

    { h: '11. Preguntas frecuentes' },
    { tabla: { cab: ['Situación', 'Qué hacer'], filas: [
      ['La vista previa sale en blanco', 'Usa "Abrir en pestaña" o "Descargar esta". Algunos navegadores no muestran PDF dentro de la página.'],
      ['Aparece "Falta cargar la firma"', 'Un administrador debe cargarla en Configuración → Firma.'],
      ['Un mercaderista no aparece', 'Revisa el filtro de Supervisor (elige "Todos") y que esté Activo.'],
      ['Una tienda dice "sin formato"', 'Esa cadena todavía no tiene formato de carta; se puede marcar pero no genera PDF.'],
      ['"Sin acceso" al ingresar', 'Tu correo no está en Usuarios: pide al administrador que te agregue.'],
      ['La carga de Excel dice que faltan columnas', 'Descarga primero la base de esa pestaña y usa ese mismo archivo como plantilla.']
    ] } }
  ];

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function html() {
    const indice = DOC.filter((b) => b.h).map((b, i) => `<a href="#ay-${i}">${esc(b.h)}</a>`).join('');
    let n = -1;
    const cuerpo = DOC.map((b) => {
      if (b.h) { n++; return `<h3 id="ay-${n}">${esc(b.h)}</h3>`; }
      if (b.p) return `<p>${esc(b.p)}</p>`;
      if (b.nota) return `<p class="ayuda-nota">${esc(b.nota)}</p>`;
      if (b.ul) return `<ul>${b.ul.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
      if (b.ol) return `<ol>${b.ol.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
      if (b.tabla) return `<div class="tabla-caja"><table><thead><tr>${b.tabla.cab.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.tabla.filas.map((f) => `<tr>${f.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      return '';
    }).join('');
    return `<div class="cabecera"><div><h2>Ayuda</h2><small>Instructivo de uso de la plataforma.</small></div>
      <button class="btn primario" data-a="ayuda-pdf">Descargar instructivo (PDF)</button></div>
      <div class="ayuda-doc"><nav class="ayuda-indice">${indice}</nav><article class="panel">${cuerpo}</article></div>`;
  }

  async function descargarPDF() {
    const vfs = await window.Plantillas.cargarFuentes();
    const fuentes = { Calibri: { normal: 'Carlito-R.ttf', bold: 'Carlito-B.ttf', italics: 'Carlito-R.ttf', bolditalics: 'Carlito-B.ttf' } };
    const hoy = new Date();
    const fecha = `${hoy.getDate()} de ${window.Plantillas.MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`;
    const content = [
      { text: 'Instructivo', fontSize: 11, color: '#E30613', bold: true, margin: [0, 10, 0, 2] },
      { text: 'Cartas de Mercaderistas', fontSize: 24, bold: true, color: '#1D3F8F' },
      { text: `Área de Trade · Suckot S.A.C. · ${fecha}`, color: '#5E6675', margin: [0, 2, 0, 18] }
    ];
    DOC.forEach((b) => {
      if (b.h) content.push({ text: b.h, fontSize: 14, bold: true, color: '#1D3F8F', margin: [0, 14, 0, 6] });
      else if (b.p) content.push({ text: b.p, margin: [0, 0, 0, 6], alignment: 'justify' });
      else if (b.nota) content.push({ table: { widths: ['*'], body: [[{ text: b.nota, margin: [6, 4, 6, 4] }]] }, layout: { hLineWidth: () => 0, vLineWidth: (i) => (i === 0 ? 3 : 0), vLineColor: () => '#F1D29B', fillColor: () => '#FFF4DE' }, margin: [0, 2, 0, 8] });
      else if (b.ul) content.push({ ul: b.ul, margin: [8, 0, 0, 8] });
      else if (b.ol) content.push({ ol: b.ol, margin: [8, 0, 0, 8] });
      else if (b.tabla) content.push({
        table: { headerRows: 1, widths: b.tabla.cab.length === 2 ? [150, '*'] : [95, '*', 140],
          body: [b.tabla.cab.map((c) => ({ text: c, bold: true, color: '#FFFFFF', fillColor: '#1D3F8F' }))].concat(b.tabla.filas.map((f) => f.map((c) => ({ text: c })))) },
        layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#DDE2EA', vLineColor: () => '#DDE2EA', paddingTop: () => 4, paddingBottom: () => 4 },
        fontSize: 9.5, margin: [0, 2, 0, 10]
      });
    });
    const dd = {
      pageSize: 'A4', pageMargins: [56, 70, 56, 50],
      info: { title: 'Instructivo · Cartas de Mercaderistas' },
      header: () => ({ image: 'logo', width: 90, margin: [48, 20, 0, 0] }),
      footer: (pag, total) => ({ text: `Instructivo · Cartas de Mercaderistas — página ${pag} de ${total}`, alignment: 'center', fontSize: 8, color: '#8A93A3', margin: [0, 18, 0, 0] }),
      content, images: { logo: window.LOGO_SUCKOT },
      defaultStyle: { font: 'Calibri', fontSize: 10.5, lineHeight: 1.15, color: '#1C2230' }
    };
    await new Promise((ok, mal) => {
      try { window.pdfMake.createPdf(dd, null, fuentes, vfs).download('Instructivo - Cartas de Mercaderistas.pdf', ok); } catch (e) { mal(e); }
    });
  }

  window.Ayuda = { DOC, html, descargarPDF };
})();
