import type { AzureSettings } from '../types';

function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

export const uploadImageToAzure = async (
    base64Data: string,
    mimeType: string,
    settings: AzureSettings
): Promise<string> => {
    if (!settings || !settings.storageUrl || !settings.container || !settings.token) {
        throw new Error("Azure CDN settings are not configured.");
    }
    
    const blob = base64ToBlob(base64Data, mimeType);
    const extension = mimeType.split('/')[1] || 'jpg';
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const folder = 'product-images';

    const filePath = `${folder}/${fileName}`;

    const uploadUrl = `${settings.storageUrl}/${settings.container}/${filePath}${settings.token}`;

    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': mimeType,
        },
        body: blob,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CDN upload failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
    }

    const publicUrl = `${settings.storageUrl}/${settings.container}/${filePath}`;
    return publicUrl;
};
