import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    title: "Support 9Router",
    message:
      "If 9Router helps your work, consider supporting development. Every contribution keeps the project alive and growing. Thank you! ❤️",
    channels: [
      {
        id: "kofi",
        label: "Ko-fi",
        description: "Buy me a coffee — international friendly",
        icon: "local_cafe",
        color: "#FF5E5B",
        url: "https://ko-fi.com/decolua",
        qr: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://ko-fi.com/decolua",
      },
      {
        id: "paypal",
        label: "PayPal",
        description: "Direct transfer via PayPal.Me",
        icon: "payments",
        color: "#0070BA",
        url: "https://paypal.me/decolua",
        qr: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://paypal.me/decolua",
      },
      {
        id: "pay",
        label: "Pay",
        description: "Scan QR with any UPI / payment app",
        icon: "qr_code_2",
        color: "#A50064",
        qr: "/images/pay.jpeg",
      },
    ],
  });
}
