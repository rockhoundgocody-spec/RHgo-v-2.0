export function withSessionTimeout(promise, timeoutMs = 6000) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('The session check timed out. Please retry.');
      error.code = 'session_timeout';
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}