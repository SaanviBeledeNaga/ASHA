import React, { useState } from 'react';
import { useAppContext } from '@/lib/AppContext';

export default function SchemesView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Static list for prototype. In production, this can be synced from the backend to Dexie.
  const schemes = [
    {
      name: "PM Matru Vandana Yojana (PMMVY)",
      desc: "Financial support of ₹5000 provided in direct cash benefit transfers directly to pregnant women and lactating mothers for nutritional wellness.",
      benefit: "₹5,000 cash incentive in 3 installments",
      eligibility: "Pregnant women and lactating mothers for their first child.",
      icon: "🤰",
      tags: ["Pregnancy", "Women", "Health"]
    },
    {
      name: "Janani Suraksha Yojana (JSY)",
      desc: "Maternal safe delivery promotion scheme reducing maternal and neonatal mortality by promoting institutional deliveries under public healthcare institutions.",
      benefit: "Cash assistance of ₹1,400 (Rural) and ₹700 (Urban) directly to mother.",
      eligibility: "Low-income pregnant women prioritizing rural areas.",
      icon: "🏥",
      tags: ["Pregnancy", "Health", "Rural"]
    },
    {
      name: "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)",
      desc: "Free diagnostic and standard health checkups provided by doctors on the 9th of every month at Government medical institutions to identify high-risk cases.",
      benefit: "Free medical diagnostics, OB-GYN consultations, and nutritional therapy guidelines.",
      eligibility: "Pregnant women in their 2nd and 3rd trimesters.",
      icon: "👩‍⚕️",
      tags: ["Pregnancy", "Health"]
    },
    {
      name: "PM Kisan Samman Nidhi",
      desc: "Direct income assurance support schema providing minimal budget backing to all agricultural landholder households.",
      benefit: "₹6,000 yearly credit delivered in three equal ₹2,000 installments.",
      eligibility: "All small and marginal landholder farmer families.",
      icon: "🌾",
      tags: ["Farmers", "Rural", "Agriculture"]
    }
  ];

  const filters = ["All", "Pregnancy", "Women", "Health", "Farmers", "Agriculture"];

  const filteredSchemes = schemes.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || s.tags.includes(selectedFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Search schemes..." 
          className="input-field" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedFilter === f ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
              style={{ backgroundColor: selectedFilter === f ? 'var(--primary-color)' : '#E2E8F0', color: selectedFilter === f ? 'white' : 'var(--text-primary)' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredSchemes.map(scheme => (
          <div key={scheme.name} className="card flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl p-3 bg-slate-100 rounded">{scheme.icon}</div>
              <h4 className="flex-1 m-0">{scheme.name}</h4>
            </div>
            <p className="text-secondary text-sm flex-1 mb-4">{scheme.desc}</p>
            <div className="mb-4 text-sm bg-slate-50 p-3 rounded">
              <strong style={{ color: 'var(--success-color)' }}>Benefits:</strong> {scheme.benefit}
            </div>
            <div className="mb-6 text-sm bg-slate-50 p-3 rounded">
              <strong style={{ color: 'var(--primary-color)' }}>Eligibility:</strong> {scheme.eligibility}
            </div>
            <div className="mt-auto flex justify-end">
              <button className="btn-secondary text-sm">Apply Now &rarr;</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
