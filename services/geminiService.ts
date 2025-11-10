
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";

let ai: GoogleGenAI;
let sessionPromise: Promise<LiveSession> | null = null;

let inputAudioContext: AudioContext;
let outputAudioContext: AudioContext;
let scriptProcessor: ScriptProcessorNode;
let mediaStream: MediaStream;
let mediaStreamSource: MediaStreamAudioSourceNode;

let currentInputTranscription = '';
let currentOutputTranscription = '';
let nextStartTime = 0;
const audioSources = new Set<AudioBufferSourceNode>();

interface Callbacks {
    onConnect: () => void;
    onDisconnect: () => void;
    onError: (error: any) => void;
    onTranscriptionUpdate: (update: { user: string; agent: string; isFinal: boolean }) => void;
}

// --- Audio Encoding/Decoding Helpers ---

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


// --- Session Management ---

export async function startSession(callbacks: Callbacks) {
    if (sessionPromise) {
        console.warn("Session already started.");
        return;
    }

    try {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    
                    mediaStreamSource = inputAudioContext.createMediaStreamSource(mediaStream);
                    scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if (sessionPromise) {
                           sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    
                    mediaStreamSource.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);
                    callbacks.onConnect();
                },
                onmessage: async (message: LiveServerMessage) => {
                    handleServerMessage(message, callbacks);
                },
                onerror: (e: ErrorEvent) => {
                    console.error("Session error:", e);
                    callbacks.onError(e);
                    closeSession();
                },
                onclose: (e: CloseEvent) => {
                    callbacks.onDisconnect();
                    cleanup();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
        });

    } catch (error) {
        console.error("Failed to start session:", error);
        callbacks.onError(error);
    }
}

async function handleServerMessage(message: LiveServerMessage, callbacks: Callbacks) {
    if (message.serverContent?.outputTranscription) {
        const text = message.serverContent.outputTranscription.text;
        currentOutputTranscription += text;
    } else if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        currentInputTranscription += text;
    }
    
    callbacks.onTranscriptionUpdate({
        user: currentInputTranscription,
        agent: currentOutputTranscription,
        isFinal: false
    });

    if (message.serverContent?.turnComplete) {
        callbacks.onTranscriptionUpdate({
            user: currentInputTranscription,
            agent: currentOutputTranscription,
            isFinal: true
        });
        currentInputTranscription = '';
        currentOutputTranscription = '';
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio) {
        nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.addEventListener('ended', () => {
            audioSources.delete(source);
        });
        source.start(nextStartTime);
        nextStartTime += audioBuffer.duration;
        audioSources.add(source);
    }
}

export function closeSession() {
    if (sessionPromise) {
        sessionPromise.then(session => {
            session.close();
            sessionPromise = null;
        }).catch(err => {
            console.error("Error closing session:", err);
            sessionPromise = null;
        });
    }
    cleanup();
}

function cleanup() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    if (scriptProcessor) {
        scriptProcessor.disconnect();
    }
    if (mediaStreamSource) {
        mediaStreamSource.disconnect();
    }
    if (inputAudioContext && inputAudioContext.state !== 'closed') {
        inputAudioContext.close();
    }
    if (outputAudioContext && outputAudioContext.state !== 'closed') {
        outputAudioContext.close();
    }
    audioSources.forEach(source => source.stop());
    audioSources.clear();
    nextStartTime = 0;
    currentInputTranscription = '';
    currentOutputTranscription = '';
}
