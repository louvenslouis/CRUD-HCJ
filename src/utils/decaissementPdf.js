const PDF_LIB_ESM_URLS = [
    'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm',
    'https://unpkg.com/pdf-lib@1.17.1/+esm',
];
const PDF_LIB_SCRIPT_URLS = [
    'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
];

const normalizeBaseUrl = (baseUrl) => {
    if (!baseUrl) return '/';
    const trimmed = baseUrl.trim();
    if (!trimmed) return '/';
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

const BASE_URL = normalizeBaseUrl(import.meta.env.BASE_URL);
export const DECAISSEMENT_TEMPLATE_PDF_URL = `${BASE_URL}forms/demande-decaissement.pdf`;

let pdfLibPromise = null;

const normalize = (value) =>
    String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

const formatDate = (rawValue) => {
    if (!rawValue) return '';
    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) return String(rawValue);
    return parsed.toLocaleDateString('fr-FR');
};

const getValues = (entry) => ({
    date: formatDate(entry.date || entry.created_at),
    demandeur: entry.demandeur || '',
    beneficiaire: entry.beneficiaire || '',
    motif: entry.motif || '',
});

const TARGET_FIELDS = ['date', 'demandeur', 'beneficiaire', 'motif'];

const FIELD_ALIASES = {
    date: ['date'],
    demandeur: ['demandeur', 'demandeur0', 'requester'],
    beneficiaire: ['beneficiaire', 'beneficiaire0', 'beneficiary'],
    motif: ['motif', 'raison'],
};

const DEFAULT_FIELD_RECTS = {
    date: { x: 127.1512, y: 557.5123, x2: 282.2557, y2: 582.1282 },
    demandeur: { x: 480.7228, y: 559.4347, x2: 596.3567, y2: 593.8008 },
    beneficiaire: { x: 123.0116, y: 533.9122, x2: 290.5896, y2: 551.5923 },
    motif: { x: 120.0188, y: 502.852, x2: 287.3419, y2: 525.0249 },
};

const normalizeRect = (rect) => ({
    x: Math.min(rect.x, rect.x2),
    y: Math.min(rect.y, rect.y2),
    x2: Math.max(rect.x, rect.x2),
    y2: Math.max(rect.y, rect.y2),
    width: Math.abs(rect.x2 - rect.x),
    height: Math.abs(rect.y2 - rect.y),
});

const extractWidgetsFromPdf = (sourceBytes) => {
    const decoder = new TextDecoder('latin1');
    const pdfText = decoder.decode(sourceBytes);
    const regex = /\/Rect\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\][\s\S]*?\/T\s*\(([^)]*)\)/g;
    const widgets = [];
    let match = regex.exec(pdfText);
    while (match) {
        const rect = normalizeRect({
            x: Number(match[1]),
            y: Number(match[2]),
            x2: Number(match[3]),
            y2: Number(match[4]),
        });
        const rawName = String(match[5] || '');
        widgets.push({
            rawName,
            name: normalize(rawName),
            rect,
        });
        match = regex.exec(pdfText);
    }
    return widgets;
};

const buildFieldMeta = (textFields, widgets) =>
    textFields.map((field, index) => ({
        field,
        index,
        name: normalize(field.getName()),
        rawName: normalize(widgets[index]?.rawName || ''),
    }));

const assignToIndex = (fieldMeta, index, value, usedIndexes) => {
    if (index === -1 || usedIndexes.has(index) || !value) return false;
    fieldMeta[index].field.setText(String(value));
    usedIndexes.add(index);
    return true;
};

const assignByAliases = (fieldMeta, aliases, value, usedIndexes) => {
    if (!value) return false;
    const normalizedAliases = aliases.map(normalize).filter(Boolean);

    const exactNameIndex = fieldMeta.findIndex((meta) =>
        !usedIndexes.has(meta.index)
        && normalizedAliases.some((alias) => meta.name === alias || meta.rawName === alias)
    );
    if (assignToIndex(fieldMeta, exactNameIndex, value, usedIndexes)) return true;

    const partialNameIndex = fieldMeta.findIndex((meta) =>
        !usedIndexes.has(meta.index)
        && normalizedAliases.some((alias) => meta.name.includes(alias) || meta.rawName.includes(alias))
    );
    return assignToIndex(fieldMeta, partialNameIndex, value, usedIndexes);
};

const findRectByAliases = (widgets, aliases) => {
    const normalizedAliases = aliases.map(normalize).filter(Boolean);
    const widget = widgets.find((item) =>
        normalizedAliases.some((alias) => item.name === alias || item.name.includes(alias))
    );
    return widget?.rect || null;
};

const fitTextToRect = (text, rect, fontSize) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    const maxChars = Math.max(6, Math.floor((rect.width - 4) / (fontSize * 0.52)));
    if (clean.length <= maxChars) return clean;
    if (maxChars <= 3) return clean.slice(0, maxChars);
    return `${clean.slice(0, maxChars - 3)}...`;
};

const drawValueInRect = (page, font, value, rectInput) => {
    if (!value || !rectInput) return false;
    const rect = normalizeRect(rectInput);
    const fontSize = rect.height >= 24 ? 12 : 10;
    const text = fitTextToRect(value, rect, fontSize);
    if (!text) return false;

    const x = rect.x + 2;
    const y = rect.y + Math.max(1, (rect.height - fontSize) / 2);
    page.drawText(text, { x, y, size: fontSize, font });
    return true;
};

const tryGetTextFieldByAlias = (form, aliases) => {
    for (const alias of aliases) {
        try {
            const field = form.getTextField(alias);
            if (field) return field;
        } catch {
            // Try next alias
        }
    }
    return null;
};

const loadPdfLibFromScript = async (url) =>
    new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-pdf-lib-url="${url}"]`);
        if (existing) {
            if (window.PDFLib) {
                resolve(window.PDFLib);
                return;
            }
            existing.addEventListener('load', () => resolve(window.PDFLib));
            existing.addEventListener('error', () => reject(new Error(`Impossible de charger ${url}`)));
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.setAttribute('data-pdf-lib-url', url);
        script.onload = () => {
            if (window.PDFLib) resolve(window.PDFLib);
            else reject(new Error(`PDFLib indisponible apres chargement: ${url}`));
        };
        script.onerror = () => reject(new Error(`Impossible de charger ${url}`));
        document.head.appendChild(script);
    });

const loadPdfLib = async () => {
    if (pdfLibPromise) return pdfLibPromise;

    pdfLibPromise = (async () => {
        for (const url of PDF_LIB_ESM_URLS) {
            try {
                const mod = await import(/* @vite-ignore */ url);
                if (mod?.PDFDocument) return mod;
            } catch {
                // Continue with next CDN URL
            }
        }

        for (const url of PDF_LIB_SCRIPT_URLS) {
            try {
                const globalLib = await loadPdfLibFromScript(url);
                if (globalLib?.PDFDocument) return globalLib;
            } catch {
                // Continue with next CDN URL
            }
        }

        throw new Error('Chargement de pdf-lib impossible (CDN inaccessible)');
    })();

    try {
        return await pdfLibPromise;
    } catch (error) {
        pdfLibPromise = null;
        throw error;
    }
};

export const createFilledDecaissementPdf = async (entry) => {
    const { PDFDocument, StandardFonts } = await loadPdfLib();
    const response = await fetch(DECAISSEMENT_TEMPLATE_PDF_URL);
    if (!response.ok) {
        throw new Error('Template PDF introuvable');
    }

    const sourceBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(sourceBytes);
    const widgets = extractWidgetsFromPdf(sourceBytes);
    const values = getValues(entry);
    const page = pdfDoc.getPages()[0];
    if (!page) throw new Error('Aucune page PDF detectee');
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const assignedKeys = new Set();

    // First pass: set real AcroForm fields when accessible.
    try {
        const form = pdfDoc.getForm();
        const textFields = form
            .getFields()
            .filter((field) => typeof field?.setText === 'function');
        const fieldMeta = buildFieldMeta(textFields, widgets);
        const usedIndexes = new Set();

        TARGET_FIELDS.forEach((key) => {
            const value = values[key];
            if (!value) return;
            const aliases = FIELD_ALIASES[key] || [key];
            const directField = tryGetTextFieldByAlias(form, aliases);
            if (directField) {
                directField.setText(String(value));
                assignedKeys.add(key);
                return;
            }
            const didAssign = assignByAliases(fieldMeta, aliases, value, usedIndexes);
            if (didAssign) assignedKeys.add(key);
        });

        form.updateFieldAppearances();
    } catch {
        // Some PDFs expose widgets without a usable AcroForm dictionary.
    }

    // Second pass (guaranteed): draw visible text at known field rectangles.
    TARGET_FIELDS.forEach((key) => {
        const value = values[key];
        if (!value) return;
        const aliases = FIELD_ALIASES[key] || [key];
        const detectedRect = findRectByAliases(widgets, aliases);
        const fallbackRect = DEFAULT_FIELD_RECTS[key] ? normalizeRect(DEFAULT_FIELD_RECTS[key]) : null;
        const targetRect = detectedRect || fallbackRect;
        const drawn = drawValueInRect(page, font, value, targetRect);
        if (drawn) assignedKeys.add(key);
    });

    const expectedCount = TARGET_FIELDS.filter((key) => Boolean(values[key])).length;
    if (expectedCount > 0 && assignedKeys.size === 0) {
        const availableWidgets = widgets.map((widget) => widget.rawName).filter(Boolean).join(', ');
        throw new Error(`Echec de placement texte. Widgets detectes: ${availableWidgets || 'aucun'}`);
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};
