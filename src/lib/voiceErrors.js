export function voiceErrorMessage(code) {
  if (['not-allowed', 'service-not-allowed', 'NotAllowedError', 'SecurityError'].includes(code)) return 'Microphone access was denied. Allow it in browser settings, then tap the microphone to retry.';
  if (['audio-capture', 'NotFoundError', 'NotReadableError'].includes(code)) return 'No microphone is available. Check your microphone connection and tap to retry.';
  if (code === 'network') return 'Speech recognition lost its connection. Check your signal, then tap to retry.';
  return 'Voice input could not start. Tap the microphone to retry, or type your question.';
}