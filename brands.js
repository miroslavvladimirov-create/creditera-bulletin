const BRANDS = {
    akpb: {
        id: 'akpb',
        name: 'АКПБ',
        companyName: 'Асоциация на кредитните посредници в България',
        headerTitle: 'АСОЦИАЦИЯ НА КРЕДИТНИТЕ ПОСРЕДНИЦИ',
        headerSubtitle: 'В БЪЛГАРИЯ',
        docTitle: 'ИНФОРМАЦИОНЕН БЮЛЕТИН',
        docSubText: 'Ипотечен пазарен бюлетин • Брой',
        coverTitle: 'ИНФОРМАЦИОНЕН<br>БЮЛЕТИН',
        coverSubtitle: 'Лихвена среда и жилищно кредитиране в България и еврозоната',
        logoHtml: `
            <svg viewBox="0 0 100 100" class="pdf-logo-svg" style="width: 44px; height: 44px;">
                <path d="M20,80 L20,40 L50,15 L80,40 L80,80 Z" fill="none" stroke="currentColor" stroke-width="5"/>
                <path d="M35,80 L35,50 L65,50 L65,80" fill="none" stroke="currentColor" stroke-width="5"/>
                <circle cx="50" cy="50" r="10" fill="var(--color-accent)"/>
            </svg>
        `,
        miniLogoHtml: `
            <svg viewBox="0 0 100 100" class="pdf-mini-logo-svg" style="width: 22px; height: 22px;">
                <path d="M20,80 L20,40 L50,15 L80,40 L80,80 Z" fill="none" stroke="currentColor" stroke-width="5"/>
                <path d="M35,80 L35,50 L65,50 L65,80" fill="none" stroke="currentColor" stroke-width="5"/>
                <circle cx="50" cy="50" r="10" fill="var(--color-accent)"/>
            </svg>
        `,
        coverLogoHtml: `
            <svg viewBox="0 0 100 100" class="pdf-cover-logo-svg" style="width: 60px; height: 60px; color: var(--color-primary);">
                <path d="M20,80 L20,40 L50,15 L80,40 L80,80 Z" fill="none" stroke="currentColor" stroke-width="5"/>
                <path d="M35,80 L35,50 L65,50 L65,80" fill="none" stroke="currentColor" stroke-width="5"/>
                <circle cx="50" cy="50" r="10" fill="var(--color-accent)"/>
            </svg>
        `,
        palette: {
            primary: '#0B2545',
            primaryLight: '#314575',
            accent: '#EEB902',
            accentDark: '#DCA307',
            bgLight: '#F4F7F9',
            textDark: '#1F2937'
        },
        website: 'www.acib.bg',
        coverContact: 'АКПБ • Асоциация на кредитните посредници в България • www.acib.bg',
        footerTextPage1: 'АКПБ • Асоциация на кредитните посредници в България • www.acib.bg',
        footerMini: 'АКПБ • Асоциация на кредитните посредници в България • www.acib.bg',
        disclaimer: 'Отказ от отговорност: Представените данни имат информативен характер и отразяват официалната статистика на ЕЦБ и БНБ към момента на съставяне на бюлетина. АКПБ не носи отговорност за промени в тарифите на банковите институции.',
        compiler: {
            name: 'гл. ас. д-р Мирослав Владимиров',
            title: 'зам.-председател на УС на АКПБ',
            email: 'mvladimirov@creditera.bg'
        },
        pdfPrefix: 'АКПБ_Бюлетин'
    },
    creditera: {
        id: 'creditera',
        name: 'CreditERA',
        companyName: 'CreditERA',
        headerTitle: 'ИПОТЕЧЕН БЮЛЕТИН',
        headerSubtitle: 'CreditERA',
        docTitle: 'ИПОТЕЧЕН БЮЛЕТИН',
        docSubText: 'Ипотечен пазарен бюлетин • Брой',
        coverTitle: 'ИПОТЕЧЕН<br>БЮЛЕТИН',
        coverSubtitle: 'Лихвена среда и жилищно кредитиране в България и еврозоната',
        slogan: 'Ипотечният БРОКЕР, с когото пестиш',
        logoHtml: `
            <img src="assets/creditera-logo.png" alt="CreditERA Logo" class="pdf-logo-img" style="height: 40px; width: auto; max-width: 140px; object-fit: contain;">
        `,
        miniLogoHtml: `
            <img src="assets/creditera-logo.png" alt="CreditERA Logo" style="height: 18px; width: auto; max-width: 90px; object-fit: contain;">
        `,
        coverLogoHtml: `
            <img src="assets/creditera-logo.png" alt="CreditERA Logo" class="pdf-cover-logo-img" style="height: 56px; width: auto; max-width: 220px; object-fit: contain;">
        `,
        palette: {
            primary: '#202E64',
            primaryLight: '#2c3e80',
            accent: '#3EA93F',
            accentDark: '#328c33',
            bgLight: '#F1F8F1',
            textDark: '#202E64'
        },
        website: 'www.creditera.bg',
        coverContact: 'CreditERA • Ипотечни и кредитни консултации • www.creditera.bg',
        footerTextPage1: 'CreditERA • Ипотечни и кредитни консултации • www.creditera.bg',
        footerMini: 'CREDITERA',
        disclaimer: 'Отказ от отговорност: Представените данни имат информативен характер и отразяват официалната статистика на ЕЦБ и БНБ към момента на съставяне на бюлетина. CreditERA не носи отговорност за промени в тарифите на банковите институции.',
        compiler: {
            name: 'гл. ас. д-р Мирослав Владимиров',
            title: '',
            email: 'mvladimirov@creditera.bg'
        },
        pdfPrefix: 'CreditERA_Бюлетин'
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BRANDS };
}
