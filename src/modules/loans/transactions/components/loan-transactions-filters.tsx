"use client";

import React from "react";
import { Search, Filter, Calendar, Home, ChevronDown } from "lucide-react";

import "./loan-transactions-filters.css";

export const LoanTransactionsFilters: React.FC = () => {
  return (
    <div className="zelify-loan-tx-filters">
      {/* Branch Selector (Premium Mockup) */}
      <div className="zelify-loan-tx-filters__dropdown">
        <Home size={16} />
        <span>Branch</span>
        <span className="zelify-loan-tx-filters__label">All Branches</span>
        <ChevronDown size={16} />
      </div>

      {/* Date Range Selector (Premium Mockup) */}
      <div className="zelify-loan-tx-filters__dropdown">
        <Calendar size={16} />
        <span>Range</span>
        <span className="zelify-loan-tx-filters__label">Last 30 Days</span>
        <ChevronDown size={16} />
      </div>

      {/* Search Bar */}
      <div className="zelify-loan-tx-filters__search">
        <Search size={18} className="zelify-loan-tx-filters__search-icon" />
        <input 
          type="text" 
          placeholder="Search by account ID, holder or transaction ID..." 
          className="zelify-loan-tx-filters__input"
        />
      </div>

      <div className="zelify-loan-tx-filters__actions">
        <button className="zelify-loan-tx-filters__btn zelify-loan-tx-filters__btn--primary">
          <Filter size={16} style={{ marginRight: '8px' }} />
          Filter
        </button>
      </div>
    </div>
  );
};
