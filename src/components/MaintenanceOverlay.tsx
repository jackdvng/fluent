"use client";

import { isMaintenanceMode } from "@/lib/maintenance";

export default function MaintenanceOverlay() {
  if (!isMaintenanceMode()) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-8 text-center shadow-[0_20px_50px_rgba(202,40,81,0.25)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Fluent"
          className="mx-auto mb-4 h-14 w-auto"
          style={{ filter: "drop-shadow(0 0 20px rgba(255, 103, 102, 0.3))" }}
        />
        <p className="text-4xl">🛠️</p>
        <h2
          id="maintenance-title"
          className="mt-4 text-2xl font-extrabold text-heading"
        >
          Fluent đang được nâng cấp
        </h2>
        <p className="mt-3 text-base leading-7 text-body">
          Mình đang tạm dừng ứng dụng một chút để cập nhật và cải thiện Fluent.
          Bạn quay lại sau ít phút nhé — cảm ơn bạn đã kiên nhẫn! 💛
        </p>
      </div>
    </div>
  );
}
