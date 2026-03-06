// ============================================
// OZOBATH — Chatbot Knowledge Base (400+ lines)
// Comprehensive FAQ dataset with keyword matching
// ============================================

export const chatbotData = [
  // ─── PRODUCTS ──────────────────────────────
  {
    id: 'prod-1',
    category: 'Products',
    question: 'What products does OZOBATH offer?',
    keywords: ['products', 'offer', 'sell', 'range', 'collection', 'what do you sell', 'catalog'],
    answer: 'OZOBATH offers premium bathroom solutions including:\n\n• **Shower Enclosures** — Frameless, semi-frameless, sliding, and corner designs\n• **Faucets & Taps** — Basin, kitchen, and sensor faucets\n• **Basin Mixers** — Single-lever and tall vessel mixers\n• **Bathroom Accessories** — Towel racks, shelves, hooks, and more\n\nAll products feature premium materials and come with warranty coverage.',
    relatedQuestions: ['prod-2', 'prod-3', 'prod-5'],
    guideLink: '/shop',
    guideLinkText: 'Browse All Products',
  },
  {
    id: 'prod-2',
    category: 'Products',
    question: 'What types of shower enclosures do you have?',
    keywords: ['shower', 'enclosure', 'glass', 'frameless', 'sliding', 'corner', 'types of shower'],
    answer: 'We offer several types of shower enclosures:\n\n• **Frameless** — 10mm tempered glass with minimal hardware for a sleek, modern look\n• **Semi-Frameless** — Balance of style and structural support\n• **Sliding Door** — Space-saving with smooth roller mechanisms\n• **Neo-Angle / Corner** — Perfect for compact bathrooms\n• **Walk-In** — Open-concept luxury designs\n\nAll our glass is tempered safety glass with anti-limescale coating options.',
    relatedQuestions: ['prod-1', 'prod-4', 'warranty-1'],
    guideLink: '/shop/shower-enclosures',
    guideLinkText: 'View Shower Enclosures',
  },
  {
    id: 'prod-3',
    category: 'Products',
    question: 'Do you have sensor or touchless faucets?',
    keywords: ['sensor', 'touchless', 'smart', 'automatic', 'infrared', 'no-touch', 'faucet'],
    answer: 'Yes! Our **Sensor-Touch Smart Faucet** features:\n\n• Infrared touch-free operation\n• LED temperature indicator (blue = cold, red = hot)\n• Battery-powered (AA x 4) with 2-year lifespan\n• Water-saving technology — up to 50% less water usage\n• Sleek modern design\n\nPerfect for modern bathrooms and hygiene-conscious households.',
    relatedQuestions: ['prod-1', 'install-2', 'warranty-1'],
    guideLink: '/shop/faucets-taps',
    guideLinkText: 'View Faucets',
  },
  {
    id: 'prod-4',
    category: 'Products',
    question: 'What glass thickness do you recommend?',
    keywords: ['glass', 'thickness', 'mm', '8mm', '10mm', '12mm', 'tempered', 'safety'],
    answer: '**Glass Thickness Guide:**\n\n• **8mm** — Great for framed and semi-frameless enclosures. Durable and cost-effective.\n• **10mm** — Our most popular. Ideal for frameless designs. Premium feel with excellent safety.\n• **12mm** — Ultra-premium. Maximum rigidity for large walk-in panels.\n\nAll our glass is **tempered safety glass** that breaks into small, harmless pieces if ever damaged. We recommend 10mm for most residential installations.',
    relatedQuestions: ['prod-2', 'install-1', 'warranty-1'],
  },
  {
    id: 'prod-5',
    category: 'Products',
    question: 'What finishes are available for faucets?',
    keywords: ['finish', 'color', 'chrome', 'matte black', 'gold', 'rose gold', 'brushed', 'faucet finish'],
    answer: 'We offer a range of premium finishes:\n\n• **Mirror Chrome** — Classic, timeless, and easy to maintain\n• **Matte Black** — Modern industrial elegance\n• **Brushed Gold** — Warm luxury statement\n• **Rose Gold PVD** — Stunning and durable coating\n• **Satin Nickel** — Subtle sophistication\n\nPVD-coated finishes are scratch-resistant and maintain their appearance for years.',
    relatedQuestions: ['prod-3', 'prod-1', 'maintain-1'],
  },
  {
    id: 'prod-6',
    category: 'Products',
    question: 'What is anti-limescale coating?',
    keywords: ['anti-limescale', 'coating', 'easy clean', 'nano', 'self-cleaning'],
    answer: 'Our **Anti-Limescale Nano Coating** is a special treatment applied to shower glass that:\n\n• Repels water and minerals, preventing buildup\n• Reduces cleaning time by up to **70%**\n• Makes the glass surface smoother at a microscopic level\n• Lasts 5-8 years with normal use\n\nThis coating comes standard on our Crystal Clear range and is available as an upgrade on other models.',
    relatedQuestions: ['prod-2', 'maintain-1', 'prod-4'],
  },

  // ─── SHIPPING ──────────────────────────────
  {
    id: 'ship-1',
    category: 'Shipping',
    question: 'Do you offer free shipping?',
    keywords: ['free shipping', 'shipping cost', 'delivery charge', 'shipping fee', 'delivery fee'],
    answer: '**Yes! FREE shipping on all orders above ₹999** across India.\n\nOrders below ₹999 have a flat ₹99 shipping fee.\n\nWe ship via trusted courier partners with full tracking available.',
    relatedQuestions: ['ship-2', 'ship-3', 'ship-4'],
  },
  {
    id: 'ship-2',
    category: 'Shipping',
    question: 'How long does delivery take?',
    keywords: ['delivery time', 'how long', 'shipping time', 'when will i receive', 'delivery days', 'how many days'],
    answer: '**Delivery timelines:**\n\n• **Metro cities** (Bangalore, Mumbai, Delhi, Chennai, Hyderabad) — **3-5 business days**\n• **Other cities** — **5-7 business days**\n• **Remote areas** — **7-10 business days**\n\nYou\'ll receive tracking details via SMS and email once your order ships.',
    relatedQuestions: ['ship-1', 'ship-3', 'order-1'],
  },
  {
    id: 'ship-3',
    category: 'Shipping',
    question: 'Do you ship internationally?',
    keywords: ['international', 'overseas', 'abroad', 'outside india', 'export', 'other countries'],
    answer: 'Currently, we ship **within India only**. We are expanding to international shipping soon.\n\nFor bulk/B2B international orders, please contact us directly at **ozobath@gmail.com** or **+91 78992 02927** for a custom quote.',
    relatedQuestions: ['ship-1', 'b2b-1', 'contact-1'],
  },
  {
    id: 'ship-4',
    category: 'Shipping',
    question: 'Can I track my order?',
    keywords: ['track', 'tracking', 'order status', 'where is my order', 'shipment status'],
    answer: 'Yes! You can track your order in two ways:\n\n1. **Order Tracking Page** — Enter your order ID on our tracking page\n2. **Email/SMS** — You\'ll receive tracking updates automatically\n\nYou can also check order status from your account dashboard.',
    relatedQuestions: ['order-1', 'ship-2'],
    guideLink: '/track-order',
    guideLinkText: 'Track Your Order',
  },

  // ─── WARRANTY ──────────────────────────────
  {
    id: 'warranty-1',
    category: 'Warranty',
    question: 'What warranty do OZOBATH products have?',
    keywords: ['warranty', 'guarantee', 'coverage', 'how long warranty', 'warranty period'],
    answer: '**Warranty Coverage:**\n\n• **Shower Enclosures** — 5 years comprehensive warranty\n• **Faucets & Taps** — 3 years warranty\n• **Basin Mixers** — 3 years warranty\n• **Accessories** — 2 years against manufacturing defects\n\nWarranty covers manufacturing defects but not damage from misuse, improper installation, or normal wear.',
    relatedQuestions: ['warranty-2', 'return-1', 'install-1'],
    guideLink: '/warranty',
    guideLinkText: 'Warranty Details',
  },
  {
    id: 'warranty-2',
    category: 'Warranty',
    question: 'How do I claim warranty?',
    keywords: ['claim warranty', 'warranty claim', 'defective', 'broken', 'replace', 'repair'],
    answer: 'To claim warranty:\n\n1. **Submit a Service Request** on our website with photos of the issue\n2. Our team will review and respond within **24-48 hours**\n3. If approved, we\'ll arrange a replacement or repair\n\n**What you need:** Order ID, product photos, description of the issue.\n\nYou can also call us at **+91 78992 02927** for immediate assistance.',
    relatedQuestions: ['warranty-1', 'return-1', 'contact-1'],
    guideLink: '/service-request',
    guideLinkText: 'Submit Service Request',
  },

  // ─── INSTALLATION ──────────────────────────
  {
    id: 'install-1',
    category: 'Installation',
    question: 'Do you provide installation services?',
    keywords: ['installation', 'install', 'fitting', 'setup', 'plumber', 'professional install'],
    answer: 'Yes! We offer **professional installation services** in select cities:\n\n• **Bangalore** — Available within 3 days of delivery\n• **Other metro cities** — Available on request\n• **DIY** — All products come with detailed installation guides and hardware\n\nInstallation charges vary by product. Contact us for a quote.',
    relatedQuestions: ['install-2', 'install-3', 'contact-1'],
  },
  {
    id: 'install-2',
    category: 'Installation',
    question: 'Can I install shower enclosures myself?',
    keywords: ['diy', 'self install', 'myself', 'install myself', 'easy to install'],
    answer: 'While DIY installation is possible, we **recommend professional installation** for shower enclosures because:\n\n• Proper waterproofing is critical\n• Glass handling requires experience\n• Precise measurements ensure a perfect seal\n\nHowever, accessories like towel racks, shelves, and soap dishes can be easily DIY-installed. Every product includes a step-by-step guide.',
    relatedQuestions: ['install-1', 'install-3', 'prod-2'],
  },
  {
    id: 'install-3',
    category: 'Installation',
    question: 'What are the installation requirements?',
    keywords: ['requirements', 'preparation', 'before install', 'bathroom ready', 'wall', 'plumbing'],
    answer: '**Before installation, ensure:**\n\n• Bathroom tiling and waterproofing are complete\n• Plumbing rough-ins are positioned correctly\n• Wall surfaces are level and can support the weight\n• Minimum shower area: 900mm x 900mm for standard enclosures\n• Water supply connections are ready for faucet installation\n\nOur team can do a **free site assessment** in Bangalore.',
    relatedQuestions: ['install-1', 'install-2', 'visit-1'],
  },

  // ─── RETURNS & REFUNDS ─────────────────────
  {
    id: 'return-1',
    category: 'Returns',
    question: 'What is your return policy?',
    keywords: ['return', 'refund', 'exchange', 'send back', 'money back', 'return policy'],
    answer: '**Return Policy:**\n\n• Returns accepted within **7 days** of delivery\n• Product must be in **original condition** with packaging\n• **Custom-made items** are non-returnable\n• Report damaged items within **48 hours** with photos\n\n**Refund Process:**\n• Refund initiated within 3 business days of receiving the return\n• Amount credited to original payment method within 5-7 days',
    relatedQuestions: ['return-2', 'order-1', 'contact-1'],
  },
  {
    id: 'return-2',
    category: 'Returns',
    question: 'What if I receive a damaged product?',
    keywords: ['damaged', 'broken', 'defective', 'wrong product', 'missing parts', 'cracked'],
    answer: 'If you receive a damaged or defective product:\n\n1. **Do NOT install** the product\n2. Take clear photos/videos of the damage\n3. Contact us within **48 hours** at ozobath@gmail.com\n4. We\'ll arrange a **free replacement** or full refund\n\nKeep the original packaging — the courier may need to inspect it.',
    relatedQuestions: ['return-1', 'warranty-2', 'contact-1'],
  },

  // ─── PAYMENTS ──────────────────────────────
  {
    id: 'pay-1',
    category: 'Payments',
    question: 'What payment methods do you accept?',
    keywords: ['payment', 'pay', 'upi', 'card', 'credit card', 'debit card', 'emi', 'cod', 'net banking'],
    answer: 'We accept all major payment methods via **Razorpay**:\n\n• **UPI** — Google Pay, PhonePe, Paytm\n• **Credit/Debit Cards** — Visa, Mastercard, RuPay\n• **Net Banking** — All major banks\n• **EMI** — Available on select cards (no-cost EMI on orders above ₹10,000)\n• **Wallets** — Paytm, PhonePe\n\nAll transactions are 100% secure with SSL encryption.',
    relatedQuestions: ['pay-2', 'pay-3', 'order-1'],
  },
  {
    id: 'pay-2',
    category: 'Payments',
    question: 'Is COD (Cash on Delivery) available?',
    keywords: ['cod', 'cash on delivery', 'pay on delivery', 'cash'],
    answer: 'Currently, **COD is not available** for our products due to the high value of items and safety of glass products during transit.\n\nWe offer secure online payment via Razorpay with options like UPI, cards, net banking, and EMI.',
    relatedQuestions: ['pay-1', 'pay-3'],
  },
  {
    id: 'pay-3',
    category: 'Payments',
    question: 'Do you offer EMI options?',
    keywords: ['emi', 'installment', 'monthly payment', 'emi option', 'no cost emi'],
    answer: '**Yes! EMI options available:**\n\n• **No-Cost EMI** on orders above ₹10,000 on select bank cards\n• **Standard EMI** available on most credit cards\n• EMI tenures: 3, 6, 9, and 12 months\n\nEMI options are shown at checkout based on your card.',
    relatedQuestions: ['pay-1', 'order-1'],
  },

  // ─── ORDERS ────────────────────────────────
  {
    id: 'order-1',
    category: 'Orders',
    question: 'How do I place an order?',
    keywords: ['place order', 'how to order', 'buy', 'purchase', 'ordering process'],
    answer: 'Placing an order is simple:\n\n1. Browse products and add to cart\n2. Go to checkout\n3. Enter your shipping address\n4. Choose payment method\n5. Complete payment\n\nYou\'ll receive order confirmation via email and SMS with your order ID.',
    relatedQuestions: ['pay-1', 'ship-2', 'ship-4'],
    guideLink: '/shop',
    guideLinkText: 'Start Shopping',
  },
  {
    id: 'order-2',
    category: 'Orders',
    question: 'Can I modify or cancel my order?',
    keywords: ['cancel', 'modify', 'change order', 'cancel order', 'edit order'],
    answer: '**Order Modification:**\n• You can modify your order within **2 hours** of placing it\n• Contact us immediately at **+91 78992 02927**\n\n**Cancellation:**\n• Free cancellation before shipping\n• After shipping, standard return policy applies\n• Refund processed within 5-7 business days',
    relatedQuestions: ['order-1', 'return-1', 'contact-1'],
  },

  // ─── B2B ───────────────────────────────────
  {
    id: 'b2b-1',
    category: 'B2B',
    question: 'Do you offer B2B or bulk pricing?',
    keywords: ['b2b', 'bulk', 'wholesale', 'builder', 'architect', 'project', 'corporate', 'bulk order'],
    answer: '**Yes! Our B2B Program offers:**\n\n• Special **project-based pricing** for bulk orders\n• Dedicated account manager\n• Priority delivery and installation\n• Custom specifications available\n• Volume discounts starting from 10+ units\n\nIdeal for architects, builders, interior designers, and hotel projects.',
    relatedQuestions: ['b2b-2', 'contact-1'],
    guideLink: '/b2b-enquiry',
    guideLinkText: 'Submit B2B Enquiry',
  },
  {
    id: 'b2b-2',
    category: 'B2B',
    question: 'What is the minimum order for B2B?',
    keywords: ['minimum order', 'moq', 'minimum quantity', 'bulk minimum'],
    answer: 'Our B2B program has **flexible minimums**:\n\n• **Shower Enclosures** — Minimum 5 units\n• **Faucets & Accessories** — Minimum 10 units\n• **Mixed orders** — Minimum ₹50,000 total value\n\nFor custom specifications, minimums may vary. Contact our B2B team for details.',
    relatedQuestions: ['b2b-1', 'contact-1'],
  },

  // ─── MAINTENANCE ───────────────────────────
  {
    id: 'maintain-1',
    category: 'Maintenance',
    question: 'How do I clean shower glass?',
    keywords: ['clean', 'cleaning', 'maintain', 'care', 'glass cleaning', 'water spots', 'limescale'],
    answer: '**Daily Care:**\n• Squeegee glass after each shower (30 seconds)\n• Prevents 90% of water spot buildup\n\n**Weekly Cleaning:**\n• Use mild, non-abrasive cleaner\n• Mix 50/50 white vinegar + water for natural cleaning\n• Spray, wait 5 minutes, wipe with soft cloth\n\n**Avoid:** Harsh chemicals, steel wool, abrasive pads — these damage glass coatings.',
    relatedQuestions: ['maintain-2', 'prod-6', 'warranty-1'],
  },
  {
    id: 'maintain-2',
    category: 'Maintenance',
    question: 'How do I maintain chrome fittings?',
    keywords: ['chrome', 'faucet care', 'fixture cleaning', 'polish', 'maintain faucet'],
    answer: '**Chrome Fitting Care:**\n\n• Clean with soft cloth + warm soapy water\n• Dry after cleaning to prevent water spots\n• For mineral deposits: 50/50 vinegar-water solution\n• Polish with microfiber cloth for shine\n\n**Never use:** Bleach, ammonia, or abrasive cleaners on chrome — they cause pitting and discoloration.',
    relatedQuestions: ['maintain-1', 'prod-5', 'warranty-1'],
  },

  // ─── SHOWROOM / VISITS ─────────────────────
  {
    id: 'visit-1',
    category: 'Showroom',
    question: 'Can I visit your showroom?',
    keywords: ['showroom', 'visit', 'experience centre', 'see products', 'touch and feel', 'store', 'outlet'],
    answer: '**Yes! Visit our Experience Centre:**\n\n📍 **Location:** Bangalore, Karnataka\n🕐 **Hours:** Monday - Saturday, 10 AM - 7 PM\n📞 **Book a visit:** +91 78992 02927\n\nSee, touch, and experience our entire product range. Our design consultants are available for personalized recommendations.',
    relatedQuestions: ['visit-2', 'contact-1'],
    guideLink: '/experience-centre',
    guideLinkText: 'Book a Visit',
  },
  {
    id: 'visit-2',
    category: 'Showroom',
    question: 'Can you visit my site for measurements?',
    keywords: ['site visit', 'measurement', 'home visit', 'measure bathroom', 'on-site'],
    answer: 'We offer **free site visits** in Bangalore for projects above ₹25,000.\n\nOur team will:\n• Take precise measurements\n• Assess plumbing and wall conditions\n• Recommend the best product configuration\n• Provide a detailed quote\n\nBook your free site visit through our website.',
    relatedQuestions: ['visit-1', 'install-1', 'b2b-1'],
    guideLink: '/book-site-visit',
    guideLinkText: 'Book Site Visit',
  },

  // ─── CONTACT ───────────────────────────────
  {
    id: 'contact-1',
    category: 'Contact',
    question: 'How can I contact OZOBATH?',
    keywords: ['contact', 'phone', 'email', 'reach', 'call', 'support', 'customer service', 'help'],
    answer: '**Reach us anytime:**\n\n📞 **Phone:** +91 78992 02927 (Mon-Sat, 9 AM - 7 PM)\n📧 **Email:** ozobath@gmail.com\n💬 **WhatsApp:** +91 78992 02927\n📍 **Showroom:** Bangalore, Karnataka\n\nWe typically respond within 2-4 hours during business hours.',
    relatedQuestions: ['visit-1', 'warranty-2', 'order-2'],
    guideLink: '/contact',
    guideLinkText: 'Contact Page',
  },

  // ─── COUPONS & OFFERS ──────────────────────
  {
    id: 'coupon-1',
    category: 'Offers',
    question: 'Are there any discount codes or offers?',
    keywords: ['discount', 'coupon', 'offer', 'promo', 'code', 'sale', 'deal', 'promotion'],
    answer: '**Current Offers:**\n\n🎟️ **WELCOME10** — 10% off your first order (max ₹2,000 discount)\n🎟️ **BULK20** — 20% off orders above ₹50,000 (max ₹15,000 discount)\n🎟️ **FLAT500** — Flat ₹500 off orders above ₹5,000\n\nFree shipping on all orders above ₹999! Check our website for seasonal sales.',
    relatedQuestions: ['order-1', 'pay-1', 'b2b-1'],
    guideLink: '/shop',
    guideLinkText: 'Shop Now',
  },

  // ─── GENERAL ───────────────────────────────
  {
    id: 'general-1',
    category: 'General',
    question: 'Is OZOBATH a trusted brand?',
    keywords: ['trusted', 'reliable', 'genuine', 'authentic', 'about ozobath', 'company'],
    answer: 'OZOBATH is a **premium bathroom solutions brand** based in Bangalore, India.\n\n✅ **500+ satisfied customers**\n✅ **ISI Certified products**\n✅ **5-year warranty** on shower enclosures\n✅ **4.8★ average rating** from verified buyers\n✅ **Used in 100+ professional projects**\n\nWe source premium materials and maintain strict quality control on every product.',
    relatedQuestions: ['prod-1', 'warranty-1', 'visit-1'],
    guideLink: '/about',
    guideLinkText: 'About OZOBATH',
  },
  {
    id: 'general-2',
    category: 'General',
    question: 'Do you offer design consultation?',
    keywords: ['design', 'consultation', 'advice', 'recommend', 'help choose', 'suggestion'],
    answer: '**Yes! Free design consultation available:**\n\n• **In-store** — Visit our Experience Centre for personalized advice\n• **Video Call** — Book a virtual consultation from anywhere in India\n• **Phone** — Quick recommendations over a call\n\nOur design consultants help you choose the right products for your bathroom layout, style, and budget.',
    relatedQuestions: ['visit-1', 'visit-2', 'contact-1'],
    guideLink: '/shop-live',
    guideLinkText: 'Book Consultation',
  },
];

// ─── Quick Guide Chips (shown at start) ────
export const quickGuideChips = [
  { label: '🛍️ Browse Products', type: 'link', path: '/shop' },
  { label: '🚚 Shipping Info', type: 'question', questionId: 'ship-1' },
  { label: '🛡️ Warranty', type: 'question', questionId: 'warranty-1' },
  { label: '💰 Offers & Coupons', type: 'question', questionId: 'coupon-1' },
  { label: '🔧 Installation', type: 'question', questionId: 'install-1' },
  { label: '📞 Contact Us', type: 'question', questionId: 'contact-1' },
  { label: '🏢 Visit Showroom', type: 'question', questionId: 'visit-1' },
  { label: '↩️ Returns', type: 'question', questionId: 'return-1' },
];

// ─── Greeting Messages ────────────────────
export const greetingMessage = {
  text: "Hi! 👋 I'm **OZO**, your OZOBATH assistant. I can help you with product info, shipping, warranty, installation, and more.\n\nHow can I help you today?",
};

// ─── Fallback Response ────────────────────
export const fallbackResponse = {
  text: "I'm not sure about that. Here are some things I can help with:\n\n• Product information & recommendations\n• Shipping & delivery details\n• Warranty & returns\n• Installation guidance\n• B2B & bulk orders\n• Coupons & offers\n\nYou can also reach our team directly at **+91 78992 02927** or **ozobath@gmail.com**.",
  relatedQuestions: ['prod-1', 'ship-1', 'warranty-1', 'contact-1'],
};
