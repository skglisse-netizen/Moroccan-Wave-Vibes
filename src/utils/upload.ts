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
      const data = await response.json();
      if (window.confirm(data.message || "Ce fichier existe déjà. Voulez-vous l'écraser ?")) {
        return uploadMedia(file, type, true);
      }
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de l'upload");
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    alert(error instanceof Error ? error.message : "Erreur lors de l'upload");
    return null;
  }
}
