import { Analysis } from './analysis.js';
import { Charts } from './charts.js';

window.addEventListener('DOMContentLoaded', () => {
  const els = {
    fn: document.getElementById('fn'),
    wc: document.getElementById('wc'),
    rt: document.getElementById('rt'),
    summaryText: document.getElementById('summaryText'),
    summaryEmpty: document.getElementById('summaryEmpty'),
    deleteBtn: document.getElementById('deleteBtn'),
    exportBtn: document.getElementById('exportBtn'),
  };

  // ----- Restore meta/text -----
  const text = localStorage.getItem('ink_text') || '';
  const meta = JSON.parse(localStorage.getItem('ink_report_meta') || 'null');

  // badges
  const words = meta?.words ?? (text.match(/\b[\p{L}\p{N}’'-]+\b/gu) || []).length;
  els.fn.textContent = meta?.name || 'none';
  els.wc.textContent = words ? words.toLocaleString() : '0000';
  els.rt.textContent = words ? `${Math.max(1, Math.ceil(words / 200))} min` : '00 min';

  // summary
  const summary = Analysis.quickSummary(text);
  if (summary) {
    els.summaryText.textContent = summary;
    els.summaryEmpty.hidden = true;
  } else {
    els.summaryText.textContent = '';
    els.summaryEmpty.hidden = false;
  }

  // charts render or clear
  if (text && text.trim().length > 0) {
    Charts.renderDashboardCharts();
  } else {
    Charts.clearCharts();
  }

  // ====== DELETE ======
  const handleDelete = () => {
    if (!confirm('Delete this report?')) return;
    try {
      localStorage.removeItem('ink_text');
      localStorage.removeItem('ink_report_meta');
    } catch {}
    // reset UI
    els.fn.textContent = 'none';
    els.wc.textContent = '0000';
    els.rt.textContent = '00 min';
    els.summaryText.textContent = '';
    els.summaryEmpty.hidden = false;

    // tear down charts and show "No chart available" notes
    Charts.clearCharts();
  };

  if (els.deleteBtn) {
    els.deleteBtn.addEventListener('click', handleDelete);
  }

  // ====== EXPORT AS PDF ======
  async function exportPDF() {
    // guards
    if (!window.jspdf?.jsPDF) {
      alert('PDF library not loaded. Please check the script tags.');
      return;
    }
    const { jsPDF } = window.jspdf;

    // Set up page
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const page = { w: pdf.internal.pageSize.getWidth(), h: pdf.internal.pageSize.getHeight(), margin: 36 };

    // Header / metadata
    const fileName = els.fn?.textContent?.trim() || 'Untitled';
    const now = new Date();
    const header = `Ink Insights — ${fileName}`;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(header, page.margin, 50);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Exported: ${now.toLocaleString()}`, page.margin, 66);

    // Summary block
    let cursorY = 92;
    if (els.summaryText?.textContent?.trim()) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Summary', page.margin, cursorY);
      cursorY += 14;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      const wrapped = pdf.splitTextToSize(els.summaryText.textContent.trim(), page.w - page.margin * 2);
      const lineHeight = 14;
      wrapped.forEach((line) => {
        if (cursorY + lineHeight > page.h - page.margin) {
          pdf.addPage();
          cursorY = page.margin;
        }
        pdf.text(line, page.margin, cursorY);
        cursorY += lineHeight;
      });

      cursorY += 12;
    }

    // Helper: add a chart canvas by id. Returns next Y.
    const addChartById = async (canvasId, title, y) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return y;

      // Title
      const titleH = 16;
      if (y + titleH + 10 > page.h - page.margin) {
        pdf.addPage();
        y = page.margin;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(title, page.margin, y);
      y += 10;

      // Canvas -> image
      // If canvas is Chart.js, it already has a bitmap; use toDataURL directly.
      let dataUrl;
      try {
        dataUrl = canvas.toDataURL('image/png', 1.0);
      } catch {
        // Fallback via html2canvas if needed
        const snap = await html2canvas(canvas, { backgroundColor: '#ffffff', scale: 2 });
        dataUrl = snap.toDataURL('image/png', 1.0);
      }

      // Fit width, preserve aspect
      const maxW = page.w - page.margin * 2;
      const ratio = canvas.height / canvas.width;
      const imgW = maxW;
      const imgH = imgW * ratio;

      if (y + imgH > page.h - page.margin) {
        pdf.addPage();
        y = page.margin;
      }

      pdf.addImage(dataUrl, 'PNG', page.margin, y, imgW, imgH);
      return y + imgH + 18; // gap after image
    };

    // Add charts (two per page naturally due to height)
    cursorY = await addChartById('keywordsChart', 'Keywords & Frequencies', cursorY);
    cursorY = await addChartById('themesChart', 'Themes & Clusters', cursorY);
    cursorY = await addChartById('sentimentChart', 'Sentiment Overview', cursorY);
    cursorY = await addChartById('emotionsChart', 'Emotional Patterns', cursorY);

    // Save
    const safeName = fileName.replace(/[\\/:*?"<>|]/g, '_') || 'Ink_Insights';
    pdf.save(`${safeName}.pdf`);
  }

  if (els.exportBtn) {
    els.exportBtn.addEventListener('click', exportPDF);
  }

  // Persist selected feature so features.html can auto-open the right section
  document.querySelectorAll('.feature').forEach(link => {
    link.addEventListener('click', () => {
      const section = link.getAttribute('data-section');
      try { localStorage.setItem('ink_target_section', section); } catch {}
    });
  });
});
