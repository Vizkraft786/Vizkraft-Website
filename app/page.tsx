import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import CinematicScroll from "@/components/CinematicScroll";
import Work from "@/components/Work";
import Team from "@/components/Team";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main id="top">
      <SmoothScroll />
      <Nav />
      <CinematicScroll />
      <Work />
      <Team />
      <Contact />
      <Footer />
    </main>
  );
}
