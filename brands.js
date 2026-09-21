const BRANDS = {
    akpb: {
        id: 'akpb',
        name: 'АКПБ',
        companyName: 'Асоциация на кредитните посредници в България',
        headerTitle: 'АСОЦИАЦИЯ НА КРЕДИТНИТЕ ПОСРЕДНИЦИ',
        headerSubtitle: 'В БЪЛГАРИЯ',
        docTitle: 'ИНФОРМАЦИОНЕН БЮЛЕТИН',
        docSubText: 'Ипотечни лихви • Брой',
        logoHtml: `
            <svg viewBox="0 0 100 100" class="pdf-logo-svg" style="width: 44px; height: 44px;">
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
        footerTextPage1: 'АКПБ • Асоциация на кредитните посредници в България',
        footerInfoPage2: '<span>АКПБ • Асоциация на кредитните посредници в България</span><span>Уебсайт: <a href="https://acib.bg" target="_blank">www.acib.bg</a> • Е-поща: office@acib.bg</span>',
        disclaimer: 'Отказ от отговорност: Представените данни имат информативен характер и отразяват офертните условия на банките към момента на съставяне на бюлетина. АКПБ не носи отговорност за промени в тарифите на банковите институции.',
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
        docSubText: 'Ипотечни лихви • Брой',
        logoHtml: `
            <img src="assets/creditera-logo.png" alt="CreditERA Logo" class="pdf-logo-img" style="height: 40px; width: auto; max-width: 140px; object-fit: contain;" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
            <div class="logo-fallback" style="display: none; font-family: Montserrat; font-weight: 900; font-size: 20px; color: var(--color-primary); align-items: center; gap: 2px;">
                <span style="color: var(--color-accent);">Credit</span>ERA
            </div>
        `,
        palette: {
            primary: '#202E64',
            primaryLight: '#2c3e80',
            accent: '#3EA93F',
            accentDark: '#328c33',
            bgLight: '#F1F8F1',
            textDark: '#202E64'
        },
        footerTextPage1: 'CreditERA · mvladimirov@creditera.bg',
        footerInfoPage2: '<span>CreditERA</span><span>Е-поща: mvladimirov@creditera.bg</span>',
        disclaimer: 'Отказ от отговорност: Представените данни имат информативен характер и отразяват офертните условия на банките към момента на съставяне на бюлетина. CreditERA не носи отговорност за промени в тарифите на банковите институции.',
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
