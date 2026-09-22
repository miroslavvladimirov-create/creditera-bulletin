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
        name: 'CreditERA.bg',
        companyName: 'CreditERA.bg',
        headerTitle: 'ИПОТЕЧЕН БЮЛЕТИН',
        headerSubtitle: 'CreditERA.bg',
        docTitle: 'ИПОТЕЧЕН БЮЛЕТИН',
        docSubText: 'Ипотечен пазарен бюлетин • Брой',
        coverTitle: 'ИПОТЕЧЕН<br>БЮЛЕТИН',
        coverSubtitle: 'Лихвена среда и жилищно кредитиране в България и еврозоната',
        slogan: 'Ипотечният БРОКЕР, с когото пестиш',
        logoHtml: `
            <a href="https://creditera.bg/" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: inline-flex; align-items: center;">
                <span class="pdf-logo-text" style="font-family: var(--font-heading); font-size: 16pt; font-weight: 800; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase;">CREDITERA.BG</span>
            </a>
        `,
        miniLogoHtml: `
            <a href="https://creditera.bg/" target="_blank" rel="noopener noreferrer" class="pdf-mini-logo-link" style="text-decoration: none; color: #ffffff; display: inline-flex; align-items: center; line-height: 1;">
                <span class="pdf-mini-brand-text" style="font-family: var(--font-heading); font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #ffffff; line-height: 1;">CREDITERA.BG</span>
            </a>
        `,
        coverLogoHtml: `
            <a href="https://creditera.bg/" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: block;">
                <div class="creditera-cover-brand-title" style="font-family: var(--font-heading); font-size: 26pt; font-weight: 800; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; line-height: 1;">CREDITERA.BG</div>
            </a>
        `,
        palette: {
            primary: '#202E64',
            primaryLight: '#2c3e80',
            accent: '#3EA93F',
            accentDark: '#328c33',
            bgLight: '#F1F8F1',
            textDark: '#202E64'
        },
        website: 'https://creditera.bg/',
        coverContact: '<a href="https://creditera.bg/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; font-weight: 600;">CreditERA.bg</a> • Ипотечни и кредитни консултации • <a href="https://creditera.bg/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">www.creditera.bg</a>',
        footerTextPage1: '<a href="https://creditera.bg/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; font-weight: 600;">CreditERA.bg</a> • Ипотечни и кредитни консултации • <a href="https://creditera.bg/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">www.creditera.bg</a>',
        footerMini: '<a href="https://creditera.bg/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">CREDITERA.BG</a>',
        disclaimer: 'Отказ от отговорност: Представените данни имат информативен характер и отразяват официалната статистика на ЕЦБ и БНБ към момента на съставяне на бюлетина. CreditERA.bg не носи отговорност за промени в тарифите на банковите институции.',
        compiler: {
            name: 'гл. ас. д-р Мирослав Владимиров',
            title: '',
            email: 'mvladimirov@creditera.bg'
        },
        pdfPrefix: 'CreditERA.bg_Бюлетин'
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BRANDS };
}
