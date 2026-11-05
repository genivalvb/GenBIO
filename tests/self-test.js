/* GenBIO — teste automatizado.
 * Como executar: abra index.html no Chrome ou Edge, abra o Console (F12), cole este arquivo inteiro e
 * pressione Enter. O resultado aparece no console. Os dados são restaurados ao final, inclusive em caso de erro. */
(async function genbioSelfTest() {
  const G = window.GenBIO;
  if (!G) throw new Error('Abra index.html antes de executar os testes.');
  const { Store, Index, People, Relations, Kinship, Events, Chrono, Seed, Layout, View, App, Dialogs, PersonForm, sanitizeDoc, emptyDoc } = G;
  const results = [];
  const ok = (name, cond, detail) => results.push({ name, pass: !!cond, detail: cond ? undefined : detail });
  const eq = (name, got, want) => ok(name, JSON.stringify(got) === JSON.stringify(want), `obtido ${JSON.stringify(got)}, esperado ${JSON.stringify(want)}`);
  const throws = (name, fn, pattern) => { try { fn(); ok(name, false, 'não lançou erro'); } catch (e) { ok(name, !pattern || pattern.test(e.message), e.message); } };
  const terms = (a, b) => Kinship.between(a, b).map(r => r.term);
  const original = Store.snapshot();
  const originalRaw = localStorage.getItem('genbio.data.v1');
  const load = doc => { Store.doc = doc; App.selectedId = null; App.selectedEventId = null; App.highlight = null; Index.rebuild(doc); };
  const tick = () => new Promise(r => setTimeout(r, 0));

  try {
    /* ---------- Dados bíblicos iniciais e cronologia ---------- */
    load(Seed.build());
    const year = id => People.get(id).birth.year, death = id => People.get(id).death.year;
    const expected = { p_adao: [0, 930], p_sete: [130, 1042], p_enos: [235, 1140], p_caina: [325, 1235], p_maalalel: [395, 1290], p_jarede: [460, 1422], p_enoque: [622, 987], p_matusalem: [687, 1656], p_lameque: [874, 1651], p_noe: [1056, 2006], p_sem: [1558, 2158], p_arfaxade: [1658, 2096], p_sala: [1693, 2126], p_heber: [1723, 2187], p_pelegue: [1757, 1996], p_reu: [1787, 2026], p_serugue: [1819, 2049], p_naor1: [1849, 1997], p_tera: [1878, 2083] };
    for (const [id, [b, d]] of Object.entries(expected)) eq(`Cronologia de ${People.get(id).name}`, [year(id), death(id)], [b, d]);
    const noDates = ['p_eva', 'p_caim', 'p_abel', 'p_cam', 'p_jafe', 'p_enoque_c', 'p_lameque_c', 'p_ada', 'p_zila', 'p_lo', 'p_milca', 'p_naor2', 'p_hara'];
    ok('Sem datas inventadas', noDates.every(id => year(id) === null && death(id) === null), noDates.filter(id => year(id) !== null));
    ok('Datas calculadas identificadas', People.get('p_sete').birth.basis === 'calculated');
    ok('Abraão identificado como inferido', People.get('p_abraao').birth.basis === 'inferred' && People.get('p_abraao').birth.precision === 'estimated');
    eq('Idade calculada de Matusalém', Chrono.age(People.get('p_matusalem')), { value: 969, source: 'computed', stated: 969 });
    eq('Idade indisponível de Eva', Chrono.age(People.get('p_eva')).source, 'none');
    ok('Seed sem alertas cronológicos', People.all().every(p => People.warnings(p).length === 0), People.all().filter(p => People.warnings(p).length).map(p => [p.name, People.warnings(p)]));
    ok('Todo registro inicial identificado', People.all().every(p => p.origin === 'seed') && Events.all().every(e => e.origin === 'seed'));
    ok('Seed passa pela validação sem correções', sanitizeDoc(JSON.parse(Store.snapshot())).issues.length === 0, sanitizeDoc(JSON.parse(Store.snapshot())).issues);
    eq('Dilúvio em AM 1656', Events.years(Events.get('e_diluvio')).start, 1656);
    eq('Evento acompanha pessoa', Events.years(Events.get('e_noe')).start, 1056);
    eq('Formato AM', Chrono.format(1656), 'AM 1656');

    /* ---------- Parentesco derivado ---------- */
    const k = {
      'Adão pai de Sete': ['p_sete', 'p_adao', 'pai'], 'Eva mãe de Sete': ['p_sete', 'p_eva', 'mãe'], 'Sete filho': ['p_adao', 'p_sete', 'filho'],
      'avô': ['p_enos', 'p_adao', 'avô'], 'avó': ['p_enos', 'p_eva', 'avó'], 'neto': ['p_adao', 'p_enos', 'neto'], 'bisavô': ['p_caina', 'p_adao', 'bisavô'], 'bisavó': ['p_caina', 'p_eva', 'bisavó'], 'trisavô': ['p_maalalel', 'p_adao', 'trisavô'],
      'irmão': ['p_caim', 'p_abel', 'irmão'], 'tio': ['p_enos', 'p_caim', 'tio'], 'sobrinho': ['p_caim', 'p_enos', 'sobrinho'], 'tio-avô': ['p_caina', 'p_caim', 'tio-avô'], 'primo 1º': ['p_enos', 'p_enoque_c', 'primo de 1º grau'],
      'primo removido': ['p_caina', 'p_enoque_c', 'primo de 1º grau, 1 geração acima'], 'irmã por parte de pai': ['p_abraao', 'p_naama', null]
    };
    for (const [name, [a, b, want]] of Object.entries(k)) if (want) ok(`Parentesco: ${name}`, terms(a, b).includes(want), terms(a, b));
    ok('Meio-irmão com mães diferentes', terms('p_jabal', 'p_tubalcaim').includes('meio-irmão (por parte de pai)'), terms('p_jabal', 'p_tubalcaim'));
    ok('Cônjuge e parentesco simultâneos', terms('p_abraao', 'p_sara').includes('esposa') && terms('p_abraao', 'p_sara').includes('irmã por parte de pai'), terms('p_abraao', 'p_sara'));
    ok('Tio e esposo simultâneos', terms('p_milca', 'p_naor2').includes('tio') && terms('p_milca', 'p_naor2').includes('esposo'), terms('p_milca', 'p_naor2'));
    ok('Sogro', terms('p_ada', 'p_metusael').includes('sogro'), terms('p_ada', 'p_metusael'));
    ok('Nora', terms('p_metusael', 'p_ada').includes('nora'), terms('p_metusael', 'p_ada'));
    ok('Madrasta', terms('p_jabal', 'p_zila').includes('madrasta'), terms('p_jabal', 'p_zila'));
    ok('Enteado', terms('p_zila', 'p_jabal').includes('enteado'), terms('p_zila', 'p_jabal'));
    ok('Parentesco não armazenado', !/"(term|kinship|grau)"/.test(Store.snapshot()));
    const naoBiblico = People.add({ name: 'Pessoa isolada', sex: 'U' });
    eq('Sem parentesco', terms('p_adao', naoBiblico.id), []);
    People.remove(naoBiblico.id);

    /* ---------- Cadastro, edição, exclusão ---------- */
    load(emptyDoc());
    throws('Nome obrigatório', () => People.add({ name: '  ' }), /nome/i);
    throws('Falecimento antes do nascimento', () => People.add({ name: 'X', birth: { year: 10 }, death: { year: 5 } }), /falecimento/i);
    const avo = People.add({ name: 'Avô', sex: 'M', birth: { year: 100 }, death: { year: 170 } });
    const avoa = People.add({ name: 'Avó', sex: 'F' });
    const filho = People.add({ name: 'Filho', sex: 'M', birth: { year: 130 } });
    const mae2 = People.add({ name: 'Segunda esposa', sex: 'F' });
    const neta = People.add({ name: 'Neta', sex: 'F', birth: { year: 160 } });
    const adot = People.add({ name: 'Adotado', sex: 'M', birth: { year: 150 } });
    Relations.addParent(filho.id, avo.id); Relations.addParent(filho.id, avoa.id); Relations.addParent(neta.id, filho.id);
    Relations.addUnion(avo.id, avoa.id); Relations.addUnion(avo.id, mae2.id);
    Relations.addParent(adot.id, avo.id, { role: 'father', kind: 'adoptive' });
    eq('Múltiplos casamentos', Relations.spouses(avo.id).length, 2);
    eq('Union duplicada não repete', (Relations.addUnion(avoa.id, avo.id), Relations.spouses(avo.id).length), 2);
    eq('Idade automática', Chrono.age(avo).value, 70);
    eq('Busca sem acento', People.search('avo').length, 2);
    People.update(avo.id, { altNames: ['Patriarca'] });
    eq('Busca em nome alternativo', People.search('patriar')[0].id, avo.id);
    ok('Parentesco adotivo identificado', terms(adot.id, avo.id).includes('pai adotivo'), terms(adot.id, avo.id));
    ok('Irmão por adoção identificado', terms(adot.id, filho.id).some(t => /adoção/.test(t)), terms(adot.id, filho.id));
    ok('Atualização recalcula parentesco', terms(neta.id, avo.id).includes('avô'), terms(neta.id, avo.id));

    /* Integridade */
    throws('Ciclo direto', () => Relations.addParent(avo.id, filho.id), /ciclo|descendente/i);
    throws('Ciclo indireto', () => Relations.addParent(avo.id, neta.id), /ciclo|descendente/i);
    throws('Autorreferência', () => Relations.addParent(avo.id, avo.id), /si mesma/i);
    throws('Cônjuge de si mesmo', () => Relations.addUnion(avo.id, avo.id), /si mesma/i);
    const outroPai = People.add({ name: 'Outro pai', sex: 'M' });
    throws('Dois pais biológicos', () => Relations.addParent(filho.id, outroPai.id), /biológico/i);
    Relations.addParent(filho.id, outroPai.id, { role: 'father', kind: 'adoptive' });
    eq('Pai adotivo além do biológico', Relations.parents(filho.id).length, 3);
    const pm = People.add({ name: 'Pai mais novo', sex: 'M', birth: { year: 500 } });
    const fv = People.add({ name: 'Filho mais velho', sex: 'M', birth: { year: 100 } });
    Relations.addParent(fv.id, pm.id);
    ok('Alerta de cronologia', People.warnings(fv).some(w => /anterior/.test(w)));
    People.remove(pm.id); People.remove(fv.id);

    const ev = Events.add({ name: 'Evento T', start: 110, end: 120, personIds: [avo.id, filho.id], sources: ['Gn 1:1'] });
    eq('Evento com vários personagens', Events.ofPerson(avo.id).length, 1);
    throws('Intervalo inválido', () => Events.add({ name: 'Y', start: 10, end: 5 }), /final/i);
    const evAnchor = Events.add({ name: 'Morte do avô', anchor: { personId: avo.id, field: 'death' } });
    eq('Evento ancorado', Events.years(evAnchor).start, 170);
    People.update(avo.id, { death: { year: 175 } });
    eq('Evento ancorado acompanha edição', Events.years(evAnchor).start, 175);
    const undated = Events.add({ name: 'Sem data' });
    eq('Evento sem data aceito', Events.years(undated).start, null);
    ok('Exclusão informa vínculos', People.relationshipCount(avo.id) > 0);
    People.remove(avo.id);
    ok('Exclusão remove vínculos', Store.doc.parentLinks.every(l => l.parentId !== avo.id) && Store.doc.unions.every(u => !u.partnerIds.includes(avo.id)));
    ok('Exclusão preserva descendentes', !!People.get(filho.id) && !!People.get(neta.id));
    ok('Exclusão limpa evento', !Events.get(ev.id).personIds.includes(avo.id));
    eq('Âncora removida preserva o ano', [Events.years(evAnchor).start, Events.get(evAnchor.id).anchor], [175, null]);
    Events.remove(undated.id);
    eq('Evento removido', Events.get(undated.id), undefined);

    /* ---------- Fluxos da interface ---------- */
    load(Seed.build()); App.changed();
    App.act('add-child', 'p_lameque_c');
    ok('Filho: pai preenchido', PersonForm.parentRows.find(r => r.role.value === 'father').picker.value === 'p_lameque_c');
    ok('Filho: atalho com os dois cônjuges', document.querySelectorAll('#f_quickParents [data-qp]').length === 2);
    document.querySelector('#f_quickParents [data-qp="p_ada"]').click();
    ok('Filho: ambos os pais selecionados', PersonForm.parentRows.find(r => r.role.value === 'mother').picker.value === 'p_ada');
    document.querySelector('#f_save').click();
    ok('Formulário valida nome', !document.querySelector('#f_error').hidden && document.querySelector('#dlg').open);
    document.querySelector('#f_name').value = 'Teste de filho';
    document.querySelector('#f_birthY').value = '300'; document.querySelector('#f_deathY').value = '200';
    document.querySelector('#f_save').click();
    ok('Formulário valida datas', /falecimento/i.test(document.querySelector('#f_error').textContent) && !People.search('Teste de filho').length);
    document.querySelector('#f_birthY').value = ''; document.querySelector('#f_deathY').value = '';
    document.querySelector('#f_save').click();
    const novo = People.search('Teste de filho')[0];
    ok('Formulário cria filho', !!novo && Relations.parents(novo.id).length === 2 && !document.querySelector('#dlg').open);
    ok('Formulário sem data continua sem data', novo.birth.year === null && novo.birth.precision === 'unknown');
    ok('Árvore atualizada', Layout.nodes.has(novo.id));
    App.act('edit', novo.id);
    document.querySelector('#f_name').value = 'Teste editado';
    document.querySelector('#f_save').click();
    eq('Edição preserva vínculos', [People.get(novo.id).name, Relations.parents(novo.id).length], ['Teste editado', 2]);

    App.act('add-spouse', novo.id);
    document.querySelector('#f_name').value = 'Cônjuge novo';
    document.querySelector('#f_save').click();
    ok('Cônjuge pelo cartão', Relations.spouses(novo.id).length === 1);
    App.act('add-parent', 'p_adao');
    document.querySelector('#f_name').value = 'Pai fictício';
    document.querySelector('#f_save').click();
    const pf = People.search('Pai fictício')[0];
    ok('Pai pelo cartão', Relations.parents('p_adao').includes(pf.id));
    People.remove(pf.id); App.changed();
    App.act('add-sibling', novo.id);
    document.querySelector('#f_name').value = 'Irmão novo';
    document.querySelector('#f_sex').value = 'M';
    document.querySelector('#f_save').click();
    const ir = People.search('Irmão novo')[0];
    ok('Irmão copia os dois pais', Kinship.between(novo.id, ir.id).some(r => r.term === 'irmão') && Relations.parents(ir.id).length === 2);
    App.applyFlowExisting({ type: 'spouse', targetId: 'p_noe' }, 'p_milca');
    ok('Vincular pessoa existente', Relations.spouses('p_noe').includes('p_milca'));
    let threw = false; try { App.applyFlowExisting({ type: 'parent', targetId: 'p_adao' }, 'p_sete'); } catch (e) { threw = true; }
    ok('Fluxo bloqueia ciclo', threw && !Relations.parents('p_adao').includes('p_sete'));

    /* Exclusão com confirmação */
    load(Seed.build()); App.changed();
    const deletion = App.deletePerson('p_noe');
    await tick();
    const conf = document.querySelector('#dlgConfirm');
    ok('Confirma exclusão com vínculos', conf.open && /Noé/.test(conf.textContent));
    conf.querySelector('[data-c="0"]').click(); await deletion;
    ok('Cancelar preserva', !!People.get('p_noe'));
    const deletion2 = App.deletePerson('p_noe'); await tick();
    document.querySelector('#dlgConfirm [data-c="1"]').click(); await deletion2;
    ok('Confirmar exclui', !People.get('p_noe') && !!People.get('p_lameque') && !!People.get('p_sem'));
    document.querySelector('.toast button').click();
    ok('Desfazer exclusão', !!People.get('p_noe') && Relations.children('p_noe').length === 3);

    /* Destaques */
    App.changed();
    ok('Linhagem Sete até Noé', App.highlightLineage('p_sete', 'p_noe') && App.highlight.set.size === 9 && !App.highlight.set.has('p_caim'), App.highlight && App.highlight.set.size);
    ok('Linhagem inexistente', App.highlightLineage('p_noe', 'p_sete') === false);
    App.clearHighlight();
    App.setHighlight('p_noe', 'anc'); ok('Ancestrais', App.highlight.set.has('p_adao') && App.highlight.set.has('p_eva') && !App.highlight.set.has('p_sem'));
    App.setHighlight('p_noe', 'desc'); ok('Descendentes', App.highlight.set.has('p_abraao') && !App.highlight.set.has('p_adao'));
    App.clearHighlight();

    /* Cronologia */
    const s = Store.doc.settings;
    eq('Sem conversão automática', s.calendar, 'AM');
    Object.assign(s, { calendar: 'BCAD', methodologyName: 'Teste', creationYearBC: 1000 });
    eq('a.C. por metodologia', [Chrono.format(0), Chrono.format(999), Chrono.format(1000), Chrono.format(1001)], ['1000 a.C.', '1 a.C.', '1 d.C.', '2 d.C.']);
    eq('Ano armazenado continua em AM', People.get('p_sete').birth.year, 130);
    const noMeth = sanitizeDoc({ persons: [], settings: { calendar: 'BCAD' } }).doc.settings.calendar;
    eq('a.C. sem metodologia é recusado', noMeth, 'AM');
    Object.assign(s, { calendar: 'AM', methodologyName: '', creationYearBC: null });

    /* Layout */
    Layout.compute();
    const n = id => Layout.nodes.get(id);
    ok('Altura proporcional ao nascimento', Math.abs((n('p_noe').y - n('p_sete').y) / (1056 - 130) - (n('p_sem').y - n('p_noe').y) / (1558 - 1056)) < 1e-9);
    ok('Sem data marcado como ilustrativo', n('p_eva').undated && n('p_caim').undated);
    ok('Cam limitado por Gn 5:32', n('p_cam').vy === 1556);
    ok('Caim antes de Sete', n('p_caim').vy <= 130);
    const overlap = Layout.list.some((a, i) => Layout.list.slice(i + 1).some(b => a.lane === b.lane && a.y < b.bottom && b.y < a.bottom));
    ok('Nenhum cartão sobreposto', !overlap);

    /* ---------- Persistência ---------- */
    Store.saveNow();
    eq('localStorage = documento', JSON.parse(localStorage.getItem('genbio.data.v1')).persons.length, Store.doc.persons.length);
    const before = Store.snapshot();
    Store.load();
    eq('Recarregar preserva tudo', Store.snapshot(), before);
    const saved = localStorage.getItem('genbio.data.v1');
    Store.doc = emptyDoc(); Store.saveNow(); Store.load();
    eq('Dados limpos não voltam ao seed', Store.doc.persons.length, 0);
    localStorage.setItem('genbio.data.v1', saved); Store.load();

    /* ---------- Exportação e importação ---------- */
    const exported = Store.exportText();
    const round = sanitizeDoc(JSON.parse(exported));
    eq('Exportação ida e volta', [round.doc.persons, round.doc.parentLinks, round.doc.unions, round.doc.events], [Store.doc.persons, Store.doc.parentLinks, Store.doc.unions, Store.doc.events]);
    eq('Exportação sem problemas', round.issues, []);
    const bad = {
      persons: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'a', name: 'dup' }, { name: '' }, { id: 'x', name: '<img src=x onerror=window.__xss=1>', avatar: 'javascript:alert(1)' }],
      parentLinks: [{ parentId: 'a', childId: 'b', role: 'father' }, { parentId: 'b', childId: 'a', role: 'father' }, { parentId: 'z', childId: 'a' }],
      unions: [{ partnerIds: ['a', 'a'] }, { partnerIds: ['a', 'z'] }], events: [{ name: 'E', personIds: ['a', 'z'], start: 'abc' }, { name: '' }]
    };
    const cleaned = sanitizeDoc(bad);
    eq('Importação corrige dados inválidos', [cleaned.doc.persons.length, cleaned.doc.parentLinks.length, cleaned.doc.unions.length, cleaned.doc.events.length, cleaned.doc.events[0].personIds, cleaned.doc.events[0].start], [3, 1, 0, 1, ['a'], null]);
    ok('Importação informa ciclos', cleaned.issues.some(i => /ciclo/.test(i)));
    ok('Avatar perigoso removido', cleaned.doc.persons[2].avatar === null);
    throws('Importação recusa formato', () => sanitizeDoc({ foo: 1 }), /persons/);
    throws('Importação recusa versão futura', () => sanitizeDoc({ persons: [], schemaVersion: 999 }), /Versão/);
    const imp = App.importText(JSON.stringify(bad)); await tick();
    ok('Importação pede confirmação', document.querySelector('#dlgConfirm').open);
    document.querySelector('#dlgConfirm [data-c="1"]').click(); await imp;
    eq('Importação aplicada', Store.doc.persons.length, 3);
    App.select('x'); View.tx = 40; View.ty = 40; View.s = 1; G.Render.frame();
    await tick();
    ok('Conteúdo importado é escapado (XSS)', !window.__xss && !document.querySelector('#panel img[src="x"]') && !document.querySelector('#cardLayer img[src="x"]'));
    ok('JSON inválido não altera dados', (await App.importText('{quebrado')) === false && Store.doc.persons.length === 3);

    /* ---------- Desempenho com 1.000+ pessoas ---------- */
    const big = emptyDoc();
    for (let i = 0; i < 1200; i++) big.persons.push({ id: 'b' + i, name: 'Pessoa ' + i, sex: i % 2 ? 'F' : 'M', birth: { year: 100 + Math.floor(Math.log2(i + 1)) * 28 + i % 20 }, death: { year: 170 + Math.floor(Math.log2(i + 1)) * 28 + i % 20 }, altNames: [], sources: [], seq: i });
    for (let i = 1; i < 1200; i++) big.parentLinks.push({ id: 'l' + i, parentId: 'b' + Math.floor((i - 1) / 2), childId: 'b' + i, role: Math.floor((i - 1) / 2) % 2 ? 'mother' : 'father', kind: 'biological', evidence: 'informed' });
    let t = performance.now();
    const cleanBig = sanitizeDoc(big);
    const tSanitize = performance.now() - t;
    Store.doc = cleanBig.doc; App.selectedId = null; App.selectedEventId = null;
    t = performance.now(); App.changed(); const tChanged = performance.now() - t;
    t = performance.now(); for (let i = 0; i < 20; i++) { View.s = 0.2; View.tx = -i * 20; G.Render.frame(); } const tFrame = (performance.now() - t) / 20;
    t = performance.now(); for (let i = 0; i < 20; i++) { View.s = 0.8; View.tx = -i * 20; G.Render.frame(); } const tFrameDom = (performance.now() - t) / 20;
    t = performance.now(); Kinship.relativesOf('b600'); const tKin = performance.now() - t;
    t = performance.now(); People.search('pessoa 1'); const tSearch = performance.now() - t;
    eq('1.200 pessoas válidas', cleanBig.issues.length, 0);
    ok(`Validação em tempo aceitável (${tSanitize.toFixed(0)} ms)`, tSanitize < 1500);
    ok(`Atualização completa (${tChanged.toFixed(0)} ms)`, tChanged < 1500);
    ok(`Quadro em zoom baixo (${tFrame.toFixed(1)} ms)`, tFrame < 40);
    ok(`Quadro com cartões (${tFrameDom.toFixed(1)} ms)`, tFrameDom < 40);
    ok(`Parentes de uma pessoa (${tKin.toFixed(0)} ms)`, tKin < 1500);
    ok(`Busca (${tSearch.toFixed(1)} ms)`, tSearch < 50);
  } catch (e) {
    results.push({ name: 'Execução sem exceção', pass: false, detail: e.stack || String(e) });
  } finally {
    Dialogs.close();
    const c = document.querySelector('#dlgConfirm'); if (c.open) c.close();
    document.querySelectorAll('.toast').forEach(x => x.remove());
    Store.doc = sanitizeDoc(JSON.parse(original)).doc;
    App.selectedId = null; App.selectedEventId = null; App.highlight = null;
    App.changed();
    Store.saveNow();
    if (originalRaw !== null) localStorage.setItem('genbio.data.v1', originalRaw);
  }
  const failed = results.filter(r => !r.pass);
  const report = { total: results.length, passed: results.length - failed.length, failed, perf: results.filter(r => /ms\)/.test(r.name)).map(r => r.name) };
  console.log(`GenBIO: ${report.passed}/${report.total} testes aprovados`);
  if (failed.length) console.table(failed);
  return report;
})();
