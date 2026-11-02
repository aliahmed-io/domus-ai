export interface ModelRequest {
  prompt: string;
  image?: string | undefined;
}
export interface ModelResult {
  output: string;
  fallback: boolean;
  message?: string | undefined;
}
interface Job {
  status?: string;
  output?: string;
  pollUrl?: string;
  fallback?: boolean;
  message?: string | undefined;
}
/** All model entry points wait for the same terminal result. A pending job is never an asset. */
export async function requestModel(
  input: ModelRequest,
  options: {
    signal?: AbortSignal;
    onStatus?: (message: string) => void;
    fetcher?: typeof fetch;
    delay?: (signal?: AbortSignal) => Promise<void>;
    attempts?: number;
  } = {},
): Promise<ModelResult> {
  options.signal?.throwIfAborted();
  const fetcher = options.fetcher ?? fetch;
  const delay =
    options.delay ??
    ((signal) =>
      new Promise<void>((resolve, reject) => {
        const abort = () => {
          clearTimeout(timer);
          reject(new DOMException("Request canceled.", "AbortError"));
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", abort);
          resolve();
        }, 2000);
        if (signal?.aborted) abort();
        else signal?.addEventListener("abort", abort, { once: true });
      }));
  const read = async (response: Response): Promise<Job> => {
    const body = await response.json();
    if (!response.ok || !body.ok)
      throw new Error(
        body.error || "The model request failed. No asset was added.",
      );
    return body.data;
  };
  options.onStatus?.("Finding a model…");
  const job = await read(
    await fetcher("/api/generate-3d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, catalogOnly: !input.image }),
      signal: options.signal ?? null,
    }),
  );
  const finish = (value: Job): ModelResult => {
    if (
      typeof value.output !== "string" ||
      (!value.output.startsWith("/models/") &&
        !/^https:\/\/.+\.glb(?:[?#].*)?$/i.test(value.output))
    )
      throw new Error("The service did not return a supported model file.");
    return {
      output: value.output,
      fallback: Boolean(value.fallback),
      message: value.message,
    };
  };
  if (job.output && (job.fallback || job.status === "succeeded"))
    return finish(job);
  if (!job.pollUrl?.startsWith("/api/generate-3d/"))
    throw new Error("No finished model or valid job link was returned.");
  for (let i = 0; i < (options.attempts ?? 120); i++) {
    const result = await read(
      await fetcher(job.pollUrl, { signal: options.signal ?? null }),
    );
    if (result.status === "failed" || result.status === "canceled")
      throw new Error("Model generation did not complete. No asset was added.");
    if (result.status === "succeeded") return finish(result);
    options.onStatus?.("The model is still processing…");
    await delay(options.signal);
  }
  throw new Error(
    "The model is taking too long. No sample was substituted. The provider job may still be running.",
  );
}
