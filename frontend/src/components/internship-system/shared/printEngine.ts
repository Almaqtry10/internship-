import { BU_LOGO_DATA_URL } from '../brandAssets';

let cachedLogoUrl = BU_LOGO_DATA_URL;

export async function getLogoDataUrl() {
    if (cachedLogoUrl) return cachedLogoUrl;
    return BU_LOGO_DATA_URL;
}

function escapeHtml(value: any) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildReportBrandHeaderHtml(logoSrc: string) {
    return `
    <div class="paper-header">
      <div class="paper-brand">
        <div class="paper-brand-en">
          <div class="paper-republic">Somali Republic</div>
          <div class="paper-university">Benadir University</div>
        </div>
        <img class="paper-logo" src="${logoSrc}" alt="Benadir University Logo"/>
        <div class="paper-brand-ar" dir="rtl">
          <div class="paper-republic-ar">جمهورية الصومال</div>
          <div class="paper-university-ar">جامعة بنادر</div>
        </div>
      </div>
      <div class="paper-office">Office of the registrar, Benadir University</div>
    </div>`;
}

function reportShellCss() {
    return `
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Times New Roman', Times, serif; color: #000; background: #fff; }
    .toolbar { padding: 10px 16px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
    .toolbar button {
      padding: 8px 14px; border: 1px solid #64748b; background: #fff;
      border-radius: 6px; cursor: pointer; font: inherit;
    }
    .page { padding: 18px 22px; max-width: 900px; margin: 0 auto; }
    
    .paper-header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #0000ff; padding-bottom: 8px; }
    .paper-brand {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      margin-bottom: 8px;
    }
    .paper-brand-en, .paper-brand-ar { flex: 1; font-weight: bold; }
    .paper-brand-en { text-align: left; }
    .paper-brand-ar { text-align: right; font-size: 1.3em; }
    
    .paper-republic, .paper-republic-ar { font-size: 18px; color: #008000; }
    .paper-university, .paper-university-ar { font-size: 22px; color: #0000ff; margin-top: 4px; }
    
    .paper-logo { width: 90px; height: 90px; object-fit: contain; }
    .paper-office { font-size: 18px; font-weight: bold; color: #000; margin-top: 10px; }
    
    .report-title { font-size: 20px; font-weight: bold; text-align: center; margin: 15px 0; color: #0000ff; }
    .meta-line { margin: 4px 0; font-size: 14px; }
    
    .kpi-grid { display: flex; gap: 16px; margin: 24px 0; border: 1px solid #000; padding: 16px; background: #fff; }
    .kpi { flex: 1; text-align: center; border-right: 1px solid #000; }
    .kpi:last-child { border-right: none; }
    .kpi span { display: block; font-size: 14px; font-weight: bold; margin-bottom: 8px; }
    .kpi strong { display: block; font-size: 20px; color: #000; }
    
    .report-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
    .report-table th, .report-table td { border: 1px solid #000; padding: 8px 10px; text-align: left; }
    .report-table th { background: #bce3e8; font-weight: bold; }
    .empty { text-align: center !important; font-style: italic; padding: 20px !important; }
    
    .signature-block { margin-top: 50px; text-align: right; }
    .signature-line { width: 250px; border-top: 1px dashed #000; display: inline-block; margin-bottom: 8px; }
    .signature-name { font-weight: bold; font-size: 16px; }
    .signature-title { font-size: 14px; color: #000; }

    @media print {
      @page { margin: 0; }
      body { margin: 1.5cm; }
      .no-print { display: none !important; }
      .page { padding: 0; max-width: none; margin: 0; }
      .kpi-grid { border-color: #000; background: #fff; }
      .report-table th { background: #bce3e8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    `;
}

function openPrintHtml(html: string) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
        alert('Please allow pop-ups to print the report.');
        URL.revokeObjectURL(url);
        return false;
    }
    win.addEventListener('load', () => {
        setTimeout(() => {
            win.focus();
            win.print();
        }, 250);
    });
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
}

function formatReportDate(dateStr: string) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

export async function openSummaryReportPrint(data: any, meta: any = {}) {
    const logo = await getLogoDataUrl();
    const d = data || {};
    
    const displayFrom = meta.from ? formatReportDate(meta.from) : 'Beginning';
    const displayTo = meta.to ? formatReportDate(meta.to) : 'Present';
    
    const metaHtml = `
      <div style="text-align: right; margin-bottom: 10px; font-size: 14px;"><strong>Printed On:</strong> ${meta.printedOn || new Date().toLocaleString()}</div>
      <div class="meta-line"><strong>Report Period:</strong> ${displayFrom} to ${displayTo}</div>
    `;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Internship Summary Report</title>
      <style>${reportShellCss()}</style></head><body>
      <div class="toolbar no-print"><button type="button" onclick="window.print()">Print Report</button></div>
      <div class="page">
        ${buildReportBrandHeaderHtml(logo as string)}
        ${metaHtml}
        <div class="report-title">INTERNSHIP SUMMARY REPORT</div>
        
        <div class="kpi-grid">
          <div class="kpi"><span>Total Requests</span><strong>${d.total || 0}</strong></div>
          <div class="kpi"><span>Open</span><strong>${d.open || 0}</strong></div>
          <div class="kpi"><span>Approved</span><strong>${d.approved || 0}</strong></div>
          <div class="kpi"><span>Rejected</span><strong>${d.rejected || 0}</strong></div>
          <div class="kpi"><span>Approval Rate</span><strong>${d.approvalRate || 0}%</strong></div>
        </div>
        
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-name">Registrar's Approval:</div>
            <div class="signature-title">Final approval granted</div>
        </div>
      </div>
      </body></html>`;

    return openPrintHtml(html);
}

export async function openApprovedListPrint(requests: any[], meta: any = {}) {
    const logo = await getLogoDataUrl();
    
    const displayFrom = meta.from ? formatReportDate(meta.from) : 'Beginning';
    const displayTo = meta.to ? formatReportDate(meta.to) : 'Present';
    
    const metaHtml = `
      <div style="text-align: right; margin-bottom: 10px; font-size: 14px;"><strong>Printed On:</strong> ${meta.printedOn || new Date().toLocaleString()}</div>
      <div class="meta-line"><strong>Report Period:</strong> ${displayFrom} to ${displayTo}</div>
    `;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Approved Internship Requests</title>
      <style>${reportShellCss()}</style></head><body>
      <div class="toolbar no-print"><button type="button" onclick="window.print()">Print List</button></div>
      <div class="page">
        ${buildReportBrandHeaderHtml(logo as string)}
        ${metaHtml}
        <div class="report-title">APPROVED INTERNSHIP REQUESTS</div>
        
        <table class="report-table" style="margin-top: 15px;">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Internship Period</th>
              <th>Degree</th>
            </tr>
          </thead>
          <tbody>
            ${requests.length === 0 ? '<tr><td colspan="5" class="empty">No approved requests in this period.</td></tr>' : 
              requests.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(r.student_id)}</td>
                <td>${escapeHtml(r.full_name)}</td>
                <td>${escapeHtml(r.internship_start_date)} &rarr; ${escapeHtml(r.internship_end_date)}</td>
                <td>${escapeHtml(r.degree || 'Bachelor')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-name">Registrar's Approval:</div>
            <div class="signature-title">Final approval granted</div>
        </div>
      </div>
      </body></html>`;

    return openPrintHtml(html);
}
