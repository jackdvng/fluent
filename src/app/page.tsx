import LessonGenerator from "@/components/LessonGenerator";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";

export default function Home() {
  return (
    <main className="min-h-full bg-background">
      <MaintenanceOverlay />
      <LessonGenerator />
    </main>
  );
}
