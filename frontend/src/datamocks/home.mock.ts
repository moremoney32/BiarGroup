// Datamocks — Home page Actor Hub

export const heroSlides = [
  {
    id: 1,
    nodeId: '188:2',
    bgGradient: 'linear-gradient(135deg, #1a1008 0%, #2d1a0a 40%, #0d0a05 100%)',
    title: 'Plateforme Unifiée\nde Communication\nCloud',
    description:
      'Transformez votre communication client avec notre solution SaaS complète : Centre d\'appels, SMS Bulk, WhatsApp Business et Email Marketing.',
    cta1: { label: 'Essai gratuit 14 jours', href: '/register' },
    cta2: { label: 'Voir la démo', href: '#demo' },
  },
  {
    id: 2,
    nodeId: '188:1696',
    bgGradient: 'linear-gradient(135deg, #071628 0%, #0e2340 50%, #05111e 100%)',
    title: 'Pourquoi les Entreprises\net Opérateurs Télécom\nChoisissent ACTOR Hub',
    description:
      'One platform · Infinite connections. Débloquez la croissance avec le white-label, multi-tenancy, UC tout-en-un et bien plus encore.',
    cta1: { label: 'Explorer la solution', href: '#solutions' },
    cta2: { label: 'Voir les tarifs', href: '#tarifs' },
  },
  {
    id: 3,
    nodeId: '188:1132',
    bgGradient: 'linear-gradient(135deg, #0f0a14 0%, #1a0f24 50%, #080510 100%)',
    title: 'Centre d\'Appels Cloud\nNouvelle Génération',
    description:
      'Softphone WebRTC, IVR intelligent, Power & Predictive Dialer, supervision en temps réel et analytics avancés.',
    cta1: { label: 'Découvrir le Call Center', href: '#call-center' },
    cta2: { label: 'Voir les fonctionnalités', href: '#fonctionnalites' },
  },
  {
    id: 4,
    nodeId: '188:2261',
    bgGradient: 'linear-gradient(135deg, #0a0a12 0%, #14141e 50%, #06060c 100%)',
    title: 'SMS Marketing\nDirect Opérateurs',
    description:
      'Connexion SMPP avec 800+ opérateurs dans 190 pays. Envoyez des millions de SMS avec 99 % de délivrabilité, API REST et rapports DLR en temps réel.',
    cta1: { label: 'Commencer avec SMS', href: '/register' },
    cta2: { label: 'Documentation API', href: '#api' },
  },
  {
    id: 5,
    nodeId: '188:2826',
    bgGradient: 'linear-gradient(135deg, #071008 0%, #0e1e0e 50%, #040a04 100%)',
    title: 'WhatsApp Business\nAPI Officielle',
    description:
      'Connectez-vous à 2 milliards d\'utilisateurs. Chatbot IA multilingue, Broadcast illimité, Multi-agents et automation complète des conversations.',
    cta1: { label: 'Activer WhatsApp', href: '/register' },
    cta2: { label: 'Voir les cas d\'usage', href: '#cas-usage' },
  },
]

export const homeStats = [
  { value: 5000, suffix: '+',  label: 'Entreprises clientes', decimal: false, color: '#FE5B29' },
  { value: 190,  suffix: '+',  label: 'Pays couverts',        decimal: false, color: '#E91E8C' },
  { value: 99.9, suffix: '%',  label: 'Uptime garanti',       decimal: true,  color: '#2B7FFF' },
  { value: 24,   suffix: '/7', label: 'Support expert',       decimal: false, color: '#FE5B29' },
]

export const homeMetrics = [
  {
    icon: 'TrendingUp',
    value: '98%',
    color: '#FE5B29',
    label: 'Taux d\'engagement client',
    desc: 'Augmentation moyenne de l\'engagement client',
  },
  {
    icon: 'DollarSign',
    value: '60%',
    color: '#2B7FFF',
    label: 'Réduction des coûts',
    desc: 'Économies sur vos coûts de communication',
  },
  {
    icon: 'Smile',
    value: '95%',
    color: '#8B5CF6',
    label: 'Satisfaction client',
    desc: 'Amélioration de la satisfaction client',
  },
  {
    icon: 'Clock',
    value: '75%',
    color: '#FE5B29',
    label: 'Gain de temps',
    desc: 'Automatisation de vos processus',
  },
  {
    icon: 'BarChart2',
    value: '4.2x',
    color: '#6366F1',
    label: 'ROI mesurable',
    desc: 'Retour sur investissement moyen',
  },
  {
    icon: 'Settings2',
    value: '24h',
    color: '#10B981',
    label: 'Intégration rapide',
    desc: 'Avec vos outils existants',
  },
]

export const homeSolutions = [
  {
    icon: 'Phone',
    iconBg: '#3B82F6',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    title: 'Centre d\'Appels Cloud',
    desc: 'Softphone HD, IVR intelligent, supervision temps réel, dialers automatiques et CTI avancé.',
    tags: ['Softphone WebRTC', 'IVR Visuel', 'Power/Predictive Dialer'],
    href: '#call-center',
  },
  {
    icon: 'MessageSquare',
    iconBg: '#0EA5E9',
    color: '#0EA5E9',
    bgColor: '#F0F9FF',
    title: 'SMS Marketing',
    desc: 'Connexion SMPP directe, envoi bulk illimité, SMS two-way et analytics en temps réel.',
    tags: ['SMPP Direct', 'SMS Bulk', 'Two-Way Conversations'],
    href: '#sms',
  },
  {
    icon: 'MessageCircle',
    iconBg: '#10B981',
    color: '#10B981',
    bgColor: '#ECFDF5',
    title: 'WhatsApp Business',
    desc: 'API officielle, chatbot IA, broadcast illimité, chat multi-agents et automation complète.',
    tags: ['Chatbot IA', 'Broadcast', 'Multi-Agents'],
    href: '#whatsapp',
  },
  {
    icon: 'Mail',
    iconBg: '#8B5CF6',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    title: 'Email Marketing',
    desc: 'Éditeur drag & drop, automation workflows, segmentation avancée et délivrabilité optimisée.',
    tags: ['Drag & Drop', 'Automation', '99.5% Délivrabilité'],
    href: '#email',
  },
]

export const homeClients = [
  'MTN', 'Orange', 'Moov', 'Airtel', 'Vodafone', 'Camtel',
  'Total', 'BICEC', 'Afriland', 'Ecobank', 'UBA', 'SCB',
]

export const homePartners = [
  'Microsoft', 'Google Cloud', 'AWS', 'Twilio',
  'SendGrid', 'WhatsApp', 'Salesforce', 'HubSpot',
]

export const homeTestimonials = [
  {
    name: 'Amadou Diallo',
    role: 'CEO, TechAfrique SARL',
    country: 'Cameroun',
    text: 'Actor Hub a transformé notre communication client. Nous envoyons 500K SMS/mois avec un taux de délivrabilité de 99%. Un ROI exceptionnel !',
    stars: 5,
    color: '#FE5B29',
    initials: 'AD',
  },
  {
    name: 'Marie-Claire Nkosi',
    role: 'Marketing Director, AinaConnect',
    country: 'Kinshasa, RDC',
    text: 'L\'intégration WhatsApp Business avec leur chatbot IA a augmenté notre engagement de 300%. Support client exceptionnel.',
    stars: 5,
    color: '#8B5CF6',
    initials: 'MN',
  },
  {
    name: 'Jean-Pierre Kabila',
    role: 'COO, EurMeat Group',
    country: 'Kinshasa, RDC',
    text: 'La plateforme la plus complète du marché. Call center, SMS, WhatsApp et Email dans une seule interface. Excellent rapport qualité/prix.',
    stars: 5,
    color: '#2B7FFF',
    initials: 'JK',
  },
]
