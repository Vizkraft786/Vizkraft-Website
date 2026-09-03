import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import CinematicScroll from "@/components/CinematicScroll";
import Work from "@/components/Work";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main id="top">
      <SmoothScroll />
      <Nav />
      <CinematicScroll />
      <Work />
      <Contact />
    </main>
  );
}
