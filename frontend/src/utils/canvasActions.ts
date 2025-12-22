import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Utility functions for Canvas Header Actions
 */

/**
 * Generate PDF from canvas content
 */
export const generatePDF = async (artifact: any): Promise<Blob | null> => {
  const element = document.getElementById('canvas-content-area');
  if (!element) {
    console.error('Canvas content element not found');
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#111827' // Dark background for PDF
    } as any);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};

/**
 * Share the current artifact
 */
export const shareArtifact = async (artifact: any) => {
  // Try to share as PDF first
  const pdfBlob = await generatePDF(artifact);
  if (pdfBlob && navigator.share) {
    try {
      const file = new File([pdfBlob], `${artifact.title || 'artifact'}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: artifact.title || 'Shared Artifact',
          text: artifact.description || 'Check out this artifact',
        });
        return;
      }
    } catch (error) {
      console.error('Error sharing file:', error);
    }
  }

  // Fallback to URL sharing
  if (navigator.share) {
    try {
      await navigator.share({
        title: artifact.title || 'Shared Artifact',
        text: artifact.description || 'Check out this artifact',
        url: window.location.href,
      });
    } catch (error) {
      console.error('Error sharing url:', error);
    }
  } else {
    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }
};

/**
 * Print the current artifact
 */
export const printArtifact = async () => {
  const element = document.getElementById('canvas-content-area');
  if (!element) {
    window.print(); // Fallback
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#111827' // Match theme
    } as any);

    const imgData = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Artifact</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="window.print();window.close()" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  } catch (error) {
    console.error('Error printing artifact:', error);
    window.print(); // Fallback
  }
};

/**
 * Save the current artifact (as JSON) - Kept for internal use if needed, but removed from UI
 */
export const saveArtifact = (artifact: any) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(artifact, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${artifact.title || 'artifact'}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

/**
 * Download the current artifact (as PDF)
 */
export const downloadArtifact = async (artifact: any) => {
  const pdfBlob = await generatePDF(artifact);
  if (pdfBlob) {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.title || 'artifact'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback to JSON if PDF fails
    saveArtifact(artifact);
  }
};
