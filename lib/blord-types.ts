export interface StatMetric {
  id: string;
  value: string;
  label: string;
}

export interface ProductFeature {
  title: string;
  description: string;
}

export interface ProductExternalLinks {
  webAppUrl?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

export type AuthRole = 'executive' | 'staff';

export type StaffDepartment =
  | 'sales'
  | 'marketing'
  | 'ict-tech'
  | 'maintenance'
  | 'operations'
  | 'inventory'
  | 'branches'
  | 'inbox'
  | 'editorial';

export interface StaffAccountPublic {
  id: string;
  name: string;
  email: string;
  department: StaffDepartment;
  branchId?: string;
  title: string;
  active: boolean;
  lastTab?: string;
  createdAt: string;
}

export interface ProductItem {
  slug: string;
  name: string;
  category: string;
  logo: string;
  priceLabel?: string;
  tagline: string;
  summary: string;
  description: string;
  featuresTitle: string;
  features: ProductFeature[];
  links: ProductExternalLinks;
}

export interface ChinaServiceStep {
  step: string;
  title: string;
  description: string;
}

export interface CoreFeature {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
}

export interface BoardMember {
  id: number;
  name: string;
  role: string;
  image: string;
  alt: string;
  email?: string;
  phone?: string;
}

export interface GroupPhoto {
  id: number;
  image: string;
  alt: string;
}

export interface AwardItem {
  id: string;
  title: string;
  recipient: string;
  image: string;
  alt: string;
  summary: string;
}

export interface CoreValue {
  id: string;
  title: string;
  description: string;
}

export interface BranchLocation {
  id: string;
  name: string;
  badge?: string;
  region: string;
  address: string;
  phone: string;
  email: string;
  mapQuery: string;
  landmarkHint: string;
}

export interface SocialChannel {
  id: string;
  platform: string;
  handle: string;
  href: string;
}

export interface BlordCarItem {
  id: string;
  name: string;
  category: string;
  sizeClass: string;
  batteryCapacity: string;
  rangeKm: string;
  priceNgn: number;
  status: 'Available' | 'Low Stock' | 'Pre-Order' | 'Sold Out';
  image: string;
  highlights: string[];
}

export interface PowerTankItem {
  id: string;
  name: string;
  capacityWatt: string;
  storageSpec: string;
  sizeDimensions: string;
  priceNgn: number;
  status: 'Available' | 'Low Stock' | 'Sold Out' | 'Coming Soon';
  image: string;
  appliances: string;
}

export interface BlordSiteContent {
  brandName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroVideoUrl: string;
  heroStats: StatMetric[];
  innovationHeadline: string;
  innovationSubtitle: string;
  paymentsEyebrow: string;
  paymentsTitle: string;
  paymentsBullets: string[];
  trustHeadline: string;
  trustMetrics: StatMetric[];
  chinaEyebrow: string;
  chinaTitle: string;
  chinaImage: string;
  chinaSteps: ChinaServiceStep[];
  coreFeaturesEyebrow: string;
  coreFeaturesTitle: string;
  coreFeatures: CoreFeature[];
  products: ProductItem[];
  cars: BlordCarItem[];
  powerTanks: PowerTankItem[];
  about: {
    eyebrow: string;
    missionTitle: string;
    missionPoints: string[];
    visionTitle: string;
    visionStatement: string;
    awardsEyebrow: string;
    awardsTitle: string;
    awardsSubtitle: string;
    awards: AwardItem[];
    historyEyebrow: string;
    historyTitle: string;
    historySubtitle: string;
    historyParagraphs: string[];
    dedicationTitle: string;
    dedicationParagraphs: string[];
    principlesEyebrow: string;
    principlesTitle: string;
    principlesSubtitle: string;
    principles: CoreValue[];
    boardMembers: BoardMember[];
    groupPhotos: GroupPhoto[];
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    supportEmail: string;
    supportPhone: string;
    procurementEmail: string;
    branches: BranchLocation[];
    socials: SocialChannel[];
  };
  footerDescription: string;
  copyrightText: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  branchId?: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
}
