import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import CinematicScroll from "@/components/CinematicScroll";
import Marquee from "@/components/Marquee";
import Work from "@/components/Work";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main id="top">
      <SmoothScroll />
      <Nav />
      <CinematicScroll />
      {/* Band between the cinematic and the archive — gives the eye somewhere
          to land as the pinned sequence releases. */}
      <Marquee />
      <Work />
      <Contact />
    </main>
  );
}
