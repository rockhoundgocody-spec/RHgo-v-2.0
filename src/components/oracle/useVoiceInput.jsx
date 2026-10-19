import useRecorderTranscription from '@/components/oracle/useRecorderTranscription';
import { useSpeechRecognition } from './useSpeech';

/**
 * useVoiceInput — unified voice input for the orb.
 * Uses native SpeechRecognition where available (Chrome/Android).
 * Falls back to MediaRecorder + Whisper transcription on browsers
 * without SpeechRecognition (iOS Safari / PWA).
 * Same interface as useSpeechRecognition: { start, stop, listening, supported }.
 */


export default function useVoiceInput(opts) {
  const srSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const sr       = useSpeechRecognition(opts);
  const recorder = useRecorderTranscription(opts);

  return srSupported ? sr : recorder;
}