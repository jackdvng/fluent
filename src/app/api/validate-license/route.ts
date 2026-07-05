import { NextResponse } from "next/server";

interface LemonSqueezyValidateResponse {
  valid?: boolean;
  error?: string | null;
  license_key?: {
    status?: string;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { licenseKey?: string };
    const licenseKey = body.licenseKey?.trim();

    if (!licenseKey) {
      return NextResponse.json(
        { valid: false, error: "Vui lòng nhập mã ủng hộ." },
        { status: 400 },
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(
      "https://api.lemonsqueezy.com/v1/licenses/validate",
      {
        method: "POST",
        headers,
        body: new URLSearchParams({ license_key: licenseKey }).toString(),
      },
    );

    const data = (await response
      .json()
      .catch(() => null)) as LemonSqueezyValidateResponse | null;

    if (!data) {
      return NextResponse.json(
        { valid: false, error: "Không thể kết nối tới máy chủ xác thực." },
        { status: 502 },
      );
    }

    if (data.valid) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json(
      {
        valid: false,
        error: data.error ?? "Mã không hợp lệ hoặc đã hết hạn.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[validate-license] Failed:", error);
    return NextResponse.json(
      { valid: false, error: "Đã xảy ra lỗi khi xác thực mã." },
      { status: 500 },
    );
  }
}
