import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import logoIcon from "@/assets/logo-icon.png";
import { CameraIcon, SparkIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/cn";

const slides: { art: ReactNode; title: string; body: string }[] = [
  {
    art: <img src={logoIcon} alt="Stash" className="h-auto w-[88px]" />,
    title: "Just write.",
    body: "Keep your sales and stock in your notebook, exactly the way you already do. Stash doesn't ask you to change.",
  },
  {
    art: <CameraIcon size={72} className="text-primary" />,
    title: "Snap and send.",
    body: "At the end of the day, take one photo of your notebook page. That's the whole job.",
  },
  {
    art: <SparkIcon />,
    title: "Stash handles the rest.",
    body: 'Ask "How much did I make today?" or "What\'s running low?" any time. No spreadsheets, no forms.',
  },
];

export default function WelcomePage() {
  usePageTitle("Welcome");
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1;
  const slide = slides[current];

  const next = () => {
    if (isLast) navigate("/signup");
    else setCurrent((c) => c + 1);
  };

  return (
    <>
      <div>
        <div className="flex flex-1 flex-col items-center justify-center pb-6 text-center">
          <div className="mb-8 flex h-[180px] w-[180px] items-center justify-center rounded-[36px] bg-accent-tint">{slide.art}</div>
          <h1 className="mb-2.5 text-[22px] font-bold tracking-[-0.01em] text-ink">{slide.title}</h1>
          <p className="max-w-[280px] text-[14px] leading-normal text-muted">{slide.body}</p>
        </div>
      </div>

      <div className="my-[26px] flex justify-center gap-1.5" aria-label={`Slide ${current + 1} of ${slides.length}`}>
        {slides.map((_, i) => (
          <span key={i} className={cn("h-1.5 rounded-full", i === current ? "w-[18px] bg-primary" : "w-1.5 bg-border")} />
        ))}
      </div>

      <div className="pb-[26px]">
        <Button onClick={next}>{isLast ? "Get started" : "Continue"}</Button>
        <div className="mt-3.5 text-center">
          <Link to="/signup" className="text-[13px] font-semibold text-muted">
            Skip
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-2.5 mb-2 h-1 w-[120px] rounded-[3px] bg-ink opacity-[0.18]" />
    </>
  );
}
