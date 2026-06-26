import {
  Mail,
  Phone,
  Instagram,
  Facebook,
  MessageCircle,
  ExternalLink,
  Code2,
  Heart,
} from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black">
      <div className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-pink-500/10 blur-[70px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-40 w-40 rounded-full bg-violet-500/10 blur-[70px]" />

      <div className="section-padding relative z-10 py-5">
        <div className="container-max">
          {/* Main Compact Footer */}
          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl lg:grid-cols-2">
            {/* Shop Details */}
            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-pink-300">
                Shop Details
              </h3>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <a
                  href="tel:+94755599333"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  <Phone size={15} className="text-pink-300" />
                  +94 75 559 9333
                </a>

                <a
                  href="mailto:adravgconsole@gmail.com"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  <Mail size={15} className="text-pink-300" />
                  <span className="break-all">adravgconsole@gmail.com</span>
                </a>

                <a
                  href="https://wa.me/94755599333"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  <MessageCircle size={15} className="text-pink-300" />
                  WhatsApp
                </a>

                <a
                  href="https://www.instagram.com/adra_vgc"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  <Instagram size={15} className="text-pink-300" />
                  @adra_vgc
                </a>

                <a
                  href="https://www.facebook.com/search/top?q=adra%20gift%20console"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white sm:col-span-2"
                >
                  <Facebook size={15} className="text-pink-300" />
                  ADRA Gift Console
                </a>
              </div>
            </div>

            {/* Developer Details */}
            <div className="border-t border-white/10 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-pink-300">
                <Code2 size={15} />
                Developer
              </h3>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <a
                  href="https://wa.me/94752529614"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  <MessageCircle size={15} className="text-pink-300" />
                  +94 75 252 9614
                </a>

                <a
                  href="https://portfolio.rifkhan.xyz"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  <ExternalLink size={15} className="text-pink-300" />
                  portfolio.rifkhan.xyz
                </a>
              </div>

              <p className="mt-3 text-xs leading-5 text-white/40">
                Modern responsive website with admin dashboard, DynamoDB backend,
                and AWS S3 upload support.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-3 flex flex-col gap-1 text-center text-xs text-white/40 md:flex-row md:items-center md:justify-between md:text-left">
            <p>© {year} ADRA Photography & Events. All rights reserved.</p>

            <p className="flex items-center justify-center gap-1 md:justify-end">
              Made with <Heart size={13} className="text-pink-300" /> by{' '}
              <a
                href="https://portfolio.rifkhan.xyz"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-pink-300 transition hover:text-white"
              >
                Rifkhan
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}