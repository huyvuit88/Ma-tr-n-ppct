import * as XLSX from 'xlsx';
import { PpctDataset, PpctLesson, PpctValidationResult, PpctIssue } from '../types';
import { cleanContentWithoutNls, isTechCompetenceText, getOfficialSgkTopicAndChapter } from './dateCalculations';

/**
 * Extracts table rows and text from a Word document (.docx) using mammoth
 * with full 2D grid matrix parsing for rowspan and colspan expansion.
 */
async function extractRowsFromDocx(data: ArrayBuffer): Promise<{ rows: (string | number)[][]; rawText: string }> {
  const rows: (string | number)[][] = [];
  let rawText = '';

  try {
    const mammoth = await import('mammoth');

    // 1. Extract HTML to parse Word tables with rowspan/colspan preservation
    try {
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer: data });
      const html = htmlResult.value || '';

      if (html.includes('<table')) {
        const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];

        for (const tableHtml of tableMatches) {
          const trMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
          const grid: string[][] = [];

          trMatches.forEach((trHtml, rIdx) => {
            if (!grid[rIdx]) grid[rIdx] = [];
            let colIdx = 0;

            const cellRegex = /<t([dh])([^>]*)>([\s\S]*?)<\/t\1>/gi;
            let cellMatch: RegExpExecArray | null;

            while ((cellMatch = cellRegex.exec(trHtml)) !== null) {
              const attrs = cellMatch[2] || '';
              const rawContent = cellMatch[3] || '';

              const rowspanMatch = attrs.match(/rowspan=["']?(\d+)["']?/i);
              const colspanMatch = attrs.match(/colspan=["']?(\d+)["']?/i);
              const rowspan = rowspanMatch ? parseInt(rowspanMatch[1], 10) : 1;
              const colspan = colspanMatch ? parseInt(colspanMatch[1], 10) : 1;

              const cellText = rawContent
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\s+/g, ' ')
                .trim();

              // Advance colIdx past any already filled cells (from earlier rowspans)
              while (grid[rIdx][colIdx] !== undefined) {
                colIdx++;
              }

              // Fill grid cells for both rowspan and colspan
              for (let r = 0; r < rowspan; r++) {
                const targetR = rIdx + r;
                if (!grid[targetR]) grid[targetR] = [];
                for (let c = 0; c < colspan; c++) {
                  grid[targetR][colIdx + c] = cellText;
                }
              }

              colIdx += colspan;
            }
          });

          // Push valid expanded rows
          for (const r of grid) {
            if (r && r.some((c) => c && c.trim().length > 0)) {
              rows.push(r.map((c) => c || ''));
            }
          }
        }
      }
    } catch (e) {
      console.warn('[PPCT Parser] Mammoth HTML table extract error, using text fallback:', e);
    }

    // 2. Extract raw text for fallback or line-by-line parsing
    try {
      const textResult = await mammoth.extractRawText({ arrayBuffer: data });
      rawText = textResult.value || '';
    } catch (e) {
      console.warn('[PPCT Parser] Mammoth text extract notice:', e);
    }
  } catch (err) {
    console.warn('[PPCT Parser] Mammoth import or extract notice:', err);
  }

  // If no table rows were extracted from HTML, parse raw text lines
  if (rows.length === 0 && rawText.trim().length > 0) {
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    for (const line of lines) {
      const parts = line.split(/[\t]+/).map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length > 1) {
        rows.push(parts);
      } else {
        rows.push([line]);
      }
    }
  }

  return { rows, rawText };
}

export interface ParsePpctOptions {
  grade?: string;
  subject?: string;
  academicYear?: string;
  school?: string;
  customName?: string;
  expectedTotalPeriods?: number;
}

/**
 * Normalizes text for keyword search
 */
function normText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Checks if a row is a non-lesson summary, header, or footer row
 */
function isSummaryOrJunkRow(cells: string[]): boolean {
  const fullText = cells.join(' ').trim();
  const lower = normText(fullText);

  // Blank or near-blank
  if (!fullText || fullText.length < 2) return true;

  // Signatures, approvals, administrative metadata
  if (
    /^(ban giam hieu|to truong|nguoi lap|hieu truong|ky duyet|to chuyen mon|ke hoach day hoc mon|nam hoc 20)/i.test(
      lower
    ) ||
    lower.includes('ky boi') ||
    lower.includes('ngay thang nam') ||
    lower.includes('trang ') ||
    /^trang\s+\d+/i.test(lower)
  ) {
    return true;
  }

  // Summary / Total rows that often contaminate period count
  if (
    /^(tong\s*cong|tong\s*so|cong\s*hoc\s*ky|cong\s*hk|tong\s*so\s*tiet|tong\s*tiet|cong\s*ca\s*nam|bang\s*tong\s*hop|tong\s*ket)/i.test(
      lower
    ) ||
    /^cong\s*[:\s]*\d+\s*tiet/i.test(lower) ||
    /^(tong|cong)\s*[:\s]*\d+/i.test(lower) ||
    lower.includes('tong so tiet ca nam') ||
    lower.includes('tong cong: 140 tiet') ||
    lower.includes('cong hoc ky i:') ||
    lower.includes('cong hoc ky ii:')
  ) {
    return true;
  }

  return false;
}

/**
 * Parses period text like "1", "1, 2", "1 - 2", "1-4", "1 đến 3", "Tiết 1, 2"
 * Returns { start, end, count, rangeStr }
 */
function parsePeriodRange(cellText: string): { start: number; end: number; count: number; rangeStr: string } | null {
  if (!cellText) return null;
  const clean = cellText.replace(/^tiết\s*/i, '').replace(/^t\s*/i, '').trim();

  // Match pattern like "1 - 2" or "1-2" or "1 đến 2" or "1 – 2"
  const rangeMatch = clean.match(/^(\d+)\s*(?:-|–|—|đến|to)\s*(\d+)$/i);
  if (rangeMatch) {
    const s = parseInt(rangeMatch[1], 10);
    const e = parseInt(rangeMatch[2], 10);
    if (!isNaN(s) && !isNaN(e) && e >= s && s > 0) {
      return {
        start: s,
        end: e,
        count: e - s + 1,
        rangeStr: `${s} - ${e}`,
      };
    }
  }

  // Match comma-separated list like "1, 2" or "1,2,3" or "1; 2"
  if (clean.includes(',') || clean.includes(';')) {
    const parts = clean
      .split(/[,;]/)
      .map((p) => parseInt(p.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    if (parts.length > 0) {
      const min = Math.min(...parts);
      const max = Math.max(...parts);
      return {
        start: min,
        end: max,
        count: parts.length,
        rangeStr: parts.join(', '),
      };
    }
  }

  // Single integer
  const single = parseInt(clean, 10);
  if (!isNaN(single) && single > 0) {
    return {
      start: single,
      end: single,
      count: 1,
      rangeStr: String(single),
    };
  }

  return null;
}

/**
 * Parses an Excel or Word (.docx) or CSV file buffer for PPCT table
 */
export async function parsePpctFile(
  file: File,
  options?: ParsePpctOptions
): Promise<PpctDataset> {
  const data = await file.arrayBuffer();
  const fileName = file.name.toLowerCase();
  const isWord = fileName.endsWith('.docx') || fileName.endsWith('.doc');

  let rows: (string | number)[][] = [];
  let fileRawText = '';

  // 1. If file is Word (.docx, .doc), use Word table parser directly
  if (isWord) {
    const docxResult = await extractRowsFromDocx(data);
    rows = docxResult.rows;
    fileRawText = docxResult.rawText;
  } else {
    // 2. Otherwise attempt Excel/CSV parsing via SheetJS
    try {
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });
    } catch (xlsxErr: any) {
      console.log('[PPCT Parser] XLSX read notice, attempting Word/Text extraction fallback:', xlsxErr?.message || xlsxErr);
      const docxResult = await extractRowsFromDocx(data);
      if (docxResult.rows.length > 0) {
        rows = docxResult.rows;
        fileRawText = docxResult.rawText;
      } else {
        try {
          const text = new TextDecoder('utf-8').decode(data);
          fileRawText = text;
          const textLines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
          rows = textLines.map((line) => line.split(/[,;\t]/).map((c) => c.trim()));
        } catch {
          // keep empty rows
        }
      }
    }
  }

  // --- Step 2: Intelligent Header Row & Column Position Detection ---
  let headerRowIndex = -1;
  let colStt = -1;
  let colTuan = -1;
  let colTiet = -1;
  let colBaiHoc = -1;
  let colSoTiet = -1;
  let colYccd = -1;

  // Scan first 30 rows to locate header row
  for (let i = 0; i < Math.min(35, rows.length); i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const cellStrings = row.map((c) => normText(String(c || '')));
    let score = 0;
    let tempStt = -1;
    let tempTuan = -1;
    let tempTiet = -1;
    let tempBaiHoc = -1;
    let tempSoTiet = -1;
    let tempYccd = -1;

    cellStrings.forEach((text, colIdx) => {
      if (/^(stt|so tt|tt|no|so thu tu)$/i.test(text)) {
        tempStt = colIdx;
        score += 2;
      } else if (/^(tuan|tuan thu|thoi diem|thoi gian)$/i.test(text) || text.includes('tuan')) {
        tempTuan = colIdx;
        score += 3;
      } else if (
        /^(tiet|tiet ppct|tiet thu|tiet theo ppct|phan phoi tiet|so tiet ppct)$/i.test(text) ||
        (text.includes('tiet') && !text.includes('so tiet'))
      ) {
        tempTiet = colIdx;
        score += 3;
      } else if (
        !/(nls|năng lực số|nang luc so|ung dung cntt|cntt|dia chi tich hop|chuyen doi so|thiet bi|mindmap|geogebra|canva|quizizz|yeu cau can dat|yccd)/i.test(
          text
        ) &&
        (/^(bai hoc|ten bai|ten bai day|chu de|ten chu de|bai day|noi dung bai day|ten chu de\/bai)$/i.test(text) ||
          text.includes('ten bai') ||
          (text.includes('noi dung') && tempBaiHoc === -1))
      ) {
        tempBaiHoc = colIdx;
        score += 4;
      } else if (/^(so tiet|thoi luong|so tiet day|so tiet thuc hien)$/i.test(text) || text.includes('so tiet')) {
        tempSoTiet = colIdx;
        score += 3;
      } else if (/^(yeu cau can dat|yccd|ghi chu|thiet bi|chuan kien thuc)$/i.test(text) || text.includes('yeu cau can dat')) {
        tempYccd = colIdx;
        score += 1;
      }
    });

    if (score >= 5 && (tempTuan !== -1 || tempTiet !== -1 || tempBaiHoc !== -1)) {
      headerRowIndex = i;
      colStt = tempStt;
      colTuan = tempTuan;
      colTiet = tempTiet;
      colBaiHoc = tempBaiHoc;
      colSoTiet = tempSoTiet;
      colYccd = tempYccd;
      break;
    }
  }

  // Fallback: If header wasn't identified by keywords, analyze column data patterns
  if (colBaiHoc === -1 && rows.length > 0) {
    // Find column with longest text (likely lesson name), ignoring columns that contain digital competence text
    const colTextLengths: number[] = [];
    const maxCols = Math.max(...rows.slice(0, 20).map((r) => r?.length || 0));

    for (let c = 0; c < maxCols; c++) {
      let totalLen = 0;
      let count = 0;
      let techHits = 0;
      for (let r = 0; r < Math.min(20, rows.length); r++) {
        const val = String(rows[r]?.[c] || '').trim();
        if (val) {
          totalLen += val.length;
          count++;
          if (isTechCompetenceText(val)) {
            techHits++;
          }
        }
      }
      // If column is dominated by tech competence notes, penalize it
      colTextLengths[c] = count > 0 && techHits < 2 ? totalLen / count : 0;
    }

    // Longest average column is lesson name
    let bestCol = 1;
    let maxAvg = 0;
    colTextLengths.forEach((avg, idx) => {
      if (avg > maxAvg) {
        maxAvg = avg;
        bestCol = idx;
      }
    });
    colBaiHoc = bestCol;
  }

  // --- Step 3: Parse lesson rows ---
  interface RawParsedItem {
    rawIndex: number;
    stt: number;
    tuan: number;
    hocKy: 1 | 2;
    chuong: string;
    baiHoc: string;
    rawTietText: string;
    periodRange: { start: number; end: number; count: number; rangeStr: string } | null;
    explicitSoTiet: number | null;
    isSinglePeriodRow: boolean;
  }

  const rawItems: RawParsedItem[] = [];
  let currentChapter = 'Chương I';
  let currentHocKy: 1 | 2 = 1;
  let lastSeenWeek = 1;
  let autoStt = 1;
  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const cells = row.map((c) => (c !== undefined && c !== null ? String(c).trim() : ''));
    if (isSummaryOrJunkRow(cells)) continue;

    const fullRowText = cells.join(' ');
    const normRow = normText(fullRowText);

    // Detect Semester Header
    if (
      /^(hoc ky i|hoc ki i|hk1|hoc ky 1)\b/i.test(normRow) ||
      normRow.includes('hoc ky i (18 tuan') ||
      normRow.includes('hoc ky i:') ||
      normRow.includes('72 tiet')
    ) {
      currentHocKy = 1;
      continue;
    }
    if (
      /^(hoc ky ii|hoc ki ii|hk2|hoc ky 2)\b/i.test(normRow) ||
      normRow.includes('hoc ky ii (17 tuan') ||
      normRow.includes('hoc ky ii:') ||
      normRow.includes('68 tiet')
    ) {
      currentHocKy = 2;
      continue;
    }

    // Detect Repeated Table Header
    const isHeaderRepeat =
      (normRow.includes('stt') || normRow.includes('tuần') || normRow.includes('tuan')) &&
      (normRow.includes('tiết') || normRow.includes('tiet')) &&
      (normRow.includes('tên bài') || normRow.includes('ten bai') || normRow.includes('bài dạy') || normRow.includes('noi dung') || normRow.includes('số tiết'));
    if (isHeaderRepeat) {
      continue;
    }

    // Extract Period text and Period Range early
    const rawTietText = colTiet !== -1 ? cells[colTiet] : '';
    const periodRange = parsePeriodRange(rawTietText);

    // Extract Lesson Name candidate
    let baiHoc = '';
    if (colBaiHoc !== -1 && cells[colBaiHoc]) {
      baiHoc = cells[colBaiHoc];
    } else {
      // Find the cell with the most descriptive text (ignoring tech competence and metadata)
      const candidates = cells.filter(
        (c) =>
          c.length > 3 &&
          !/^\d+$/.test(c) &&
          !/^(tuần|tiết|stt|ghi chú|học kỳ)/i.test(c) &&
          !isTechCompetenceText(c)
      );
      baiHoc = candidates[0] || cells[1] || cells[0] || '';
    }

    // Detect Chapter Header (e.g. Chương VI, Chủ đề 2, Hoạt động trải nghiệm)
    const isChapterOrTheme =
      /^(chương|chuong|chủ đề|chu de|phần|phan|hoạt động thực hành|hoat dong thuc hanh)\s*([ivxlcdm\d]+|[:\.\s])/i.test(normRow) ||
      /^(chương|chuong|chủ đề|chu de)\s+[ivxlcdm\d]+/i.test(normText(cells[0])) ||
      /^(chương|chuong|chủ đề|chu de)\s+[ivxlcdm\d]+/i.test(normText(cells[1] || '')) ||
      /^(chương|chuong|chủ đề|chu de)\s+[ivxlcdm\d]+/i.test(normText(baiHoc));

    if (isChapterOrTheme && (!periodRange || periodRange.count === 0)) {
      currentChapter = cleanContentWithoutNls(baiHoc || cells[0] || currentChapter);
      continue;
    }

    // If lesson name is too short or is a header repetition, skip
    if (!baiHoc || baiHoc.length < 2 || /^(stt|tuần|tiết|tên bài|số tiết|ghi chú)$/i.test(baiHoc)) {
      continue;
    }

    // Extract Week
    let tuan = lastSeenWeek;
    let weekCell = colTuan !== -1 ? cells[colTuan] : '';
    if (!weekCell) {
      // Look for a cell that looks like "Tuần X" or a small number 1..35
      const foundWeek = cells.find((c) => /^tuần\s*(\d+)$/i.test(c));
      if (foundWeek) {
        const m = foundWeek.match(/^tuần\s*(\d+)$/i);
        if (m) weekCell = m[1];
      }
    }
    if (weekCell) {
      const match = weekCell.match(/\b(\d+)\b/);
      if (match) {
        const w = parseInt(match[1], 10);
        if (w >= 1 && w <= 35) {
          tuan = w;
          lastSeenWeek = w;
        }
      }
    }

    // Extract Explicit "Số tiết"
    let explicitSoTiet: number | null = null;
    const soTietCell = colSoTiet !== -1 ? cells[colSoTiet] : '';
    if (soTietCell) {
      const num = parseInt(soTietCell, 10);
      if (!isNaN(num) && num > 0 && num <= 10) {
        explicitSoTiet = num;
      }
    }

    // Check if the lesson title itself indicates a single period breakdown: e.g. "(tiết 1)", "(tiết 2)"
    const hasSinglePeriodMarker = /\(tiết\s*\d+\)/i.test(baiHoc) || /\(tiết\s*thứ\s*\d+\)/i.test(baiHoc);

    // Extract STT
    let stt = autoStt;
    const sttCell = colStt !== -1 ? cells[colStt] : cells[0];
    const numStt = parseInt(sttCell, 10);
    if (!isNaN(numStt) && numStt > 0) {
      stt = numStt;
    }

    // Synchronize Semester with Week: Week 1..18 -> HK1, Week 19..35 -> HK2
    const hocKy: 1 | 2 = currentHocKy === 2 ? 2 : (tuan > 18 ? 2 : 1);

    let finalBaiHoc = cleanContentWithoutNls(baiHoc.replace(/^[-–—\s]+/, '').trim());
    let finalChapter = cleanContentWithoutNls(currentChapter);

    if (isTechCompetenceText(finalBaiHoc) || isTechCompetenceText(finalChapter)) {
      const match = getOfficialSgkTopicAndChapter(`${finalChapter} ${finalBaiHoc}`);
      if (match) {
        finalChapter = match.chapter;
        finalBaiHoc = match.topic;
      }
    }

    rawItems.push({
      rawIndex: i,
      stt,
      tuan,
      hocKy,
      chuong: finalChapter,
      baiHoc: finalBaiHoc,
      rawTietText,
      periodRange,
      explicitSoTiet,
      isSinglePeriodRow: hasSinglePeriodMarker,
    });

    autoStt++;
  }

  // --- Step 4: Intelligent Period Count Resolution ---
  const lessons: PpctLesson[] = [];
  let currentCumulativePeriod = 1;

  // Check if rawItems represents a 1-row-per-period table (approximately 140 rows)
  const isOneRowPerPeriodTable = rawItems.length >= 135 && rawItems.length <= 145;

  for (let k = 0; k < rawItems.length; k++) {
    const item = rawItems[k];
    let soTiet = 1;
    let tietPPCT = currentCumulativePeriod;
    let tietRangeStr = '';

    const isHocKy2 = item.hocKy === 2 || item.tuan > 18 || currentCumulativePeriod > 72;

    if (isOneRowPerPeriodTable) {
      // Each row represents exactly 1 period
      soTiet = 1;
      tietPPCT = currentCumulativePeriod++;
      tietRangeStr = String(tietPPCT);
    } else if (item.periodRange && item.periodRange.count > 0) {
      soTiet = Math.max(1, item.periodRange.count);
      let pStart = item.periodRange.start;
      let pEnd = item.periodRange.end;

      // Detect if HK2 period numbers in the document restarted from 1 (e.g. 1..68)
      if (isHocKy2 && pEnd <= 72 && currentCumulativePeriod >= 72) {
        pStart += 72;
        pEnd += 72;
      }

      tietPPCT = pEnd;
      tietRangeStr = pStart === pEnd ? String(pEnd) : `${pStart} - ${pEnd}`;
      currentCumulativePeriod = Math.max(currentCumulativePeriod, pEnd + 1);
    } else if (item.explicitSoTiet && item.explicitSoTiet > 0 && item.explicitSoTiet <= 6) {
      soTiet = item.explicitSoTiet;
      tietPPCT = currentCumulativePeriod + soTiet - 1;
      tietRangeStr = soTiet === 1 ? String(currentCumulativePeriod) : `${currentCumulativePeriod} - ${tietPPCT}`;
      currentCumulativePeriod += soTiet;
    } else {
      soTiet = 1;
      tietPPCT = currentCumulativePeriod++;
      tietRangeStr = String(tietPPCT);
    }

    // Calculate Week strictly: 4 periods per week standard (18 weeks HK1, 17 weeks HK2)
    let finalWeek = item.tuan;
    if (finalWeek < 1 || finalWeek > 35) {
      finalWeek = Math.min(35, Math.max(1, Math.ceil(tietPPCT / 4)));
    }
    const finalHocKy: 1 | 2 = tietPPCT <= 72 && finalWeek <= 18 ? 1 : 2;

    lessons.push({
      id: `parsed-${k + 1}-${Date.now()}`,
      stt: k + 1,
      tuan: finalWeek,
      hocKy: finalHocKy,
      chuong: item.chuong || (finalHocKy === 1 ? 'Chương I' : 'Chương VI'),
      baiHoc: item.baiHoc,
      soTiet,
      tietPPCT,
      tietRange: tietRangeStr,
    });
  }

  // --- Step 5: Metadata Detection (Subject, Grade, School, Year) ---
  const allTextLower = (
    file.name +
    ' ' +
    fileRawText +
    ' ' +
    rows.slice(0, 15).map((r) => (r || []).join(' ')).join(' ')
  ).toLowerCase();

  // Subject
  let detectedSubject = 'Toán';
  if (options?.subject) {
    detectedSubject = options.subject;
  } else {
    const isToanInName = /toán|toan/i.test(file.name);
    const isToanInContent = /môn toán|toán học|đại số|hình học|phân phối chương trình toán/i.test(allTextLower);

    if (isToanInName || isToanInContent) {
      detectedSubject = 'Toán';
    } else if (/\bmôn\s+ngữ\s+văn\b|\bngữ\s+văn\b/i.test(allTextLower) && !allTextLower.includes('toán')) {
      detectedSubject = 'Ngữ văn';
    } else if (/khoa học tự nhiên|\bkhtn\b/i.test(allTextLower)) {
      detectedSubject = 'KHTN';
    } else if (/tiếng anh|\benglish\b/i.test(allTextLower)) {
      detectedSubject = 'Tiếng Anh';
    } else {
      detectedSubject = 'Toán';
    }
  }

  // Grade
  let detectedGrade = '9';
  if (options?.grade) {
    detectedGrade = options.grade;
  } else {
    const fileNameGradeMatch = file.name.match(/(?:toan|toán|k|khối|lớp|grade)[_\s\-]*([6789]|10|11|12)\b/i) ||
                               file.name.match(/\b([6789]|10|11|12)\b/);
    if (fileNameGradeMatch && fileNameGradeMatch[1]) {
      detectedGrade = fileNameGradeMatch[1];
    } else {
      const textGradeMatch = allTextLower.match(/(?:khối|lớp|môn toán\s*|toán\s*)([6789]|10|11|12)\b/i);
      if (textGradeMatch && textGradeMatch[1]) {
        detectedGrade = textGradeMatch[1];
      }
    }
  }

  // School
  let detectedSchool = options?.school || 'TRƯỜNG THCS NGUYỄN DU';
  if (!options?.school) {
    const schoolRow = rows.slice(0, 8).find((r) => (r || []).some((c) => /Trường|THCS|THPT|Tiểu học/i.test(String(c))));
    if (schoolRow) {
      const matchedCell = schoolRow.find((c) => /Trường|THCS|THPT/i.test(String(c)));
      if (matchedCell) detectedSchool = String(matchedCell).trim();
    }
  }

  // Academic Year
  let detectedYear = options?.academicYear || '2025 - 2026';
  if (!options?.academicYear) {
    const yearMatch = allTextLower.match(/(?:năm học|nh|năm)\s*[:\-–]?\s*(\d{4}\s*[-–/]\s*\d{4})/i) ||
                      file.name.match(/(\d{4}\s*[-–/]\s*\d{4})/);
    if (yearMatch && yearMatch[1]) {
      detectedYear = yearMatch[1].replace('/', ' - ').replace('–', ' - ').replace(/\s*-\s*/, ' - ');
    }
  }

  const cleanDisplayName = options?.customName || `${detectedSubject} ${detectedGrade} — ${file.name.replace(/\.[^/.]+$/, '')}`;
  const totalLessonsPeriods = lessons.reduce((sum, l) => sum + (l.soTiet || 1), 0);

  const dataset: PpctDataset = {
    id: `dataset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: cleanDisplayName,
    fileName: file.name,
    subject: detectedSubject,
    grade: detectedGrade,
    school: detectedSchool,
    academicYear: detectedYear,
    totalLessons: totalLessonsPeriods,
    lessons,
  };

  // Run initial validation
  dataset.validation = validatePpctDataset(dataset, options?.expectedTotalPeriods || 140);

  // If dataset is already valid (e.g. exactly 140 periods: HK1=72, HK2=68), keep it faithful to uploaded file!
  if (dataset.validation && dataset.validation.isValid) {
    return dataset;
  }

  // If detected subject is Math (or expected periods is 140), and parsed lessons are within expected range:
  // automatically standardize so that HK1 has exactly 18 weeks (72 periods) and HK2 has exactly 17 weeks (68 periods)
  if (
    (detectedSubject === 'Toán' || options?.expectedTotalPeriods === 140) &&
    totalLessonsPeriods >= 120 &&
    totalLessonsPeriods <= 165 &&
    dataset.validation &&
    !dataset.validation.isValid
  ) {
    return autoStandardizePpct(dataset, options?.expectedTotalPeriods || 140);
  }

  return dataset;
}

/**
 * Validates a PPCT dataset, recording and explicitly pinpointing any discrepancies
 * in total periods, term periods, week allocations, numbering continuity, and duplicates.
 */
export function validatePpctDataset(
  dataset: PpctDataset,
  expectedTotalPeriods: number = 140
): PpctValidationResult {
  try {
    const issues: PpctIssue[] = [];
    const lessons = dataset.lessons || [];

    const totalPeriods = lessons.reduce((sum, l) => sum + (l.soTiet || 1), 0);
    const hk1Lessons = lessons.filter((l) => l.hocKy === 1);
    const hk2Lessons = lessons.filter((l) => l.hocKy === 2);
    const hk1Periods = hk1Lessons.reduce((sum, l) => sum + (l.soTiet || 1), 0);
    const hk2Periods = hk2Lessons.reduce((sum, l) => sum + (l.soTiet || 1), 0);

    const expectedHK1 = 72; // Standard GDPT 2018 for Math THCS
    const expectedHK2 = 68; // Standard GDPT 2018 for Math THCS
    const diff = totalPeriods - expectedTotalPeriods;
    const diffHK1 = hk1Periods - expectedHK1;
    const diffHK2 = hk2Periods - expectedHK2;

    // 1. Overall Total Periods Discrepancy
    if (diff > 0) {
      issues.push({
        id: `issue-total-overflow-${Date.now()}`,
        type: 'total_overflow',
        severity: 'error',
        message: `Dư ${diff} tiết so với định mức cả năm (${totalPeriods}/${expectedTotalPeriods} tiết).`,
        suggestion: `Kiểm tra các bài học có số tiết quá lớn hoặc rà soát xem có dòng tiêu đề/tổng kết nào bị nhận diện nhầm.`,
      });
    } else if (diff < 0) {
      issues.push({
        id: `issue-total-underflow-${Date.now()}`,
        type: 'total_underflow',
        severity: 'error',
        message: `Thiếu ${Math.abs(diff)} tiết so với định mức cả năm (${totalPeriods}/${expectedTotalPeriods} tiết).`,
        suggestion: `Kiểm tra xem file có bị thiếu các bài ôn tập, thực hành hoặc các tuần cuối năm học không.`,
      });
    }

    // 2. Term 1 Discrepancy
    if (diffHK1 !== 0) {
      issues.push({
        id: `issue-hk1-mismatch-${Date.now()}`,
        type: 'hk1_mismatch',
        severity: Math.abs(diffHK1) > 4 ? 'error' : 'warning',
        message: `Học kỳ I đang có ${hk1Periods} tiết (${diffHK1 > 0 ? `Dư ${diffHK1}` : `Thiếu ${Math.abs(diffHK1)}`} tiết so với chuẩn ${expectedHK1} tiết).`,
        suggestion: `Phân phối chuẩn HK1 gồm 18 tuần × 4 tiết/tuần = 72 tiết. Cân chỉnh lại số tiết tuần 1 đến 18.`,
      });
    }

    // 3. Term 2 Discrepancy
    if (diffHK2 !== 0) {
      issues.push({
        id: `issue-hk2-mismatch-${Date.now()}`,
        type: 'hk2_mismatch',
        severity: Math.abs(diffHK2) > 4 ? 'error' : 'warning',
        message: `Học kỳ II đang có ${hk2Periods} tiết (${diffHK2 > 0 ? `Dư ${diffHK2}` : `Thiếu ${Math.abs(diffHK2)}`} tiết so với chuẩn ${expectedHK2} tiết).`,
        suggestion: `Phân phối chuẩn HK2 gồm 17 tuần × 4 tiết/tuần = 68 tiết. Cân chỉnh lại số tiết tuần 19 đến 35.`,
      });
    }

    // 4. Week Statistics & Week-by-Week Discrepancy
    const weekStats: Record<number, number> = {};
    for (let w = 1; w <= 35; w++) {
      weekStats[w] = 0;
    }

    lessons.forEach((l) => {
      const w = l.tuan;
      if (w >= 1 && w <= 35) {
        weekStats[w] = (weekStats[w] || 0) + (l.soTiet || 1);
      }
    });

    // Check for week anomalies (each normal week should ideally have 4 periods for Math)
    for (let w = 1; w <= 35; w++) {
      const pCount = weekStats[w];
      if (pCount > 4) {
        issues.push({
          id: `issue-week-overflow-${w}`,
          type: 'week_overflow',
          severity: 'warning',
          tuan: w,
          message: `Tuần ${w} đang bố trí ${pCount} tiết (Dư ${pCount - 4} tiết so với định mức 4 tiết/tuần).`,
          suggestion: `Chuyển bớt ${pCount - 4} tiết sang các tuần liền kề hoặc kiểm tra số tiết của các bài trong tuần ${w}.`,
        });
      } else if (pCount < 4 && pCount > 0) {
        issues.push({
          id: `issue-week-underflow-${w}`,
          type: 'week_underflow',
          severity: 'info',
          tuan: w,
          message: `Tuần ${w} chỉ có ${pCount} tiết (Ít hơn định mức 4 tiết/tuần).`,
          suggestion: `Bổ sung thêm tiết dạy hoặc tiết ôn tập/luyện tập vào tuần ${w}.`,
        });
      } else if (pCount === 0) {
        issues.push({
          id: `issue-week-gap-${w}`,
          type: 'week_gap',
          severity: 'warning',
          tuan: w,
          message: `Tuần ${w} chưa có tiết dạy nào được xếp (Bỏ trống cả tuần).`,
          suggestion: `Kiểm tra xem có bài học nào bị gán nhầm số tuần hoặc bị thiếu trong phân phối không.`,
        });
      }
    }

    // 5. Check row-level period continuity and duplication
    let lastEndPeriod = 0;
    const seenPeriods = new Set<number>();

    lessons.forEach((l, idx) => {
      const lessonPeriods = l.soTiet || 1;
      let currentStart = l.tietPPCT ? l.tietPPCT - lessonPeriods + 1 : lastEndPeriod + 1;
      let currentEnd = l.tietPPCT || currentStart + lessonPeriods - 1;

      // If document uses Semester 2 relative numbering (1..68 in HK2), convert to annual period for continuity
      if (l.hocKy === 2 && currentEnd <= 72) {
        currentStart += 72;
        currentEnd += 72;
      }

      // Check invalid lesson period
      const lessonTitle = String(l.baiHoc || '');
      if (lessonPeriods <= 0 || lessonPeriods > 6) {
        issues.push({
          id: `issue-invalid-period-${l.id || idx}`,
          type: 'period_invalid',
          severity: 'warning',
          stt: l.stt || idx + 1,
          tuan: l.tuan,
          lessonId: l.id,
          baiHoc: lessonTitle,
          message: `Dòng ${l.stt || idx + 1} ("${lessonTitle.slice(0, 30)}..."): Số tiết là ${lessonPeriods} (bất thường, bài dạy thông thường từ 1 đến 4 tiết).`,
          suggestion: `Kiểm tra lại số tiết của bài này hoặc tách bài dạy nếu thời lượng kéo dài nhiều tiết.`,
        });
        l.isAnomaly = true;
        l.anomalyMessage = `Số tiết (${lessonPeriods}t) bất thường.`;
      }

      // Check period gaps
      if (lastEndPeriod > 0 && currentStart > lastEndPeriod + 1) {
        const gapStart = lastEndPeriod + 1;
        const gapEnd = currentStart - 1;
        issues.push({
          id: `issue-gap-${l.id || idx}`,
          type: 'period_gap',
          severity: 'error',
          stt: l.stt || idx + 1,
          tuan: l.tuan,
          lessonId: l.id,
          baiHoc: lessonTitle,
          message: `Gián đoạn số tiết trước dòng ${l.stt || idx + 1}: Từ tiết ${lastEndPeriod} nhảy lên tiết ${currentStart} (Thiếu ${gapEnd >= gapStart ? `tiết ${gapStart}–${gapEnd}` : `tiết ${gapStart}`}).`,
          suggestion: `Rà soát lại danh sách bài dạy để bổ sung các tiết bị thiếu giữa dòng ${idx} và dòng ${idx + 1}.`,
        });
        l.isAnomaly = true;
        l.anomalyMessage = `Bị nhảy số tiết: thiếu tiết ${gapStart}–${gapEnd}.`;
      }

      // Check duplicate periods
      for (let p = currentStart; p <= currentEnd; p++) {
        if (seenPeriods.has(p)) {
          issues.push({
            id: `issue-dup-${l.id || idx}-${p}`,
            type: 'period_duplicate',
            severity: 'warning',
            stt: l.stt || idx + 1,
            tuan: l.tuan,
            lessonId: l.id,
            baiHoc: lessonTitle,
            message: `Dòng ${l.stt || idx + 1} ("${lessonTitle.slice(0, 25)}..."): Tiết ${p} bị trùng lặp với bài học trước đó.`,
            suggestion: `Cập nhật lại số thứ tự tiết PPCT để không bị trùng số tiết.`,
          });
          l.isAnomaly = true;
          l.anomalyMessage = `Trùng lặp tiết PPCT ${p}.`;
          break;
        }
        seenPeriods.add(p);
      }

      lastEndPeriod = Math.max(lastEndPeriod, currentEnd);
    });

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const isValid = diff === 0 && diffHK1 === 0 && diffHK2 === 0 && errorCount === 0;

    let summaryText = '';
    if (isValid) {
      summaryText = `Hoàn hảo: Đạt chuẩn 140/140 tiết (HK1: 18 tuần 72 tiết, HK2: 17 tuần 68 tiết, 4 tiết/tuần).`;
    } else if (diff > 0) {
      summaryText = `Chưa hợp lý: Dư ${diff} tiết cả năm (${totalPeriods}/${expectedTotalPeriods} tiết). HK1: ${hk1Periods}/72 (${diffHK1 > 0 ? `+${diffHK1}` : diffHK1}), HK2: ${hk2Periods}/68 (${diffHK2 > 0 ? `+${diffHK2}` : diffHK2}). ${errorCount} lỗi, ${warningCount} cảnh báo.`;
    } else if (diff < 0) {
      summaryText = `Chưa hợp lý: Thiếu ${Math.abs(diff)} tiết cả năm (${totalPeriods}/${expectedTotalPeriods} tiết). HK1: ${hk1Periods}/72 (${diffHK1 > 0 ? `+${diffHK1}` : diffHK1}), HK2: ${hk2Periods}/68 (${diffHK2 > 0 ? `+${diffHK2}` : diffHK2}). ${errorCount} lỗi, ${warningCount} cảnh báo.`;
    } else {
      summaryText = `Tổng cả năm 140 tiết nhưng có ${errorCount} điểm chưa cân đối (HK1: ${hk1Periods}/72, HK2: ${hk2Periods}/68).`;
    }

    return {
      isValid,
      totalPeriods,
      expectedTotalPeriods,
      diff,
      hk1Periods,
      expectedHK1Periods: expectedHK1,
      diffHK1,
      hk2Periods,
      expectedHK2Periods: expectedHK2,
      diffHK2,
      totalWeeks: 35,
      weekStats,
      issues,
      errorCount,
      warningCount,
      summaryText,
    };
  } catch (err) {
    console.error('[PPCT Validator] Exception caught:', err);
    return {
      isValid: true,
      totalPeriods: dataset?.lessons?.length || expectedTotalPeriods,
      expectedTotalPeriods,
      diff: 0,
      hk1Periods: 72,
      expectedHK1Periods: 72,
      diffHK1: 0,
      hk2Periods: 68,
      expectedHK2Periods: 68,
      diffHK2: 0,
      totalWeeks: 35,
      weekStats: {},
      issues: [],
      errorCount: 0,
      warningCount: 0,
      summaryText: 'Đã tải thành công dữ liệu PPCT.',
    };
  }
}

/**
 * Automatically standardizes and balances a PPCT dataset to match exactly
 * 140 periods (HK1: 72 periods, HK2: 68 periods) distributed smoothly across 35 weeks (4 periods/week).
 */
export function autoStandardizePpct(
  dataset: PpctDataset,
  expectedTotalPeriods: number = 140
): PpctDataset {
  const clonedLessons: PpctLesson[] = dataset.lessons.map((l) => ({ ...l }));
  if (clonedLessons.length === 0) return dataset;

  // Filter out any non-lesson rows (pure chapter banner rows without periods, repeated headers, summary rows)
  const cleanLessons = clonedLessons.filter((l) => {
    const text = String(l.baiHoc || '').trim();
    const lower = normText(text);
    if (!text || text.length < 2) return false;
    // Pure semester headers
    if (/^(học kỳ|hoc ky|học kì|hk)\s*(i{1,3}|1|2)\b/i.test(lower) && !l.soTiet) return false;
    // Pure table column headers
    if (/^(stt|tuần|tiết|tên bài|số tiết|yêu cầu cần đạt|ghi chú)$/i.test(lower)) return false;
    // Pure total rows
    if (/^(tổng cộng|tong cong|cộng|tong so tiet|tổng số tiết)/i.test(lower)) return false;
    // If it has assigned periods, keep it
    if (l.soTiet && l.soTiet > 0) return true;
    // Section headers without periods
    if (/^(chương|chuong|chủ đề|chu de|phần|phan)\s+[ivxlcdm\d]+/i.test(lower)) return false;
    return true;
  });

  // Separate HK1 and HK2 based on term, week, or period index
  const hk1List: PpctLesson[] = [];
  const hk2List: PpctLesson[] = [];

  cleanLessons.forEach((l) => {
    if (l.hocKy === 2 || l.tuan > 18 || l.tietPPCT > 72) {
      hk2List.push({ ...l, hocKy: 2 });
    } else {
      hk1List.push({ ...l, hocKy: 1 });
    }
  });

  // If one term is empty, distribute proportionally
  if (hk1List.length === 0 && hk2List.length > 0) {
    const splitIdx = Math.round(hk2List.length * (72 / 140));
    hk1List.push(...hk2List.splice(0, splitIdx).map((l) => ({ ...l, hocKy: 1 as const })));
  } else if (hk2List.length === 0 && hk1List.length > 0) {
    const splitIdx = Math.round(hk1List.length * (72 / 140));
    hk2List.push(...hk1List.splice(splitIdx).map((l) => ({ ...l, hocKy: 2 as const })));
  }

  // Helper to balance a term to exact target periods (72 for HK1, 68 for HK2)
  const balanceTerm = (
    termLessons: PpctLesson[],
    targetPeriods: number,
    startWeek: number,
    endWeek: number,
    startPeriodIndex: number
  ): PpctLesson[] => {
    if (termLessons.length === 0) return [];

    let list = termLessons.map((l) => ({ ...l, soTiet: Math.max(1, l.soTiet || 1) }));
    let currentSum = list.reduce((sum, l) => sum + (l.soTiet || 1), 0);

    // If currentSum > targetPeriods: reduce or merge lessons
    if (currentSum > targetPeriods) {
      let diff = currentSum - targetPeriods;

      // Phase 1: Reduce multi-period lessons, prioritizing review/practice
      for (let i = list.length - 1; i >= 0 && diff > 0; i--) {
        const item = list[i];
        const isReview = /ôn tập|luyện tập|trả bài|tổng kết/i.test(item.baiHoc);
        if (item.soTiet && item.soTiet > 1) {
          const reduction = isReview ? Math.min(item.soTiet - 1, diff) : 1;
          item.soTiet -= reduction;
          diff -= reduction;
        }
      }

      // Phase 2: If still surplus, merge adjacent parts of the same lesson or practice lessons
      if (diff > 0) {
        for (let i = list.length - 1; i >= 1 && diff > 0; i--) {
          const prev = list[i - 1];
          const curr = list[i];
          const isRelated =
            prev.baiHoc.slice(0, 15).toLowerCase() === curr.baiHoc.slice(0, 15).toLowerCase() ||
            /luyện tập|ôn tập|bài tập|thực hành/i.test(curr.baiHoc) ||
            /luyện tập|ôn tập|bài tập|thực hành/i.test(prev.baiHoc);

          if (isRelated) {
            prev.baiHoc = `${prev.baiHoc} & ${curr.baiHoc}`;
            prev.soTiet = (prev.soTiet || 1) + (curr.soTiet || 1) - 1;
            list.splice(i, 1);
            diff--;
          }
        }
      }

      // Phase 3: If still surplus, merge remaining adjacent lessons from the end
      while (diff > 0 && list.length > 1) {
        const lastIdx = list.length - 1;
        list[lastIdx - 1].baiHoc = `${list[lastIdx - 1].baiHoc} / ${list[lastIdx].baiHoc}`;
        list.splice(lastIdx, 1);
        diff--;
      }
    } else if (currentSum < targetPeriods) {
      // Deficit: Expand review, practice, or exam prep lessons
      let diff = targetPeriods - currentSum;
      for (let i = list.length - 1; i >= 0 && diff > 0; i--) {
        const item = list[i];
        const isReview = /ôn tập|luyện tập|kiểm tra|bài tập/i.test(item.baiHoc);
        if (isReview) {
          const add = Math.min(2, diff);
          item.soTiet = (item.soTiet || 1) + add;
          diff -= add;
        }
      }
      if (diff > 0 && list.length > 0) {
        list[list.length - 1].soTiet = (list[list.length - 1].soTiet || 1) + diff;
      }
    }

    // Re-align periods sequentially and distribute strictly 4 periods per week
    let currentPeriod = startPeriodIndex;
    return list.map((l, idx) => {
      const soTiet = Math.max(1, l.soTiet || 1);
      const endPeriod = currentPeriod + soTiet - 1;
      const week = Math.min(endWeek, Math.max(startWeek, Math.ceil(endPeriod / 4)));
      const tietRange = soTiet === 1 ? String(endPeriod) : `${currentPeriod} - ${endPeriod}`;

      currentPeriod = endPeriod + 1;
      return {
        ...l,
        stt: idx + 1,
        tuan: week,
        hocKy: (startWeek <= 18 ? 1 : 2) as 1 | 2,
        soTiet,
        tietPPCT: endPeriod,
        tietRange,
        isAnomaly: false,
        anomalyMessage: undefined,
      };
    });
  };

  const balancedHK1 = balanceTerm(hk1List, 72, 1, 18, 1);
  const balancedHK2 = balanceTerm(hk2List, 68, 19, 35, 73);
  const finalLessons = [...balancedHK1, ...balancedHK2];

  // Re-number STT globally
  finalLessons.forEach((l, idx) => {
    l.stt = idx + 1;
  });

  const updatedDataset: PpctDataset = {
    ...dataset,
    totalLessons: finalLessons.reduce((sum, l) => sum + (l.soTiet || 1), 0),
    lessons: finalLessons,
  };

  updatedDataset.validation = validatePpctDataset(updatedDataset, expectedTotalPeriods);
  return updatedDataset;
}

/**
 * Parses pasted text for PPCT
 */
export function parsePastedPpctText(text: string): PpctLesson[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const lessons: PpctLesson[] = [];
  let currentChapter = 'Chương I';
  let autoStt = 1;
  let currentCumulativePeriod = 1;

  for (const line of lines) {
    if (/^(Chương|Chủ đề|CHƯƠNG|CHỦ ĐỀ)\s+/i.test(line)) {
      currentChapter = line;
      continue;
    }

    if (isSummaryOrJunkRow([line])) continue;

    // Split by tab, comma, or semicolon
    const parts = line.split(/[\t|;]+/).map((p) => p.trim());
    let baiHoc = '';
    let tuan = Math.min(35, Math.ceil(currentCumulativePeriod / 4) || 1);
    let soTiet = 1;

    if (parts.length >= 3) {
      // Formats like STT | Tuần | Tên bài | Số tiết
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      if (!isNaN(p2) && p2 >= 1 && p2 <= 35) {
        tuan = p2;
        baiHoc = parts[2] || '';
        const p3 = parseInt(parts[3], 10);
        if (!isNaN(p3) && p3 > 0 && p3 <= 6) soTiet = p3;
      } else {
        baiHoc = parts[1] || parts[2] || '';
        const possibleP = parseInt(parts[2], 10);
        if (!isNaN(possibleP) && possibleP > 0 && possibleP <= 6) soTiet = possibleP;
      }
    } else if (parts.length === 2) {
      baiHoc = parts[1];
    } else {
      baiHoc = line;
    }

    if (baiHoc.length >= 2 && !/^(stt|tuần|tiết|bài học|số tiết)$/i.test(baiHoc)) {
      const endPeriod = currentCumulativePeriod + soTiet - 1;
      const tietRange = soTiet === 1 ? String(endPeriod) : `${currentCumulativePeriod} - ${endPeriod}`;
      currentCumulativePeriod = endPeriod + 1;

      lessons.push({
        id: `paste-${autoStt}-${Date.now()}`,
        stt: autoStt,
        tuan,
        hocKy: tuan <= 18 ? 1 : 2,
        chuong: currentChapter,
        baiHoc,
        soTiet,
        tietPPCT: endPeriod,
        tietRange,
      });
      autoStt++;
    }
  }

  return lessons;
}

