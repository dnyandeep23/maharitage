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
      className="w-[20%] h-[80vh] rounded-4xl bg-[#FFFD99]/50 flex flex-col items-center gap-3 relative"
    >
      {activeLinkRect && (
        <div
          className="absolute left-0 w-[89%] bg-[#f9f794]/60 mx-4 rounded-full transition-all duration-300 ease-in-out"
          style={{
            top: activeLinkRect.top,
            height: activeLinkRect.height,
            zIndex: 0,
          }}
        />
      )}
      <div className="h-[71vh] w-full flex flex-col p-4 rounded-4xl overflow-y-scroll gap-3 z-10">
        {sidebarSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.map((item, itemIndex) => (
              <button
                key={itemIndex}
                ref={(el) => (itemRefs.current[item.name] = el)}
                onClick={item.onClick}
                className={`w-full text-left px-4 py-3 my-1 cursor-pointer rounded-full flex items-center gap-2 font-bold text-sm ${
                  selectedItem === item.name
                    ? "text-green-900"
                    : item.name === "Logout"
                    ? "text-green-900  hover:bg-red-300/30"
                    : "hover:bg-[#f9f794]/30 text-green-900"
                }`}
              >
                {item.icon} {item.name}
              </button>
            ))}
            {sectionIndex < sidebarSections.length - 1 && (
              <hr className="border-t border-green-900/50 mt-2" />
            )}
          </div>
        ))}
      </div>

      {/* User Info */}
      <div className="flex bg-[#FFFD99] relative gap-3 rounded-4xl p-2 items-center text-green-950 z-10">
        <p className="py-0.5 absolute top-2 right-4 px-2 bg-gradient-to-br from-green-600/60 to-green-950/60 text-[8px] text-white rounded-full font-medium">
          {user?.role}
        </p>
        <p className="py-2 px-4 uppercase rounded-full bg-gradient-to-br from-green-600 to-green-950 text-white text-xl h-12 w-12 font-bold flex justify-center items-center">
          {user?.username[0]}
        </p>
        <div className="w-56">
          <p className="text-sm font-bold truncate">{user?.username}</p>
          <p className="text-xs font-medium truncate">{user?.email}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
