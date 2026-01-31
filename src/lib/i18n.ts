import { create } from 'zustand';

type Language = 'en' | 'ar';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: () => 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.overview': 'Overview',
    'nav.requests': 'My Requests',
    'nav.tracking': 'Active Tracking',
    'nav.invoices': 'Invoices',
    'nav.ratings': 'Driver Ratings',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    
    // Overview
    'overview.title': 'Dashboard Overview',
    'overview.activeShipments': 'Active Shipments',
    'overview.pendingRequests': 'Pending Requests',
    'overview.acceptedToday': 'Accepted Today',
    'overview.estimatedCost': 'Estimated Cost',
    'overview.avgDeliveryTime': 'Avg Delivery Time',
    'overview.activeTrucks': 'Active Trucks',
    'overview.hours': 'hours',
    'overview.recentRequests': 'Recent Requests',
    'overview.newRequest': 'New Request',
    
    // Requests
    'requests.title': 'My Requests',
    'requests.id': 'Request ID',
    'requests.from': 'From',
    'requests.to': 'To',
    'requests.truckType': 'Truck Type',
    'requests.status': 'Status',
    'requests.offers': 'Offers',
    'requests.actions': 'Actions',
    'requests.viewDetails': 'View Details',
    'requests.track': 'Track',
    'requests.createNew': 'Create New Request',
    'requests.filter': 'Filter',
    
    // New Request Form
    'form.fromLocation': 'From Location',
    'form.toLocation': 'To Location',
    'form.truckType': 'Truck Type',
    'form.trucksRequired': 'Trucks Required',
    'form.minYear': 'Min Manufacturing Year',
    'form.notes': 'Notes',
    'form.submit': 'Submit Request',
    'form.cancel': 'Cancel',
    
    // Tracking
    'tracking.title': 'Active Shipments',
    'tracking.driver': 'Driver',
    'tracking.plate': 'Plate',
    'tracking.started': 'Started',
    'tracking.eta': 'ETA',
    'tracking.progress': 'Progress',
    'tracking.trackLive': 'Track Live',
    
    // Invoices
    'invoices.title': 'Invoices & Payments',
    'invoices.id': 'Invoice ID',
    'invoices.amount': 'Amount',
    'invoices.status': 'Status',
    'invoices.paidAt': 'Paid At',
    'invoices.totalSpend': 'Total Spend',
    'invoices.thisMonth': 'This Month',
    
    // Ratings
    'ratings.title': 'Driver Ratings',
    'ratings.driver': 'Driver',
    'ratings.rating': 'Rating',
    'ratings.trips': 'Trips',
    'ratings.addRating': 'Add Rating',
    
    // Status
    'status.pending': 'Pending',
    'status.offers_received': 'Offers Received',
    'status.accepted': 'Accepted',
    'status.in_progress': 'In Progress',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.paid': 'Paid',
    
    // Truck Types
    'truck.flatbed': 'Flatbed',
    'truck.refrigerated': 'Refrigerated',
    'truck.tanker': 'Tanker',
    'truck.container': 'Container',
    'truck.lowboy': 'Lowboy',
    'truck.dry_van': 'Dry Van',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.phone': 'Phone Number',
    'auth.otp': 'Enter OTP',
    'auth.sendOtp': 'Send OTP',
    'auth.verifyOtp': 'Verify OTP',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.companyName': 'Company Name',
    'auth.welcome': 'Welcome to عزة Logistics',
    'auth.subtitle': 'Your futuristic logistics partner',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.noData': 'No data available',
    'common.sar': 'SAR',
  },
  ar: {
    // Navigation
    'nav.overview': 'نظرة عامة',
    'nav.requests': 'طلباتي',
    'nav.tracking': 'التتبع المباشر',
    'nav.invoices': 'الفواتير',
    'nav.ratings': 'تقييم السائقين',
    'nav.profile': 'الملف الشخصي',
    'nav.logout': 'تسجيل الخروج',
    
    // Overview
    'overview.title': 'لوحة التحكم',
    'overview.activeShipments': 'الشحنات النشطة',
    'overview.pendingRequests': 'الطلبات المعلقة',
    'overview.acceptedToday': 'المقبولة اليوم',
    'overview.estimatedCost': 'التكلفة المقدرة',
    'overview.avgDeliveryTime': 'متوسط وقت التسليم',
    'overview.activeTrucks': 'الشاحنات النشطة',
    'overview.hours': 'ساعات',
    'overview.recentRequests': 'الطلبات الأخيرة',
    'overview.newRequest': 'طلب جديد',
    
    // Requests
    'requests.title': 'طلباتي',
    'requests.id': 'رقم الطلب',
    'requests.from': 'من',
    'requests.to': 'إلى',
    'requests.truckType': 'نوع الشاحنة',
    'requests.status': 'الحالة',
    'requests.offers': 'العروض',
    'requests.actions': 'الإجراءات',
    'requests.viewDetails': 'عرض التفاصيل',
    'requests.track': 'تتبع',
    'requests.createNew': 'إنشاء طلب جديد',
    'requests.filter': 'تصفية',
    
    // New Request Form
    'form.fromLocation': 'من موقع',
    'form.toLocation': 'إلى موقع',
    'form.truckType': 'نوع الشاحنة',
    'form.trucksRequired': 'عدد الشاحنات المطلوبة',
    'form.minYear': 'الحد الأدنى لسنة التصنيع',
    'form.notes': 'ملاحظات',
    'form.submit': 'إرسال الطلب',
    'form.cancel': 'إلغاء',
    
    // Tracking
    'tracking.title': 'الشحنات النشطة',
    'tracking.driver': 'السائق',
    'tracking.plate': 'لوحة الشاحنة',
    'tracking.started': 'بدأت',
    'tracking.eta': 'الوصول المتوقع',
    'tracking.progress': 'التقدم',
    'tracking.trackLive': 'تتبع مباشر',
    
    // Invoices
    'invoices.title': 'الفواتير والمدفوعات',
    'invoices.id': 'رقم الفاتورة',
    'invoices.amount': 'المبلغ',
    'invoices.status': 'الحالة',
    'invoices.paidAt': 'تاريخ الدفع',
    'invoices.totalSpend': 'إجمالي الإنفاق',
    'invoices.thisMonth': 'هذا الشهر',
    
    // Ratings
    'ratings.title': 'تقييم السائقين',
    'ratings.driver': 'السائق',
    'ratings.rating': 'التقييم',
    'ratings.trips': 'الرحلات',
    'ratings.addRating': 'أضف تقييم',
    
    // Status
    'status.pending': 'معلق',
    'status.offers_received': 'تم استلام العروض',
    'status.accepted': 'مقبول',
    'status.in_progress': 'قيد التنفيذ',
    'status.completed': 'مكتمل',
    'status.cancelled': 'ملغي',
    'status.paid': 'مدفوع',
    
    // Truck Types
    'truck.flatbed': 'سطحة',
    'truck.refrigerated': 'مبردة',
    'truck.tanker': 'صهريج',
    'truck.container': 'حاوية',
    'truck.lowboy': 'لوبوي',
    'truck.dry_van': 'فان جاف',
    
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.phone': 'رقم الهاتف',
    'auth.otp': 'أدخل رمز التحقق',
    'auth.sendOtp': 'إرسال الرمز',
    'auth.verifyOtp': 'تأكيد الرمز',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.companyName': 'اسم الشركة',
    'auth.welcome': 'مرحباً بك في عزة للخدمات اللوجستية',
    'auth.subtitle': 'شريكك اللوجستي المستقبلي',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'common.noData': 'لا توجد بيانات',
    'common.sar': 'ر.س',
  },
};

export const useI18n = create<I18nState>((set, get) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  t: (key) => {
    const { language } = get();
    return translations[language][key] || key;
  },
  dir: () => get().language === 'ar' ? 'rtl' : 'ltr',
}));
