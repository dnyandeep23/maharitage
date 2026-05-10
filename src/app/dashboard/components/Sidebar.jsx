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
      className="museum-card-premium relative flex max-h-[34vh] w-full shrink-0 flex-col items-center gap-3 overflow-hidden lg:h-[80vh] lg:max-h-none lg:w-[20%]"
    >
      {activeLinkRect && (
        <div
          className="absolute left-0 mx-4 hidden w-[89%] rounded-full bg-[#263a2d]/10 transition-all duration-300 ease-in-out ring-1 ring-[#263a2d]/10 lg:block"
          style={{
            top: activeLinkRect.top,
            height: activeLinkRect.height,
            zIndex: 0,
          }}
        />
      )}
      <div className="archive-scroll z-10 flex w-full gap-2 overflow-x-auto p-3 lg:h-[71vh] lg:flex-col lg:gap-3 lg:overflow-y-scroll lg:p-4">
        {sidebarSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="flex shrink-0 gap-2 lg:block lg:shrink">
            {section.map((item, itemIndex) => (
              <button
                key={itemIndex}
                ref={(el) => (itemRefs.current[item.name] = el)}
                onClick={item.onClick}
                className={`my-1 flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-3 text-left text-xs font-bold transition lg:w-full lg:text-sm ${
                  selectedItem === item.name
                    ? "bg-[#263a2d]/10 text-[#263a2d]"
                    : item.name === "Logout"
                    ? "text-[#263a2d] hover:bg-red-200/45"
                    : "text-[#263a2d]/78 hover:bg-[#263a2d]/8"
                }`}
              >
                {item.icon} {item.name}
              </button>
            ))}
            {sectionIndex < sidebarSections.length - 1 && (
              <hr className="mt-2 hidden border-t border-[#263a2d]/12 lg:block" />
            )}
          </div>
        ))}
      </div>

      {/* User Info */}
      <div className="relative z-10 hidden w-full max-w-full items-center gap-3 border border-[#263a2d]/10 bg-[#eadcc4]/58 p-2 text-[#263a2d] backdrop-blur lg:flex">
        <p className="absolute right-4 top-2 rounded-full bg-[#263a2d] px-2 py-0.5 text-[8px] font-medium text-[#f7f0e4]">
          {user?.role}
        </p>

        <p className="flex h-12 w-12 items-center justify-center rounded-full bg-[#263a2d] px-4 py-2 text-xl font-bold uppercase text-[#f7f0e4]">
          {user?.username[0]}
        </p>

        {/* Main text container */}
        <div className="flex flex-col min-w-0">
          {" "}
          {/* <-- IMPORTANT */}
          <p className="text-sm font-bold truncate">{user?.username}</p>
          {/* Email with truncate */}
          <p className="text-xs font-medium truncate block max-w-[140px] sm:max-w-[200px] md:max-w-[250px]">
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
