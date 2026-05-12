"use client";

import React, { useState, useEffect, useRef } from "react";

const Sidebar = ({ user, sidebarSections, selectedItem }) => {
  const [activeLinkRect, setActiveLinkRect] = useState(null);
  const sidebarRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    const activeItemRef = itemRefs.current[selectedItem];
    if (activeItemRef && sidebarRef.current) {
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const itemRect = activeItemRef.getBoundingClientRect();
      setActiveLinkRect({
        top: itemRect.top - sidebarRect.top,
        height: itemRect.height,
      });
    }
  }, [selectedItem]);

  return (
    <div
      ref={sidebarRef}
      className="museum-card-premium relative flex max-h-[34vh] w-full shrink-0 flex-col items-center gap-3 overflow-hidden lg:h-[80vh] lg:max-h-none lg:w-[20%] lg:min-w-[16rem]"
    >
      {activeLinkRect && (
        <div
          className="absolute left-0 mx-4 hidden w-[calc(100%-2rem)] rounded-[1rem] bg-[#263a2d]/10 transition-all duration-300 ease-in-out ring-1 ring-[#263a2d]/10 lg:block"
          style={{
            top: activeLinkRect.top,
            height: activeLinkRect.height,
            zIndex: 0,
          }}
        />
      )}
      <div className="archive-scroll z-10 flex w-full gap-2 overflow-x-auto p-3 lg:h-[71vh] lg:flex-col lg:gap-2 lg:overflow-y-auto lg:p-4">
        {sidebarSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="flex shrink-0 gap-2 lg:block lg:shrink">
            {section.map((item, itemIndex) => (
              <button
                key={itemIndex}
                ref={(el) => (itemRefs.current[item.name] = el)}
                onClick={item.onClick}
                className={`my-1 flex min-h-11 shrink-0 cursor-pointer items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-xs font-bold transition lg:w-full lg:text-sm ${
                  selectedItem === item.name
                    ? "bg-[#263a2d]/10 text-[#263a2d] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                    : item.name === "Logout"
                    ? "text-[#263a2d] hover:bg-red-200/50 hover:text-red-800"
                    : "text-[#263a2d]/74 hover:bg-[#263a2d]/8 hover:text-[#123327]"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </button>
            ))}
            {sectionIndex < sidebarSections.length - 1 && (
              <hr className="mt-2 hidden border-t border-[#263a2d]/12 lg:block" />
            )}
          </div>
        ))}
      </div>

      {/* User Info */}
      <div className="relative z-10 hidden w-[calc(100%-1.5rem)] max-w-full items-center gap-3 rounded-[1.15rem] border border-[#263a2d]/10 bg-[#eadcc4]/58 p-3 text-[#263a2d] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur lg:flex">
        <p className="absolute right-3 top-3 rounded-full bg-[#263a2d] px-2 py-0.5 text-[8px] font-bold text-[#f7f0e4]">
          {user?.role}
        </p>

        <p className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#263a2d] text-xl font-bold uppercase text-[#f7f0e4]">
          {user?.username?.[0] || "U"}
        </p>

        <div className="flex min-w-0 flex-col pr-12">
          <p className="text-sm font-bold truncate">{user?.username}</p>
          <p className="block truncate text-xs font-medium opacity-80">
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
