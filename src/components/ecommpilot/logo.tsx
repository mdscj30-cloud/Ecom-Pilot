import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function Logo({ className }: { className?: string }) {
  const logoImage = PlaceHolderImages.find((img) => img.id === "app-logo");

  if (!logoImage) {
    // Fallback to a simple div if the image isn't found
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        className
      )}
    >
      <Image
        src={logoImage.imageUrl}
        alt={logoImage.description}
        data-ai-hint={logoImage.imageHint}
        fill
        className="object-contain"
      />
    </div>
  );
}
