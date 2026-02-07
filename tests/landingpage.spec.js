// Poxdorf Landingpage — Automatisierte Tests
// Bezug: TEST-SPEC.md + PRD.md
// Ausführung: node tests/landingpage.spec.js <url>

const BASE_URL = process.argv[2] || 'https://digit500.github.io/poxdorf-app/';

const results = [];
let passed = 0;
let failed = 0;

function test(id, description, fn) {
  try {
    fn();
    results.push({ id, description, status: '✅', detail: '' });
    passed++;
  } catch (e) {
    results.push({ id, description, status: '❌', detail: e.message });
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runTests() {
  console.log(`🧪 Testing: ${BASE_URL}\n`);

  // Fetch the page
  let html;
  try {
    const res = await fetch(BASE_URL);
    
    // T-LP-001: Seite lädt
    test('T-LP-001', 'Seite lädt erfolgreich (HTTP 200)', () => {
      assert(res.status === 200, `HTTP ${res.status} statt 200`);
    });

    html = await res.text();
  } catch (e) {
    test('T-LP-001', 'Seite lädt erfolgreich', () => { throw e; });
    printReport();
    return;
  }

  // T-LP-002: Wappen
  test('T-LP-002', 'Poxdorf-Wappen wird referenziert', () => {
    assert(html.includes('wappen-poxdorf.png'), 'wappen-poxdorf.png nicht gefunden');
  });

  // T-LP-003: Gemeindename
  test('T-LP-003', 'Gemeindename "Poxdorf" sichtbar', () => {
    assert(html.includes('Poxdorf'), '"Poxdorf" nicht gefunden');
  });

  // T-LP-004: Kein isoliertes "Dorf"
  test('T-LP-004', 'Kein isoliertes "Dorf" im Text', () => {
    // "Poxdorf" ist OK, aber "Dorf" allein oder "Dorfnachrichten" nicht
    const withoutPoxdorf = html.replace(/Poxdorf/g, '');
    const dorfMatches = withoutPoxdorf.match(/\bDorf\b/gi);
    assert(!dorfMatches || dorfMatches.length === 0, 
      `"Dorf" isoliert gefunden (${dorfMatches?.length}x)`);
  });

  // T-LP-005: Keine KI/AI Buzzwords in Feature-Beschreibungen
  test('T-LP-005', 'Keine KI/AI Buzzwords', () => {
    const buzzwords = ['künstliche Intelligenz', 'KI-', 'AI-powered', 'Machine Learning', 'GPT'];
    const found = buzzwords.filter(bw => html.toLowerCase().includes(bw.toLowerCase()));
    assert(found.length === 0, `Buzzwords gefunden: ${found.join(', ')}`);
  });

  // T-LP-006: Alle 6 Feature-Cards
  test('T-LP-006', 'Alle 6 Features vorhanden', () => {
    const features = ['Müllkalender', 'Veranstaltungen', 'Flyer Scanner', 
                      'Nachrichten', 'Notfallinformationen', 'Gemeindekontakte'];
    const missing = features.filter(f => !html.includes(f));
    assert(missing.length === 0, `Fehlend: ${missing.join(', ')}`);
  });

  // T-LP-007: Transparenz-Banner
  test('T-LP-007', 'Transparenz-Banner vorhanden', () => {
    assert(html.includes('offizielle') && html.includes('Poxdorf-App'), 
      '"offizielle Poxdorf-App" nicht gefunden');
  });

  // T-LP-008: Vision-Sektion
  test('T-LP-008', 'Vision-Sektion vorhanden', () => {
    assert(html.includes('Unsere Vision'), '"Unsere Vision" nicht gefunden');
  });

  // T-LP-009: Regionale Vernetzung
  test('T-LP-009', 'Regionale Gemeinden sichtbar', () => {
    const gemeinden = ['Pinzberg', 'Effeltrich', 'Kunreuth', 'Wiesenthau'];
    const missing = gemeinden.filter(g => !html.includes(g));
    assert(missing.length === 0, `Fehlend: ${missing.join(', ')}`);
  });

  // T-LP-010: Footer
  test('T-LP-010', 'United DigiArt Vision im Footer', () => {
    assert(html.includes('United DigiArt Vision'), 'United DigiArt Vision nicht gefunden');
  });

  // T-LP-014: Navigation Links
  test('T-LP-014', 'Navigation-Anker existieren', () => {
    const anchors = ['features', 'kalender', 'muell', 'kontakt', 'vision'];
    const missing = anchors.filter(a => !html.includes(`id="${a}"`));
    assert(missing.length === 0, `Fehlende Anker: ${missing.join(', ')}`);
  });

  // T-LP-015: Keine kaputten Bild-Referenzen (Basic Check)
  test('T-LP-015', 'Bild-Referenzen vorhanden', () => {
    const imgMatches = html.match(/src="([^"]+\.(png|jpg|svg))"/g);
    if (imgMatches) {
      imgMatches.forEach(match => {
        assert(!match.includes('undefined') && !match.includes('null'), 
          `Ungültige Bild-Referenz: ${match}`);
      });
    }
  });

  // Check wappen image loads
  test('T-LP-015b', 'Wappen-Bild lädt', async () => {
    const wappenUrl = new URL('wappen-poxdorf.png', BASE_URL).href;
    const res = await fetch(wappenUrl);
    assert(res.status === 200, `Wappen HTTP ${res.status}`);
  });

  printReport();
}

function printReport() {
  const total = passed + failed;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log('\n🧪 Test-Report: Poxdorf Landingpage');
  console.log('━'.repeat(50));
  
  results.forEach(r => {
    const detail = r.detail ? ` (${r.detail})` : '';
    console.log(`${r.status} ${r.id}: ${r.description}${detail}`);
  });

  console.log('━'.repeat(50));
  console.log(`Ergebnis: ${passed}/${total} bestanden (${pct}%)`);
  
  if (failed > 0) {
    console.log(`\n❌ ${failed} Test(s) fehlgeschlagen!`);
    process.exit(1);
  } else {
    console.log(`\n✅ Alle Tests bestanden!`);
    process.exit(0);
  }
}

runTests();
