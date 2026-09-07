#!/usr/bin/env bash
# Importa as 8 faixas do álbum Déclic a partir da pasta Downloads (ou outra).
# Uso: bash scripts/import-album-tracks.sh "c:/Users/SUPORTE/Downloads"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-}"
DEST="$ROOT/server/private/digital/musicas-neuroconectivas"

if [[ -z "$SRC" ]]; then
  echo "Uso: bash scripts/import-album-tracks.sh <pasta-com-os-mp3>" >&2
  exit 1
fi

if [[ ! -d "$SRC" ]]; then
  echo "Pasta não encontrada: $SRC" >&2
  exit 1
fi

mkdir -p "$DEST"

# origem (nome aproximado no PC) : destino no repositório
pairs=(
  "Beleza da Alma Voltou a Cantar 2:01-beleza-da-alma-voltou-a-cantar.mp3"
  "Beleza da Alma Voltou a Cantar:01-beleza-da-alma-voltou-a-cantar.mp3"
  "A música é a Chave:02-a-musica-e-a-chave.mp3"
  "A música é a Chave:02-a-musica-e-a-chave.mp3"
  "É preciso união:03-e-preciso-uniao.mp3"
  "É preciso união:03-e-preciso-uniao.mp3"
  "Eu me perdoo:04-eu-me-perdoo.mp3"
  "Déclic:05-declic.mp3"
  "Declic:05-declic.mp3"
  "Délclic:05-declic.mp3"
  "Fluxo da Vida Fluir Dentro de mim 2:06-fluxo-da-vida-fluir-dentro-de-mim.mp3"
  "Fluxo da Vida Fluir Dentro de mim:06-fluxo-da-vida-fluir-dentro-de-mim.mp3"
  "Expresse sua arte:07-expresse-sua-arte.mp3"
  "A alma canta:08-a-alma-canta.mp3"
)

find_source() {
  local needle="$1"
  local f base lower needle_lower
  needle_lower="$(echo "$needle" | tr '[:upper:]' '[:lower:]')"
  while IFS= read -r -d '' f; do
    base="$(basename "$f")"
    lower="$(echo "$base" | tr '[:upper:]' '[:lower:]')"
    if [[ "$lower" == *"${needle_lower}"* ]]; then
      printf '%s' "$f"
      return 0
    fi
  done < <(find "$SRC" -maxdepth 1 -type f \( -iname '*.mp3' -o -iname '*.mpeg' -o -iname '*.mp3.mpeg' \) -print0)
  return 1
}

convert_to_mp3() {
  local in="$1" out="$2"
  if ! command -v ffmpeg >/dev/null; then
    echo "ffmpeg é necessário para converter $in" >&2
    exit 1
  fi
  ffmpeg -y -i "$in" -map 0:a -codec:a libmp3lame -b:a 192k -map_metadata -1 "$out"
}

declare -A done=()
for item in "${pairs[@]}"; do
  needle="${item%%:*}"
  dest_name="${item##*:}"
  [[ -n "${done[$dest_name]:-}" ]] && continue
  src="$(find_source "$needle" || true)"
  if [[ -z "$src" ]]; then
    if [[ -f "$DEST/$dest_name" ]]; then
      echo "já existe: $dest_name (origem não encontrada para '$needle')"
      done[$dest_name]=1
      continue
    fi
    echo "Não achei arquivo para: $needle" >&2
    exit 1
  fi
  out="$DEST/$dest_name"
  echo "→ $dest_name  ←  $(basename "$src")"
  convert_to_mp3 "$src" "$out"
  done[$dest_name]=1
done

expected=(
  "01-beleza-da-alma-voltou-a-cantar.mp3"
  "02-a-musica-e-a-chave.mp3"
  "03-e-preciso-uniao.mp3"
  "04-eu-me-perdoo.mp3"
  "05-declic.mp3"
  "06-fluxo-da-vida-fluir-dentro-de-mim.mp3"
  "07-expresse-sua-arte.mp3"
  "08-a-alma-canta.mp3"
)
for f in "${expected[@]}"; do
  [[ -f "$DEST/$f" ]] || { echo "Falta $DEST/$f" >&2; exit 1; }
done

echo ""
echo "OK: 8 faixas em $DEST"
echo "Próximo passo: bash scripts/make-album-previews.sh"
