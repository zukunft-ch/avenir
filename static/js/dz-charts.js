/*
  DZCharts: one chart language for every Zukunftslabor figure.
  Used by notiz.html (interactive Vega) and by zukunftslabor/scripts/render_charts.mjs
  (static SVG fallbacks), so both look identical.
  - config(dark): Vega-Lite config in the site's tokens (ink, ceramic ground, Alpenglühen).
  - prepare(spec, opts): strips the per-spec title/config/size (the title lives in the figure
    head, size comes from the container) and applies the house marks.
*/
(function (root) {
  var SANS = '"Mozilla Headline", system-ui, sans-serif';
  var MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

  var PAL = {
    light: {
      ink: '#121517', muted: '#4f565b', faint: 'rgba(18,21,23,0.09)', zero: 'rgba(18,21,23,0.35)',
      cat: ['#c026d3', '#6d28d9', '#f43f5e', '#4338ca', '#8a9196', '#d97706'],
      ramp: ['#fce7f3', '#c026d3', '#4338ca'],
      grad: ['#f43f5e', '#c026d3', '#6d28d9', '#4338ca']
    },
    dark: {
      ink: '#e7eae6', muted: '#a2a9ad', faint: 'rgba(231,234,230,0.10)', zero: 'rgba(231,234,230,0.4)',
      cat: ['#e879f9', '#a78bfa', '#fb7185', '#818cf8', '#8a9196', '#fbbf24'],
      ramp: ['#2e1065', '#c026d3', '#fb7185'],
      grad: ['#fb7185', '#e879f9', '#a78bfa', '#818cf8']
    }
  };

  function config(dark) {
    var p = dark ? PAL.dark : PAL.light;
    return {
      background: 'transparent',
      font: SANS,
      padding: { top: 6, right: 4, bottom: 2, left: 2 },
      view: { stroke: null },
      axis: {
        domain: false, ticks: false,
        labelFont: MONO, labelFontSize: 11, labelColor: p.muted, labelPadding: 8, labelLimit: 220,
        titleFont: MONO, titleFontSize: 10.5, titleFontWeight: 400, titleColor: p.muted, titlePadding: 12,
        gridColor: p.faint, gridDash: [2, 4]
      },
      axisX: { grid: false, labelAngle: 0, labelOverlap: 'greedy' },
      axisQuantitative: { tickCount: 6, labelOverlap: 'greedy' },
      axisTemporal: { tickCount: 8 },
      axisY: { titleAngle: 0, titleAlign: 'left', titleAnchor: 'end', titleY: -14, titleX: 0, titleBaseline: 'bottom' },
      axisBand: { labelAngle: 0 },
      legend: {
        orient: 'top', direction: 'horizontal', title: null, offset: 30,
        labelFont: SANS, labelFontSize: 12.5, labelColor: p.ink, labelLimit: 260,
        symbolType: 'circle', symbolSize: 90, symbolStrokeWidth: 0, columnPadding: 18
      },
      title: { color: p.ink, font: SANS },
      range: { category: p.cat, ramp: p.ramp, heatmap: p.ramp },
      scale: { bandPaddingInner: 0.28, bandPaddingOuter: 0.12 },
      mark: { color: p.cat[1] },
      bar: { color: p.cat[1], cornerRadiusEnd: 3 },
      line: { color: p.cat[0], strokeWidth: 2.5, strokeCap: 'round', strokeJoin: 'round' },
      point: { color: p.cat[0], filled: true, size: 46 },
      circle: { color: p.cat[1], opacity: 0.85 },
      area: { color: p.cat[1], opacity: 0.8 },
      rule: { color: p.zero, strokeWidth: 1 },
      text: { color: p.ink, font: MONO, fontSize: 11 }
    };
  }

  function markType(m) { return typeof m === 'string' ? m : (m && m.type); }

  // Vertical / horizontal brand gradient as a Vega fill (single-series marks only).
  function gradient(dark, horizontal) {
    var g = (dark ? PAL.dark : PAL.light).grad;
    return horizontal
      ? { gradient: 'linear', x1: 0, y1: 0, x2: 1, y2: 0, stops: g.map(function (c, i) { return { offset: i / (g.length - 1), color: c }; }) }
      : { gradient: 'linear', x1: 0, y1: 1, x2: 0, y2: 0, stops: [{ offset: 0, color: g[2] }, { offset: 1, color: g[1] }] };
  }

  function prepare(spec, opts) {
    opts = opts || {};
    var dark = !!opts.dark;
    var title = spec.title;
    title = title && typeof title === 'object' ? title.text : title;
    delete spec.title;
    delete spec.config;
    spec.width = 'container';
    var h = +spec.height || 340;
    spec.height = opts.lead ? Math.max(360, Math.min(h + 40, 460)) : Math.max(240, Math.min(h, 360));
    if (opts.narrow) spec.height = Math.round(spec.height * 0.85);
    spec.autosize = { type: 'fit-x', contains: 'padding' };

    var t = markType(spec.mark);
    var enc = spec.encoding || {};
    // a constant colour encoding ({value: ...}) counts as single-series: the house style decides
    ['color', 'fill', 'stroke'].forEach(function (k) { if (enc[k] && enc[k].value !== undefined && !enc[k].field && !enc[k].condition) delete enc[k]; });
    var single = !enc.color && !enc.fill;
    if (typeof spec.mark === 'string') spec.mark = { type: spec.mark };
    if (spec.mark) {
      // drop hard-coded per-spec colours on single-series marks: the house style decides
      if (single) { delete spec.mark.color; delete spec.mark.fill; delete spec.mark.stroke; }
      if (t === 'bar') {
        var horizontal = enc.y && (enc.y.type === 'nominal' || enc.y.type === 'ordinal');
        spec.mark.cornerRadiusEnd = 3;
        if (single) spec.mark.color = gradient(dark, horizontal);
        delete spec.mark.opacity;
      }
      if (t === 'line') {
        spec.mark.strokeWidth = 2.5;
        if (spec.mark.point) spec.mark.point = { filled: true, size: opts.lead ? 54 : 42 };
        if (single) spec.mark.stroke = gradient(dark, true);
      }
      if (t === 'area') { spec.mark.opacity = 0.82; spec.mark.line = false; }
    }
    var vals = (spec.data && spec.data.values) || [];
    var row0 = vals[0] || {};
    function distinct(f) { var s = {}, out = []; vals.forEach(function (r) { var v = r[f]; if (v !== undefined && !s[v]) { s[v] = 1; out.push(String(v)); } }); return out; }

    // Field names with dots/brackets ("Kosten Mrd. CHF") are literal keys, not paths: escape them.
    function esc(f) { return (typeof f === 'string' && /[.\[\]]/.test(f) && f in row0) ? f.replace(/([.\[\]])/g, '\\$1') : f; }
    Object.keys(enc).forEach(function (k) {
      var c = enc[k];
      (Array.isArray(c) ? c : [c]).forEach(function (d) {
        if (!d || typeof d !== 'object') return;
        if (d.field) d.field = esc(d.field);
        if (d.sort && d.sort.field) d.sort.field = esc(d.sort.field);
      });
    });

    // Categorical colours: always the house palette (keeps domain order), legends always on top.
    var P = dark ? PAL.dark : PAL.light;
    ['color', 'fill', 'stroke'].forEach(function (k) {
      var c = enc[k];
      if (!c || !c.field) return;
      if (c.scale && Array.isArray(c.scale.range) && (c.type === 'nominal' || c.type === 'ordinal')) {
        c.scale.range = c.scale.range.map(function (_, i) { return P.cat[i % P.cat.length]; });
      }
      if (c.scale && c.scale.scheme) delete c.scale.scheme; // house palette / ramp
      if (c.legend && c.legend !== null) { delete c.legend.orient; delete c.legend.direction; delete c.legend.columns; }
    });

    var hasX = enc.x && (enc.x.type === 'nominal' || enc.x.type === 'ordinal');
    var hasY = enc.y && (enc.y.type === 'nominal' || enc.y.type === 'ordinal');

    // Phones: vertical bars with long category names become horizontal bars (names stay readable).
    if (t === 'bar' && hasX && !hasY && opts.narrow && enc.y) {
      var xc = distinct(enc.x.field.replace(/\\/g, ''));
      var lng = xc.reduce(function (m, v) { return Math.max(m, v.length); }, 0);
      if (xc.length * lng * 6.6 > (opts.width || 340) || lng > 14) {
        var tmp = enc.x; enc.x = enc.y; enc.y = tmp;
        if (enc.xOffset) { enc.yOffset = enc.xOffset; delete enc.xOffset; }
        if (enc.x.axis) { delete enc.x.axis.labelAngle; delete enc.x.axis.labelAlign; }
        hasX = false; hasY = true;
        if (single && spec.mark) spec.mark.color = gradient(dark, true);
      }
    }
    // Phones: legends wrap instead of running off the edge.
    if (opts.narrow) ['color', 'fill', 'stroke'].forEach(function (k) {
      var c = enc[k];
      if (c && c.field && c.legend !== null) { c.legend = Object.assign({}, c.legend || {}, { orient: 'top', direction: 'vertical', columns: 1, anchor: 'start', labelLimit: (opts.width || 340) - 40 }); }
    });

    // Horizontal bars: height follows the number of rows, labels get room.
    if (t === 'bar' && hasY) {
      var rows = distinct(enc.y.field.replace(/\\/g, '')).length || 6;
      spec.height = Math.max(120, Math.min(rows * (opts.lead ? 32 : 28), 560));
      enc.y.axis = Object.assign({}, enc.y.axis || {}, { labelLimit: opts.narrow ? Math.round((opts.width || 340) * 0.42) : 300 });
    }
    // Long nominal labels on x: rotate only when they would collide.
    if (hasX) {
      var cats = distinct(enc.x.field.replace(/\\/g, ''));
      var longest = cats.reduce(function (m, v) { return Math.max(m, v.length); }, 3);
      enc.x.axis = Object.assign({}, enc.x.axis || {});
      enc.x.axis.labelAngle = (cats.length * longest * 6.6 > (opts.width || 680)) ? -35 : 0;
      if (enc.x.axis.labelAngle) enc.x.axis.labelAlign = 'right'; else delete enc.x.axis.labelAlign;
    }
    if (enc.y && enc.y.axis) delete enc.y.axis.labelAngle;

    // Switzerland is the subject: in single-series comparisons its bars carry the brand gradient,
    // everything else recedes to a neutral tone.
    var catCh = hasY ? enc.y : (hasX ? enc.x : null);
    if (t === 'bar' && single && catCh) {
      var cf = catCh.field.replace(/\\/g, '');
      var swiss = distinct(cf).filter(function (v) { return /schweiz|switzerland|suisse|svizzera|\bCH\b|die zukunft|\(ziel\)|^ziel\b/i.test(v); });
      if (swiss.length && swiss.length < distinct(cf).length) {
        enc.color = {
          condition: { test: { field: catCh.field, oneOf: swiss }, value: gradient(dark, hasY) },
          value: dark ? 'rgba(231,234,230,0.28)' : 'rgba(18,21,23,0.22)'
        };
        delete spec.mark.color;
      }
    }

    // Phones: fewer value ticks so numbers never collide.
    if (opts.narrow) ['x', 'y'].forEach(function (k) {
      if (enc[k] && enc[k].type === 'quantitative') enc[k].axis = Object.assign({}, enc[k].axis || {}, { tickCount: 4, labelFlush: true });
    });
    // A zero line whenever values go negative.
    var q = enc.y && enc.y.type === 'quantitative' ? enc.y : (enc.x && enc.x.type === 'quantitative' ? enc.x : null);
    if (q && !spec.layer) {
      var qf = q.field && q.field.replace(/\\/g, '');
      var neg = vals.some(function (r) { return +r[qf] < 0; });
      if (neg) {
        var zero = { mark: { type: 'rule', strokeWidth: 1 }, encoding: {} };
        zero.encoding[q === enc.y ? 'y' : 'x'] = { datum: 0 };
        var main = { mark: spec.mark, encoding: enc };
        if (spec.params) { main.params = spec.params; delete spec.params; }
        delete spec.mark; delete spec.encoding;
        spec.layer = [main, zero];
      }
    }
    return { spec: spec, title: title || '' };
  }

  root.DZCharts = { config: config, prepare: prepare, palette: PAL };
})(typeof window !== 'undefined' ? window : globalThis);
