export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"
export const WS_URL = BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://")
