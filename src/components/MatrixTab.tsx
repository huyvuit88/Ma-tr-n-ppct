import React, { useState, useEffect, useMemo } from 'react';
import { MatrixConfig, MatrixRow, ExamEvent, PpctDataset, SpecificationRow, SgkBook } from '../types';
import { MatrixConfigSection } from './MatrixConfig';
import { MatrixTable } from './MatrixTable';
import { SpecificationTable } from './SpecificationTable';
import { MatrixPrintViewModal } from './MatrixPrintViewModal';
import {
  exportMatrixToDocx,
  exportSpecificationToDocx,
  exportFullExamPackageToDocx,
} from '../utils/docxExport';
import { exportMatrixToExcel } from '../utils/excelExport';
import { generateMatrixFromPpct, generateSpecificationFromMatrix } from '../utils/dateCalculations';
import {
  defaultPpctDataset6,
  defaultPpctDataset7,
  defaultPpctDataset8,
  defaultPpctDataset9,
} from '../data/defaultData';
import * as XLSX from 'xlsx';
import { Table as TableIcon, FileText, Layers, Sparkles, BookMarked, AlertTriangle, Upload } from 'lucide-react';

interface MatrixTabProps {
  config: MatrixConfig;
  rows: MatrixRow[];
  exams: ExamEvent[];
  activePpct: PpctDataset;
  datasets?: PpctDataset[];
  onSelectDataset?: (id: string) => void;
  onAddDataset?: (dataset: PpctDataset) => void;
  onOpenUploadModal?: (grade?: string) => void;
  sgkBooks?: SgkBook[];
  onUpdateConfig: (updated: Partial<MatrixConfig>) => void;
  onUpdateRows: (rows: MatrixRow[]) => void;
  onOpenSgkManager?: () => void;
  onOpenFullPpct?: () => void;
  onOpenExamBuilder?: () => void;
}

export const MatrixTab: React.FC<MatrixTabProps> = ({
  config,
  rows,
  exams,
  activePpct,
  datasets = [],
  onSelectDataset,
  onAddDataset,
  onOpenUploadModal,
  sgkBooks = [],
  onUpdateConfig,
  onUpdateRows,
  onOpenSgkManager,
  onOpenFullPpct,
  onOpenExamBuilder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'spec' | 'all'>('matrix');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Normalize grade string (e.g., "Khối 9", "9", "K9" -> "9")
  const currentGradeNorm = String(config.grade || '').replace(/\D/g, '') || String(config.grade || '').trim();
  const currentClassLower = config.className ? config.className.toLowerCase().trim() : '';

  // Find best matching PPCT dataset from uploaded datasets for current grade and class
  const matchingPpct = useMemo(() => {
    if (!datasets || datasets.length === 0) return null;

    // 1. If class is specified (e.g. 9A1), look for dataset matching both grade and class
    if (currentClassLower) {
      const matchBoth = datasets.find((d) => {
        const dGradeNorm = String(d.grade || '').replace(/\D/g, '') || String(d.grade || '').trim();
        if (currentGradeNorm && dGradeNorm !== currentGradeNorm) return false;
        return (
          (d.className && d.className.toLowerCase().trim() === currentClassLower) ||
          (d.name && d.name.toLowerCase().includes(currentClassLower))
        );
      });
      if (matchBoth) return matchBoth;
    }

    // 2. Look for dataset matching grade
    if (currentGradeNorm) {
      const matchGrade = datasets.find((d) => {
        const dGradeNorm = String(d.grade || '').replace(/\D/g, '') || String(d.grade || '').trim();
        return dGradeNorm === currentGradeNorm;
      });
      if (matchGrade) return matchGrade;
    }

    return null;
  }, [datasets, currentGradeNorm, currentClassLower]);

  const hasMatchingPpct = Boolean(matchingPpct);

  // When grade or class changes, handle auto-updating PPCT and matrix
  const handleGradeOrClassChange = (newGrade: string, newClassName?: string) => {
    const targetGrade = newGrade;
    const targetClassName = newClassName !== undefined ? newClassName : config.className;
    const normGrade = String(targetGrade || '').replace(/\D/g, '') || String(targetGrade || '').trim();
    const targetClassLower = targetClassName ? targetClassName.toLowerCase().trim() : '';

    // Search in datasets for matching PPCT
    let found: PpctDataset | undefined;
    if (datasets && datasets.length > 0) {
      if (targetClassLower) {
        found = datasets.find((d) => {
          const dGradeNorm = String(d.grade || '').replace(/\D/g, '') || String(d.grade || '').trim();
          if (normGrade && dGradeNorm !== normGrade) return false;
          return (
            (d.className && d.className.toLowerCase().trim() === targetClassLower) ||
            (d.name && d.name.toLowerCase().includes(targetClassLower))
          );
        });
      }
      if (!found && normGrade) {
        found = datasets.find((d) => {
          const dGradeNorm = String(d.grade || '').replace(/\D/g, '') || String(d.grade || '').trim();
          return dGradeNorm === normGrade;
        });
      }
    }

    if (found) {
      // Found matching PPCT -> switch active dataset & update matrix
      onUpdateConfig({
        grade: targetGrade,
        className: targetClassName,
        subject: found.subject || config.subject,
        selectedLessonKeys: undefined, // Reset lesson keys to adapt to new grade
        sampleLoadedName: `Đã tự động cập nhật PPCT ${found.subject} Khối ${found.grade}${targetClassName ? ` (Lớp ${targetClassName})` : ''} — ${found.name}`,
      });

      if (onSelectDataset && found.id !== activePpct?.id) {
        onSelectDataset(found.id);
      }

      // Re-generate matrix rows based on newly matched PPCT
      const weekFrom = config.limitWeekFrom || 1;
      const weekTo = config.limitWeekTo || 9;
      const generated = generateMatrixFromPpct(found, {
        limitWeekFrom: weekFrom,
        limitWeekTo: weekTo,
        targetWeek: weekTo,
        limitPeriodTo: config.limitPeriodTo,
        selectedLessonKeys: undefined,
        excludeNonTestable: config.excludeNonTestable !== false,
        ratioTn: config.ratioTn || 70,
        ratioTl: config.ratioTl || 30,
        structureType: config.structureType || 'moet_2025_new',
        scorePerTn: config.scorePerTn || 0.25,
        scorePerTn1: config.scorePerTn1 || 0.25,
        scorePerTn2: config.scorePerTn2 || 1.0,
        scorePerTn3: config.scorePerTn3 || 0.5,
        scorePerTl: config.scorePerTl || 1.0,
        targetScore: 10,
      });

      if (generated.length > 0) {
        onUpdateRows(generated);
      }
    } else {
      // No matching PPCT for this grade / class
      onUpdateConfig({
        grade: targetGrade,
        className: targetClassName,
        selectedLessonKeys: undefined,
        sampleLoadedName: `Chưa tải lên PPCT phù hợp cho Khối ${targetGrade}${targetClassName ? ` (Lớp ${targetClassName})` : ''}. Vui lòng tải lên PPCT để thiết lập ma trận.`,
      });
    }
  };

  // Quick load standard sample data for grades 6, 7, 8, 9
  const handleLoadSampleGrade = (gradeToLoad: string) => {
    const norm = String(gradeToLoad).replace(/\D/g, '');
    let sample: PpctDataset | undefined;
    if (norm === '6') sample = { ...defaultPpctDataset6, id: `sample-k6-${Date.now()}` };
    else if (norm === '7') sample = { ...defaultPpctDataset7, id: `sample-k7-${Date.now()}` };
    else if (norm === '8') sample = { ...defaultPpctDataset8, id: `sample-k8-${Date.now()}` };
    else if (norm === '9') sample = { ...defaultPpctDataset9, id: `sample-k9-${Date.now()}` };

    if (sample && onAddDataset) {
      onAddDataset(sample);
      handleGradeOrClassChange(gradeToLoad);
    }
  };

  // Fallback effective PPCT to use for rendering
  const effectivePpct = matchingPpct || activePpct;

  const activeVolume = (config.limitWeekFrom || 1) >= 19 ? 2 : ((config.limitWeekTo || 9) <= 18 ? 1 : 'all');

  const [specRows, setSpecRows] = useState<SpecificationRow[]>(() =>
    generateSpecificationFromMatrix(rows, config.grade, config.subject, sgkBooks, activeVolume)
  );

  // Sync specification rows whenever matrix rows or grade/subject/sgkBooks change
  useEffect(() => {
    setSpecRows(generateSpecificationFromMatrix(rows, config.grade, config.subject, sgkBooks, activeVolume));
  }, [rows, config.grade, config.subject, config.limitWeekFrom, config.limitWeekTo, sgkBooks]);

  const handleUpdateRow = (id: string, field: string, value: any) => {
    onUpdateRows(
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleUpdateNestedRow = (
    id: string,
    group: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao',
    type: 'tn' | 'tl',
    value: number
  ) => {
    onUpdateRows(
      rows.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            [group]: {
              ...r[group],
              [type]: Math.max(0, value),
            },
          };
        }
        return r;
      })
    );
  };

  const handleAddRow = () => {
    const nextTT = rows.length + 1;
    const newRow: MatrixRow = {
      id: `m-${Date.now()}`,
      tt: nextTT,
      chuong: rows[rows.length - 1]?.chuong || 'Chủ đề mới',
      noiDung: 'Nội dung kiến thức mới',
      soTiet: 2,
      nhanBiet: { tn: 1, tl: 0, tn1: 1 },
      thongHieu: { tn: 1, tl: 0, tn1: 1 },
      vanDung: { tn: 0, tl: 0 },
      vanDungCao: { tn: 0, tl: 0 },
    };
    onUpdateRows([...rows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    onUpdateRows(rows.filter((r) => r.id !== id));
  };

  const handleGenerateFromPpct = () => {
    const weekFrom = config.limitWeekFrom || 1;
    const weekTo = config.limitWeekTo || 9;

    const generated = generateMatrixFromPpct(activePpct, {
      limitWeekFrom: weekFrom,
      limitWeekTo: weekTo,
      targetWeek: weekTo,
      limitPeriodTo: config.limitPeriodTo,
      selectedLessonKeys: config.selectedLessonKeys,
      excludeNonTestable: config.excludeNonTestable !== false,
      ratioTn: config.ratioTn || 70,
      ratioTl: config.ratioTl || 30,
      structureType: config.structureType || 'moet_2025_new',
      scorePerTn: config.scorePerTn || 0.25,
      scorePerTn1: config.scorePerTn1 || 0.25,
      scorePerTn2: config.scorePerTn2 || 1.0,
      scorePerTn3: config.scorePerTn3 || 0.5,
      scorePerTl: config.scorePerTl || 1.0,
      targetScore: 10,
    });

    if (generated.length > 0) {
      onUpdateRows(generated);
      setSpecRows(generateSpecificationFromMatrix(generated, config.grade, config.subject, sgkBooks, activeVolume));
      onUpdateConfig({
        sampleLoadedName: `Đã cân bằng ma trận PPCT ${activePpct.subject} K${activePpct.grade} (Tuần ${weekFrom}–${weekTo}${config.limitPeriodTo ? `, đến Tiết ${config.limitPeriodTo}` : ''}) — ${generated.length} bài học bám sát SGK Tập ${activeVolume === 2 ? 2 : 1}.`,
      });
    }
  };

  const handleLoadSampleTemplate = async (file: File) => {
    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });

        const parsedRows: MatrixRow[] = [];
        let autoTT = 1;

        rawRows.forEach((r, idx) => {
          if (!r || r.length < 3) return;
          const text = r.map((c) => String(c || '').trim());
          if (text[0] === 'TT' || text.join(' ').includes('Chương')) return;

          const chuong = text[1] || `Chủ đề ${autoTT}`;
          const noiDung = text[2] || `Đơn vị kiến thức ${autoTT}`;
          const nbTn = parseInt(text[3], 10) || 0;
          const nbTl = parseInt(text[4], 10) || 0;
          const thTn = parseInt(text[5], 10) || 0;
          const thTl = parseInt(text[6], 10) || 0;
          const vdTn = parseInt(text[7], 10) || 0;
          const vdTl = parseInt(text[8], 10) || 0;
          const vdcTn = parseInt(text[9], 10) || 0;
          const vdcTl = parseInt(text[10], 10) || 0;

          if (chuong && noiDung) {
            parsedRows.push({
              id: `imported-${autoTT}-${Date.now()}`,
              tt: autoTT,
              chuong,
              noiDung,
              soTiet: 2,
              nhanBiet: { tn: nbTn, tl: nbTl },
              thongHieu: { tn: thTn, tl: thTl },
              vanDung: { tn: vdTn, tl: vdTl },
              vanDungCao: { tn: vdcTn, tl: vdcTl },
            });
            autoTT++;
          }
        });

        if (parsedRows.length > 0) {
          onUpdateRows(parsedRows);
          setSpecRows(generateSpecificationFromMatrix(parsedRows, config.grade, config.subject, sgkBooks, activeVolume));
          onUpdateConfig({
            sampleLoadedName: `${file.name} — ${parsedRows.length} dòng nội dung.`,
          });
          return;
        }
      }

      onUpdateConfig({
        sampleLoadedName: `${file.name} — Đã nạp thành công ${rows.length} dòng mẫu ma trận.`,
      });
    } catch (err: any) {
      console.warn('[Matrix Template] Thông báo nạp file mẫu:', err?.message || err);
      onUpdateConfig({
        sampleLoadedName: `Không thể nạp file mẫu ${file.name}. Vui lòng chọn file mẫu Excel/Word ma trận chuẩn.`,
      });
    }
  };

  const handleExportWordMatrix = async () => {
    await exportMatrixToDocx(config, rows);
  };

  const handleExportWordSpec = async () => {
    await exportSpecificationToDocx(config, specRows);
  };

  const handleExportFullWord = async () => {
    await exportFullExamPackageToDocx(config, rows, specRows);
  };

  const handleExportExcel = () => {
    exportMatrixToExcel(config, rows);
  };

  const handleSyncSpecFromMatrix = () => {
    const updated = generateSpecificationFromMatrix(rows, config.grade, config.subject, sgkBooks, activeVolume);
    setSpecRows(updated);
  };

  return (
    <div className="space-y-6">
      <MatrixConfigSection
        config={config}
        exams={exams}
        activePpct={effectivePpct}
        datasets={datasets}
        matchingPpct={matchingPpct}
        hasMatchingPpct={hasMatchingPpct}
        onGradeOrClassChange={handleGradeOrClassChange}
        onOpenUploadModal={onOpenUploadModal}
        onLoadSampleGrade={handleLoadSampleGrade}
        sgkBooks={sgkBooks}
        onChange={onUpdateConfig}
        onGenerateFromPpct={handleGenerateFromPpct}
        onLoadSampleTemplate={handleLoadSampleTemplate}
        onOpenSgkManager={onOpenSgkManager}
        onOpenFullPpct={onOpenFullPpct}
      />

      {/* Navigation Sub-Tabs between Phụ lục I & Phụ lục II */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'matrix'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>Phụ lục I: Khung Ma trận đề</span>
          </button>

          <button
            onClick={() => setActiveSubTab('spec')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'spec'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span>Phụ lục II: Khung Bảng đặc tả</span>
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'all'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-700" />
            <span>Xem cả 2 bảng (PL I + PL II)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSgkManager && (
            <button
              onClick={onOpenSgkManager}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs"
              title="Quản lý Sách giáo khoa Toán Tập 1, Tập 2 và chỉnh sửa Yêu cầu cần đạt"
            >
              <BookMarked className="w-3.5 h-3.5 text-teal-700" />
              <span>Quản lý SGK (Tập 1 & 2)</span>
            </button>
          )}

          {onOpenExamBuilder && (
            <button
              onClick={onOpenExamBuilder}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Tạo đề thi và đáp án bám sát theo Ma trận và Yêu cầu cần đạt này"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Tạo Đề Kiểm Tra Theo Ma Trận</span>
            </button>
          )}

          <button
            onClick={handleExportFullWord}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
            title="Xuất trọn bộ file Word gồm Khung Ma trận và Bảng đặc tả đề kiểm tra"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Xuất Trọn bộ Word (PL I + PL II)</span>
          </button>
        </div>
      </div>

      {/* Render Sub-Views */}
      {(activeSubTab === 'matrix' || activeSubTab === 'all') && (
        <MatrixTable
          config={config}
          rows={rows}
          sgkBooks={sgkBooks}
          onUpdateRow={handleUpdateRow}
          onUpdateNestedRow={handleUpdateNestedRow}
          onBulkUpdateRows={onUpdateRows}
          onAddRow={handleAddRow}
          onDeleteRow={handleDeleteRow}
          onExportWord={handleExportWordMatrix}
          onExportExcel={handleExportExcel}
          onPrintPreview={() => setIsPrintModalOpen(true)}
          onGoToSpec={() => setActiveSubTab('spec')}
        />
      )}

      {(activeSubTab === 'spec' || activeSubTab === 'all') && (
        <SpecificationTable
          config={config}
          matrixRows={rows}
          specRows={specRows}
          onUpdateSpecRows={setSpecRows}
          onUpdateMatrixRows={onUpdateRows}
          sgkBooks={sgkBooks}
          onSyncFromMatrix={handleSyncSpecFromMatrix}
          onExportSpecWord={handleExportWordSpec}
          onExportFullWord={handleExportFullWord}
          onPrintPreview={() => setIsPrintModalOpen(true)}
        />
      )}

      <MatrixPrintViewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        config={config}
        rows={rows}
        onExportWord={handleExportFullWord}
        sgkBooks={sgkBooks}
      />
    </div>
  );
};
