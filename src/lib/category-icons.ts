import {
  Armchair,
  Baby,
  Boxes,
  Briefcase,
  Car,
  CupSoda,
  Fish,
  Gem,
  Hammer,
  Lamp,
  Leaf,
  MoonStar,
  Palette,
  PencilRuler,
  Plug,
  Shirt,
  ShoppingBasket,
  Sprout,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryIconKey } from './admin-category-data'

export const categoryIcons: Record<CategoryIconKey, LucideIcon> = {
  kuliner: UtensilsCrossed,
  kriya: Palette,
  fashion: Shirt,
  minuman: CupSoda,
  herbal: Leaf,
  sembako: ShoppingBasket,
  elektronik: Plug,
  dekorasi: Lamp,
  bayi: Baby,
  pertanian: Sprout,
  peternakan: Fish,
  aksesoris: Gem,
  ibadah: MoonStar,
  otomotif: Car,
  'alat-tulis': PencilRuler,
  jasa: Briefcase,
  furnitur: Armchair,
  logam: Hammer,
  lainnya: Boxes,
}

export type CategoryIconOption = {
  key: CategoryIconKey
  label: string
}

export const categoryIconOptions: CategoryIconOption[] = [
  { key: 'kuliner', label: 'Kuliner' },
  { key: 'minuman', label: 'Minuman' },
  { key: 'sembako', label: 'Sembako' },
  { key: 'kriya', label: 'Kriya' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'herbal', label: 'Herbal' },
  { key: 'aksesoris', label: 'Aksesoris' },
  { key: 'lainnya', label: 'Lainnya' },
]
