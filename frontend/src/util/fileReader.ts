export function readBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const bytesBase64 = dataUrl.split(",", 2)[1];
            resolve(bytesBase64);
        };
        reader.readAsDataURL(blob);
    });
}
