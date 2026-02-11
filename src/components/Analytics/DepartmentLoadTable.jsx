import React from 'react';

const DepartmentLoadTable = ({ data }) => {
    // Sort by Total Active (Open + Pending)
    const sortedProps = [...data].sort((a, b) => (b.open + b.pending) - (a.open + a.pending)).slice(0, 6);

    return (
        <div className="bg-white rounded-3xl p-8 border border-[#dcdcdc] shadow-none h-full">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Internal Resource Load</h3>

            <div className="space-y-6">
                {sortedProps.map((d, i) => {
                    const active = d.open + d.pending;
                    const loadPercent = Math.min(100, (active / 20) * 100);
                    const color = active > 15 ? 'bg-rose-500' : active > 8 ? 'bg-[#2e7d32]' : 'bg-[#cfead6]';

                    return (
                        <div key={i} className="group">
                            <div className="flex justify-between text-[11px] font-black text-[#1f2d2a] mb-2 uppercase tracking-tight">
                                <span>{d.name}</span>
                                <span className={active > 15 ? 'text-rose-600' : 'text-[#2e7d32]'}>{active} Active</span>
                            </div>
                            <div className="w-full bg-[#f8faf9] border border-[#dcdcdc] rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full ${color} transition-all duration-700 origin-left`}
                                    style={{ width: `${loadPercent}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                <span>{d.solved} Unit Resolutions</span>
                                {d.delayed > 0 && <span className="text-rose-500">{d.delayed} Threshold Violations</span>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default DepartmentLoadTable;
