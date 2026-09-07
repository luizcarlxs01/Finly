// Compõe os PNGs 1024x1024 que o flutter_launcher_icons consome, a partir da
// logo do Finly (assets/finly_logo.png, fundo transparente).
//
//   dart run tool/gen_icon.dart
//
// Gera:
//   assets/generated/finly_icon.png            — logo sobre o azul Finly (ícone legado / iOS)
//   assets/generated/finly_icon_foreground.png — logo transparente, com folga p/ adaptive icon
import 'dart:io';

import 'package:image/image.dart' as img;

img.Image _canvas(int size, {img.Color? fill}) {
  final c = img.Image(width: size, height: size, numChannels: 4);
  if (fill != null) img.fill(c, color: fill);
  return c;
}

/// Desenha [logo] centralizado em [canvas] ocupando [scale] da largura.
void _placeCentered(img.Image canvas, img.Image logo, double scale) {
  final target = (canvas.width * scale).round();
  final resized = img.copyResize(
    logo,
    width: target,
    height: target,
    interpolation: img.Interpolation.cubic,
  );
  final dx = ((canvas.width - resized.width) / 2).round();
  final dy = ((canvas.height - resized.height) / 2).round();
  img.compositeImage(canvas, resized, dstX: dx, dstY: dy);
}

void main() {
  final src = File('assets/finly_logo.png');
  if (!src.existsSync()) {
    stderr.writeln('assets/finly_logo.png não encontrado');
    exit(1);
  }
  final logo = img.decodePng(src.readAsBytesSync());
  if (logo == null) {
    stderr.writeln('falha ao decodificar assets/finly_logo.png');
    exit(1);
  }

  Directory('assets/generated').createSync(recursive: true);

  // Ícone principal: logo sobre o azul escuro da marca (#0B275E).
  final icon = _canvas(1024, fill: img.ColorRgb8(0x0B, 0x27, 0x5E));
  _placeCentered(icon, logo, 0.66);
  File('assets/generated/finly_icon.png').writeAsBytesSync(img.encodePng(icon));

  // Foreground do adaptive icon: transparente. O ic_launcher.xml ainda aplica
  // um inset de 16%, então 0.80 aqui → ~0.54 do viewport (dentro da safe zone).
  final fg = _canvas(1024);
  _placeCentered(fg, logo, 0.80);
  File('assets/generated/finly_icon_foreground.png')
      .writeAsBytesSync(img.encodePng(fg));

  // Logo para a splash nativa — transparente e COM folga, para o círculo da
  // splash do Android 12 não cortar as pontas do "F".
  final splash = _canvas(960);
  _placeCentered(splash, logo, 0.46);
  File('assets/generated/finly_splash.png')
      .writeAsBytesSync(img.encodePng(splash));

  stdout.writeln(
      'ok: finly_icon.png + finly_icon_foreground.png + finly_splash.png');
}
