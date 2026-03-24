export async function loadFonts() {
  const faces = [
    new FontFace('Serrif VF', 'url(/SerrifVF.ttf)'),
    new FontFace('Saans', 'url(/Saans-Regular.ttf)', { weight: '400' }),
    new FontFace('Saans', 'url(/Saans-Medium.ttf)', { weight: '500' }),
    new FontFace('Saans', 'url(/Saans-SemiBold.ttf)', { weight: '600' }),
    new FontFace('Saans', 'url(/Saans-Bold.ttf)', { weight: '700' }),
    new FontFace('Saans Mono', 'url(/SaansMono-Medium.ttf)', { weight: '500' }),
    new FontFace('Floralia', 'url(/Floralia.ttf)'),
  ]
  await Promise.all(faces.map(async f => { await f.load(); document.fonts.add(f) }))
}
