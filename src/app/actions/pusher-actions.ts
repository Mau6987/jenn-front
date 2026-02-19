"use server"

export async function getPusherConfig() {
  return {
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
  }
}
