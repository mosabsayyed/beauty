

/**
 * Utility functions for Canvas Header Actions
 */

/**
 * Share the current artifact
 */
export const shareArtifact = async (artifact: any) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: artifact.title || 'Shared Artifact',
        text: artifact.description || 'Check out this artifact',
        url: window.location.href,
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
export const printArtifact = () => {
  window.print();
};

/**
 * Save the current artifact (as JSON)
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
 * Download the current artifact (format depends on type)
 */
export const downloadArtifact = (artifact: any) => {
  // For now, default to JSON save. 
  // Future: Implement CSV for tables, PNG for charts, etc.
  saveArtifact(artifact);
};
