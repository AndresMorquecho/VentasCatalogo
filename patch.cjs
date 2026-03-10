const fs = require('fs');
let txt = fs.readFileSync('diff-utf8.txt', 'utf8');

const replacements = [
    ['NÃ\\u0082Â°', 'N°'],
    ['NÂ°', 'N°'],
    ['CATÃ\\u0083Â¡LOGO', 'CATÁLOGO'],
    ['CATÃ¡LOGO', 'CATÁLOGO'],
    ['MÃ\\u0083Â­nimo', 'Mínimo'],
    ['MÃ­nimo', 'Mínimo'],
    ['mÃ\\u0083Â©todo', 'método'],
    ['mÃ©todo', 'método'],
    ['nÃ\\u0083Âºmero', 'número'],
    ['nÃºmero', 'número'],
    ['DEPÃ\\u0083Â“SITO', 'DEPÓSITO'],
    ['DEPÃ“SITO', 'DEPÓSITO'],
    ['GestiÃ\\u0083Â³n', 'Gestión'],
    ['GestiÃ³n', 'Gestión'],
    ['ObservaciÃ\\u0083Â³n', 'Observación'],
    ['ObservaciÃ³n', 'Observación'],
    ['cÃ\\u0083Â©dula', 'cédula'],
    ['cÃ©dula', 'cédula'],
    ['InformaciÃ³n', 'Información'],
    ['NÃºmero', 'Número'],
    ['CÃ³digo', 'Código'],
];

for (const [search, replace] of replacements) {
    if (search.includes('\\u')) {
        const regex = new RegExp(search.replace(/\\/g, '\\\\'), 'g');
        txt = txt.replace(regex, replace);
    } else {
        txt = txt.replace(new RegExp(search, 'g'), replace);
    }
}

fs.writeFileSync('diff-clean.patch', txt);
