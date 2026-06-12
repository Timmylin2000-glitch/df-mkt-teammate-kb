"""
Build the Google Apps Script (Code.gs) from the current index.html template.
Run this whenever the HTML template changes, then copy Code.gs into Apps Script.

The HTML template is embedded as base64 to avoid any backtick / ${} escaping
issues inside Apps Script. The client-side JS stays byte-for-byte identical to
the Python-generated site.
"""
import base64, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(HERE, 'index.html')
OUT_DIR = os.path.join(HERE, 'apps-script')
os.makedirs(OUT_DIR, exist_ok=True)

with open(INDEX, encoding='utf-8') as f:
    html = f.read()

# Replace the baked-in data object with a placeholder.
# index.html contains:  const RAW = {....};\n\n// ── PIC badge helper
m = re.search(r'const RAW = .*?;\n\n// ── PIC badge helper', html, re.DOTALL)
if not m:
    raise SystemExit("Could not locate 'const RAW = ...;' anchor in index.html")
template = html[:m.start()] + 'const RAW = __DATA_JSON__;\n\n// ── PIC badge helper' + html[m.end():]

template_b64 = base64.b64encode(template.encode('utf-8')).decode('ascii')

# ─── GAS source ───────────────────────────────────────────────────────────────
GAS = r'''/**
 * DF REG MKT Teammate — Google Sheet → GitHub Pages publisher
 *
 * One-time setup:
 *   1. Extensions → Apps Script, paste this whole file into Code.gs, Save.
 *   2. Reload the Google Sheet. A "DF MKT Site" menu appears.
 *   3. DF MKT Site → 🔑 Set GitHub Token  → paste the fine-grained token.
 *   4. DF MKT Site → 🔄 Update Website     → publishes to GitHub Pages.
 *
 * To change the GitHub target, edit CONFIG below.
 * The HTML template is embedded (base64). To change the site design, edit
 * generate_site.py, re-run it, then re-run build_apps_script.py and repaste.
 */

var CONFIG = {
  owner:  'Timmylin2000-glitch',
  repo:   'df-mkt-teammate-kb',
  branch: 'main',
  path:   'index.html'
};

// Sheets handled specially (not scenario-card tabs)
var SPECIAL = ['Index', 'Reg & Local Contactor', 'Social Media Link'];

var STD = ['scenario','pic','steps','prepare','timeline','qa','links'];

var NAV = [
  {id:'_index',     label:'Index',                    type:'index'},
  {id:'_contactor', label:'Contactor',                type:'contactor'},
  {id:'_sm',        label:'SM Links',                 type:'sm'},
  {id:'sep1',       sep:true},
  {id:'tab1',  label:'Tab 1 · Budget & Plan',    sheet:'Tab1 Budget Plan & Report'},
  {id:'tab2',  label:'Tab 2 · OM',               sheet:'Tab2 OM'},
  {id:'tab3',  label:'Tab 3 · Assets',           sheet:'Tab3 Assets'},
  {id:'tab4',  label:'Tab 4 · Social Media',     sheet:'Tab4 Social Media'},
  {id:'tab5',  label:'Tab 5 · PR',               sheet:'Tab5 PR'},
  {id:'tab7',  label:'Tab 7 · Esports',          sheet:'Tab7 Esports'},
  {id:'tab8',  label:'Tab 8 · Partnership & IP', sheet:'Tab8 Partnership & IP'},
  {id:'tab9',  label:'Tab 9 · In-game Items',    sheet:'Tab9 In-game Items Requirement'},
  {id:'tab10', label:'Tab 10 · CCP',             sheet:'Tab10 CCP'},
  {id:'tab11', label:'Tab 11 · Website',         sheet:'Tab11 Website'},
  {id:'tab12', label:'Tab 12 · Patch Updates',   sheet:'Tab12 Patch Updates'},
  {id:'tab13', label:'Tab 13 · Store Feature',   sheet:'Tab13 Store Feature'}
];

var TEMPLATE_B64 = '__TEMPLATE_B64__';

// ─── Menu ─────────────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('DF MKT Site')
    .addItem('🔄 Update Website', 'updateWebsite')
    .addSeparator()
    .addItem('🔑 Set GitHub Token', 'setGitHubToken')
    .addToUi();
}

function setGitHubToken() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('Set GitHub Token',
    'Paste the fine-grained GitHub token (Contents: Read and write on ' +
    CONFIG.owner + '/' + CONFIG.repo + '):',
    ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var token = res.getResponseText().trim();
  if (!token) { ui.alert('No token entered.'); return; }
  PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', token);
  ui.alert('Token saved. You can now use "Update Website".');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function updateWebsite() {
  var ui = SpreadsheetApp.getUi();
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    ui.alert('No GitHub token set yet.\n\nRun "DF MKT Site → 🔑 Set GitHub Token" first.');
    return;
  }
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Building site…', 'DF MKT Site', 30);
    var data = buildData();
    var html = buildHtml(data);
    pushToGitHub(html, token);
    var url = 'https://' + CONFIG.owner.toLowerCase() + '.github.io/' + CONFIG.repo + '/';
    SpreadsheetApp.getActiveSpreadsheet().toast('Done. Live in ~1 min.', 'DF MKT Site', 8);
    ui.alert('Website updated.\n\n' + url + '\n\nChanges go live in about 1 minute.');
  } catch (e) {
    ui.alert('Update failed:\n\n' + e.message);
    throw e;
  }
}

// ─── Read the spreadsheet into the same data shape as generate_site.py ─────────
function buildData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {};

  // Standard scenario tabs
  ss.getSheets().forEach(function (sheet) {
    var name = sheet.getName();
    if (SPECIAL.indexOf(name) !== -1) return;
    var lastRow = sheet.getLastRow();
    if (lastRow < 3) { data[name] = []; return; }
    var rng = sheet.getRange(3, 1, lastRow - 2, 7);
    var vals = rng.getValues();
    var rich = rng.getRichTextValues();
    var rows = [];
    for (var i = 0; i < vals.length; i++) {
      var v = vals[i];
      if (!v.some(function (x) { return x !== '' && x !== null; })) continue;
      var row = {};
      for (var j = 0; j < STD.length; j++) row[STD[j]] = clean(v[j]);
      // hyperlinks: cell-level link, else first run's link, else =HYPERLINK formula
      for (var k = 0; k < 7; k++) {
        var url = extractLink(rich[i][k], sheet, 3 + i, 1 + k);
        if (url) row[STD[k] + '_url'] = url;
      }
      rows.push(row);
    }
    data[name] = rows;
  });

  // Index
  data['_index'] = readSection(ss, 'Index', 3, function (r) {
    if (!r.some(function (x) { return clean(x); })) return null;
    return {tab: clean(r[0]), name: clean(r[1]), desc: clean(r[2])};
  });

  // Contactor
  data['_contactor'] = readContactor(ss);

  // Social Media Links
  data['_sm'] = readSM(ss);

  // Assemble tabs in NAV order
  var tabs = {_index: data['_index'], _contactor: data['_contactor'], _sm: data['_sm']};
  NAV.forEach(function (item) {
    if (item.sheet) tabs[item.id] = data[item.sheet] || [];
  });
  return {nav: NAV, tabs: tabs};
}

function readSection(ss, sheetName, startRow, mapFn) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) return [];
  var vals = sheet.getRange(startRow, 1, lastRow - startRow + 1, Math.max(3, sheet.getLastColumn())).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var mapped = mapFn(vals[i]);
    if (mapped) out.push(mapped);
  }
  return out;
}

function readContactor(ss) {
  var sheet = ss.getSheetByName('Reg & Local Contactor');
  if (!sheet) return {team: [], contactors: []};
  var vals = sheet.getDataRange().getValues();
  var team = [], contactors = [], sec = null;
  for (var i = 0; i < vals.length; i++) {
    var r = vals[i];
    if (!r.some(function (x) { return x !== '' && x !== null; })) continue;
    var f = clean(r[0]);
    if (f.indexOf('Regional Team') !== -1) { sec = null; continue; }
    if (f === 'Member')                    { sec = 'team'; continue; }
    if (f.indexOf('Local MKT') !== -1)     { sec = null; continue; }
    if (f === 'Region')                    { sec = 'loc'; continue; }
    if (sec === 'team')      team.push({name: clean(r[0]), resp: clean(r[1]), email: clean(r[2])});
    else if (sec === 'loc')  contactors.push({region: clean(r[0]), contact: clean(r[1]), email: clean(r[2])});
  }
  return {team: team, contactors: contactors};
}

function readSM(ss) {
  var sheet = ss.getSheetByName('Social Media Link');
  var sm = {off_hdr: [], off: [], non_hdr: [], non: [], esp_hdr: [], esp: []};
  if (!sheet) return sm;
  var vals = sheet.getDataRange().getValues();
  var sec = null;
  for (var i = 0; i < vals.length; i++) {
    var r = vals[i];
    var first = clean(r[0]);
    if (first === 'Official Channels') { sec = 'off'; continue; }
    if (first === 'Non-Official')      { sec = 'non'; continue; }
    if (first === 'Esports Channel')   { sec = 'esp'; continue; }
    if (!r.some(function (x) { return x !== '' && x !== null; })) continue;

    if (sec === 'off') {
      if (first === 'Channel') sm.off_hdr = r.map(clean).filter(function (x) { return x; });
      else sm.off.push(padRow(r, sm.off_hdr.length));
    } else if (sec === 'non') {
      if (first === 'Channel') sm.non_hdr = r.map(clean).filter(function (x) { return x; });
      else sm.non.push(padRow(r, sm.non_hdr.length));
    } else if (sec === 'esp') {
      if (first === 'Channel') {
        sm.esp_hdr = r.map(clean).filter(function (x) { return x; });
      } else {
        var rowVals = r.map(function (x) { return clean(x) ? clean(x) : '—'; });
        while (rowVals.length && rowVals[rowVals.length - 1] === '—') rowVals.pop();
        if (rowVals.some(function (x) { return x !== '—'; })) sm.esp.push(rowVals);
      }
    }
  }
  return sm;
}

function padRow(r, n) {
  var out = [];
  for (var i = 0; i < n; i++) out.push(clean(r[i]) ? clean(r[i]) : '—');
  return out;
}

// Extract a hyperlink from a cell: rich-text link, first run link, or =HYPERLINK()
function extractLink(richValue, sheet, row, col) {
  try {
    if (richValue) {
      var u = richValue.getLinkUrl();
      if (u) return u;
      var runs = richValue.getRuns();
      for (var i = 0; i < runs.length; i++) {
        var ru = runs[i].getLinkUrl();
        if (ru) return ru;
      }
    }
  } catch (e) {}
  try {
    var formula = sheet.getRange(row, col).getFormula();
    var m = formula.match(/HYPERLINK\(\s*"([^"]+)"/i);
    if (m) return m[1];
  } catch (e) {}
  return null;
}

function clean(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

// ─── Build the HTML from template + data ───────────────────────────────────────
function buildHtml(data) {
  var template = Utilities.newBlob(Utilities.base64Decode(TEMPLATE_B64)).getDataAsString('UTF-8');
  var json = JSON.stringify(data);
  return template.split('__DATA_JSON__').join(json);
}

// ─── Push to GitHub via the contents API ───────────────────────────────────────
function pushToGitHub(html, token) {
  var base = 'https://api.github.com/repos/' + CONFIG.owner + '/' + CONFIG.repo +
             '/contents/' + CONFIG.path;
  var headers = {
    Authorization: 'token ' + token,
    Accept: 'application/vnd.github+json'
  };

  // Get current file SHA (required to update an existing file)
  var sha = null;
  var getRes = UrlFetchApp.fetch(base + '?ref=' + CONFIG.branch, {
    method: 'get', headers: headers, muteHttpExceptions: true
  });
  if (getRes.getResponseCode() === 200) {
    sha = JSON.parse(getRes.getContentText()).sha;
  } else if (getRes.getResponseCode() !== 404) {
    throw new Error('GitHub GET failed (' + getRes.getResponseCode() + '): ' +
                    getRes.getContentText());
  }

  var payload = {
    message: 'Update site from Google Sheet (' + new Date().toISOString() + ')',
    content: Utilities.base64Encode(html, Utilities.Charset.UTF_8),
    branch: CONFIG.branch
  };
  if (sha) payload.sha = sha;

  var putRes = UrlFetchApp.fetch(base, {
    method: 'put', headers: headers, contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  var code = putRes.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error('GitHub PUT failed (' + code + '): ' + putRes.getContentText());
  }
}
'''

GAS = GAS.replace('__TEMPLATE_B64__', template_b64)

out = os.path.join(OUT_DIR, 'Code.gs')
with open(out, 'w', encoding='utf-8') as f:
    f.write(GAS)

print('Generated: ' + out)
print('Code.gs size: {:,} bytes (template b64: {:,})'.format(len(GAS), len(template_b64)))
