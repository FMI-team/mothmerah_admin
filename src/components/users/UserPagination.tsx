"use client";
import React from "react";

type UserPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const UserPagination: React.FC<UserPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pagesAroundCurrent = Array.from(
    { length: Math.min(2, totalPages) },
    (_, i) => i + Math.max(currentPage - 1, 1)
  ).filter((page) => page <= totalPages);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 text-sm"
      >
        السابق
      </button>
      <div className="flex items-center gap-2">
        {pagesAroundCurrent.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium ${
              currentPage === page
                ? "bg-purple-500 text-white"
                : "text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-white/3"
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs text-sm hover:bg-gray-50 h-10 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3"
      >
        التالي
      </button>
    </div>
  );
};

export default UserPagination;


