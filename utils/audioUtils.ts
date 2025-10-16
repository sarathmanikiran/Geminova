export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export function pcmToWav(pcmData: ArrayBuffer, sampleRate: number): Blob {
    const pcm16 = new Int16Array(pcmData);
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    // RIFF identifier
    view.setUint32(0, 1380533830, false); // "RIFF"
    // file length
    view.setUint32(4, 36 + pcm16.length * 2, true);
    // RIFF type
    view.setUint32(8, 1463899717, false); // "WAVE"
    // format chunk identifier
    view.setUint32(12, 1718449184, false); // "fmt "
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    view.setUint32(36, 1684108385, false); // "data"
    // data chunk length
    view.setUint32(40, pcm16.length * 2, true);

    return new Blob([wavHeader, pcm16], { type: 'audio/wav' });
}