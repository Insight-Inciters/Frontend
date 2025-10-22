// js/dashboard.js
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
  if (els.deleteBtn) els.deleteBtn.addEventListener('click', handleDelete);

  // ====== EXPORT PDF ======
  async function exportPDF() {
    // Ensure charts are painted
    await new Promise(requestAnimationFrame);

    const { jsPDF } = window.jspdf || {};
    if (!window.html2canvas || !jsPDF) {
      alert('PDF libraries not found. Make sure html2canvas and jsPDF are included before this script.');
      return;
    }

    // Target: export the main dashboard area
    const target = document.querySelector('main.wrap') || document.body;

    // Optional: temporarily hide the “No chart available” helper lines during export
    const notes = Array.from(target.querySelectorAll('.panel .empty-note'));
    const prevHidden = notes.map(n => n.hidden);
    notes.forEach(n => (n.hidden = true));

    // High-res rasterization of the area
    const canvas = await window.html2canvas(target, {
      scale: Math.min(2, window.devicePixelRatio || 2),
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight
    });

    // Restore note visibility
    notes.forEach((n, i) => (n.hidden = prevHidden[i]));

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Page setup (A4 portrait)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const margin = 10; // mm
    const usableW = pageW - margin * 2;
    const imgW = usableW;
    const imgH = (canvas.height * imgW) / canvas.width;

    // Add first page
    let position = margin;
    pdf.addImage(imgData, 'JPEG', margin, position, imgW, imgH);

    // Paginate if content is taller than a single page
    let heightLeft = imgH - (pageH - margin * 2);
    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgH - heightLeft);
      pdf.addImage(imgData, 'JPEG', margin, position, imgW, imgH);
      heightLeft -= (pageH - margin * 2);
    }

    const baseName = (meta?.name ? meta.name : 'Ink-Insights-Report')
      .toString()
      .trim()
      .replace(/[^\w\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'Ink-Insights-Report';

    const stamp = new Date().toISOString().slice(0,10);
    pdf.save(`${baseName}-${stamp}.pdf`);
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
