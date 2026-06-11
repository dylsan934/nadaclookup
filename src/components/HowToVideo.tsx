import { useRef, useState } from "react";
import { Play } from "lucide-react";

interface HowToVideoProps {
  src: string;
  poster: string;
  title?: string;
  subtitle?: string;
}

export const HowToVideo = ({
  src,
  poster,
  title = "How to look up a NADAC price",
  subtitle = "A 20-second walkthrough",
}: HowToVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    videoRef.current?.play();
    setPlaying(true);
  };

  return (
    <section className="my-10 md:my-14">
      <div className="text-center mb-4 md:mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/60 bg-card aspect-video max-w-3xl mx-auto">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          controls={playing}
          onEnded={() => setPlaying(false)}
          className="w-full h-full object-cover"
        />
        {!playing && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label="Play how-to video"
            className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors group"
          >
            <span className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary text-primary-foreground shadow-xl group-hover:scale-105 transition-transform">
              <Play className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" />
            </span>
          </button>
        )}
      </div>
    </section>
  );
};
