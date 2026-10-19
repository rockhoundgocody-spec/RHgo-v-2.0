export default async function voiceTimeout(request, ms = 30000) {
  let timer;
  try {
    return await Promise.race([request, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Conversation timed out')), ms); })]);
  } finally { clearTimeout(timer); }
}