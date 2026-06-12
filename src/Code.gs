/**
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

var TEMPLATE_B64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCxpbml0aWFsLXNjYWxlPTEiPgo8dGl0bGU+REYgUkVHIE1LVCBUZWFtbWF0ZTwvdGl0bGU+CjxzdHlsZT4KKntib3gtc2l6aW5nOmJvcmRlci1ib3g7bWFyZ2luOjA7cGFkZGluZzowfQpib2R5e2ZvbnQtZmFtaWx5Oi1hcHBsZS1zeXN0ZW0sQmxpbmtNYWNTeXN0ZW1Gb250LCdTZWdvZSBVSScsc2Fucy1zZXJpZjtmb250LXNpemU6MTRweDtiYWNrZ3JvdW5kOiNmMWY1Zjk7Y29sb3I6IzFlMjkzYjtkaXNwbGF5OmZsZXg7aGVpZ2h0OjEwMHZoO292ZXJmbG93OmhpZGRlbn0KCi8qIOKUgOKUgCBTaWRlYmFyIOKUgOKUgCAqLwojc2lkZWJhcnt3aWR0aDoyMjhweDttaW4td2lkdGg6MjI4cHg7YmFja2dyb3VuZDojMGYxNzJhO2NvbG9yOiM5NGEzYjg7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtvdmVyZmxvdy15OmF1dG87ZmxleC1zaHJpbms6MH0KI3NpZGViYXItaGVhZGVye3BhZGRpbmc6MjBweCAxNnB4IDE0cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgIzFlMjkzYn0KI3NpZGViYXItaGVhZGVyIC5sb2dve2ZvbnQtc2l6ZToxMXB4O2ZvbnQtd2VpZ2h0OjcwMDtsZXR0ZXItc3BhY2luZzouMWVtO2NvbG9yOiM2NDc0OGI7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO21hcmdpbi1ib3R0b206NHB4fQojc2lkZWJhci1oZWFkZXIgLnRpdGxle2ZvbnQtc2l6ZToxNXB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojZjFmNWY5O2xpbmUtaGVpZ2h0OjEuM30KI25hdi1saXN0e2xpc3Qtc3R5bGU6bm9uZTtwYWRkaW5nOjhweCAwO2ZsZXg6MX0KI25hdi1saXN0IGxpLnNlcHtoZWlnaHQ6MXB4O2JhY2tncm91bmQ6IzFlMjkzYjttYXJnaW46OHB4IDEycHh9CiNuYXYtbGlzdCBsaS5uYXYtaXRlbSBhe2Rpc3BsYXk6YmxvY2s7cGFkZGluZzo4cHggMTZweDtjb2xvcjojOTRhM2I4O3RleHQtZGVjb3JhdGlvbjpub25lO2ZvbnQtc2l6ZToxM3B4O2JvcmRlci1yYWRpdXM6MDt0cmFuc2l0aW9uOmJhY2tncm91bmQgLjE1cyxjb2xvciAuMTVzO2xpbmUtaGVpZ2h0OjEuNH0KI25hdi1saXN0IGxpLm5hdi1pdGVtIGE6aG92ZXJ7YmFja2dyb3VuZDojMWUyOTNiO2NvbG9yOiNlMmU4ZjB9CiNuYXYtbGlzdCBsaS5uYXYtaXRlbSBhLmFjdGl2ZXtiYWNrZ3JvdW5kOiMxZDRlZDg7Y29sb3I6I2ZmZjtmb250LXdlaWdodDo2MDB9CgovKiDilIDilIAgTWFpbiDilIDilIAgKi8KI21haW57ZmxleDoxO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47b3ZlcmZsb3c6aGlkZGVufQojdG9vbGJhcntwYWRkaW5nOjE0cHggMjRweDtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2UyZThmMDtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O2ZsZXgtc2hyaW5rOjB9CiN0b29sYmFyIGgye2ZvbnQtc2l6ZToxNnB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojMGYxNzJhO21pbi13aWR0aDowO2ZsZXg6MTt3aGl0ZS1zcGFjZTpub3dyYXA7b3ZlcmZsb3c6aGlkZGVuO3RleHQtb3ZlcmZsb3c6ZWxsaXBzaXN9CiNzZWFyY2h7cGFkZGluZzo3cHggMTJweDtib3JkZXI6MXB4IHNvbGlkICNjYmQ1ZTE7Ym9yZGVyLXJhZGl1czo2cHg7Zm9udC1zaXplOjEzcHg7d2lkdGg6MjYwcHg7b3V0bGluZTpub25lO2JhY2tncm91bmQ6I2Y4ZmFmY30KI3NlYXJjaDpmb2N1c3tib3JkZXItY29sb3I6IzNiODJmNjtiYWNrZ3JvdW5kOiNmZmZ9CiNjb250ZW50e2ZsZXg6MTtvdmVyZmxvdy15OmF1dG87cGFkZGluZzoyMHB4IDI0cHh9CgovKiDilIDilIAgQ2FyZHMg4pSA4pSAICovCi5jYXJkcy1ncmlke2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjEycHh9Ci5jYXJke2JhY2tncm91bmQ6I2ZmZjtib3JkZXI6MXB4IHNvbGlkICNlMmU4ZjA7Ym9yZGVyLXJhZGl1czoxMHB4O292ZXJmbG93OmhpZGRlbjt0cmFuc2l0aW9uOmJveC1zaGFkb3cgLjE1c30KLmNhcmQ6aG92ZXJ7Ym94LXNoYWRvdzowIDJweCAxMnB4IHJnYmEoMCwwLDAsLjA3KX0KLmNhcmQtaGVhZGVye3BhZGRpbmc6MTRweCAxNnB4O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpmbGV4LXN0YXJ0O2dhcDoxMHB4O3VzZXItc2VsZWN0Om5vbmV9Ci5jYXJkLWhlYWRlcjpob3ZlcntiYWNrZ3JvdW5kOiNmOGZhZmN9Ci5jYXJkLXNjZW5hcmlve2ZsZXg6MTtmb250LXdlaWdodDo2MDA7Zm9udC1zaXplOjE0cHg7Y29sb3I6IzBmMTcyYTtsaW5lLWhlaWdodDoxLjQ7d2hpdGUtc3BhY2U6cHJlLWxpbmV9Ci5jYXJkLXBpY3tmbGV4LXNocmluazowO3BhZGRpbmc6MnB4IDlweDtib3JkZXItcmFkaXVzOjIwcHg7Zm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6NzAwO2xldHRlci1zcGFjaW5nOi4wM2VtO21hcmdpbi10b3A6MnB4fQouY2FyZC1jaGV2cm9ue2NvbG9yOiM5NGEzYjg7Zm9udC1zaXplOjEycHg7bWFyZ2luLXRvcDozcHg7ZmxleC1zaHJpbms6MDt0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMnN9Ci5jYXJkLWNoZXZyb24ub3Blbnt0cmFuc2Zvcm06cm90YXRlKDE4MGRlZyl9Ci5jYXJkLWJvZHl7ZGlzcGxheTpub25lO3BhZGRpbmc6MCAxNnB4IDE2cHg7Ym9yZGVyLXRvcDoxcHggc29saWQgI2YxZjVmOX0KLmNhcmQtYm9keS5vcGVue2Rpc3BsYXk6YmxvY2t9Ci5maWVsZHttYXJnaW4tdG9wOjE0cHh9Ci5maWVsZC1sYWJlbHtmb250LXNpemU6MTFweDtmb250LXdlaWdodDo3MDA7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4wN2VtO2NvbG9yOiM2NDc0OGI7bWFyZ2luLWJvdHRvbTo1cHh9Ci5maWVsZC12YWx1ZXtjb2xvcjojMWUyOTNiO2xpbmUtaGVpZ2h0OjEuNzt3aGl0ZS1zcGFjZTpwcmUtd3JhcDt3b3JkLWJyZWFrOmJyZWFrLXdvcmQ7Zm9udC1zaXplOjEzLjVweH0KLmZpZWxkLXZhbHVlIGF7Y29sb3I6IzI1NjNlYjt0ZXh0LWRlY29yYXRpb246bm9uZX0KLmZpZWxkLXZhbHVlIGE6aG92ZXJ7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZX0KLmZpZWxkLWxpbmt7ZGlzcGxheTppbmxpbmUtYmxvY2s7bWFyZ2luLXRvcDo2cHg7cGFkZGluZzo0cHggMTBweDtiYWNrZ3JvdW5kOiNlZmY2ZmY7Ym9yZGVyOjFweCBzb2xpZCAjYmZkYmZlO2JvcmRlci1yYWRpdXM6NXB4O2NvbG9yOiMxZDRlZDg7Zm9udC1zaXplOjEycHg7Zm9udC13ZWlnaHQ6NjAwO3RleHQtZGVjb3JhdGlvbjpub25lfQouZmllbGQtbGluazpob3ZlcntiYWNrZ3JvdW5kOiNkYmVhZmV9CgovKiBQSUMgY29sb3JzICovCi5waWMtdGlte2JhY2tncm91bmQ6I2VkZTlmZTtjb2xvcjojNWIyMWI2fQoucGljLXJ1cnV7YmFja2dyb3VuZDojZmNlN2YzO2NvbG9yOiM5ZDE3NGR9Ci5waWMtamVyZW15e2JhY2tncm91bmQ6I2ZlZjNjNztjb2xvcjojOTI0MDBlfQoucGljLWh1YXtiYWNrZ3JvdW5kOiNkMWZhZTU7Y29sb3I6IzA2NWY0Nn0KLnBpYy1teWV7YmFja2dyb3VuZDojZGJlYWZlO2NvbG9yOiMxZTQwYWZ9Ci5waWMtbXVsdGl7YmFja2dyb3VuZDojZjFmNWY5O2NvbG9yOiM0NzU1Njl9CgovKiDilIDilIAgVGFibGVzIChJbmRleCAvIENvbnRhY3RvciAvIFNNKSDilIDilIAgKi8KLnBhZ2UtdGl0bGV7Zm9udC1zaXplOjE4cHg7Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOiMwZjE3MmE7bWFyZ2luLWJvdHRvbToxOHB4fQouc2VjdGlvbi10aXRsZXtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo3MDA7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2xldHRlci1zcGFjaW5nOi4wN2VtO2NvbG9yOiM2NDc0OGI7bWFyZ2luOjI0cHggMCAxMHB4fQouZGF0YS10YWJsZXt3aWR0aDoxMDAlO2JvcmRlci1jb2xsYXBzZTpjb2xsYXBzZTtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyOjFweCBzb2xpZCAjZTJlOGYwO2JvcmRlci1yYWRpdXM6MTBweDtvdmVyZmxvdzpoaWRkZW59Ci5kYXRhLXRhYmxlIHRoe2JhY2tncm91bmQ6I2Y4ZmFmYztwYWRkaW5nOjEwcHggMTRweDt0ZXh0LWFsaWduOmxlZnQ7Zm9udC1zaXplOjEycHg7Zm9udC13ZWlnaHQ6NzAwO3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0ZXItc3BhY2luZzouMDVlbTtjb2xvcjojNjQ3NDhiO2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNlMmU4ZjA7d2hpdGUtc3BhY2U6bm93cmFwfQouZGF0YS10YWJsZSB0ZHtwYWRkaW5nOjEwcHggMTRweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZjFmNWY5O3ZlcnRpY2FsLWFsaWduOnRvcDtmb250LXNpemU6MTNweDtsaW5lLWhlaWdodDoxLjY7d29yZC1icmVhazpicmVhay13b3JkfQouZGF0YS10YWJsZSB0cjpsYXN0LWNoaWxkIHRke2JvcmRlci1ib3R0b206bm9uZX0KLmRhdGEtdGFibGUgdGQgYXtjb2xvcjojMjU2M2ViO3RleHQtZGVjb3JhdGlvbjpub25lfQouZGF0YS10YWJsZSB0ZCBhOmhvdmVye3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9Ci5kYXRhLXRhYmxlIC5yZXNwLWNvbHt3aGl0ZS1zcGFjZTpwcmUtd3JhcDttYXgtd2lkdGg6MzYwcHh9Ci5zbS10YWJsZS13cmFwe292ZXJmbG93LXg6YXV0bztib3JkZXItcmFkaXVzOjEwcHg7Ym9yZGVyOjFweCBzb2xpZCAjZTJlOGYwO21hcmdpbi1ib3R0b206MjBweH0KLnNtLXRhYmxle2JvcmRlci1jb2xsYXBzZTpjb2xsYXBzZTtiYWNrZ3JvdW5kOiNmZmY7bWluLXdpZHRoOjYwMHB4fQouc20tdGFibGUgdGh7YmFja2dyb3VuZDojZjhmYWZjO3BhZGRpbmc6OXB4IDEycHg7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjcwMDt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7Y29sb3I6IzY0NzQ4Yjtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZTJlOGYwO3doaXRlLXNwYWNlOm5vd3JhcH0KLnNtLXRhYmxlIHRke3BhZGRpbmc6OHB4IDEycHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2YxZjVmOTtmb250LXNpemU6MTJweDt3b3JkLWJyZWFrOmJyZWFrLWFsbDttYXgtd2lkdGg6MTgwcHg7dmVydGljYWwtYWxpZ246dG9wfQouc20tdGFibGUgdHI6bGFzdC1jaGlsZCB0ZHtib3JkZXItYm90dG9tOm5vbmV9Ci5zbS10YWJsZSB0ZDpmaXJzdC1jaGlsZHtmb250LXdlaWdodDo2MDA7d2hpdGUtc3BhY2U6bm93cmFwO3dvcmQtYnJlYWs6bm9ybWFsO21heC13aWR0aDpub25lfQouc20tdGFibGUgdGQgYXtjb2xvcjojMjU2M2ViO2ZvbnQtc2l6ZToxMXB4fQouZGFzaHtjb2xvcjojY2JkNWUxfQouZW1wdHktc3RhdGV7cGFkZGluZzo2MHB4IDI0cHg7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6Izk0YTNiOH0KLmVtcHR5LXN0YXRlIC5pY29ue2ZvbnQtc2l6ZTozNnB4O21hcmdpbi1ib3R0b206MTJweH0KLmVtcHR5LXN0YXRlIHB7Zm9udC1zaXplOjE0cHh9Ci5uby1yZXN1bHRze3BhZGRpbmc6NDBweDt0ZXh0LWFsaWduOmNlbnRlcjtjb2xvcjojOTRhM2I4O2ZvbnQtc2l6ZToxNHB4fQouZW1haWwtbGlua3tjb2xvcjojMjU2M2ViO3RleHQtZGVjb3JhdGlvbjpub25lO2ZvbnQtc2l6ZToxMnB4fQoudGFne2Rpc3BsYXk6aW5saW5lLWJsb2NrO2JhY2tncm91bmQ6I2VmZjZmZjtjb2xvcjojMWQ0ZWQ4O2JvcmRlcjoxcHggc29saWQgI2JmZGJmZTtib3JkZXItcmFkaXVzOjRweDtwYWRkaW5nOjJweCA4cHg7Zm9udC1zaXplOjExcHg7Zm9udC13ZWlnaHQ6NzAwO21hcmdpbi1yaWdodDo0cHg7d2hpdGUtc3BhY2U6bm93cmFwO21pbi13aWR0aDozMHB4O3RleHQtYWxpZ246Y2VudGVyfQo8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5Pgo8YXNpZGUgaWQ9InNpZGViYXIiPgogIDxkaXYgaWQ9InNpZGViYXItaGVhZGVyIj4KICAgIDxkaXYgY2xhc3M9ImxvZ28iPkRlbHRhIEZvcmNlPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJ0aXRsZSI+UkVHIE1LVCBUZWFtbWF0ZTwvZGl2PgogIDwvZGl2PgogIDx1bCBpZD0ibmF2LWxpc3QiPjwvdWw+CjwvYXNpZGU+CjxkaXYgaWQ9Im1haW4iPgogIDxkaXYgaWQ9InRvb2xiYXIiPgogICAgPGgyIGlkPSJwYWdlLXRpdGxlIj5JbmRleDwvaDI+CiAgICA8aW5wdXQgaWQ9InNlYXJjaCIgdHlwZT0ic2VhcmNoIiBwbGFjZWhvbGRlcj0iU2VhcmNoIGFsbCBjb250ZW504oCmIiBhdXRvY29tcGxldGU9Im9mZiI+CiAgPC9kaXY+CiAgPGRpdiBpZD0iY29udGVudCI+PC9kaXY+CjwvZGl2PgoKPHNjcmlwdD4KY29uc3QgUkFXID0gX19EQVRBX0pTT05fXzsKCi8vIOKUgOKUgCBQSUMgYmFkZ2UgaGVscGVyIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgApmdW5jdGlvbiBwaWNDbGFzcyhwaWMpewogIGNvbnN0IHAgPSAocGljfHwnJykudG9Mb3dlckNhc2UoKTsKICBpZihwLmluY2x1ZGVzKCcsJykgfHwgKHAuaW5jbHVkZXMoJ3RpbScpICYmIHAubGVuZ3RoID4gNSkpIHJldHVybiAncGljLW11bHRpJzsKICBpZihwLmluY2x1ZGVzKCd0aW0nKSkgICAgcmV0dXJuICdwaWMtdGltJzsKICBpZihwLmluY2x1ZGVzKCdydXJ1JykpICAgcmV0dXJuICdwaWMtcnVydSc7CiAgaWYocC5pbmNsdWRlcygnamVyZW15JykpIHJldHVybiAncGljLWplcmVteSc7CiAgaWYocC5pbmNsdWRlcygnaHVhJykpICAgIHJldHVybiAncGljLWh1YSc7CiAgaWYocC5pbmNsdWRlcygnbXllJykpICAgIHJldHVybiAncGljLW15ZSc7CiAgcmV0dXJuICdwaWMtbXVsdGknOwp9CgovLyDilIDilIAgTGluayBkZXRlY3RvciDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAKZnVuY3Rpb24gbGlua2lmeSh0ZXh0KXsKICBpZighdGV4dCkgcmV0dXJuICcnOwogIGNvbnN0IGVzYyA9IHRleHQucmVwbGFjZSgvJi9nLCcmYW1wOycpLnJlcGxhY2UoLzwvZywnJmx0OycpLnJlcGxhY2UoLz4vZywnJmd0OycpOwogIHJldHVybiBlc2MucmVwbGFjZSgvKGh0dHBzPzpcL1wvW15cc10rKS9nLCAnPGEgaHJlZj0iJDEiIHRhcmdldD0iX2JsYW5rIiByZWw9Im5vb3BlbmVyIj4kMTwvYT4nKTsKfQoKLy8g4pSA4pSAIFJlbmRlciBoZWxwZXJzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgApmdW5jdGlvbiBmaWVsZChsYWJlbCwgdmFsdWUpewogIGlmKCF2YWx1ZSB8fCB2YWx1ZSA9PT0gJ+KAlCcpIHJldHVybiAnJzsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImZpZWxkIj4KICAgIDxkaXYgY2xhc3M9ImZpZWxkLWxhYmVsIj4ke2xhYmVsfTwvZGl2PgogICAgPGRpdiBjbGFzcz0iZmllbGQtdmFsdWUiPiR7bGlua2lmeSh2YWx1ZSl9PC9kaXY+CiAgPC9kaXY+YDsKfQoKZnVuY3Rpb24gcmVuZGVyQ2FyZHMocm93cywgcXVlcnkpewogIGlmKCFyb3dzIHx8IHJvd3MubGVuZ3RoID09PSAwKQogICAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJlbXB0eS1zdGF0ZSI+PGRpdiBjbGFzcz0iaWNvbiI+8J+TrTwvZGl2PjxwPk5vIGNvbnRlbnQgeWV0IOKAlCBjaGVjayBiYWNrIGxhdGVyLjwvcD48L2Rpdj5gOwogIGNvbnN0IHEgPSAocXVlcnl8fCcnKS50b0xvd2VyQ2FzZSgpOwogIGNvbnN0IGZpbHRlcmVkID0gcm93cy5maWx0ZXIociA9PiB7CiAgICBpZighcSkgcmV0dXJuIHRydWU7CiAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhyKS5zb21lKHYgPT4gKHZ8fCcnKS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHEpKTsKICB9KTsKICBpZihmaWx0ZXJlZC5sZW5ndGggPT09IDApCiAgICByZXR1cm4gYDxkaXYgY2xhc3M9Im5vLXJlc3VsdHMiPk5vIHJlc3VsdHMgZm9yICI8c3Ryb25nPiR7cX08L3N0cm9uZz4iPC9kaXY+YDsKICByZXR1cm4gYDxkaXYgY2xhc3M9ImNhcmRzLWdyaWQiPiR7ZmlsdGVyZWQubWFwKHIgPT4gewogICAgY29uc3QgaGFzTGlua3MgPSByLmxpbmtzICYmIHIubGlua3MgIT09ICfigJQnOwogICAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJjYXJkIj4KICAgICAgPGRpdiBjbGFzcz0iY2FyZC1oZWFkZXIiIG9uY2xpY2s9InRvZ2dsZUNhcmQodGhpcykiPgogICAgICAgIDxkaXYgY2xhc3M9ImNhcmQtc2NlbmFyaW8iPiR7ci5zY2VuYXJpb3x8JyhVbnRpdGxlZCknfTwvZGl2PgogICAgICAgIDxzcGFuIGNsYXNzPSJjYXJkLXBpYyAke3BpY0NsYXNzKHIucGljKX0iPiR7ci5waWN8fCcnfTwvc3Bhbj4KICAgICAgICA8c3BhbiBjbGFzcz0iY2FyZC1jaGV2cm9uIj7ilrw8L3NwYW4+CiAgICAgIDwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJjYXJkLWJvZHkiPgogICAgICAgICR7ZmllbGQoJ1Byb2Nlc3MgU3RlcHMnLCByLnN0ZXBzKX0KICAgICAgICAke2ZpZWxkKCdXaGF0IHRvIFByZXBhcmUnLCByLnByZXBhcmUpfQogICAgICAgICR7ZmllbGQoJ1RpbWVsaW5lJywgci50aW1lbGluZSl9CiAgICAgICAgJHtmaWVsZCgnQ29tbW9uIFEmQScsIHIucWEpfQogICAgICAgICR7aGFzTGlua3MgPyBgPGRpdiBjbGFzcz0iZmllbGQiPjxkaXYgY2xhc3M9ImZpZWxkLWxhYmVsIj5SZWxhdGVkIExpbmtzPC9kaXY+PGRpdiBjbGFzcz0iZmllbGQtdmFsdWUiPiR7ci5saW5rc191cmwgPyBgPGEgaHJlZj0iJHtyLmxpbmtzX3VybH0iIHRhcmdldD0iX2JsYW5rIiByZWw9Im5vb3BlbmVyIiBjbGFzcz0iZmllbGQtbGluayI+JHtyLmxpbmtzfTwvYT5gIDogbGlua2lmeShyLmxpbmtzKX08L2Rpdj48L2Rpdj5gIDogJyd9CiAgICAgIDwvZGl2PgogICAgPC9kaXY+YDsKICB9KS5qb2luKCcnKX08L2Rpdj5gOwp9CgpmdW5jdGlvbiB0YWJJZEZyb21OYW1lKG5hbWUpewogIGNvbnN0IG09ewogICAgJ0NvbnRhY3Rvcic6J19jb250YWN0b3InLCdTTSBMaW5rcyc6J19zbScsCiAgICAnQnVkZ2V0ICYgUGxhbic6J3RhYjEnLCdPTSc6J3RhYjInLCdBc3NldHMnOid0YWIzJywKICAgICdTb2NpYWwgTWVkaWEnOid0YWI0JywnUFInOid0YWI1JywnRXNwb3J0cyc6J3RhYjcnLAogICAgJ0Nyb3NzLUluZHVzdHJ5ICYgSVAgUGFydG5lcnNoaXBzJzondGFiOCcsJ1ZpcnR1YWwgSXRlbSBSZXdhcmRzJzondGFiOScsCiAgICAnQ0NQJzondGFiMTAnLCdXZWJzaXRlJzondGFiMTEnLCdQYXRjaCBVcGRhdGVzJzondGFiMTInLCdTdG9yZSc6J3RhYjEzJwogIH07CiAgcmV0dXJuIG1bbmFtZV18fG51bGw7Cn0KCmZ1bmN0aW9uIHJlbmRlckluZGV4KHJvd3MpewogIHJldHVybiBgPHAgY2xhc3M9InBhZ2UtdGl0bGUiPlRhYiBJbmRleDwvcD4KICA8dGFibGUgY2xhc3M9ImRhdGEtdGFibGUiPgogICAgPHRoZWFkPjx0cj48dGggc3R5bGU9IndpZHRoOjQ4cHgiPlRhYjwvdGg+PHRoIHN0eWxlPSJ3aWR0aDoxODBweCI+TmFtZTwvdGg+PHRoPkRlc2NyaXB0aW9uPC90aD48L3RyPjwvdGhlYWQ+CiAgICA8dGJvZHk+JHtyb3dzLm1hcChyPT57CiAgICAgIGNvbnN0IHRpZD10YWJJZEZyb21OYW1lKHIubmFtZSk7CiAgICAgIGNvbnN0IG5hbWVFbD10aWQKICAgICAgICA/IGA8YSBocmVmPSIjIiBvbmNsaWNrPSJuYXZpZ2F0ZShcJyR7dGlkfVwnKTtyZXR1cm4gZmFsc2U7IiBzdHlsZT0iY29sb3I6IzI1NjNlYjtmb250LXdlaWdodDo2MDA7dGV4dC1kZWNvcmF0aW9uOm5vbmUiPiR7ci5uYW1lfSDihpc8L2E+YAogICAgICAgIDogYDxzcGFuIHN0eWxlPSJmb250LXdlaWdodDo2MDAiPiR7ci5uYW1lfTwvc3Bhbj5gOwogICAgICByZXR1cm4gYDx0cj4KICAgICAgICA8dGQ+PHNwYW4gY2xhc3M9InRhZyI+JHtyLnRhYn08L3NwYW4+PC90ZD4KICAgICAgICA8dGQ+JHtuYW1lRWx9PC90ZD4KICAgICAgICA8dGQgc3R5bGU9ImNvbG9yOiM0NzU1NjkiPiR7ci5kZXNjfTwvdGQ+CiAgICAgIDwvdHI+YDsKICAgIH0pLmpvaW4oJycpfTwvdGJvZHk+CiAgPC90YWJsZT5gOwp9CgpmdW5jdGlvbiByZW5kZXJDb250YWN0b3IoZGF0YSl7CiAgY29uc3QgdGVhbVJvd3MgPSBkYXRhLnRlYW0ubWFwKHI9PmA8dHI+CiAgICA8dGQgc3R5bGU9ImZvbnQtd2VpZ2h0OjcwMCI+JHtyLm5hbWV9PC90ZD4KICAgIDx0ZCBjbGFzcz0icmVzcC1jb2wiPiR7ci5yZXNwfTwvdGQ+CiAgICA8dGQ+PGEgaHJlZj0ibWFpbHRvOiR7ci5lbWFpbH0iIGNsYXNzPSJlbWFpbC1saW5rIj4ke3IuZW1haWx9PC9hPjwvdGQ+CiAgPC90cj5gKS5qb2luKCcnKTsKICBjb25zdCBsb2NSb3dzID0gZGF0YS5jb250YWN0b3JzLm1hcChyPT5gPHRyPgogICAgPHRkIHN0eWxlPSJmb250LXdlaWdodDo3MDAiPiR7ci5yZWdpb259PC90ZD4KICAgIDx0ZD4ke3IuY29udGFjdH08L3RkPgogICAgPHRkPjxhIGhyZWY9Im1haWx0bzoke3IuZW1haWx9IiBjbGFzcz0iZW1haWwtbGluayI+JHtyLmVtYWlsfTwvYT48L3RkPgogIDwvdHI+YCkuam9pbignJyk7CiAgcmV0dXJuIGA8cCBjbGFzcz0icGFnZS10aXRsZSI+Q29udGFjdG9yPC9wPgogIDxkaXYgY2xhc3M9InNlY3Rpb24tdGl0bGUiPlJlZ2lvbmFsIFRlYW08L2Rpdj4KICA8dGFibGUgY2xhc3M9ImRhdGEtdGFibGUiPgogICAgPHRoZWFkPjx0cj48dGg+TWVtYmVyPC90aD48dGg+UmVzcG9uc2liaWxpdGllczwvdGg+PHRoPkVtYWlsPC90aD48L3RyPjwvdGhlYWQ+CiAgICA8dGJvZHk+JHt0ZWFtUm93c308L3Rib2R5PgogIDwvdGFibGU+CiAgPGRpdiBjbGFzcz0ic2VjdGlvbi10aXRsZSI+TG9jYWwgTUtUIENvbnRhY3RvcnM8L2Rpdj4KICA8dGFibGUgY2xhc3M9ImRhdGEtdGFibGUiPgogICAgPHRoZWFkPjx0cj48dGg+UmVnaW9uPC90aD48dGg+TUtUIENvbnRhY3RvcjwvdGg+PHRoPkVtYWlsPC90aD48L3RyPjwvdGhlYWQ+CiAgICA8dGJvZHk+JHtsb2NSb3dzfTwvdGJvZHk+CiAgPC90YWJsZT5gOwp9CgpmdW5jdGlvbiBzbUNlbGwodmFsKXsKICBpZighdmFsIHx8IHZhbD09PSfigJQnKSByZXR1cm4gYDxzcGFuIGNsYXNzPSJkYXNoIj7igJQ8L3NwYW4+YDsKICBpZih2YWwuc3RhcnRzV2l0aCgnaHR0cCcpKSByZXR1cm4gYDxhIGhyZWY9IiR7dmFsfSIgdGFyZ2V0PSJfYmxhbmsiIHJlbD0ibm9vcGVuZXIiPuKGlyBMaW5rPC9hPmA7CiAgcmV0dXJuIHZhbDsKfQoKZnVuY3Rpb24gcmVuZGVyU00oc20pewogIGNvbnN0IG9mZkhlYWQgPSBzbS5vZmZfaGRyLm1hcChoPT5gPHRoPiR7aH08L3RoPmApLmpvaW4oJycpOwogIGNvbnN0IG9mZkJvZHkgPSBzbS5vZmYubWFwKHI9PmA8dHI+JHtyLm1hcCh2PT5gPHRkPiR7c21DZWxsKHYpfTwvdGQ+YCkuam9pbignJyl9PC90cj5gKS5qb2luKCcnKTsKICBjb25zdCBub25IZWFkID0gc20ubm9uX2hkci5tYXAoaD0+YDx0aD4ke2h9PC90aD5gKS5qb2luKCcnKTsKICBjb25zdCBub25Cb2R5ID0gc20ubm9uLm1hcChyPT5gPHRyPiR7ci5tYXAodj0+YDx0ZD4ke3NtQ2VsbCh2KX08L3RkPmApLmpvaW4oJycpfTwvdHI+YCkuam9pbignJyk7CiAgY29uc3QgZXNwSGVhZCA9IHNtLmVzcF9oZHIgJiYgc20uZXNwX2hkci5sZW5ndGggPyBgPHRoZWFkPjx0cj4ke3NtLmVzcF9oZHIubWFwKGg9PmA8dGg+JHtofTwvdGg+YCkuam9pbignJyl9PC90cj48L3RoZWFkPmAgOiAnJzsKICBjb25zdCBlc3BTZWN0aW9uID0gc20uZXNwLmxlbmd0aCA/IGAKICAgIDxkaXYgY2xhc3M9InNlY3Rpb24tdGl0bGUiPkVzcG9ydHMgQ2hhbm5lbHM8L2Rpdj4KICAgIDxkaXYgY2xhc3M9InNtLXRhYmxlLXdyYXAiPgogICAgICA8dGFibGUgY2xhc3M9InNtLXRhYmxlIj4ke2VzcEhlYWR9PHRib2R5PiR7c20uZXNwLm1hcChyPT5gPHRyPiR7ci5tYXAodj0+YDx0ZD4ke3NtQ2VsbCh2KX08L3RkPmApLmpvaW4oJycpfTwvdHI+YCkuam9pbignJyl9PC90Ym9keT4KICAgICAgPC90YWJsZT4KICAgIDwvZGl2PmAgOiAnJzsKICByZXR1cm4gYDxwIGNsYXNzPSJwYWdlLXRpdGxlIj5Tb2NpYWwgTWVkaWEgTGlua3M8L3A+CiAgPGRpdiBjbGFzcz0ic2VjdGlvbi10aXRsZSI+T2ZmaWNpYWwgQ2hhbm5lbHM8L2Rpdj4KICA8ZGl2IGNsYXNzPSJzbS10YWJsZS13cmFwIj4KICAgIDx0YWJsZSBjbGFzcz0ic20tdGFibGUiPjx0aGVhZD48dHI+JHtvZmZIZWFkfTwvdHI+PC90aGVhZD48dGJvZHk+JHtvZmZCb2R5fTwvdGJvZHk+PC90YWJsZT4KICA8L2Rpdj4KICA8ZGl2IGNsYXNzPSJzZWN0aW9uLXRpdGxlIj5Ob24tT2ZmaWNpYWwgQ2hhbm5lbHM8L2Rpdj4KICA8ZGl2IGNsYXNzPSJzbS10YWJsZS13cmFwIj4KICAgIDx0YWJsZSBjbGFzcz0ic20tdGFibGUiPjx0aGVhZD48dHI+JHtub25IZWFkfTwvdHI+PC90aGVhZD48dGJvZHk+JHtub25Cb2R5fTwvdGJvZHk+PC90YWJsZT4KICA8L2Rpdj4KICAke2VzcFNlY3Rpb259YDsKfQoKLy8g4pSA4pSAIE5hdmlnYXRpb24g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACmxldCBhY3RpdmVJZCA9ICdfaW5kZXgnOwoKZnVuY3Rpb24gZ2V0TGFiZWwoaWQpewogIGNvbnN0IGl0ZW0gPSBSQVcubmF2LmZpbmQobj0+bi5pZD09PWlkKTsKICByZXR1cm4gaXRlbSA/IGl0ZW0ubGFiZWwgOiBpZDsKfQoKZnVuY3Rpb24gYnVpbGROYXYoKXsKICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXYtbGlzdCcpOwogIFJBVy5uYXYuZm9yRWFjaChpdGVtID0+IHsKICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTsKICAgIGlmKGl0ZW0uc2VwKXsgbGkuY2xhc3NOYW1lPSdzZXAnOyB1bC5hcHBlbmRDaGlsZChsaSk7IHJldHVybjsgfQogICAgbGkuY2xhc3NOYW1lID0gJ25hdi1pdGVtJzsKICAgIGxpLmlubmVySFRNTCA9IGA8YSBocmVmPSIjIiBkYXRhLWlkPSIke2l0ZW0uaWR9Ij4ke2l0ZW0ubGFiZWx9PC9hPmA7CiAgICBsaS5xdWVyeVNlbGVjdG9yKCdhJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHsKICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOwogICAgICBuYXZpZ2F0ZShpdGVtLmlkKTsKICAgIH0pOwogICAgdWwuYXBwZW5kQ2hpbGQobGkpOwogIH0pOwp9CgpmdW5jdGlvbiBuYXZpZ2F0ZShpZCl7CiAgYWN0aXZlSWQgPSBpZDsKICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbmF2LWxpc3QgYScpLmZvckVhY2goYSA9PiB7CiAgICBhLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScsIGEuZGF0YXNldC5pZCA9PT0gaWQpOwogIH0pOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlLXRpdGxlJykudGV4dENvbnRlbnQgPSBnZXRMYWJlbChpZCk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlYXJjaCcpLnZhbHVlID0gJyc7CiAgcmVuZGVyQ29udGVudCgnJyk7Cn0KCmZ1bmN0aW9uIHJlbmRlckNvbnRlbnQocXVlcnkpewogIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKTsKICBjb25zdCBpZCAgPSBhY3RpdmVJZDsKICBpZihpZCA9PT0gJ19pbmRleCcpICAgICB7IGVsLmlubmVySFRNTCA9IHJlbmRlckluZGV4KFJBVy50YWJzWydfaW5kZXgnXSk7IHJldHVybjsgfQogIGlmKGlkID09PSAnX2NvbnRhY3RvcicpIHsgZWwuaW5uZXJIVE1MID0gcmVuZGVyQ29udGFjdG9yKFJBVy50YWJzWydfY29udGFjdG9yJ10pOyByZXR1cm47IH0KICBpZihpZCA9PT0gJ19zbScpICAgICAgICB7IGVsLmlubmVySFRNTCA9IHJlbmRlclNNKFJBVy50YWJzWydfc20nXSk7IHJldHVybjsgfQogIGVsLmlubmVySFRNTCA9IHJlbmRlckNhcmRzKFJBVy50YWJzW2lkXSB8fCBbXSwgcXVlcnkpOwp9CgovLyDilIDilIAgU2VhcmNoIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgApsZXQgc2VhcmNoVGltZXI7CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZWFyY2gnKS5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGUgPT4gewogIGNsZWFyVGltZW91dChzZWFyY2hUaW1lcik7CiAgc2VhcmNoVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHJlbmRlckNvbnRlbnQoZS50YXJnZXQudmFsdWUpLCAxMjApOwp9KTsKCi8vIOKUgOKUgCBDYXJkIHRvZ2dsZSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAKZnVuY3Rpb24gdG9nZ2xlQ2FyZChoZWFkZXIpewogIGNvbnN0IGJvZHkgICAgPSBoZWFkZXIubmV4dEVsZW1lbnRTaWJsaW5nOwogIGNvbnN0IGNoZXZyb24gPSBoZWFkZXIucXVlcnlTZWxlY3RvcignLmNhcmQtY2hldnJvbicpOwogIGJvZHkuY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpOwogIGNoZXZyb24uY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpOwp9CgovLyDilIDilIAgSW5pdCDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAKYnVpbGROYXYoKTsKbmF2aWdhdGUoJ19pbmRleCcpOwo8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+';

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
