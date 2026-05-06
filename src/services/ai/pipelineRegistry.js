const pipelines = {};

export function registerPipeline(taskName, handler) {
  pipelines[taskName] = handler;
}

export async function runPipeline(taskName, input, options = {}) {
  const handler = pipelines[taskName];

  if (!handler) {
    throw new Error(`Pipeline not registered: ${taskName}`);
  }

  const startedAt = Date.now();

  try {
    const result = await handler(input, options);

    return {
      ...result,
      pipelineMeta: {
        taskName,
        durationMs: Date.now() - startedAt,
        mode: options.mode || input.mode || 'default',
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      task: taskName,
      status: 'failed',
      error: error.message,
      pipelineMeta: {
        taskName,
        durationMs: Date.now() - startedAt,
        generatedAt: new Date().toISOString()
      }
    };
  }
}