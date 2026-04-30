/** Returns the public URL for a Pixie stage image.
 *  Expected files: public/pixie/{species}/pixie-{species}-stage-{1-5}.png
 *  Falls back to emoji in CompanionDisplay if the file is missing (onError handler). */
export function getPixieImagePath(species: string, stage: number): string {
  return `/pixie/${species}/pixie-${species}-stage-${stage}.png`
}
