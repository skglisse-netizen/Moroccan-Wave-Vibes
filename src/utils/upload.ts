/**
 * Common utility for uploading media with existence check and overwrite confirmation.
 */
export async function uploadMedia(
  file: File, 
  type: 'image' | 'video' = 'image', 
  overwrite = false
): Promise<{ url: string; filename: string } | null> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const token = localStorage.getItem('auth_token');
  const url = `/api/upload/media${overwrite ? '?overwrite=true' : ''}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'include'
    });

    if (response.status === 409) {
      let msg = "Ce fichier existe déjà. Voulez-vous l'écraser ?";
      try {
        const data = await response.json();
        msg = data.message || msg;
      } catch { /* ignore parse error */ }
      if (window.confirm(msg)) {
        return uploadMedia(file, type, true);
      }
      return null;
    }

    if (!response.ok) {
      // Safely determine error message — server may return HTML (e.g. nginx 413/502)
      let errorMsg = `Erreur serveur (${response.status})`;
      if (response.status === 413) {
        errorMsg = "Fichier trop volumineux. Veuillez réduire la taille de l'image.";
      } else if (response.status === 401) {
        errorMsg = "Session expirée. Veuillez vous reconnecter.";
      } else if (response.status === 403) {
        errorMsg = "Vous n'avez pas la permission d'effectuer cette action.";
      } else {
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMsg = errorData.message || errorData.error || errorMsg;
          }
          // If HTML (e.g. nginx error page), keep the user-friendly errorMsg above
        } catch { /* ignore parse error, keep generic message */ }
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    alert(error instanceof Error ? error.message : "Erreur lors de l'upload");
    return null;
  }
}
