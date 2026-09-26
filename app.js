/* =====================================================================
   Cartas de Mercaderistas · Suckot S.A.C.
   Lógica de la aplicación: sesión, base de datos (Supabase) y pantallas.
   ===================================================================== */
(function () {
  'use strict';

  const P = window.Plantillas;
  const CFG = window.CARTAS_CONFIG || {};
  const LIBS = {
    pdfmake: 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.23/build/pdfmake.min.js',
    jszip: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
    xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
  };

  // Campos de configuración: [clave, etiqueta, grupo, valor por defecto]
  const CONFIG_CAMPOS = [
    ['EMPRESA_RAZON', 'Razón social', 'Empresa', 'SUCKOT S.A.C.'],
    ['EMPRESA_CORTA', 'Nombre corto en los textos', 'Empresa', 'SUCKOT SAC'],
    ['EMPRESA_RUC', 'RUC', 'Empresa', '20518117395'],
    ['EMPRESA_DIRECCION', 'Dirección', 'Empresa', 'Av. República de Colombia N°643 ofc. 301 San Isidro'],
    ['EMPRESA_TELEFONO', 'Teléfono fijo (en los textos)', 'Empresa', '422-0181'],
    ['PIE_TELEFONOS', 'Teléfonos (pie de página)', 'Empresa', '(511) 422-0003 / 422-0181'],
    ['PIE_WEB', 'Web (pie de página)', 'Empresa', 'www.suckot.com'],
    ['CIUDAD', 'Ciudad de la fecha', 'Empresa', 'Lima'],
    ['RRHH_TRATAMIENTO', 'RR.HH.: tratamiento (Srta./Sr.)', 'Contactos', 'Srta.'],
    ['RRHH_NOMBRE', 'RR.HH. / asistente social: nombre', 'Contactos', ''],
    ['RRHH_CARGO', 'RR.HH.: cargo (carta Tottus)', 'Contactos', ''],
    ['RRHH_CELULAR', 'RR.HH.: celular', 'Contactos', ''],
    ['RRHH_CORREO', 'RR.HH.: correo', 'Contactos', ''],
    ['CONTACTO2_NOMBRE', '2.º contacto de emergencia (Tottus): nombre', 'Contactos', ''],
    ['CONTACTO2_CELULAR', '2.º contacto: celular', 'Contactos', ''],
    ['CONTACTO2_CORREO', '2.º contacto: correo', 'Contactos', ''],
    ['SUPERVISOR_NOMBRE', 'Supervisor por defecto: nombre', 'Contactos', ''],
    ['SUPERVISOR_CELULAR', 'Supervisor por defecto: celular', 'Contactos', ''],
    ['COORDINADOR_NOMBRE', 'Coordinador: nombre (Oechsle)', 'Contactos', ''],
    ['COORDINADOR_CELULAR', 'Coordinador: celular', 'Contactos', ''],
    ['REP_LEGAL_NOMBRE', 'Representante legal: nombre (Plaza Vea)', 'Contactos', ''],
    ['REP_LEGAL_DOC', 'Representante legal: documento', 'Contactos', ''],
    ['CARGO', 'Cargo', 'Condiciones de trabajo', 'Mercaderista de Ruta'],
    ['PRODUCTO', 'Producto que representa', 'Condiciones de trabajo', 'Juguetes-Suckot'],
    ['DIAS_HORARIO', 'Días y horario (carta de presentación)', 'Condiciones de trabajo', 'lu, ma, mi, ju, vi, sa de 09:00 am - 18:00 pm'],
    ['DIAS', 'Días (Tottus)', 'Condiciones de trabajo', 'lunes a sábado'],
    ['HORARIO', 'Horario (Tottus)', 'Condiciones de trabajo', '09:00 a.m. – 18:00 p.m.'],
    ['DESCANSO', 'Descanso', 'Condiciones de trabajo', 'domingo'],
    ['REFRIGERIO', 'Refrigerio', 'Condiciones de trabajo', '1 hora'],
    ['SITUACION', 'Situación en tienda', 'Condiciones de trabajo', 'Eventual'],
    ['ASEGURADORA', 'Aseguradora', 'Condiciones de trabajo', 'ESSALUD'],
    ['NOSOCOMIO', 'Nosocomio (cartas de compromiso)', 'Condiciones de trabajo', 'EsSalud'],
    ['MODALIDAD_CONTRATO', 'Modalidad de contrato (Tottus)', 'Condiciones de trabajo', 'En planilla'],
    ['TOTTUS_EMPRESA', 'Tottus: nombre en los textos', 'Cadenas', 'HIPERMERCADOS TOTTUS'],
    ['TOTTUS_RAZON', 'Tottus: destinatario del compromiso', 'Cadenas', 'TOTTUS S.A'],
    ['SAGA_RAZON', 'Saga: razón social (constancia SST)', 'Cadenas', 'FALABELLA S.A'],
    ['OECHSLE_RAZON', 'Oechsle: razón social (constancia SST)', 'Cadenas', 'TIENDAS PERUANAS S.A'],
    ['METRO_RAZON', 'Metro: razón social (constancia SST)', 'Cadenas', 'METRO S.A'],
    ['WONG_RAZON', 'Wong: razón social (constancia SST)', 'Cadenas', 'WONG S.A'],
    ['VEA_RAZON', 'Plaza Vea: razón social', 'Cadenas', 'COMPAÑÍA FOOD RETAIL S.A.C.'],
    ['VEA_AREA', 'Plaza Vea: área visitada', 'Cadenas', 'BAZAR'],
    ['VEA_MODALIDAD', 'Plaza Vea: modalidad', 'Cadenas', 'BAZAR'],
    ['VEA_HORARIO', 'Plaza Vea: horario', 'Cadenas', '08:00 - 17:00'],
    ['VEA_ASEGURADORA', 'Plaza Vea: aseguradora', 'Cadenas', 'PACÍFICO']
  ];

  // ---------- Estado ----------
  const S = {
    sb: null, demo: false, email: '', user: null, tab: 'generar',
    db: { mercaderistas: [], tiendas: [], ruta: [], apoyos: [], config: {}, usuarios: [] },
    cargado: 0,
    gen: { mes: '', fecha: '', sup: '', cadena: '', buscar: '', extras: new Set(), quitados: new Set(), abiertos: new Set(), expandidas: new Set(), buscaT: {}, modo: 'tienda', inicial: true },
    filtro: { sup: '', buscar: '', cadena: '', apoyos: 'vigentes' },
    prev: null
  };

  // ---------- Utilidades ----------
  const $ = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => [...(raiz || document).querySelectorAll(sel)];
  const h = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const dos = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
  const nombreM = (m) => `${m.nombres} ${m.apellidos}`.trim();
  const nombreLista = (m) => `${m.apellidos}, ${m.nombres}`;
  const NOMBRES_EXTRA = { 'TAI LOY': 'Tai Loy', 'RIPLEY': 'Ripley', 'MASS': 'Mass' };
  const cadenaNombre = (c) => (P.CADENAS[c] ? P.CADENAS[c].nombre : NOMBRES_EXTRA[c] || String(c || '').charAt(0) + String(c || '').slice(1).toLowerCase());
  const ordenCadena = (c) => { const i = Object.keys(P.CADENAS).indexOf(c); return i < 0 ? 99 : i; };
  const cfg = () => { const o = {}; CONFIG_CAMPOS.forEach(([k, , , d]) => { o[k] = d; }); return Object.assign(o, S.db.config); };
  const esAdmin = () => S.user && S.user.rol === 'admin';
  const tiendaPorId = (id) => S.db.tiendas.find((t) => t.id === id);
  const mercPorId = (id) => S.db.mercaderistas.find((m) => m.id === id);
  const usuarioPorEmail = (e) => S.db.usuarios.find((u) => (u.email || '').toLowerCase() === (e || '').toLowerCase());
  const supervisores = () => S.db.usuarios.slice().sort((a, b) => (a.nombre || a.email).localeCompare(b.nombre || b.email));
  const nulo = (v) => (v === '' || v == null ? null : v);

  function toast(msg, error) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (error ? ' error' : ''); t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, error ? 6000 : 3000);
  }
  function ocupado(msg) { $('#ocupado-msg').textContent = msg || 'Procesando…'; $('#ocupado').hidden = false; }
  function libre() { $('#ocupado').hidden = true; }
  function errorAmigable(e) {
    const m = (e && (e.message || e.error_description || e.msg)) || String(e);
    if (/mercaderistas_dni_key/.test(m)) return 'Ya existe un mercaderista con ese DNI.';
    if (/tiendas_cadena_tienda_key/.test(m)) return 'Esa tienda ya existe en esa cadena.';
    if (/supervisor_email_fkey/.test(m)) return 'El supervisor indicado no está registrado en Usuarios.';
    if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
    if (/row-level security/i.test(m)) return 'No tienes permiso para hacer esto.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
    return m;
  }
  async function conManejo(fn, msg) {
    try { if (msg) ocupado(msg); return await fn(); }
    catch (e) { console.error(e); toast(errorAmigable(e), true); }
    finally { if (msg) libre(); }
  }
  function cargarScript(src) {
    return new Promise((ok, mal) => {
      if (cargarScript.listos[src]) return ok();
      const s = document.createElement('script');
      s.src = src; s.onload = () => { cargarScript.listos[src] = true; ok(); };
      s.onerror = () => mal(new Error('No se pudo cargar una librería. Revisa tu conexión.'));
      document.head.appendChild(s);
    });
  }
  cargarScript.listos = {};
  async function asegurarPDF() {
    if (!window.pdfMake) await cargarScript(LIBS.pdfmake);
    if (!window.JSZip) await cargarScript(LIBS.jszip);
  }
  function descargarBlob(blob, nombre) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }
  function imprimirBlob(blob) {
    const url = URL.createObjectURL(blob);
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
    f.src = url;
    f.onload = () => setTimeout(() => {
      try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { window.open(url, '_blank'); }
    }, 400);
    document.body.appendChild(f);
    setTimeout(() => { f.remove(); URL.revokeObjectURL(url); }, 10 * 60 * 1000);
  }
  const limpiarArchivo = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();

  // =====================================================================
  //  DATOS (Supabase o demo)
  // =====================================================================
  const TABLAS = ['usuarios', 'mercaderistas', 'tiendas', 'ruta', 'apoyos', 'config'];

  async function traer(tabla) {
    let out = [], desde = 0;
    for (;;) {
      const { data, error } = await S.sb.from(tabla).select('*').range(desde, desde + 999);
      if (error) throw error;
      out = out.concat(data);
      if (data.length < 1000) break;
      desde += 1000;
    }
    return out;
  }

  async function cargarTodo() {
    if (S.demo) return;
    const res = await Promise.all(TABLAS.map(traer));
    TABLAS.forEach((t, i) => {
      if (t === 'config') { S.db.config = {}; res[i].forEach((r) => { S.db.config[r.clave] = r.valor; }); }
      else S.db[t] = res[i];
    });
    S.cargado = Date.now();
  }

  const claveFila = {
    usuarios: (r) => (r.email || '').toLowerCase(),
    mercaderistas: (r) => r.id, tiendas: (r) => r.id, apoyos: (r) => r.id,
    ruta: (r) => r.mercaderista_id + '|' + r.tienda_id
  };
  function fusionar(tabla, filas) {
    const k = claveFila[tabla];
    filas.forEach((f) => {
      const i = S.db[tabla].findIndex((r) => k(r) === k(f));
      if (i >= 0) S.db[tabla][i] = Object.assign({}, S.db[tabla][i], f); else S.db[tabla].push(f);
    });
  }
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2));

  const api = {
    async insertar(tabla, filas) {
      if (S.demo) { const f = filas.map((r) => Object.assign({ id: uid(), actualizado_por: S.email }, r)); fusionar(tabla, f); return f; }
      const { data, error } = await S.sb.from(tabla).insert(filas).select();
      if (error) throw error; fusionar(tabla, data); return data;
    },
    async actualizar(tabla, id, cambios, campoId) {
      campoId = campoId || 'id';
      if (S.demo) { const r = S.db[tabla].find((x) => x[campoId] === id); Object.assign(r, cambios); return r; }
      const { data, error } = await S.sb.from(tabla).update(cambios).eq(campoId, id).select();
      if (error) throw error; fusionar(tabla, data); return data[0];
    },
    async upsert(tabla, filas, onConflict) {
      if (!filas.length) return [];
      if (S.demo) {
        const campos = onConflict.split(',');
        filas.forEach((f) => {
          const ex = S.db[tabla].find((r) => campos.every((c) => String(r[c]).toLowerCase() === String(f[c]).toLowerCase()));
          if (ex) Object.assign(ex, f); else S.db[tabla].push(Object.assign({ id: uid() }, f));
        });
        return filas;
      }
      const { data, error } = await S.sb.from(tabla).upsert(filas, { onConflict }).select();
      if (error) throw error; fusionar(tabla, data); return data;
    },
    async borrar(tabla, filtro) {
      const coincide = (r) => Object.entries(filtro).every(([k, v]) => (Array.isArray(v) ? v.includes(r[k]) : r[k] === v));
      if (!S.demo) {
        let q = S.sb.from(tabla).delete();
        Object.entries(filtro).forEach(([k, v]) => { q = Array.isArray(v) ? q.in(k, v) : q.eq(k, v); });
        const { error } = await q;
        if (error) throw error;
      }
      S.db[tabla] = S.db[tabla].filter((r) => !coincide(r));
    },
    async guardarConfig(obj) {
      const filas = Object.entries(obj).map(([clave, valor]) => ({ clave, valor }));
      if (!S.demo) {
        const { error } = await S.sb.from('config').upsert(filas, { onConflict: 'clave' });
        if (error) throw error;
      }
      Object.assign(S.db.config, obj);
    }
  };

  function cargarDemo() {
    const t = (cadena, tienda, nombre_carta, gerente) => ({ id: uid(), cadena, tienda, nombre_carta, gerente: gerente || null, activa: true });
    const tiendas = [
      t('TOTTUS', 'La Fontana', 'HIPERMERCADOS TOTTUS LA FONTANA', 'Gerente Demo'), t('TOTTUS', 'Atocongo', 'HIPERMERCADOS TOTTUS ATOCONGO'),
      t('TOTTUS', 'Angamos', 'HIPERMERCADOS TOTTUS ANGAMOS'), t('TOTTUS', 'Canadá', 'HIPERMERCADOS TOTTUS CANADÁ'),
      t('SAGA', 'Mall del Sur', 'FALABELLA MALL DEL SUR'), t('SAGA', 'San Miguel', 'FALABELLA SAN MIGUEL'),
      t('OECHSLE', 'Mall del Sur', 'OECHSLE MALL DEL SUR'), t('OECHSLE', 'Primavera', 'OECHSLE PRIMAVERA'),
      t('PLAZA VEA', 'La Molina', 'PLAZA VEA LA MOLINA'), t('PLAZA VEA', 'Óvalo Higuereta', 'PLAZA VEA ÓVALO HIGUERETA'),
      t('METRO', 'La Molina', 'METRO LA MOLINA'), t('METRO', 'Chorrillos', 'METRO CHORRILLOS'),
      t('WONG', 'Camacho', 'WONG CAMACHO'), t('WONG', 'Benavides', 'WONG BENAVIDES')
    ];
    const usuarios = [
      { email: 'demo@suckot.com', nombre: 'Usuario Demo', rol: 'admin', celular: '' },
      { email: 'supervisora@suckot.com', nombre: 'Rosa Supervisora Demo', rol: 'supervisor', celular: '900 111 222' }
    ];
    const m = (nombres, apellidos, dni, sexo, sup, extra) => Object.assign({ id: uid(), nombres, apellidos, dni, sexo, supervisor_email: sup, activo: true, fecha_ingreso: '2024-03-01', fecha_cap_sst: '2026-01-05', carnet_salud: '10000000001', codigo_cfr: 'DEMO-000001' }, extra || {});
    const mercs = [
      m('María Fernanda', 'Pérez Rojas', '70000001', 'F', 'supervisora@suckot.com'),
      m('Luis Alberto', 'Quispe Mamani', '70000002', 'M', 'supervisora@suckot.com', { fecha_cap_sst: null }),
      m('Ana Lucía', 'Torres Díaz', '70000003', 'F', 'demo@suckot.com')
    ];
    const T = (c, n) => tiendas.find((x) => x.cadena === c && x.tienda === n).id;
    const ruta = [
      [0, 'TOTTUS', 'La Fontana'], [0, 'TOTTUS', 'Atocongo'], [0, 'PLAZA VEA', 'La Molina'], [0, 'METRO', 'La Molina'], [0, 'WONG', 'Camacho'],
      [1, 'SAGA', 'Mall del Sur'], [1, 'OECHSLE', 'Mall del Sur'],
      [2, 'TOTTUS', 'Angamos'], [2, 'METRO', 'Chorrillos']
    ].map(([i, c, n]) => ({ mercaderista_id: mercs[i].id, tienda_id: T(c, n) }));
    const hoy = new Date();
    const apoyos = [{ id: uid(), mercaderista_id: mercs[2].id, tienda_id: T('WONG', 'Benavides'), desde: iso(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 10)), hasta: iso(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 20)), nota: 'Apoyo por inventario', actualizado_por: 'demo@suckot.com' }];
    S.db = {
      usuarios, tiendas, mercaderistas: mercs, ruta, apoyos,
      config: {
        RRHH_NOMBRE: 'Contacto RR.HH. Demo', RRHH_CARGO: 'jefa de RR. HH.', RRHH_CELULAR: '900 000 001', RRHH_CORREO: 'rrhh@ejemplo.com',
        CONTACTO2_NOMBRE: 'Contacto Emergencia Demo', CONTACTO2_CELULAR: '900 000 002', CONTACTO2_CORREO: 'emergencia@ejemplo.com',
        SUPERVISOR_NOMBRE: 'Supervisor Demo', SUPERVISOR_CELULAR: '900 000 003', COORDINADOR_NOMBRE: 'Coordinador Demo', COORDINADOR_CELULAR: '900 000 004',
        REP_LEGAL_NOMBRE: 'Representante Demo', REP_LEGAL_DOC: 'DNI N°00000000'
      }
    };
    if (window.__FIRMA_DEMO) S.db.config.FIRMA = window.__FIRMA_DEMO;
    S.email = 'demo@suckot.com';
    S.user = usuarios[0];
  }

  // =====================================================================
  //  SESIÓN
  // =====================================================================
  async function iniciar() {
    $('#login-logo').src = window.LOGO_SUCKOT; $('#barra-logo').src = window.LOGO_SUCKOT;
    S.demo = new URLSearchParams(location.search).has('demo');
    if (S.demo) { cargarDemo(); $('#aviso-demo').hidden = false; return mostrarApp(); }
    if (!window.supabase || !CFG.supabaseUrl) { mostrarLogin('No se pudo conectar con la base de datos. Revisa tu conexión.'); return; }
    S.sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } });
    const { data } = await S.sb.auth.getSession();
    if (data && data.session) await entrar(data.session); else mostrarLogin();
    S.sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') mostrarLogin(); });
  }

  function mostrarLogin(msg) {
    $('#app').hidden = true; $('#noautorizado').hidden = true; $('#login').hidden = false;
    const e = $('#login-error'); e.hidden = !msg; e.textContent = msg || '';
  }

  async function entrar(session) {
    S.email = (session.user.email || '').toLowerCase();
    try { ocupado('Cargando datos…'); await cargarTodo(); }
    catch (e) { libre(); mostrarLogin(errorAmigable(e)); return; }
    libre();
    S.user = usuarioPorEmail(S.email);
    if (!S.user) {
      $('#login').hidden = true; $('#app').hidden = true; $('#noautorizado').hidden = false;
      $('#na-email').textContent = S.email; return;
    }
    mostrarApp();
  }

  function mostrarApp() {
    $('#login').hidden = true; $('#noautorizado').hidden = true; $('#app').hidden = false;
    $('#usuario-nombre').textContent = S.user.nombre || S.email;
    $('#usuario-rol').textContent = `${S.email} · ${S.user.rol === 'admin' ? 'Administrador' : 'Supervisor'}`;
    const hoy = new Date();
    const base = hoy.getDate() >= 20 ? new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    S.gen.mes = `${base.getFullYear()}-${dos(base.getMonth() + 1)}`;
    S.gen.fecha = iso(base);
    const propios = S.db.mercaderistas.some((m) => (m.supervisor_email || '').toLowerCase() === S.email);
    S.gen.sup = propios ? S.email : '__todos__';
    S.filtro.sup = S.gen.sup;
    irA(S.tab);
  }

  $('#form-login').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    ocupado('Ingresando…');
    const { data, error } = await S.sb.auth.signInWithPassword({ email: String(f.get('email')).trim(), password: String(f.get('password')) });
    libre();
    if (error) { mostrarLogin(errorAmigable(error)); return; }
    await entrar(data.session);
  });

  // =====================================================================
  //  NAVEGACIÓN Y EVENTOS
  // =====================================================================
  function irA(tab) {
    S.tab = tab;
    $$('#tabs button').forEach((b) => b.classList.toggle('activo', b.dataset.tab === tab));
    render();
  }
  function render() {
    const v = $('#vista');
    const vistas = { generar: vistaGenerar, ruta: vistaRuta, mercaderistas: vistaMercaderistas, tiendas: vistaTiendas, apoyos: vistaApoyos, config: vistaConfig, ayuda: () => (window.Ayuda ? window.Ayuda.html() : '<p>No se pudo cargar la ayuda.</p>') };
    v.innerHTML = (vistas[S.tab] || vistaGenerar)();
    $$('.barra-accion').forEach((b) => b.remove());
    if (S.tab === 'generar') { document.body.insertAdjacentHTML('beforeend', barraAccion()); marcarIndeterminados(); }
  }

  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (b) irA(b.dataset.tab); });

  const ACCIONES = {};
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el) return;
    const fn = ACCIONES[el.dataset.a];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  const CAMBIOS = {};
  document.addEventListener('change', (e) => { const el = e.target.closest('[data-c]'); if (el && CAMBIOS[el.dataset.c]) CAMBIOS[el.dataset.c](el, e); });
  document.addEventListener('input', (e) => { const el = e.target.closest('[data-i]'); if (el && CAMBIOS[el.dataset.i]) CAMBIOS[el.dataset.i](el, e); });

  ACCIONES.salir = async () => { if (S.demo) { location.href = location.pathname; return; } await S.sb.auth.signOut(); mostrarLogin(); };
  ACCIONES.recargar = () => conManejo(async () => { await cargarTodo(); render(); toast('Datos actualizados'); }, 'Actualizando…');
  window.addEventListener('focus', () => { if (!S.demo && S.user && Date.now() - S.cargado > 120000 && !$('.modal')) { cargarTodo().then(render).catch(() => {}); } });

  // ---------- Modal genérico ----------
  function abrirModal(html, clase) {
    const f = $('#modal-fondo');
    f.innerHTML = `<div class="modal ${clase || ''}" role="dialog" aria-modal="true">${html}</div>`;
    f.hidden = false;
    const primero = $('input,select,textarea', f); if (primero && !clase) setTimeout(() => primero.focus(), 30);
  }
  function cerrarModal() {
    const f = $('#modal-fondo'); f.hidden = true; f.innerHTML = '';
    if (S.prev && S.prev.url) URL.revokeObjectURL(S.prev.url);
    S.prev = null;
  }
  ACCIONES['cerrar-modal'] = cerrarModal;
  $('#modal-fondo').addEventListener('mousedown', (e) => { if (e.target.id === 'modal-fondo') cerrarModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal-fondo').hidden) cerrarModal(); });
  const cabModal = (titulo) => `<div class="modal-cab"><h3>${h(titulo)}</h3><button class="btn icono" data-a="cerrar-modal" aria-label="Cerrar">✕</button></div>`;

  ACCIONES['cambiar-clave'] = () => {
    if (S.demo) return toast('No disponible en modo demo');
    abrirModal(`${cabModal('Cambiar contraseña')}
      <form id="f-clave"><div class="modal-cuerpo form-grid">
        <label>Nueva contraseña<input type="password" name="a" minlength="8" required autocomplete="new-password"></label>
        <label>Repetir contraseña<input type="password" name="b" minlength="8" required autocomplete="new-password"></label>
      </div><div class="modal-pie"><button type="button" class="btn" data-a="cerrar-modal">Cancelar</button><button class="btn primario">Guardar</button></div></form>`);
    $('#f-clave').addEventListener('submit', async (ev) => {
      ev.preventDefault(); const f = new FormData(ev.target);
      if (f.get('a') !== f.get('b')) return toast('Las contraseñas no coinciden', true);
      await conManejo(async () => {
        const { error } = await S.sb.auth.updateUser({ password: String(f.get('a')) });
        if (error) throw error; cerrarModal(); toast('Contraseña actualizada');
      }, 'Guardando…');
    });
  };

  // ---------- Selector de supervisor ----------
  function opcionesSupervisor(valor) {
    const ops = [`<option value="__todos__" ${valor === '__todos__' ? 'selected' : ''}>Todos los supervisores</option>`];
    supervisores().forEach((u) => ops.push(`<option value="${h(u.email)}" ${valor === u.email ? 'selected' : ''}>${h(u.nombre || u.email)}${u.email === S.email ? ' (yo)' : ''}</option>`));
    ops.push(`<option value="__sin__" ${valor === '__sin__' ? 'selected' : ''}>Sin supervisor asignado</option>`);
    return ops.join('');
  }
  function filtrarMercs(sup, buscar, incluirInactivos) {
    const b = norm(buscar);
    return S.db.mercaderistas
      .filter((m) => incluirInactivos || m.activo !== false)
      .filter((m) => sup === '__todos__' || (sup === '__sin__' ? !m.supervisor_email : (m.supervisor_email || '').toLowerCase() === sup))
      .filter((m) => !b || norm(nombreM(m) + ' ' + m.dni).includes(b))
      .sort((a, c) => nombreLista(a).localeCompare(nombreLista(c)));
  }

  // =====================================================================
  //  GENERAR CARTAS
  // =====================================================================
  function rangoMes() {
    const [y, m] = S.gen.mes.split('-').map(Number);
    return { ini: new Date(y, m - 1, 1), fin: new Date(y, m, 0), etiqueta: `${P.MESES[m - 1].toUpperCase()} ${y}` };
  }

  // tiendaId -> { tipo, desde, hasta } de lo asignado en el mes (ruta + apoyos)
  function asignaciones(mid) {
    const { ini, fin } = rangoMes();
    const out = new Map();
    S.db.ruta.filter((r) => r.mercaderista_id === mid).forEach((r) => out.set(r.tienda_id, { tipo: 'Ruta', desde: ini, hasta: fin }));
    S.db.apoyos.filter((a) => a.mercaderista_id === mid).forEach((a) => {
      const d = P.aFecha(a.desde), hs = P.aFecha(a.hasta);
      if (!d || !hs || d > fin || hs < ini || out.has(a.tienda_id)) return;
      out.set(a.tienda_id, { tipo: 'Apoyo', desde: d < ini ? ini : d, hasta: hs > fin ? fin : hs });
    });
    return out;
  }
  const clave = (mid, tid) => mid + '|' + tid;
  function seleccionada(mid, tid, asig) {
    const k = clave(mid, tid);
    return S.gen.extras.has(k) || (asig.has(tid) && !S.gen.quitados.has(k));
  }
  const tiendasActivas = () => S.db.tiendas.filter((t) => t.activa !== false);
  function cadenasDisponibles() {
    const set = new Set(tiendasActivas().map((t) => t.cadena));
    return [...set].sort((a, b) => ordenCadena(a) - ordenCadena(b) || a.localeCompare(b));
  }

  function mercsGenerar() { return filtrarMercs(S.gen.sup, S.gen.buscar); }

  // Lista de cartas seleccionadas (opcional: solo de un mercaderista)
  function cartasSeleccionadas(soloMid) {
    const { ini, fin } = rangoMes();
    const out = [];
    const mercs = soloMid ? [mercPorId(soloMid)] : mercsGenerar();
    mercs.forEach((m) => {
      const asig = asignaciones(m.id);
      const sel = tiendasActivas()
        .filter((t) => (!S.gen.cadena || t.cadena === S.gen.cadena) && P.CADENAS[t.cadena] && seleccionada(m.id, t.id, asig))
        .sort((a, b) => ordenCadena(a.cadena) - ordenCadena(b.cadena) || a.tienda.localeCompare(b.tienda));
      const sup = usuarioPorEmail(m.supervisor_email);
      sel.forEach((t) => {
        const a = asig.get(t.id);
        out.push({
          key: clave(m.id, t.id), mercaderista: m, tienda: t,
          tipo: a ? a.tipo : 'Adicional', desde: a ? a.desde : ini, hasta: a ? a.hasta : fin,
          supervisor: sup ? { nombre: sup.nombre, celular: sup.celular } : null,
          tiendasCadena: sel.filter((x) => x.cadena === t.cadena)
        });
      });
    });
    return out;
  }

  function vistaGenerar() {
    const mercs = mercsGenerar();
    if (S.gen.inicial) { S.gen.inicial = false; if (mercs.length <= 6) mercs.forEach((m) => S.gen.abiertos.add(m.id)); }
    const cadenas = cadenasDisponibles();
    const c = cfg();
    let html = `<div class="cabecera"><div><h2>Generar cartas</h2><small>Marca las tiendas de cada mercaderista y genera sus cartas listas para imprimir o enviar.</small></div>
      <div><button class="btn chico" data-a="expandir">Expandir todo</button> <button class="btn chico" data-a="contraer">Contraer todo</button> <button class="btn chico" data-a="solo-ruta" title="Quita las tiendas agregadas a mano y vuelve a la ruta">Volver a la ruta</button></div></div>
      <div class="filtros">
        <label>Mes<input type="month" value="${h(S.gen.mes)}" data-c="gen-mes"></label>
        <label>Fecha de la carta<input type="date" value="${h(S.gen.fecha)}" data-c="gen-fecha"></label>
        <label>Supervisor<select data-c="gen-sup">${opcionesSupervisor(S.gen.sup)}</select></label>
        <label>Cadena<select data-c="gen-cadena"><option value="">Todas</option>${cadenas.map((x) => `<option value="${h(x)}" ${S.gen.cadena === x ? 'selected' : ''}>${h(cadenaNombre(x))}</option>`).join('')}</select></label>
        <label>Buscar mercaderista<input type="search" placeholder="Nombre o DNI" value="${h(S.gen.buscar)}" data-i="gen-buscar"></label>
      </div>`;
    if (!c.FIRMA) html += `<p class="panel faltan">⚠ Falta cargar la firma en Configuración: las cartas saldrán sin firma.</p>`;
    if (!mercs.length) return html + `<div class="vacio">No hay mercaderistas para este filtro.<br><small>Revisa el supervisor seleccionado o registra mercaderistas en la pestaña Mercaderistas.</small></div>`;
    html += `<div id="lista-gen">${mercs.map((m) => tarjetaMerc(m, cadenas)).join('')}</div>`;
    return html;
  }

  function tarjetaMerc(m, cadenas) {
    const asig = asignaciones(m.id);
    const abierto = S.gen.abiertos.has(m.id);
    const cads = cadenas.filter((x) => !S.gen.cadena || x === S.gen.cadena);
    const selTiendas = tiendasActivas().filter((t) => cads.includes(t.cadena) && P.CADENAS[t.cadena] && seleccionada(m.id, t.id, asig));
    const nAsig = [...asig.keys()].filter((tid) => { const t = tiendaPorId(tid); return t && t.activa !== false && cads.includes(t.cadena); }).length;
    const faltan = new Set();
    [...new Set(selTiendas.map((t) => t.cadena))].forEach((cad) => P.faltantes(m, cad).forEach((f) => faltan.add(f)));
    const sinFmt = tiendasActivas().filter((t) => cads.includes(t.cadena) && !P.CADENAS[t.cadena] && seleccionada(m.id, t.id, asig));
    const sup = usuarioPorEmail(m.supervisor_email);
    const resumen = selTiendas.length
      ? selTiendas.map((t) => `${cadenaNombre(t.cadena)} ${t.tienda}`).join(' · ')
      : 'Ninguna tienda marcada';
    let cuerpo = '';
    if (abierto) {
      const conAlgo = [], sinNada = [];
      cads.forEach((cad) => {
        const ts = tiendasActivas().filter((t) => t.cadena === cad).sort((a, b) => a.tienda.localeCompare(b.tienda));
        const visibles = ts.filter((t) => asig.has(t.id) || S.gen.extras.has(clave(m.id, t.id)));
        const exp = S.gen.expandidas.has(m.id + '|' + cad);
        if (!visibles.length && !exp) { sinNada.push([cad, ts.length]); return; }
        const mostrar = exp ? ts : visibles;
        const resto = ts.length - visibles.length;
        const nSel = ts.filter((t) => seleccionada(m.id, t.id, asig)).length;
        conAlgo.push(`<div class="cad"><div class="cad-nombre">${h(cadenaNombre(cad))}${P.CADENAS[cad] ? '' : ' <span class="tag rojo">sin formato</span>'}<small>${nSel} de ${ts.length} marcadas</small></div>
          <div class="chips">${mostrar.map((t) => chipTienda(m, t, asig)).join('')}
          ${resto > 0 ? `<button class="chip-mas" data-a="ver-cadena" data-k="${h(m.id + '|' + cad)}">${exp ? 'Ocultar no asignadas' : `+ ${resto} tienda${resto === 1 ? '' : 's'} más`}</button>` : ''}</div></div>`);
      });
      const q = S.gen.buscaT[m.id] || '';
      const buscador = `<div class="agregar"><input type="search" placeholder="Buscar cualquier tienda para agregarla (ej.: tottus atocongo)…" value="${h(q)}" data-i="busca-tienda" data-mid="${h(m.id)}">
        <div class="chips" id="res-${h(m.id)}">${resultadosTienda(m, asig, q)}</div></div>`;
      cuerpo = `<div class="merc-cuerpo">${buscador}${conAlgo.join('') || '<p class="muted">Sin tiendas en ruta este mes.</p>'}
        ${sinNada.length ? `<div class="otras"><span>Agregar tienda de otra cadena:</span>${sinNada.map(([cad, n]) => `<button class="chip-mas" data-a="ver-cadena" data-k="${h(m.id + '|' + cad)}">+ ${h(cadenaNombre(cad))} (${n})</button>`).join('')}</div>` : ''}</div>`;
    }
    return `<article class="merc ${abierto ? 'abierto' : ''} ${selTiendas.length ? '' : 'sin-sel'}" data-mid="${h(m.id)}">
      <div class="merc-cab" data-a="toggle-merc" data-mid="${h(m.id)}">
        <input type="checkbox" data-c="merc-todo" data-mid="${h(m.id)}" ${selTiendas.length ? 'checked' : ''} data-parcial="${selTiendas.length && selTiendas.length < nAsig ? 1 : 0}" title="Marcar/desmarcar todas sus tiendas">
        <div class="merc-info"><span class="merc-nombre">${h(nombreLista(m))}</span> <span class="muted">· DNI ${h(m.dni)}</span>
          <small>${sup ? 'Supervisor: ' + h(sup.nombre || sup.email) + ' · ' : ''}<span class="merc-resumen">${h(resumen)}</span></small>
          ${faltan.size ? `<small class="faltan">⚠ Falta ${h([...faltan].join(', '))} — complétalo en Mercaderistas</small>` : ''}
          ${sinFmt.length ? `<small class="muted">${sinFmt.length} tienda${sinFmt.length === 1 ? '' : 's'} de ${h([...new Set(sinFmt.map((t) => cadenaNombre(t.cadena)))].join(', '))} sin formato de carta todavía (no se generan).</small>` : ''}</div>
        <span class="tag ${selTiendas.length ? 'ok' : ''}">${selTiendas.length} carta${selTiendas.length === 1 ? '' : 's'}</span>
        <div class="merc-acc">
          <button class="btn chico" data-a="prev-merc" data-mid="${h(m.id)}" ${selTiendas.length ? '' : 'disabled'}>Ver</button>
          <button class="btn chico" data-a="pdf-merc" data-mid="${h(m.id)}" ${selTiendas.length ? '' : 'disabled'}>PDF</button>
          <span class="flecha">▶</span>
        </div>
      </div>${cuerpo}</article>`;
  }

  function resultadosTienda(m, asig, q) {
    const toks = norm(q).split(' ').filter(Boolean);
    if (!toks.length || norm(q).length < 2) return '';
    const res = tiendasActivas().filter((t) => { const txt = norm(`${cadenaNombre(t.cadena)} ${t.tienda} ${t.codigo || ''} ${t.nombre_carta || ''}`); return toks.every((k) => txt.includes(k)); })
      .sort((a, b) => ordenCadena(a.cadena) - ordenCadena(b.cadena) || a.tienda.localeCompare(b.tienda));
    if (!res.length) return '<span class="muted">Sin resultados.</span>';
    return res.slice(0, 30).map((t) => chipTienda(m, t, asig, true)).join('') + (res.length > 30 ? `<span class="muted">… y ${res.length - 30} más, escribe más detalle.</span>` : '');
  }

  function chipTienda(m, t, asig, conCadena) {
    const a = asig.get(t.id);
    const on = seleccionada(m.id, t.id, asig);
    const etiqueta = a ? (a.tipo === 'Apoyo' ? `Apoyo ${P.fCorta(a.desde).slice(0, 5)}–${P.fCorta(a.hasta).slice(0, 5)}` : 'Ruta') : (on ? 'Adicional' : '');
    const sinFormato = !P.CADENAS[t.cadena] ? ' <small class="sf">sin formato</small>' : '';
    return `<label class="chip ${on ? 'on' : ''} ${a ? '' : 'extra'}"><input type="checkbox" data-c="tienda" data-mid="${h(m.id)}" data-tid="${h(t.id)}" ${on ? 'checked' : ''}>${conCadena ? h(cadenaNombre(t.cadena)) + ' · ' : ''}${h(t.tienda)}${etiqueta ? ` <small>${h(etiqueta)}</small>` : ''}${conCadena ? sinFormato : ''}</label>`;
  }

  function barraAccion() {
    const n = cartasSeleccionadas().length;
    const nm = new Set(cartasSeleccionadas().map((c) => c.mercaderista.id)).size;
    return `<div class="barra-accion"><div>
      <span class="cuenta" id="cuenta-cartas">${n} carta${n === 1 ? '' : 's'} · ${nm} mercaderista${nm === 1 ? '' : 's'}</span>
      <button class="btn" data-a="prev-todas" ${n ? '' : 'disabled'}>Previsualizar</button>
      <button class="btn azul" data-a="imprimir-todas" ${n ? '' : 'disabled'}>Imprimir</button>
      <select data-c="gen-modo" title="Cómo agrupar los PDF">
        <option value="tienda" ${S.gen.modo === 'tienda' ? 'selected' : ''}>Un PDF por tienda (carpeta por mercaderista)</option>
        <option value="mercaderista" ${S.gen.modo === 'mercaderista' ? 'selected' : ''}>Un PDF por mercaderista</option>
        <option value="cadena" ${S.gen.modo === 'cadena' ? 'selected' : ''}>Un PDF por cadena</option>
        <option value="todo" ${S.gen.modo === 'todo' ? 'selected' : ''}>Todo en un solo PDF</option>
      </select>
      <button class="btn primario" data-a="descargar-todas" ${n ? '' : 'disabled'}>Guardar PDF</button>
    </div></div>`;
  }
  function marcarIndeterminados() { $$('input[data-c="merc-todo"]').forEach((i) => { i.indeterminate = i.dataset.parcial === '1'; }); }

  function refrescarMerc(mid) {
    const art = $(`article.merc[data-mid="${CSS.escape(mid)}"]`);
    if (art) { art.outerHTML = tarjetaMerc(mercPorId(mid), cadenasDisponibles()); }
    const b = $('.barra-accion'); if (b) b.outerHTML = barraAccion();
    marcarIndeterminados();
  }

  CAMBIOS['gen-mes'] = (el) => { if (el.value) { S.gen.mes = el.value; S.gen.fecha = el.value + '-01'; render(); } };
  CAMBIOS['gen-fecha'] = (el) => { S.gen.fecha = el.value; };
  CAMBIOS['gen-sup'] = (el) => { S.gen.sup = el.value; S.gen.inicial = true; render(); };
  CAMBIOS['gen-cadena'] = (el) => { S.gen.cadena = el.value; render(); };
  CAMBIOS['gen-modo'] = (el) => { S.gen.modo = el.value; };
  CAMBIOS['gen-buscar'] = (el) => {
    S.gen.buscar = el.value;
    clearTimeout(CAMBIOS.t); CAMBIOS.t = setTimeout(() => {
      const cadenas = cadenasDisponibles(); const mercs = mercsGenerar();
      $('#lista-gen') ? ($('#lista-gen').innerHTML = mercs.map((m) => tarjetaMerc(m, cadenas)).join('')) : render();
      const b = $('.barra-accion'); if (b) b.outerHTML = barraAccion(); marcarIndeterminados();
    }, 200);
  };
  CAMBIOS['busca-tienda'] = (el) => {
    const mid = el.dataset.mid; S.gen.buscaT[mid] = el.value;
    clearTimeout(CAMBIOS.tb); CAMBIOS.tb = setTimeout(() => {
      const cont = document.getElementById('res-' + mid);
      if (cont) cont.innerHTML = resultadosTienda(mercPorId(mid), asignaciones(mid), el.value);
    }, 150);
  };
  CAMBIOS.tienda = (el) => {
    const mid = el.dataset.mid, tid = el.dataset.tid, k = clave(mid, tid);
    const asig = asignaciones(mid);
    if (asig.has(tid)) { if (el.checked) S.gen.quitados.delete(k); else S.gen.quitados.add(k); }
    else if (el.checked) S.gen.extras.add(k); else S.gen.extras.delete(k);
    refrescarMerc(mid);
  };
  CAMBIOS['merc-todo'] = (el) => {
    const mid = el.dataset.mid; const asig = asignaciones(mid);
    const cads = cadenasDisponibles().filter((x) => !S.gen.cadena || x === S.gen.cadena);
    const tiendas = tiendasActivas().filter((t) => cads.includes(t.cadena));
    if (el.checked) tiendas.forEach((t) => { if (asig.has(t.id)) S.gen.quitados.delete(clave(mid, t.id)); });
    else tiendas.forEach((t) => { const k = clave(mid, t.id); S.gen.extras.delete(k); if (asig.has(t.id)) S.gen.quitados.add(k); });
    refrescarMerc(mid);
  };
  ACCIONES['toggle-merc'] = (el, e) => {
    if (e.target.closest('input,button,label')) return;
    const mid = el.dataset.mid;
    if (S.gen.abiertos.has(mid)) S.gen.abiertos.delete(mid); else S.gen.abiertos.add(mid);
    refrescarMerc(mid);
  };
  // Los checkbox dentro de la cabecera no deben abrir/cerrar la tarjeta
  document.addEventListener('click', (e) => { if (e.target.matches('.merc-cab input[type=checkbox]')) e.stopPropagation(); }, true);
  ACCIONES['ver-cadena'] = (el) => {
    const k = el.dataset.k; const mid = k.split('|')[0];
    if (S.gen.expandidas.has(k)) S.gen.expandidas.delete(k); else S.gen.expandidas.add(k);
    refrescarMerc(mid);
  };
  ACCIONES.expandir = () => { mercsGenerar().forEach((m) => S.gen.abiertos.add(m.id)); render(); };
  ACCIONES.contraer = () => { S.gen.abiertos.clear(); render(); };
  ACCIONES['solo-ruta'] = () => { S.gen.extras.clear(); S.gen.quitados.clear(); S.gen.expandidas.clear(); render(); toast('Selección restablecida a la ruta del mes'); };

  // ---------- PDF ----------
  function datosPDF(titulo) {
    return { cfg: cfg(), fechaCarta: S.gen.fecha || iso(rangoMes().ini), titulo };
  }
  const nombreCarta = (c) => limpiarArchivo(`${cadenaNombre(c.tienda.cadena).toUpperCase()} ${c.tienda.tienda.toUpperCase()} - ${nombreLista(c.mercaderista).replace(',', '').toUpperCase()}`);

  async function pdfDe(cartas, titulo) {
    await asegurarPDF();
    return P.generarBlob(cartas, datosPDF(titulo));
  }

  function agrupar(cartas, modo) {
    const mes = rangoMes().etiqueta;
    if (modo === 'todo') return [{ nombre: `Cartas mercaderistas - ${mes}.pdf`, cartas }];
    const grupos = new Map();
    cartas.forEach((c) => {
      let k, nombre;
      const nm = limpiarArchivo(nombreLista(c.mercaderista).replace(',', '').toUpperCase());
      if (modo === 'tienda') { k = c.key; nombre = `${nm}/${nombreCarta(c)} - ${mes}.pdf`; }
      else if (modo === 'mercaderista') { k = c.mercaderista.id; nombre = `${nm} - ${mes}.pdf`; }
      else { k = c.tienda.cadena; nombre = `${cadenaNombre(c.tienda.cadena).toUpperCase()} - ${mes}.pdf`; }
      if (!grupos.has(k)) grupos.set(k, { nombre, cartas: [] });
      grupos.get(k).cartas.push(c);
    });
    return [...grupos.values()];
  }

  async function descargar(cartas, modo) {
    if (!cartas.length) return;
    const grupos = agrupar(cartas, modo);
    await conManejo(async () => {
      await asegurarPDF();
      if (grupos.length === 1) {
        const g = grupos[0];
        descargarBlob(await pdfDe(g.cartas, g.nombre), g.nombre.split('/').pop());
      } else {
        const zip = new window.JSZip();
        for (let i = 0; i < grupos.length; i++) {
          ocupado(`Generando PDF ${i + 1} de ${grupos.length}…`);
          zip.file(grupos[i].nombre, await pdfDe(grupos[i].cartas, grupos[i].nombre));
        }
        ocupado('Comprimiendo…');
        descargarBlob(await zip.generateAsync({ type: 'blob' }), `Cartas mercaderistas - ${rangoMes().etiqueta}.zip`);
      }
      toast(`Listo: ${cartas.length} carta${cartas.length === 1 ? '' : 's'}`);
    }, 'Preparando PDF…');
  }

  ACCIONES['descargar-todas'] = () => descargar(cartasSeleccionadas(), S.gen.modo);
  ACCIONES['pdf-merc'] = (el) => descargar(cartasSeleccionadas(el.dataset.mid), 'mercaderista');
  ACCIONES['imprimir-todas'] = () => conManejo(async () => {
    const cartas = cartasSeleccionadas();
    ocupado(`Preparando ${cartas.length} carta${cartas.length === 1 ? '' : 's'} para imprimir…`);
    imprimirBlob(await pdfDe(cartas, 'Cartas mercaderistas'));
  }, 'Preparando impresión…');

  // ---------- Previsualización ----------
  ACCIONES['prev-todas'] = () => abrirPrevia(cartasSeleccionadas());
  ACCIONES['prev-merc'] = (el) => abrirPrevia(cartasSeleccionadas(el.dataset.mid));

  function abrirPrevia(cartas) {
    if (!cartas.length) return;
    S.prev = { cartas, actual: 0, url: null, blob: null };
    let grupo = '';
    const lista = cartas.map((c, i) => {
      let cab = '';
      const nm = nombreLista(c.mercaderista);
      if (nm !== grupo) { grupo = nm; cab = `<div class="prev-grupo">${h(nm)}</div>`; }
      return `${cab}<button class="prev-item" data-a="prev-ir" data-i="${i}">${h(cadenaNombre(c.tienda.cadena))} · ${h(c.tienda.tienda)} ${c.tipo !== 'Ruta' ? `<span class="tag alerta">${h(c.tipo)}</span>` : ''}</button>`;
    }).join('');
    abrirModal(`${cabModal(`Previsualización · ${cartas.length} carta${cartas.length === 1 ? '' : 's'} · ${rangoMes().etiqueta}`)}
      <div class="prev"><div class="prev-lista">${lista}</div>
      <div class="prev-visor"><div class="prev-cargando" id="prev-cargando">Generando…</div><iframe id="prev-frame" title="Carta" hidden></iframe></div></div>
      <div class="modal-pie"><span class="izq muted" id="prev-nombre"></span>
        <button class="btn" data-a="prev-pestana" title="Si la vista previa no se ve, ábrela en otra pestaña">Abrir en pestaña</button>
        <button class="btn" data-a="prev-descargar">Descargar esta</button>
        <button class="btn azul" data-a="prev-imprimir">Imprimir esta</button>
        <button class="btn primario" data-a="prev-descargar-todas">Guardar todas (${h(S.gen.modo === 'tienda' ? 'PDF por tienda' : S.gen.modo === 'mercaderista' ? 'PDF por mercaderista' : S.gen.modo === 'cadena' ? 'PDF por cadena' : 'un solo PDF')})</button></div>`, 'grande');
    mostrarPrevia(0);
  }
  async function mostrarPrevia(i) {
    if (!S.prev) return;
    S.prev.actual = i;
    $$('.prev-item').forEach((b) => b.classList.toggle('activo', Number(b.dataset.i) === i));
    const c = S.prev.cartas[i];
    $('#prev-nombre').textContent = nombreCarta(c);
    $('#prev-cargando').hidden = false; $('#prev-cargando').textContent = 'Generando…'; $('#prev-frame').hidden = true;
    try {
      const blob = await pdfDe([c], nombreCarta(c));
      if (!S.prev || S.prev.actual !== i) return;
      if (S.prev.url) URL.revokeObjectURL(S.prev.url);
      S.prev.blob = blob; S.prev.url = URL.createObjectURL(blob);
      const f = $('#prev-frame'); f.src = S.prev.url + '#view=FitH'; f.hidden = false; $('#prev-cargando').hidden = true;
    } catch (e) { console.error(e); $('#prev-cargando').textContent = 'No se pudo generar: ' + errorAmigable(e); }
  }
  ACCIONES['prev-ir'] = (el) => mostrarPrevia(Number(el.dataset.i));
  ACCIONES['prev-pestana'] = () => { if (S.prev && S.prev.blob) window.open(URL.createObjectURL(S.prev.blob), '_blank'); };
  ACCIONES['prev-descargar'] = () => { if (S.prev && S.prev.blob) descargarBlob(S.prev.blob, nombreCarta(S.prev.cartas[S.prev.actual]) + ` - ${rangoMes().etiqueta}.pdf`); };
  ACCIONES['prev-imprimir'] = () => {
    const f = $('#prev-frame');
    try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { if (S.prev && S.prev.blob) imprimirBlob(S.prev.blob); }
  };
  ACCIONES['prev-descargar-todas'] = () => { const cartas = S.prev.cartas; descargar(cartas, S.gen.modo); };

  // =====================================================================
  //  RUTA
  // =====================================================================
  function barraFiltros(extra) {
    return `<div class="filtros">
      <label>Supervisor<select data-c="f-sup">${opcionesSupervisor(S.filtro.sup)}</select></label>
      <label>Buscar<input type="search" placeholder="Nombre o DNI" value="${h(S.filtro.buscar)}" data-i="f-buscar"></label>${extra || ''}</div>`;
  }
  CAMBIOS['f-sup'] = (el) => { S.filtro.sup = el.value; render(); };
  CAMBIOS['f-buscar'] = (el) => {
    S.filtro.buscar = el.value;
    clearTimeout(CAMBIOS.tf); CAMBIOS.tf = setTimeout(() => { const pos = el.selectionStart; render(); const i = $('[data-i="f-buscar"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }, 250);
  };

  function vistaRuta() {
    const mercs = filtrarMercs(S.filtro.sup, S.filtro.buscar);
    const filas = mercs.map((m) => {
      const ts = S.db.ruta.filter((r) => r.mercaderista_id === m.id).map((r) => tiendaPorId(r.tienda_id)).filter(Boolean)
        .sort((a, b) => ordenCadena(a.cadena) - ordenCadena(b.cadena) || a.tienda.localeCompare(b.tienda));
      const sup = usuarioPorEmail(m.supervisor_email);
      return `<tr><td><b>${h(nombreLista(m))}</b><br><small>DNI ${h(m.dni)}</small></td><td>${h(sup ? sup.nombre || sup.email : '—')}</td>
        <td>${ts.length ? ts.map((t) => `<span class="tag azul">${h(cadenaNombre(t.cadena))} · ${h(t.tienda)}</span>`).join('') : '<span class="muted">Sin tiendas</span>'}</td>
        <td class="acciones"><button class="btn chico" data-a="editar-ruta" data-mid="${h(m.id)}">Editar ruta</button></td></tr>`;
    }).join('');
    return `<div class="cabecera"><div><h2>Ruta de mercaderistas</h2><small>Tiendas fijas de cada mercaderista. Se usan cada mes para generar las cartas.</small></div><div>${botonesExcel('ruta')}</div></div>
      ${barraFiltros()}
      <div class="tabla-caja"><table><thead><tr><th>Mercaderista</th><th>Supervisor</th><th>Tiendas en ruta</th><th></th></tr></thead>
      <tbody>${filas || '<tr><td colspan="4" class="vacio">No hay mercaderistas para este filtro.</td></tr>'}</tbody></table></div>`;
  }

  ACCIONES['editar-ruta'] = (el) => {
    const m = mercPorId(el.dataset.mid);
    const actuales = new Set(S.db.ruta.filter((r) => r.mercaderista_id === m.id).map((r) => r.tienda_id));
    const grupos = cadenasDisponibles().map((cad) => {
      const ts = tiendasActivas().filter((t) => t.cadena === cad).sort((a, b) => a.tienda.localeCompare(b.tienda));
      const n = ts.filter((t) => actuales.has(t.id)).length;
      return `<details class="ruta-grupo" data-cad="${h(cad)}" ${n ? 'open' : ''}><summary>${h(cadenaNombre(cad))} <small class="muted">${n} de ${ts.length}${P.CADENAS[cad] ? '' : ' · sin formato de carta'}</small></summary><div class="chips">
        ${ts.map((t) => `<label class="check" data-nombre="${h(norm(cadenaNombre(cad) + ' ' + t.tienda + ' ' + (t.codigo || '')))}"><input type="checkbox" name="t" value="${h(t.id)}" ${actuales.has(t.id) ? 'checked' : ''}>${h(t.tienda)}</label>`).join('')}</div></details>`;
    }).join('');
    abrirModal(`${cabModal('Ruta de ' + nombreM(m))}
      <form id="f-ruta"><div class="modal-cuerpo">
        <input type="search" placeholder="Filtrar tiendas…" data-i="filtro-ruta" style="margin-bottom:12px">
        ${grupos || '<p class="muted">Primero registra tiendas en la pestaña Tiendas.</p>'}
      </div><div class="modal-pie"><button type="button" class="btn" data-a="cerrar-modal">Cancelar</button><button class="btn primario">Guardar ruta</button></div></form>`);
    $('#f-ruta').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const nuevas = new Set($$('input[name=t]:checked', ev.target).map((i) => i.value));
      const agregar = [...nuevas].filter((id) => !actuales.has(id));
      const quitar = [...actuales].filter((id) => !nuevas.has(id));
      await conManejo(async () => {
        if (quitar.length) await api.borrar('ruta', { mercaderista_id: m.id, tienda_id: quitar });
        if (agregar.length) await api.insertar('ruta', agregar.map((tid) => ({ mercaderista_id: m.id, tienda_id: tid })));
        cerrarModal(); render(); toast('Ruta actualizada');
      }, 'Guardando…');
    });
  };
  CAMBIOS['filtro-ruta'] = (el) => {
    const b = norm(el.value);
    $$('#f-ruta label.check').forEach((l) => { l.hidden = b && !l.dataset.nombre.includes(b); });
    $$('#f-ruta details.ruta-grupo').forEach((d) => { if (b) { const hay = $$('label.check', d).some((l) => !l.hidden); d.hidden = !hay; d.open = hay; } else d.hidden = false; });
  };

  // =====================================================================
  //  MERCADERISTAS
  // =====================================================================
  function vistaMercaderistas() {
    const mercs = filtrarMercs(S.filtro.sup, S.filtro.buscar, true);
    const filas = mercs.map((m) => {
      const sup = usuarioPorEmail(m.supervisor_email);
      return `<tr class="${m.activo === false ? 'inactivo' : ''}"><td><b>${h(nombreLista(m))}</b></td><td>${h(m.dni)}</td><td>${h(sup ? sup.nombre || sup.email : '—')}</td>
        <td>${h(m.fecha_ingreso ? P.fCorta(m.fecha_ingreso) : '—')}</td><td>${h(m.fecha_cap_sst ? P.fCorta(m.fecha_cap_sst) : '—')}</td>
        <td>${h(m.carnet_salud || '—')}</td><td>${h(m.codigo_cfr || '—')}</td>
        <td>${m.activo === false ? '<span class="tag">Inactivo</span>' : '<span class="tag ok">Activo</span>'}</td>
        <td class="acciones"><button class="btn chico" data-a="editar-merc" data-mid="${h(m.id)}">Editar</button></td></tr>`;
    }).join('');
    return `<div class="cabecera"><div><h2>Mercaderistas</h2><small>${mercs.length} registrados en este filtro</small></div>
      <div>${botonesExcel('mercaderistas')} <button class="btn primario" data-a="editar-merc">+ Nuevo mercaderista</button></div></div>
      ${barraFiltros()}
      <div class="tabla-caja"><table><thead><tr><th>Nombre</th><th>DNI</th><th>Supervisor</th><th>F. ingreso</th><th>Cap. SST</th><th>Carnet salud</th><th>Código CFR</th><th>Estado</th><th></th></tr></thead>
      <tbody>${filas || '<tr><td colspan="9" class="vacio">No hay mercaderistas para este filtro.</td></tr>'}</tbody></table></div>`;
  }

  ACCIONES['editar-merc'] = (el) => {
    const m = el.dataset.mid ? mercPorId(el.dataset.mid) : { sexo: 'F', activo: true, supervisor_email: S.user.rol === 'supervisor' ? S.email : '' };
    const opSup = ['<option value="">— Sin supervisor —</option>'].concat(supervisores().map((u) => `<option value="${h(u.email)}" ${(m.supervisor_email || '').toLowerCase() === u.email.toLowerCase() ? 'selected' : ''}>${h(u.nombre || u.email)}</option>`)).join('');
    abrirModal(`${cabModal(m.id ? 'Editar mercaderista' : 'Nuevo mercaderista')}
      <form id="f-merc"><div class="modal-cuerpo form-grid">
        <label>Nombres<input type="text" name="nombres" required value="${h(m.nombres)}"></label>
        <label>Apellidos<input type="text" name="apellidos" required value="${h(m.apellidos)}"></label>
        <label>DNI<input type="text" name="dni" required pattern="[0-9A-Za-z]{6,12}" value="${h(m.dni)}"></label>
        <label>Trato en las cartas<select name="sexo"><option value="F" ${m.sexo !== 'M' ? 'selected' : ''}>Femenino (la Srta.)</option><option value="M" ${m.sexo === 'M' ? 'selected' : ''}>Masculino (el Sr.)</option></select></label>
        <label>Supervisor<select name="supervisor_email">${opSup}</select></label>
        <label>Fecha de ingreso<input type="date" name="fecha_ingreso" value="${h(m.fecha_ingreso || '')}"><span class="ayuda">Tottus y constancia de trabajo (Plaza Vea)</span></label>
        <label>Fecha de capacitación SST<input type="date" name="fecha_cap_sst" value="${h(m.fecha_cap_sst || '')}"><span class="ayuda">Saga, Oechsle, Metro y Wong</span></label>
        <label>N° carnet de salud<input type="text" name="carnet_salud" value="${h(m.carnet_salud || '')}"><span class="ayuda">Plaza Vea</span></label>
        <label>Código carné inducción SST (CFR)<input type="text" name="codigo_cfr" value="${h(m.codigo_cfr || '')}"><span class="ayuda">Plaza Vea</span></label>
        <label class="completo check"><input type="checkbox" name="activo" ${m.activo !== false ? 'checked' : ''}> Activo (aparece al generar cartas)</label>
      </div><div class="modal-pie">
        ${m.id ? '<button type="button" class="btn peligro izq" data-a="borrar-merc" data-mid="' + h(m.id) + '">Eliminar</button>' : ''}
        <button type="button" class="btn" data-a="cerrar-modal">Cancelar</button><button class="btn primario">Guardar</button></div></form>`);
    $('#f-merc').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const datos = {
        nombres: String(f.get('nombres')).trim(), apellidos: String(f.get('apellidos')).trim(), dni: String(f.get('dni')).trim(),
        sexo: f.get('sexo'), supervisor_email: nulo(String(f.get('supervisor_email') || '').toLowerCase()),
        fecha_ingreso: nulo(f.get('fecha_ingreso')), fecha_cap_sst: nulo(f.get('fecha_cap_sst')),
        carnet_salud: nulo(String(f.get('carnet_salud')).trim()), codigo_cfr: nulo(String(f.get('codigo_cfr')).trim()),
        activo: f.get('activo') === 'on'
      };
      await conManejo(async () => {
        if (m.id) await api.actualizar('mercaderistas', m.id, datos); else await api.insertar('mercaderistas', [datos]);
        cerrarModal(); render(); toast('Mercaderista guardado');
      }, 'Guardando…');
    });
  };
  ACCIONES['borrar-merc'] = (el) => {
    const m = mercPorId(el.dataset.mid);
    if (!confirm(`¿Eliminar a ${nombreM(m)}? También se borra su ruta y sus apoyos. Si solo dejó de trabajar, mejor desmarca "Activo".`)) return;
    conManejo(async () => {
      await api.borrar('mercaderistas', { id: m.id });
      S.db.ruta = S.db.ruta.filter((r) => r.mercaderista_id !== m.id);
      S.db.apoyos = S.db.apoyos.filter((r) => r.mercaderista_id !== m.id);
      cerrarModal(); render(); toast('Mercaderista eliminado');
    }, 'Eliminando…');
  };

  // =====================================================================
  //  TIENDAS
  // =====================================================================
  function vistaTiendas() {
    const b = norm(S.filtro.buscar);
    const ts = S.db.tiendas
      .filter((t) => !S.filtro.cadena || t.cadena === S.filtro.cadena)
      .filter((t) => !b || norm(t.cadena + ' ' + t.tienda + ' ' + (t.nombre_carta || '') + ' ' + (t.codigo || '')).includes(b))
      .sort((a, c) => ordenCadena(a.cadena) - ordenCadena(c.cadena) || a.tienda.localeCompare(c.tienda));
    const cadenas = [...new Set(Object.keys(P.CADENAS).concat(S.db.tiendas.map((t) => t.cadena)))];
    const LIM = 300;
    const filas = ts.slice(0, LIM).map((t) => {
      const n = S.db.ruta.filter((r) => r.tienda_id === t.id).length;
      return `<tr class="${t.activa === false ? 'inactivo' : ''}"><td>${h(cadenaNombre(t.cadena))}${P.CADENAS[t.cadena] ? '' : ' <span class="tag rojo">sin formato</span>'}</td><td><b>${h(t.tienda)}</b><br><small>${h(t.codigo || '')}</small></td>
        <td>${h(t.nombre_carta || '')}</td><td>${h(t.gerente || '—')}</td><td>${n}</td><td>${t.activa === false ? '<span class="tag">Inactiva</span>' : '<span class="tag ok">Activa</span>'}</td>
        <td class="acciones"><button class="btn chico" data-a="editar-tienda" data-tid="${h(t.id)}">Editar</button></td></tr>`;
    }).join('');
    return `<div class="cabecera"><div><h2>Tiendas</h2><small>${ts.length} tiendas en este filtro</small></div>
      <div>${botonesExcel('tiendas')} <button class="btn primario" data-a="editar-tienda">+ Nueva tienda</button></div></div>
      <div class="filtros">
        <label>Cadena<select data-c="f-cadena"><option value="">Todas</option>${cadenas.map((c) => `<option value="${h(c)}" ${S.filtro.cadena === c ? 'selected' : ''}>${h(cadenaNombre(c))}</option>`).join('')}</select></label>
        <label>Buscar<input type="search" placeholder="Tienda" value="${h(S.filtro.buscar)}" data-i="f-buscar"></label></div>
      <div class="tabla-caja"><table><thead><tr><th>Cadena</th><th>Tienda</th><th>Nombre en la carta</th><th>Gerente (Tottus)</th><th>Mercaderistas</th><th>Estado</th><th></th></tr></thead>
      <tbody>${filas || '<tr><td colspan="7" class="vacio">No hay tiendas.</td></tr>'}</tbody></table></div>
      ${ts.length > LIM ? `<p class="muted" style="margin-top:8px">Se muestran ${LIM} de ${ts.length}. Usa el filtro de cadena o el buscador para encontrar las demás.</p>` : ''}`;
  }
  CAMBIOS['f-cadena'] = (el) => { S.filtro.cadena = el.value; render(); };

  ACCIONES['editar-tienda'] = (el) => {
    const t = el.dataset.tid ? tiendaPorId(el.dataset.tid) : { cadena: S.filtro.cadena || 'TOTTUS', activa: true };
    const cadenas = [...new Set(Object.keys(P.CADENAS).concat(S.db.tiendas.map((x) => x.cadena), t.cadena ? [t.cadena] : []))];
    abrirModal(`${cabModal(t.id ? 'Editar tienda' : 'Nueva tienda')}
      <form id="f-tienda"><div class="modal-cuerpo form-grid">
        <label>Cadena<input type="text" name="cadena" list="lista-cadenas" required value="${h(t.cadena || '')}" style="text-transform:uppercase"><datalist id="lista-cadenas">${cadenas.map((c) => `<option value="${h(c)}">${h(cadenaNombre(c))}</option>`).join('')}</datalist><span class="ayuda">Elige una o escribe una nueva (ej.: RIPLEY).</span></label>
        <label>Tienda<input type="text" name="tienda" required placeholder="Ej.: La Fontana" value="${h(t.tienda || '')}"></label>
        <label>Código (opcional)<input type="text" name="codigo" placeholder="Ej.: TOTTUS-123" value="${h(t.codigo || '')}"></label>
        <label class="completo">Nombre como aparece en la carta<input type="text" name="nombre_carta" placeholder="Ej.: HIPERMERCADOS TOTTUS LA FONTANA" value="${h(t.nombre_carta || '')}"><span class="ayuda">Si lo dejas vacío se usa «CADENA TIENDA».</span></label>
        <label class="completo">Gerente de tienda<input type="text" name="gerente" value="${h(t.gerente || '')}"><span class="ayuda">Solo lo usa la carta de presentación de Tottus.</span></label>
        <label class="completo check"><input type="checkbox" name="activa" ${t.activa !== false ? 'checked' : ''}> Activa</label>
      </div><div class="modal-pie">
        ${t.id ? '<button type="button" class="btn peligro izq" data-a="borrar-tienda" data-tid="' + h(t.id) + '">Eliminar</button>' : ''}
        <button type="button" class="btn" data-a="cerrar-modal">Cancelar</button><button class="btn primario">Guardar</button></div></form>`);
    $('#f-tienda').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const datos = { cadena: String(f.get('cadena')).trim().toUpperCase(), tienda: String(f.get('tienda')).trim(), codigo: nulo(String(f.get('codigo') || '').trim()), nombre_carta: nulo(String(f.get('nombre_carta')).trim().toUpperCase()), gerente: nulo(String(f.get('gerente')).trim()), activa: f.get('activa') === 'on' };
      await conManejo(async () => {
        if (t.id) await api.actualizar('tiendas', t.id, datos); else await api.insertar('tiendas', [datos]);
        cerrarModal(); render(); toast('Tienda guardada');
      }, 'Guardando…');
    });
  };
  ACCIONES['borrar-tienda'] = (el) => {
    const t = tiendaPorId(el.dataset.tid);
    if (!confirm(`¿Eliminar ${cadenaNombre(t.cadena)} ${t.tienda}? Se quitará de la ruta de todos los mercaderistas. Si ya no se visita, mejor desmarca "Activa".`)) return;
    conManejo(async () => {
      await api.borrar('tiendas', { id: t.id });
      S.db.ruta = S.db.ruta.filter((r) => r.tienda_id !== t.id);
      S.db.apoyos = S.db.apoyos.filter((r) => r.tienda_id !== t.id);
      cerrarModal(); render(); toast('Tienda eliminada');
    }, 'Eliminando…');
  };

  // =====================================================================
  //  APOYOS
  // =====================================================================
  function vistaApoyos() {
    const hoy = iso(new Date());
    const permitidos = new Set(filtrarMercs(S.filtro.sup, S.filtro.buscar, true).map((m) => m.id));
    const lista = S.db.apoyos
      .filter((a) => permitidos.has(a.mercaderista_id))
      .filter((a) => S.filtro.apoyos === 'todos' || a.hasta >= hoy)
      .sort((a, b) => (a.desde < b.desde ? 1 : -1));
    const filas = lista.map((a) => {
      const m = mercPorId(a.mercaderista_id), t = tiendaPorId(a.tienda_id);
      if (!m || !t) return '';
      return `<tr><td><b>${h(nombreLista(m))}</b></td><td>${h(cadenaNombre(t.cadena))} · ${h(t.tienda)}</td><td>${h(P.fCorta(a.desde))}</td><td>${h(P.fCorta(a.hasta))}</td>
        <td>${h(a.nota || '')}</td><td><small>${h(a.actualizado_por || '')}</small></td>
        <td class="acciones"><button class="btn chico peligro" data-a="borrar-apoyo" data-id="${h(a.id)}">Eliminar</button></td></tr>`;
    }).join('');
    return `<div class="cabecera"><div><h2>Apoyos</h2><small>Tiendas fuera de la ruta por un periodo (reemplazos, inventarios, campañas). Se marcan solas al generar las cartas del mes.</small></div>
      <div>${botonesExcel('apoyos')} <button class="btn primario" data-a="nuevo-apoyo">+ Nuevo apoyo</button></div></div>
      ${barraFiltros(`<label>Mostrar<select data-c="f-apoyos"><option value="vigentes" ${S.filtro.apoyos === 'vigentes' ? 'selected' : ''}>Vigentes y próximos</option><option value="todos" ${S.filtro.apoyos === 'todos' ? 'selected' : ''}>Todos</option></select></label>`)}
      <div class="tabla-caja"><table><thead><tr><th>Mercaderista</th><th>Tienda</th><th>Desde</th><th>Hasta</th><th>Nota</th><th>Registrado por</th><th></th></tr></thead>
      <tbody>${filas || '<tr><td colspan="7" class="vacio">No hay apoyos registrados.</td></tr>'}</tbody></table></div>`;
  }
  CAMBIOS['f-apoyos'] = (el) => { S.filtro.apoyos = el.value; render(); };

  ACCIONES['nuevo-apoyo'] = () => {
    const mercs = filtrarMercs('__todos__', '');
    const { ini, fin } = rangoMes();
    const opT = cadenasDisponibles().map((cad) => `<optgroup label="${h(cadenaNombre(cad))}">${tiendasActivas().filter((t) => t.cadena === cad).sort((a, b) => a.tienda.localeCompare(b.tienda)).map((t) => `<option value="${h(t.id)}">${h(cadenaNombre(cad))} · ${h(t.tienda)}</option>`).join('')}</optgroup>`).join('');
    abrirModal(`${cabModal('Nuevo apoyo')}
      <form id="f-apoyo"><div class="modal-cuerpo form-grid">
        <label class="completo">Mercaderista<select name="m" required><option value="">Elegir…</option>${mercs.map((m) => `<option value="${h(m.id)}">${h(nombreLista(m))} · ${h(m.dni)}</option>`).join('')}</select></label>
        <label class="completo">Tienda<select name="t" required><option value="">Elegir…</option>${opT}</select></label>
        <label>Desde<input type="date" name="desde" required value="${iso(ini)}"></label>
        <label>Hasta<input type="date" name="hasta" required value="${iso(fin)}"></label>
        <label class="completo">Nota (opcional)<input type="text" name="nota" placeholder="Ej.: reemplazo por vacaciones"></label>
      </div><div class="modal-pie"><button type="button" class="btn" data-a="cerrar-modal">Cancelar</button><button class="btn primario">Guardar apoyo</button></div></form>`);
    $('#f-apoyo').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      if (f.get('hasta') < f.get('desde')) return toast('La fecha "hasta" no puede ser anterior a "desde"', true);
      await conManejo(async () => {
        await api.insertar('apoyos', [{ mercaderista_id: f.get('m'), tienda_id: f.get('t'), desde: f.get('desde'), hasta: f.get('hasta'), nota: nulo(String(f.get('nota')).trim()) }]);
        cerrarModal(); render(); toast('Apoyo registrado');
      }, 'Guardando…');
    });
  };
  ACCIONES['borrar-apoyo'] = (el) => {
    if (!confirm('¿Eliminar este apoyo?')) return;
    conManejo(async () => { await api.borrar('apoyos', { id: el.dataset.id }); render(); toast('Apoyo eliminado'); }, 'Eliminando…');
  };

  // =====================================================================
  //  CONFIGURACIÓN
  // =====================================================================
  function vistaConfig() {
    const c = cfg(), admin = esAdmin();
    const grupos = [...new Set(CONFIG_CAMPOS.map((x) => x[2]))];
    const campos = grupos.map((g) => `<div class="panel"><h3>${h(g)}</h3><div class="config-grid">
      ${CONFIG_CAMPOS.filter((x) => x[2] === g).map(([k, etq]) => `<label>${h(etq)}<input type="text" name="${h(k)}" value="${h(c[k] || '')}" ${admin ? '' : 'disabled'}></label>`).join('')}
      </div></div>`).join('');
    const ref = (CFG.supabaseUrl || '').replace(/^https:\/\/([^.]+)\..*$/, '$1');
    const usuarios = admin ? `<div class="panel"><h3>Usuarios y supervisores</h3>
      <p class="ayuda" style="margin-bottom:10px">Cada supervisor ve por defecto a sus mercaderistas. Al agregar un usuario con contraseña (o cargarlo por Excel con la columna CONTRASEÑA) se le crea su acceso para ingresar. Si alguien olvida su contraseña, restablécela en
      <a href="https://supabase.com/dashboard/project/${h(ref)}/auth/users" target="_blank" rel="noopener">Supabase → Authentication → Users</a>.</p>
      <p style="margin-bottom:10px">${botonesExcel('usuarios')}</p>
      <div class="tabla-caja"><table><thead><tr><th>Correo</th><th>Nombre</th><th>Celular (va en las cartas)</th><th>Rol</th><th>Mercaderistas</th><th></th></tr></thead><tbody>
      ${supervisores().map((u) => `<tr><td>${h(u.email)}</td><td>${h(u.nombre || '')}</td><td>${h(u.celular || '')}</td><td>${u.rol === 'admin' ? '<span class="tag azul">Administrador</span>' : '<span class="tag">Supervisor</span>'}</td>
        <td>${S.db.mercaderistas.filter((m) => (m.supervisor_email || '').toLowerCase() === u.email.toLowerCase()).length}</td>
        <td class="acciones"><button class="btn chico" data-a="editar-usuario" data-email="${h(u.email)}">Editar</button></td></tr>`).join('')}
      </tbody></table></div><p style="margin-top:10px"><button class="btn" data-a="editar-usuario">+ Agregar usuario</button></p></div>` : '';
    return `<div class="cabecera"><div><h2>Configuración</h2><small>${admin ? 'Datos que se repiten en todas las cartas.' : 'Solo un administrador puede modificar esta sección.'}</small></div>
      ${admin ? '<button class="btn primario" data-a="guardar-config">Guardar cambios</button>' : ''}</div>
      <div class="panel"><h3>Firma</h3>
        ${c.FIRMA ? `<img class="firma-prev" src="${h(c.FIRMA)}" alt="Firma">` : '<p class="faltan">Todavía no hay firma cargada.</p>'}
        ${admin ? '<label class="btn" style="display:inline-flex">Cargar imagen de firma (PNG/JPG)<input type="file" accept="image/*" data-c="firma" hidden></label><p class="ayuda">Usa una imagen con fondo blanco. Se guarda en la base (no en GitHub).</p>' : ''}
      </div>
      <form id="f-config">${campos}</form>
      ${usuarios}
      <div class="panel"><h3>Carga masiva con Excel</h3>
        <p class="ayuda">Cada pestaña tiene su propio Excel: <b>Mercaderistas</b>, <b>Tiendas</b>, <b>Ruta</b> y <b>Apoyos</b> (y <b>Usuarios</b> aquí arriba). Descarga la base actual, modifícala y vuelve a cargarla. El paso a paso está en la pestaña <b>Ayuda</b>.</p>
      </div>`;
  }

  ACCIONES['guardar-config'] = () => {
    const f = $('#f-config'); const obj = {};
    CONFIG_CAMPOS.forEach(([k]) => { const i = f.elements[k]; if (i) obj[k] = i.value.trim(); });
    conManejo(async () => { await api.guardarConfig(obj); toast('Configuración guardada'); }, 'Guardando…');
  };

  CAMBIOS.firma = (el) => {
    const file = el.files[0]; if (!file) return;
    const img = new Image();
    img.onload = () => {
      const w = Math.min(700, img.width), hgt = Math.round(w * img.height / img.width);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = hgt;
      const g = cv.getContext('2d'); g.drawImage(img, 0, 0, w, hgt);
      // El fondo blanco se vuelve transparente para que no tape la marca de agua
      const px = g.getImageData(0, 0, w, hgt), d = px.data;
      for (let i = 0; i < d.length; i += 4) {
        const min = Math.min(d[i], d[i + 1], d[i + 2]);
        if (min > 235) d[i + 3] = 0; else if (min > 200) d[i + 3] = Math.min(d[i + 3], Math.round((235 - min) * 255 / 35));
      }
      g.putImageData(px, 0, 0);
      const url = cv.toDataURL('image/png');
      conManejo(async () => { await api.guardarConfig({ FIRMA: url }); render(); toast('Firma guardada'); }, 'Guardando firma…');
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  ACCIONES['editar-usuario'] = (el) => {
    const u = el.dataset.email ? usuarioPorEmail(el.dataset.email) : { rol: 'supervisor' };
    abrirModal(`${cabModal(u.email ? 'Editar usuario' : 'Agregar usuario')}
      <form id="f-usuario"><div class="modal-cuerpo form-grid">
        <label class="completo">Correo (con el que ingresa)<input type="email" name="email" required value="${h(u.email || '')}" ${u.email ? 'readonly' : ''}></label>
        <label>Nombre<input type="text" name="nombre" required value="${h(u.nombre || '')}"></label>
        <label>Celular<input type="text" name="celular" value="${h(u.celular || '')}"><span class="ayuda">Aparece como contacto del supervisor (Plaza Vea y Oechsle).</span></label>
        <label>Rol<select name="rol"><option value="supervisor" ${u.rol !== 'admin' ? 'selected' : ''}>Supervisor</option><option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Administrador</option></select></label>
        <label>Contraseña ${u.email ? '(solo si aún no tiene acceso)' : 'para ingresar'}<input type="text" name="clave" minlength="6" autocomplete="off" placeholder="Ej.: su DNI"><span class="ayuda">Mínimo 6 caracteres. Luego puede cambiarla desde su menú.</span></label>
      </div><div class="modal-pie">
        ${u.email && u.email !== S.email ? '<button type="button" class="btn peligro izq" data-a="borrar-usuario" data-email="' + h(u.email) + '">Quitar acceso</button>' : ''}
        <button type="button" class="btn" data-a="cerrar-modal">Cancelar</button><button class="btn primario">Guardar</button></div></form>`);
    $('#f-usuario').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const datos = { email: String(f.get('email')).trim().toLowerCase(), nombre: String(f.get('nombre')).trim(), celular: nulo(String(f.get('celular')).trim()), rol: f.get('rol') };
      const clave = String(f.get('clave') || '').trim();
      await conManejo(async () => {
        await api.upsert('usuarios', [datos], 'email');
        let extra = '';
        if (clave) extra = (await crearAcceso(datos.email, clave)) === 'creado' ? ' y acceso creado' : ' (ya tenía acceso; la contraseña no se cambió)';
        cerrarModal(); render(); toast('Usuario guardado' + extra);
      }, 'Guardando…');
    });
  };
  ACCIONES['borrar-usuario'] = (el) => {
    if (!confirm(`¿Quitar el acceso de ${el.dataset.email}? Sus mercaderistas quedarán sin supervisor.`)) return;
    conManejo(async () => {
      await api.borrar('usuarios', { email: el.dataset.email });
      S.db.mercaderistas.forEach((m) => { if ((m.supervisor_email || '').toLowerCase() === el.dataset.email.toLowerCase()) m.supervisor_email = null; });
      cerrarModal(); render(); toast('Acceso quitado');
    }, 'Guardando…');
  };

  // ---------- Excel ----------
  function fechaExcel(v) {
    if (v == null || v === '') return null;
    if (v instanceof Date) return iso(new Date(v.getFullYear(), v.getMonth(), v.getDate()));
    if (typeof v === 'number') { const d = new Date(Math.round((v - 25569) * 86400000)); return iso(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
    const d = P.aFecha(String(v).trim()); return d ? iso(d) : null;
  }
  const txt = (v) => (v == null ? '' : String(v).trim());
  const siNo = (v) => !/^(no|n|0|false|inactiv[oa])$/i.test(txt(v));

  // ---------- Accesos (usuarios que pueden ingresar) ----------
  async function crearAcceso(email, clave) {
    if (S.demo) return 'creado';
    const { data, error } = await S.sb.rpc('crear_acceso', { p_email: email, p_clave: String(clave) });
    if (error) throw error;
    return data;
  }

  // ---------- Excel por entidad (descargar la base actual / cargar cambios) ----------
  const porTrozos = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
  const nombreFiltro = () => (S.filtro.sup === '__todos__' ? 'todos' : S.filtro.sup === '__sin__' ? 'sin supervisor' : ((usuarioPorEmail(S.filtro.sup) || {}).nombre || S.filtro.sup));
  const dniTxt = (v) => { let d = txt(v).replace(/\.0+$/, ''); if (/^\d{1,7}$/.test(d)) d = d.padStart(8, '0'); return d; };
  const buscaMerc = (v) => { const d = dniTxt(v); return d ? S.db.mercaderistas.find((m) => m.dni === d) : null; };
  function buscadorTiendas() {
    const porCod = new Map(S.db.tiendas.filter((t) => t.codigo).map((t) => [t.codigo.toUpperCase(), t]));
    const porNom = new Map(S.db.tiendas.map((t) => [t.cadena + '|' + norm(t.tienda), t]));
    return (r) => (txt(r.CODIGO) && porCod.get(txt(r.CODIGO).toUpperCase())) || porNom.get(txt(r.CADENA).toUpperCase() + '|' + norm(r.TIENDA)) || null;
  }
  const ordenTiendas = (a, b) => ordenCadena(a.cadena) - ordenCadena(b.cadena) || a.cadena.localeCompare(b.cadena) || a.tienda.localeCompare(b.tienda);

  const EXCEL = {
    usuarios: {
      titulo: 'Usuarios', soloAdmin: true, requeridas: ['EMAIL'],
      cols: ['EMAIL', 'NOMBRE', 'CELULAR', 'ROL', 'CONTRASEÑA'],
      filas: () => supervisores().map((u) => [u.email, u.nombre || '', u.celular || '', u.rol, '']),
      async importar(filas, cab) {
        const rows = filas.filter((r) => txt(r.EMAIL)).map((r) => {
          const o = { email: txt(r.EMAIL).toLowerCase() };
          if (cab.has('NOMBRE')) o.nombre = txt(r.NOMBRE) || null;
          if (cab.has('CELULAR')) o.celular = txt(r.CELULAR) || null;
          if (cab.has('ROL')) o.rol = /admin/i.test(txt(r.ROL)) || o.email === S.email ? 'admin' : 'supervisor';
          return o;
        });
        ocupado('Cargando usuarios…');
        await api.upsert('usuarios', rows, 'email');
        const conClave = filas.filter((r) => txt(r.EMAIL) && txt(r.CONTRASENA));
        let creados = 0, existian = 0; const errores = [];
        for (let i = 0; i < conClave.length; i++) {
          ocupado(`Creando accesos ${i + 1} de ${conClave.length}…`);
          const r = conClave[i];
          try { (await crearAcceso(txt(r.EMAIL).toLowerCase(), dniTxt(r.CONTRASENA) || txt(r.CONTRASENA))) === 'creado' ? creados++ : existian++; }
          catch (e) { errores.push(`${txt(r.EMAIL)}: ${errorAmigable(e)}`); }
        }
        let texto = `Usuarios: ${rows.length} cargados.`;
        if (conClave.length) texto += ` Accesos: ${creados} creados${existian ? `, ${existian} ya existían (no se cambió su contraseña)` : ''}.`;
        if (errores.length) texto += ` No se pudo crear: ${errores.join('; ')}`;
        return { texto, alerta: errores.length > 0 };
      }
    },
    tiendas: {
      titulo: 'Tiendas', requeridas: ['CADENA', 'TIENDA'],
      cols: ['CODIGO', 'CADENA', 'TIENDA', 'NOMBRE_CARTA', 'GERENTE', 'ACTIVA'],
      filas: () => S.db.tiendas.slice().sort(ordenTiendas).map((t) => [t.codigo || '', t.cadena, t.tienda, t.nombre_carta || '', t.gerente || '', t.activa === false ? 'NO' : 'SI']),
      async importar(filas, cab) {
        const busca = buscadorTiendas();
        const nuevas = [], cambios = [], vistos = new Set();
        filas.forEach((r) => {
          const cadena = txt(r.CADENA).toUpperCase(), tienda = txt(r.TIENDA);
          if (!cadena || !tienda) return;
          const o = { cadena, tienda };
          if (cab.has('CODIGO')) o.codigo = txt(r.CODIGO) || null;
          if (cab.has('NOMBRE_CARTA')) o.nombre_carta = txt(r.NOMBRE_CARTA).toUpperCase() || null;
          if (cab.has('GERENTE')) o.gerente = txt(r.GERENTE) || null;
          if (cab.has('ACTIVA')) o.activa = siNo(r.ACTIVA);
          const ex = busca({ CODIGO: o.codigo, CADENA: cadena, TIENDA: tienda });
          const k = ex ? ex.id : (o.codigo || cadena + '|' + norm(tienda));
          if (vistos.has(k)) return;
          vistos.add(k);
          if (ex) cambios.push(Object.assign({ id: ex.id }, o)); else nuevas.push(o);
        });
        const lotesC = porTrozos(cambios, 500), lotesN = porTrozos(nuevas, 500);
        for (let i = 0; i < lotesC.length; i++) { ocupado(`Actualizando tiendas ${i + 1}/${lotesC.length}…`); await api.upsert('tiendas', lotesC[i], 'id'); }
        for (let i = 0; i < lotesN.length; i++) { ocupado(`Creando tiendas ${i + 1}/${lotesN.length}…`); await api.insertar('tiendas', lotesN[i]); }
        return { texto: `Tiendas: ${nuevas.length} nuevas y ${cambios.length} actualizadas.` };
      }
    },
    mercaderistas: {
      titulo: 'Mercaderistas', porSupervisor: true, requeridas: ['DNI', 'NOMBRES'],
      cols: ['NOMBRES', 'APELLIDOS', 'DNI', 'SEXO', 'SUPERVISOR_EMAIL', 'FECHA_INGRESO', 'FECHA_CAP_SST', 'CARNET_SALUD', 'CODIGO_CFR', 'ACTIVO'],
      filas: () => filtrarMercs(S.filtro.sup, '', true).map((m) => [m.nombres, m.apellidos, m.dni, m.sexo, m.supervisor_email || '',
        m.fecha_ingreso ? P.fCorta(m.fecha_ingreso) : '', m.fecha_cap_sst ? P.fCorta(m.fecha_cap_sst) : '', m.carnet_salud || '', m.codigo_cfr || '', m.activo === false ? 'NO' : 'SI']),
      async importar(filas, cab) {
        const emails = new Set(S.db.usuarios.map((u) => u.email.toLowerCase()));
        const sinSup = new Set(), vistos = new Set(), rows = [];
        filas.forEach((r) => {
          const dni = dniTxt(r.DNI);
          if (!dni || !txt(r.NOMBRES) || vistos.has(dni)) return;
          vistos.add(dni);
          const o = { dni, nombres: txt(r.NOMBRES), apellidos: txt(r.APELLIDOS) };
          if (cab.has('SEXO')) o.sexo = /^m/i.test(txt(r.SEXO)) ? 'M' : 'F';
          if (cab.has('SUPERVISOR_EMAIL')) {
            let sup = txt(r.SUPERVISOR_EMAIL).toLowerCase() || null;
            if (sup && !emails.has(sup)) { sinSup.add(sup); sup = null; }
            o.supervisor_email = sup;
          }
          if (cab.has('FECHA_INGRESO')) o.fecha_ingreso = fechaExcel(r.FECHA_INGRESO);
          if (cab.has('FECHA_CAP_SST')) o.fecha_cap_sst = fechaExcel(r.FECHA_CAP_SST);
          if (cab.has('CARNET_SALUD')) o.carnet_salud = txt(r.CARNET_SALUD) || null;
          if (cab.has('CODIGO_CFR')) o.codigo_cfr = txt(r.CODIGO_CFR) || null;
          if (cab.has('ACTIVO')) o.activo = siNo(r.ACTIVO);
          rows.push(o);
        });
        const lotes = porTrozos(rows, 500);
        for (let i = 0; i < lotes.length; i++) { ocupado(`Cargando mercaderistas ${i + 1}/${lotes.length}…`); await api.upsert('mercaderistas', lotes[i], 'dni'); }
        let texto = `Mercaderistas: ${rows.length} cargados o actualizados.`;
        if (sinSup.size) texto += ` Estos supervisores no están en Usuarios y quedaron sin asignar: ${[...sinSup].join(', ')}.`;
        return { texto, alerta: sinSup.size > 0 };
      }
    },
    ruta: {
      titulo: 'Ruta', porSupervisor: true, requeridas: ['DNI'],
      cols: ['DNI', 'MERCADERISTA', 'CODIGO', 'CADENA', 'TIENDA'],
      filas: () => {
        const out = [];
        filtrarMercs(S.filtro.sup, '', true).forEach((m) => {
          S.db.ruta.filter((r) => r.mercaderista_id === m.id).map((r) => tiendaPorId(r.tienda_id)).filter(Boolean).sort(ordenTiendas)
            .forEach((t) => out.push([m.dni, nombreLista(m), t.codigo || '', t.cadena, t.tienda]));
        });
        return out;
      },
      async importar(filas) {
        const busca = buscadorTiendas();
        const porM = new Map(), noM = new Set(), noT = [];
        filas.forEach((r) => {
          const m = buscaMerc(r.DNI);
          if (!m) { if (txt(r.DNI)) noM.add(dniTxt(r.DNI)); return; }
          if (!porM.has(m.id)) porM.set(m.id, new Set());
          if (!txt(r.CODIGO) && !txt(r.TIENDA)) return; // fila solo con DNI: queda sin ruta
          const t = busca(r);
          if (!t) { noT.push(`${txt(r.CADENA)} ${txt(r.TIENDA)} ${txt(r.CODIGO)}`.replace(/\s+/g, ' ').trim()); return; }
          porM.get(m.id).add(t.id);
        });
        ocupado('Actualizando ruta…');
        for (const lote of porTrozos([...porM.keys()], 100)) await api.borrar('ruta', { mercaderista_id: lote });
        const nuevas = [];
        porM.forEach((set, mid) => set.forEach((tid) => nuevas.push({ mercaderista_id: mid, tienda_id: tid })));
        for (const lote of porTrozos(nuevas, 500)) await api.insertar('ruta', lote);
        let texto = `Ruta: ${porM.size} mercaderistas actualizados (${nuevas.length} tiendas asignadas).`;
        if (noM.size) texto += ` DNI no registrados en Mercaderistas: ${[...noM].slice(0, 8).join(', ')}${noM.size > 8 ? '…' : ''}.`;
        if (noT.length) texto += ` Tiendas no encontradas: ${noT.slice(0, 5).join('; ')}${noT.length > 5 ? '…' : ''}.`;
        return { texto, alerta: noM.size > 0 || noT.length > 0 };
      }
    },
    apoyos: {
      titulo: 'Apoyos', porSupervisor: true, requeridas: ['DNI', 'DESDE', 'HASTA'],
      cols: ['DNI', 'MERCADERISTA', 'CODIGO', 'CADENA', 'TIENDA', 'DESDE', 'HASTA', 'NOTA'],
      filas: () => {
        const ids = new Set(filtrarMercs(S.filtro.sup, '', true).map((m) => m.id));
        return S.db.apoyos.filter((a) => ids.has(a.mercaderista_id)).sort((a, b) => (a.desde < b.desde ? 1 : -1)).map((a) => {
          const m = mercPorId(a.mercaderista_id) || {}, t = tiendaPorId(a.tienda_id) || {};
          return [m.dni || '', m.nombres ? nombreLista(m) : '', t.codigo || '', t.cadena || '', t.tienda || '', P.fCorta(a.desde), P.fCorta(a.hasta), a.nota || ''];
        });
      },
      async importar(filas) {
        const busca = buscadorTiendas();
        const nuevas = [], errores = [];
        filas.forEach((r) => {
          const m = buscaMerc(r.DNI), t = busca(r), d = fechaExcel(r.DESDE), hs = fechaExcel(r.HASTA);
          if (!m || !t || !d || !hs) { errores.push(`${txt(r.DNI)} ${txt(r.TIENDA)}`.trim()); return; }
          if (S.db.apoyos.some((a) => a.mercaderista_id === m.id && a.tienda_id === t.id && a.desde === d && a.hasta === hs)) return;
          nuevas.push({ mercaderista_id: m.id, tienda_id: t.id, desde: d, hasta: hs, nota: txt(r.NOTA) || null });
        });
        for (const lote of porTrozos(nuevas, 500)) await api.insertar('apoyos', lote);
        let texto = `Apoyos: ${nuevas.length} nuevos.`;
        if (errores.length) texto += ` Filas con datos incompletos o no encontrados: ${errores.slice(0, 5).join('; ')}${errores.length > 5 ? '…' : ''}.`;
        return { texto, alerta: errores.length > 0 };
      }
    }
  };

  function botonesExcel(e) {
    if (EXCEL[e].soloAdmin && !esAdmin()) return '';
    return `<button class="btn" data-a="xls-bajar" data-e="${e}" title="Descarga la base actual para revisarla o modificarla">⬇ Descargar Excel</button>
      <label class="btn" title="Carga un Excel con el mismo formato de la descarga">⬆ Cargar Excel<input type="file" accept=".xlsx,.xls,.csv" data-c="xls-subir" data-e="${e}" hidden></label>`;
  }

  ACCIONES['xls-bajar'] = (el) => conManejo(async () => {
    const d = EXCEL[el.dataset.e];
    await cargarScript(LIBS.xlsx);
    const X = window.XLSX;
    const filas = d.filas();
    const ws = X.utils.aoa_to_sheet([d.cols].concat(filas));
    ws['!cols'] = d.cols.map((c, j) => ({ wch: Math.min(48, Math.max(c.length, ...filas.slice(0, 300).map((f) => String(f[j] || '').length)) + 2) }));
    ws['!autofilter'] = { ref: ws['!ref'] };
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, d.titulo.toUpperCase());
    const out = X.write(wb, { bookType: 'xlsx', type: 'array' });
    const extra = d.porSupervisor ? ` - ${nombreFiltro()}` : '';
    descargarBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), limpiarArchivo(`${d.titulo}${extra} ${iso(new Date())}`) + '.xlsx');
  }, 'Preparando Excel…');

  CAMBIOS['xls-subir'] = (el) => {
    const file = el.files[0]; if (!file) return;
    el.value = '';
    const d = EXCEL[el.dataset.e];
    conManejo(async () => {
      await cargarScript(LIBS.xlsx);
      const X = window.XLSX;
      const wb = X.read(await file.arrayBuffer(), { type: 'array' });
      const hoja = wb.SheetNames.find((n) => norm(n) === norm(d.titulo)) || wb.SheetNames[0];
      const aoa = X.utils.sheet_to_json(wb.Sheets[hoja], { header: 1, defval: '', raw: true });
      const cab = (aoa[0] || []).map((c) => norm(c).toUpperCase().replace(/\s+/g, '_'));
      const falta = d.requeridas.filter((c) => !cab.includes(c));
      if (falta.length) throw new Error(`Al Excel le faltan las columnas: ${falta.join(', ')}. Descarga la base de esta pestaña para ver el formato.`);
      const filas = aoa.slice(1).filter((r) => r.some((v) => txt(v))).map((r) => { const o = {}; cab.forEach((c, j) => { if (c) o[c] = r[j]; }); return o; });
      if (!filas.length) throw new Error('El Excel no tiene filas para cargar.');
      const res = await d.importar(filas, new Set(cab));
      ocupado('Actualizando datos…');
      if (!S.demo) await cargarTodo();
      render();
      abrirModal(`${cabModal('Resultado de la carga · ' + d.titulo)}<div class="modal-cuerpo"><p class="${res.alerta ? 'faltan' : ''}" style="white-space:pre-line">${h(res.texto.replace(/\. /g, '.\n'))}</p></div>
        <div class="modal-pie"><button class="btn primario" data-a="cerrar-modal">Listo</button></div>`);
    }, 'Leyendo Excel…');
  };


  // ---------- Arranque ----------
  ACCIONES['ayuda-pdf'] = () => conManejo(async () => { await asegurarPDF(); await window.Ayuda.descargarPDF(); }, 'Preparando instructivo…');
  window.__cartasApp = { S, cartasSeleccionadas, pdfDe, asegurarPDF };
  iniciar().catch((e) => { console.error(e); mostrarLogin(errorAmigable(e)); });
})();
