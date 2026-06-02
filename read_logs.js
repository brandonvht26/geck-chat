const fs = require('fs');
const path = require('path');

const targetWords = ['se ha seleccionado ningún archivo', 'AxiosError', 'Error: ', 'uploadAsync', 'GeckChat', 'Error de conexión', 'Exception'];

function scanFile(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) return;
    
    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf16le');
    } catch(e) {
      content = fs.readFileSync(filePath, 'utf8');
    }
    
    const lines = content.split('\n');
    const matched = lines.filter(line => targetWords.some(word => line.includes(word)));
    
    console.log(`\n--- RESULTADOS EN ${filename} ---`);
    if (matched.length > 0) {
      console.log(matched.slice(-20).join('\n'));
    } else {
      console.log('No se encontraron errores relevantes.');
    }
  } catch (e) {
    console.error(`Error leyendo ${filename}: ${e.message}`);
  }
}

scanFile('emulator.log');
scanFile('emulator2.log');
