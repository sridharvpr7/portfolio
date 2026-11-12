import fs from 'node:fs';
import sharp from 'sharp';

async function createPdfFromJpeg(inputPath, outputPath) {
  const metadata = await sharp(inputPath).metadata();
  const width = metadata.width;
  const height = metadata.height;
  const jpegBuffer = fs.readFileSync(inputPath);

  // PDF coordinate points: standard 72 points per inch, or match pixel dimensions:
  // Points = pixels * (72 / density). Since density is 150, ptWidth = 3125 * 72 / 150 = 1500, ptHeight = 2209 * 72 / 150 = 1060.32
  const ptWidth = (width * 72) / (metadata.density || 150);
  const ptHeight = (height * 72) / (metadata.density || 150);

  const objects = [];
  
  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  
  // Object 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  
  // Object 3: Page
  objects.push(`3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 ${ptWidth.toFixed(2)} ${ptHeight.toFixed(2)}]
  /Resources <<
    /XObject << /Im1 4 0 R >>
  >>
  /Contents 5 0 R
>>
endobj`);

  // Object 4: Image XObject with DCTDecode (raw JPEG pass-through)
  const imgHeader = `4 0 obj
<<
  /Type /XObject
  /Subtype /Image
  /Width ${width}
  /Height ${height}
  /ColorSpace /DeviceRGB
  /BitsPerComponent 8
  /Filter /DCTDecode
  /Length ${jpegBuffer.length}
>>
stream
`;
  const imgFooter = '\nendstream\nendobj';

  // Object 5: Contents
  const contentStream = `q ${ptWidth.toFixed(2)} 0 0 ${ptHeight.toFixed(2)} 0 0 cm /Im1 Do Q`;
  const contentObj = `5 0 obj
<< /Length ${Buffer.byteLength(contentStream)} >>
stream
${contentStream}
endstream
endobj`;

  // Build the complete PDF buffer
  const chunks = [];
  let currentOffset = 0;
  
  function addString(str) {
    const buf = Buffer.from(str, 'utf-8');
    chunks.push(buf);
    currentOffset += buf.length;
  }
  
  function addBuffer(buf) {
    chunks.push(buf);
    currentOffset += buf.length;
  }

  const offsets = [];
  
  addString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Obj 1
  offsets.push(currentOffset);
  addString(objects[0] + '\n');

  // Obj 2
  offsets.push(currentOffset);
  addString(objects[1] + '\n');

  // Obj 3
  offsets.push(currentOffset);
  addString(objects[2] + '\n');

  // Obj 4
  offsets.push(currentOffset);
  addString(imgHeader);
  addBuffer(jpegBuffer);
  addString(imgFooter + '\n');

  // Obj 5
  offsets.push(currentOffset);
  addString(contentObj + '\n');

  // xref table
  const xrefOffset = currentOffset;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  addString(xref);

  const finalPdf = Buffer.concat(chunks);
  fs.writeFileSync(outputPath, finalPdf);
  console.log(`Created PDF: ${outputPath} (${finalPdf.length} bytes)`);
}

createPdfFromJpeg(
  'public/assets/certificates/codealpha Fend.jpg',
  'public/assets/certificates/codealpha-frontend-internship-offer.pdf'
);

