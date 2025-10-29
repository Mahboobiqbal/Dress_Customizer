import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import { DressSVG } from "../utils/dressGenerator.jsx";
import girlPicture from "../assets/girlpicture.png";

export default function Landing() {
  const samples = [
    {
      name: "Blush Lace Gown",
      params: {
        color: "currentColor",
        pattern: "lace",
        sleeveLength: 80,
        neckline: "v-neck",
        trainLength: 80,
        texture: "satin",
        textureIntensity: 50,
        skirtVolume: 80,
      },
    },
    {
      name: "Emerald Velvet",
      params: {
        color: "currentColor",
        pattern: "solid",
        sleeveLength: 30,
        neckline: "off-shoulder",
        trainLength: 40,
        texture: "velvet",
        textureIntensity: 55,
        skirtVolume: 60,
      },
    },
    {
      name: "Minimal Silk",
      params: {
        color: "currentColor",
        pattern: "solid",
        sleeveLength: 0,
        neckline: "halter",
        trainLength: 10,
        texture: "silk",
        textureIntensity: 30,
        skirtVolume: 35,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#222831] text-[#EEEEEE]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="pt-14 pb-16 lg:pt-20 lg:pb-24 relative">
          <BackgroundSparkle />
          <div className="grid lg:grid-cols-10 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A25A] bg-[#31363F]/70 backdrop-blur px-3 py-1 text-xs font-medium text-[#EEEEEE] shadow-sm">
                New • AI Dress Customizer
              </div>
              <h1 className="mt-3 text-4xl/tight sm:text-5xl/tight font-semibold tracking-tight font-['Playfair_Display']">
                Turn ideas into elegant fashion mock‑ups in seconds
              </h1>
              <p className="mt-4 text-[#BDBDBD] text-lg">
                Describe the color, pattern, sleeves, neckline and fabric. Get a
                refined, editable vector preview you can tweak and export.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/studio"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#76ABAE] text-[#222831] px-5 py-3 font-medium shadow hover:bg-[#5E9396]"
                >
                  Launch Studio <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#C5A25A] px-5 py-3 hover:bg-[#C5A25A]/20"
                >
                  Explore features
                </a>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-[#BDBDBD]">
                <span className="inline-flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#C5A25A]" /> Loved by designers
                </span>
                <span>Private • 100% browser • Export SVG/PNG</span>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="rounded-2xl p-px bg-linear-to-br from-[#C5A25A] to-[#76ABAE33] shadow-sm">
                <div className="rounded-2xl border border-[#C5A25A] p-4 bg-[#31363F]/80 backdrop-blur">
                  <div className="aspect-5/7 w-full bg-[#31363F] rounded-lg overflow-hidden">
                    <img
                      src={girlPicture}
                      alt="Elegant dress inspiration"
                      className=" w-full object-cover"
                      loading="eager"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-12 lg:py-16">
          <h2 className="text-2xl font-semibold font-['Playfair_Display']">
            Crafted for fashion creatives
          </h2>
          <p className="mt-2 text-[#BDBDBD]">
            Everything you need to ideate, iterate and share.
          </p>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              title="Prompt to design"
              desc="Describe a dress in plain English and get a clean, editable mock‑up."
            >
              <Wand className="w-5 h-5 text-[#76ABAE]" />
            </FeatureCard>
            <FeatureCard
              title="Rich customization"
              desc="Adjust color, pattern, sleeves, neckline, train, texture, and volume."
            >
              <Sliders className="w-5 h-5 text-[#76ABAE]" />
            </FeatureCard>
            <FeatureCard
              title="Save & compare"
              desc="Capture variants with thumbnails; switch styles in one click."
            >
              <Layers className="w-5 h-5 text-[#76ABAE]" />
            </FeatureCard>
            <FeatureCard
              title="Vector export"
              desc="Export crisp SVG or ready‑to‑share PNG with one tap."
            >
              <Export className="w-5 h-5 text-[#76ABAE]" />
            </FeatureCard>
            <FeatureCard
              title="Fast & private"
              desc="Everything runs locally in your browser—no uploads required."
            >
              <Bolt className="w-5 h-5 text-[#76ABAE]" />
            </FeatureCard>
            <FeatureCard
              title="Polished visuals"
              desc="Tasteful palettes and gentle shading for high‑end presentation."
            >
              <Moon className="w-5 h-5 text-[#76ABAE]" />
            </FeatureCard>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 lg:py-16">
          <h2 className="text-2xl font-semibold font-['Playfair_Display']">
            How it works
          </h2>
          <ol className="mt-6 grid md:grid-cols-3 gap-5">
            <Step n={1} title="Describe">
              Type your idea: “Emerald velvet ballgown with off‑shoulder
              neckline and long train.”
            </Step>
            <Step n={2} title="Refine">
              Tweak color, sleeves, pattern, and fabric. Save variants to
              compare.
            </Step>
            <Step n={3} title="Export">
              Download as SVG or PNG for presentations or hand‑offs.
            </Step>
          </ol>
        </section>

        {/* Gallery */}
        <section className="py-12 lg:py-16">
          <h2 className="text-2xl font-semibold font-['Playfair_Display']">
            Inspiration gallery
          </h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {samples.map((s) => (
              <div
                key={s.name}
                className="group rounded-2xl p-px bg-linear-to-br from-[#C5A25A] to-[#76ABAE33] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="rounded-2xl border border-[#31363F] p-3 bg-[#31363F]/70">
                  <div className="aspect-5/7 grid place-items-center bg-[#31363F] rounded-lg overflow-hidden text-[#76ABAE]">
                    <DressSVG params={s.params} />
                  </div>
                  <div className="mt-2 text-sm text-[#BDBDBD]">{s.name}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/studio"
              className="inline-flex items-center gap-2 rounded-lg bg-[#76ABAE] text-[#222831] px-5 py-3 font-medium shadow hover:bg-[#5E9396]"
            >
              Start designing now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-sm text-[#BDBDBD] border-t border-[#31363F]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>© {new Date().getFullYear()} Dress Customizer</div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Mahboobiqbal/Dress_Customizer"
                target="_blank"
                className="hover:text-[#EEEEEE]"
              >
                GitHub
              </a>
              <Link to="/studio" className="hover:text-[#EEEEEE]">
                Studio
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ title, desc, children }) {
  return (
    <div className="rounded-xl border border-[#31363F] p-4 bg-[#31363F]/70 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 text-[#EEEEEE]">
        {children}
        <span className="font-medium">{title}</span>
      </div>
      <p className="mt-2 text-[#BDBDBD] text-sm">{desc}</p>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <li className="rounded-xl border border-[#31363F] p-4 bg-[#31363F]/70 backdrop-blur shadow-sm">
      <div className="text-xs text-[#BDBDBD] flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#C5A25A]/30 text-[#EEEEEE] font-medium">
          {n}
        </span>
        Step {n}
      </div>
      <div className="mt-1 font-medium">{title}</div>
      <p className="mt-1 text-sm text-[#BDBDBD]">{children}</p>
    </li>
  );
}

function ArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function Wand(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M6 19 19 6l-1-1L5 18l1 1Z" />
      <path d="M15 6l3 3" />
    </svg>
  );
}
function Sliders(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M21 4H14" />
      <path d="M10 4H3" />
      <circle cx="12" cy="4" r="2" />
      <path d="M21 12h-7" />
      <path d="M7 12H3" />
      <circle cx="9" cy="12" r="2" />
      <path d="M21 20h-3" />
      <path d="M9 20H3" />
      <circle cx="15" cy="20" r="2" />
    </svg>
  );
}
function Layers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}
function Export(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}
function Bolt(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="m13 2-8 14h7l-1 6 8-14h-7l1-6Z" />
    </svg>
  );
}
function Moon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

function BackgroundSparkle() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-linear-to-br from-[#76ABAE]/40 to-[#C5A25A]/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-linear-to-tr from-[#C5A25A]/40 to-[#76ABAE]/20 blur-3xl" />
    </div>
  );
}

function Star(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z" />
    </svg>
  );
}
