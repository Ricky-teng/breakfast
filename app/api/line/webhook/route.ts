import { NextRequest, NextResponse } from "next/server";
import { messagingApi, validateSignature, webhook } from "@line/bot-sdk";
import { prisma } from "@/lib/prisma";

const channelSecret = process.env.LINE_CHANNEL_SECRET ?? "";
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "";

const client = new messagingApi.MessagingApiClient({ channelAccessToken });

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  if (!channelSecret || !validateSignature(body, channelSecret, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const { events } = JSON.parse(body) as { events: webhook.Event[] };

  for (const event of events) {
    if (
      event.type !== "message" ||
      event.message.type !== "text" ||
      event.source?.type !== "user"
    ) {
      continue;
    }

    const userId = event.source.userId;
    if (!userId) continue;

    let displayName = userId;
    try {
      const profile = await client.getProfile(userId);
      displayName = profile.displayName;
    } catch {
      // 抓不到暱稱(例如客人封鎖了官方帳號)就退回用 userId 顯示
    }

    await prisma.message.create({
      data: {
        lineUserId: userId,
        displayName,
        text: event.message.text,
        receivedAt: new Date(event.timestamp),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
