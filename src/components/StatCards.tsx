import React from 'react';
import { PpctDataset, TimeframeConfig } from '../types';

interface StatCardsProps {
  ppct: PpctDataset;
  config: TimeframeConfig;
  currentWeek: number;
  term: 1 | 2;
  isBeforeTerm: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({
  ppct,
  config,
  currentWeek,
  term,
  isBeforeTerm,
}) => {
  const totalPeriods =
    ppct.lessons.reduce((sum, l) => sum + (l.soTiet || 1), 0) || config.totalPeriodsYear || 140;
  const hk1Periods =
    ppct.lessons
      .filter((l) => l.hocKy === 1)
      .reduce((sum, l) => sum + (l.soTiet || 1), 0) || config.totalPeriodsHK1 || 72;
  const hk2Periods =
    ppct.lessons
      .filter((l) => l.hocKy === 2)
      .reduce((sum, l) => sum + (l.soTiet || 1), 0) || config.totalPeriodsHK2 || 68;

  // Calculate taught periods based on current week
  const taughtPeriods = isBeforeTerm
    ? 0
    : ppct.lessons
        .filter((l) => l.tuan <= currentWeek)
        .reduce((sum, l) => sum + (l.soTiet || 1), 0);

  const taughtHk1 = isBeforeTerm
    ? 0
    : ppct.lessons
        .filter((l) => l.hocKy === 1 && l.tuan <= currentWeek)
        .reduce((sum, l) => sum + (l.soTiet || 1), 0);

  const taughtHk2 = isBeforeTerm
    ? 0
    : ppct.lessons
        .filter((l) => l.hocKy === 2 && l.tuan <= currentWeek)
        .reduce((sum, l) => sum + (l.soTiet || 1), 0);

  const percentYear = Math.min(100, Math.round((taughtPeriods / (totalPeriods || 1)) * 100));
  const percentHk1 = Math.min(100, Math.round((taughtHk1 / (hk1Periods || 1)) * 100));
  const percentHk2 = Math.min(100, Math.round((taughtHk2 / (hk2Periods || 1)) * 100));

  const weekProgressHk1 = isBeforeTerm
    ? 0
    : Math.min(100, Math.round((Math.min(currentWeek, config.totalWeeksHK1) / config.totalWeeksHK1) * 100));

  const weekProgressHk2 =
    isBeforeTerm || currentWeek <= config.totalWeeksHK1
      ? 0
      : Math.min(
          100,
          Math.round(
            ((currentWeek - config.totalWeeksHK1) /
              Math.max(1, config.totalWeeksYear - config.totalWeeksHK1)) *
              100
          )
        );

  const displayWeek = isBeforeTerm ? 0 : Math.min(currentWeek, config.totalWeeksYear);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Cả năm */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-medium text-slate-500">Tiến độ cả năm</h3>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              totalPeriods === 140
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {totalPeriods === 140 ? 'Chuẩn 140 tiết' : `${totalPeriods}/140 tiết`}
          </span>
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1.5">
          {percentYear}%
        </div>
        <div className="text-xs text-slate-600 font-medium">
          {taughtPeriods}/{totalPeriods} tiết • Tuần {displayWeek}/{config.totalWeeksYear}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <span>Định mức: 35 tuần • 4 tiết/tuần</span>
        </div>
      </div>

      {/* Card 2: Học kỳ I */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-medium text-slate-500">Học kỳ I</h3>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              hk1Periods === 72
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {hk1Periods === 72 ? 'Chuẩn 72 tiết' : `${hk1Periods}/72 tiết`}
          </span>
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1.5">
          {percentHk1}%
        </div>
        <div className="text-xs text-slate-600 font-medium">
          {taughtHk1}/{hk1Periods} tiết • Thời gian {weekProgressHk1}%
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <span>Định mức: 18 tuần • 4 tiết/tuần (Tiết 1 - 72)</span>
        </div>
      </div>

      {/* Card 3: Học kỳ II */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-medium text-slate-500">Học kỳ II</h3>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              hk2Periods === 68
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {hk2Periods === 68 ? 'Chuẩn 68 tiết' : `${hk2Periods}/68 tiết`}
          </span>
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1.5">
          {percentHk2}%
        </div>
        <div className="text-xs text-slate-600 font-medium">
          {taughtHk2}/{hk2Periods} tiết • Thời gian {weekProgressHk2}%
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <span>Định mức: 17 tuần • 4 tiết/tuần (Tiết 73 - 140)</span>
        </div>
      </div>
    </div>
  );
};
