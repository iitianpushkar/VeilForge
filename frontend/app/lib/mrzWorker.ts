export function initworker(
  onParsed: (parsed: any) => void
) {
  const worker = new Worker(
    "/mrz-scanner/dist/js/mrz-worker.bundle-min.js",
    { type: "classic" }
  );

  worker.onmessage = (e) => {
    if (e.data?.type === "result") {
      onParsed(e.data.result.parsed);
    }
  };

  worker.onerror = (e) => {
    console.error("worker error:", e);
  };

  return worker;
}
