#!/usr/bin/env bash
# Run when online to download Unsplash stock photos into public/images/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMG="$ROOT/public/images"
mkdir -p "$IMG/products" "$IMG/banners" "$IMG/categories" "$IMG/blog"

dl() { curl -fsSL "$2" -o "$1" && echo "OK $1"; }

dl "$IMG/products/omega-3-premium.jpg" "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&h=900&q=85"
dl "$IMG/products/hyaluronic-cream.jpg" "https://images.unsplash.com/photo-1570172619644-dfd03ed5d88b?auto=format&fit=crop&w=900&h=900&q=85"
dl "$IMG/products/vitamin-d3-2000.jpg" "https://images.unsplash.com/photo-1584308666744-24d5c474f30e?auto=format&fit=crop&w=900&h=900&q=85"
dl "$IMG/products/zinc-chelate.jpg" "https://images.unsplash.com/photo-1550572017-4a598001bfd0?auto=format&fit=crop&w=900&h=900&q=85"
dl "$IMG/products/melatonin-3mg.jpg" "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&h=900&q=85"
dl "$IMG/products/glucose-test-strips.jpg" "https://images.unsplash.com/photo-1579684385120-1e15a89ca8e2?auto=format&fit=crop&w=900&h=900&q=85"
dl "$IMG/products/daily-electrolyte.jpg" "https://images.unsplash.com/photo-1548839140-29a7491ee417?auto=format&fit=crop&w=900&h=900&q=85"
dl "$IMG/products/probiotic-30b.jpg" "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&h=900&q=85"
dl "$IMG/hero-home.jpg" "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=88&w=2000&h=1125"
dl "$IMG/banners/mid-banner.jpg" "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=85&w=2000&h=720"
dl "$IMG/banners/promo.jpg" "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=85&w=960&h=1080"
dl "$IMG/banners/trust.jpg" "https://images.unsplash.com/photo-1505751172876-fa1925c57317?auto=format&fit=crop&q=80&w=1600&h=400"
dl "$IMG/categories/supplements.jpg" "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=85&w=800&h=500"
dl "$IMG/categories/skincare.jpg" "https://images.unsplash.com/photo-1570172619644-dfd03ed5d88b?auto=format&fit=crop&q=85&w=800&h=500"
dl "$IMG/categories/family.jpg" "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=85&w=800&h=500"
dl "$IMG/categories/medical.jpg" "https://images.unsplash.com/photo-1579684385120-1e15a89ca8e2?auto=format&fit=crop&q=85&w=800&h=500"
dl "$IMG/blog/hydration-basics.jpg" "https://images.unsplash.com/photo-1548839140-29a7491ee417?auto=format&fit=crop&q=85&w=1200&h=675"
dl "$IMG/blog/vitamin-d-guide.jpg" "https://images.unsplash.com/photo-1584308666744-24d5c474f30e?auto=format&fit=crop&q=85&w=1200&h=675"

echo "Done. Update products.json to use .jpg paths if you prefer photos over SVG fallbacks."
