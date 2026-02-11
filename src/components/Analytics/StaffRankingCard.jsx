import React from 'react';
import { Trophy, Star, Zap } from 'lucide-react';

const StaffRankingCard = ({ staff }) => {
    // Top 5
    const topStaff = staff.slice(0, 5);

    return (
        <div className="bg-white rounded-3xl p-8 border border-[#dcdcdc] shadow-none h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Excellence Registry</h3>
                <Trophy size={18} className="text-[#2e7d32]" />
            </div>

            <div className="space-y-4">
                {topStaff.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-[#f8faf9] rounded-2xl transition-all border border-transparent hover:border-[#cfead6] group">
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-[#2e7d32] text-white' :
                                idx === 1 ? 'bg-[#cfead6] text-[#2e7d32]' :
                                    idx === 2 ? 'bg-[#f8faf9] text-[#1f2d2a] border border-[#dcdcdc]' :
                                        'bg-slate-50 text-slate-300'
                                }`}>
                                {idx + 1}
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-[#1f2d2a] uppercase tracking-tight group-hover:text-[#2e7d32] transition-colors">{s.name}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{s.solved} Resolutions</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                <span className="text-[11px] font-black text-[#1f2d2a]">{s.avgRating}</span>
                            </div>
                            <div className="text-[9px] font-black text-[#2e7d32] uppercase tracking-widest mt-1">Score: {s.efficiency}</div>
                        </div>
                    </div>
                ))}

                {topStaff.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                        No performance data yet today.
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffRankingCard;
