import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const targetDir = path.resolve(__dirname, '../public/assets/resume');
const targetFile = path.join(targetDir, 'resume.pdf');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Generate a valid PDF-1.4 file
function createPdfBuffer() {
  const lines = [
    'BT',
    '/F1 20 Tf',
    '50 740 Td',
    '(Sridhar Vpr - Electronics & Communication Engineering | Full-Stack Developer) Tj',
    '/F1 10 Tf',
    '0 -24 Td',
    '(Email: sridharvpr7@gmail.com | GitHub: github.com/sridharvpr7 | LinkedIn: linkedin.com/in/sridhar-manivannan-468ba035b) Tj',
    '0 -16 Td',
    '(Location: Tamil Nadu, India | Portfolio: https://sridharvpr-portfolio.onrender.com) Tj',
    '/F1 13 Tf',
    '0 -30 Td',
    '(EDUCATION) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    '(J.N.N. Institute of Engineering - Bachelor of Engineering in Electronics and Communication (2025 - 2029)) Tj',
    '0 -14 Td',
    '(Coursework: Digital Electronics, VLSI Design, Verilog HDL, Computer Architecture, Embedded Systems) Tj',
    '/F1 13 Tf',
    '0 -30 Td',
    '(TECHNICAL SKILLS) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    '(Hardware & ECE: Digital Logic, Verilog HDL, RTL Design, CMOS, Microcontrollers, UART, SPI, I2C) Tj',
    '0 -14 Td',
    '(Web & Software: React 19, TypeScript, JavaScript, Node.js, Express, PostgreSQL, Firebase, SQLite) Tj',
    '0 -14 Td',
    '(Tools: Git, GitHub, VS Code, Vite, Render, ModelSim, EDA Playground) Tj',
    '/F1 13 Tf',
    '0 -30 Td',
    '(INTERNSHIPS & CERTIFICATIONS) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    '(Codec Technologies - Digital Electronics & VLSI Intern (AICTE & ICAC Approved, July-Aug 2026)) Tj',
    '0 -14 Td',
    '(CodeAlpha - Frontend Development Intern (Scheduled July 2026)) Tj',
    '0 -14 Td',
    '(Infosys Springboard - VLSI Digital Design: Chip Design & Verilog Programming) Tj',
    '0 -14 Td',
    '(Infosys Springboard - Digital Electronics | Internet of Things | JavaScript | HTML5 | CSS3) Tj',
    '/F1 13 Tf',
    '0 -30 Td',
    '(FEATURED PROJECTS) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    '(Beyond the Circuit - Personal Engineering Portfolio (React 19, TypeScript, Vite, Neon PostgreSQL)) Tj',
    '0 -14 Td',
    '(Elder\\047s Veil - Full-Stack Comic Reading Platform (JavaScript, Node.js, Express, PostgreSQL)) Tj',
    '0 -14 Td',
    '(CONVET PULSE - Engineering Radix & Unit Converter (HTML5, CSS3, JavaScript, Signal Formulas)) Tj',
    '0 -14 Td',
    '(Portfolio Manager - Investment Tracking Platform (Node.js, SQLite, XIRR Analytics)) Tj',
    '0 -14 Td',
    '(Kabaddi Pro - Digital Tournament Management Suite (JavaScript, jsPDF)) Tj',
    'ET'
  ];

  const streamContent = lines.join('\n');
  const streamLength = Buffer.byteLength(streamContent);

  const objects = [
    `%PDF-1.4\n`,
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`,
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`
  ];

  let body = '';
  const xrefOffsets = [0];
  let currentOffset = 0;

  for (let i = 0; i < objects.length; i++) {
    if (i === 0) {
      body += objects[i];
      currentOffset += Buffer.byteLength(objects[i]);
    } else {
      xrefOffsets.push(currentOffset);
      body += objects[i];
      currentOffset += Buffer.byteLength(objects[i]);
    }
  }

  const startxref = currentOffset;
  let xref = `xref\n0 ${xrefOffsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < xrefOffsets.length; i++) {
    xref += String(xrefOffsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size ${xrefOffsets.length} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;
  return Buffer.from(body + xref + trailer, 'latin1');
}

fs.writeFileSync(targetFile, createPdfBuffer());
console.log('Successfully created resume PDF at:', targetFile);
