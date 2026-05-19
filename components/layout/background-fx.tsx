/**
 * Aurora gradient mesh — four drifting radial bloom layers behind everything.
 * Built with CSS only (see globals.css `.aurora-mesh`). Auto-tones for dark
 * mode and respects prefers-reduced-motion.
 *
 * The two extra <span> children pair with the ::before / ::after on the
 * wrapper to give four animated layers in total (purple, blue, pink, mint).
 */
export function BackgroundFx() {
  return (
    <div aria-hidden className="aurora-mesh">
      <span />
      <span />
    </div>
  );
}
